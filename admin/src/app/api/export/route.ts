import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      }
    }
  )

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '0', 10)
  const pageSize = 1000

  // 1. Fetch exactly 1 chunk of 1000 rows to bypass 50-request limit on Cloudflare Edge Worker
  const { data: pageData, error } = await supabase
    .from('products')
    .select(`
      *,
      size_history (*),
      prices (*)
    `)
    .eq('hidden', false)
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const products = pageData || []

  // 2. Transform Data
  const formattedProducts = []
  const brandsMap = new Map()
  const categoriesMap = new Map()

  let totalShrunk = 0
  let totalReduction = 0

  for (const p of products) {
    // Process size history
    const history = (p.size_history || []).sort(
      (a: any, b: any) => new Date(a.date_detected).getTime() - new Date(b.date_detected).getTime()
    )
    
    let originalSize = p.current_size ? `${p.current_size} ${p.unit}` : 'Unknown'
    let currentSize = originalSize
    let hasShrunk = false
    let percentage = 0
    let earliestYear = new Date().getFullYear()
    let latestYear = earliestYear
    let mappedHistory = []

    if (history.length > 0) {
      const first = history[0]
      const last = history[history.length - 1]
      
      originalSize = `${first.size} ${first.unit}`
      currentSize = `${last.size} ${last.unit}`
      earliestYear = new Date(first.date_detected).getFullYear()
      latestYear = new Date(last.date_detected).getFullYear()
      
      if (first.size > last.size && first.unit === last.unit) {
        hasShrunk = true
        percentage = parseFloat(((first.size - last.size) / first.size * 100).toFixed(1))
        totalShrunk++
        totalReduction += percentage
      }

      mappedHistory = history.map((h: any) => ({
        year: new Date(h.date_detected).getFullYear(),
        size: `${h.size} ${h.unit}`
      }))
    } else {
      mappedHistory = [{ year: earliestYear, size: currentSize }]
    }

    // Process Price
    let priceData = null
    if (p.prices && p.prices.length > 0) {
      const latestPrice = p.prices.sort((a: any, b: any) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime())[0]
      priceData = {
        avgPrice: `$${latestPrice.price}`,
        unitPrice: latestPrice.price_per_unit ? `$${latestPrice.price_per_unit}/${p.unit}` : 'Unknown',
        fairness: 'Unknown'
      }
    }

    const brandId = p.brand ? p.brand.toLowerCase().replace(/ /g, '-') : 'unknown-brand'
    const categoryId = p.category ? p.category.toLowerCase().replace(/ /g, '-') : 'uncategorized'

    formattedProducts.push({
      id: p.barcode,
      name: p.name,
      brandId: brandId,
      categoryId: categoryId,
      originalSize,
      currentSize,
      percentage,
      score: p.score_override || p.score || 100,
      hasShrunk,
      earliestYear,
      latestYear,
      numChanges: history.length,
      lastVerified: new Date(p.updated_at).toISOString().split('T')[0],
      history: mappedHistory,
      price: priceData,
      alternatives: [], // Handled by separate swaps table if needed later
      related: []
    })
  }

  const finalPayload = {
    products: formattedProducts,
  }

  return NextResponse.json(finalPayload)
}
