import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    // 1. Parse Native Web FormData
    const formData = await request.formData()
    const barcode = formData.get('barcode')?.toString() || ''
    const productName = formData.get('product_name')?.toString() || ''
    const oldSize = formData.get('old_size')?.toString() || ''
    const newSize = formData.get('new_size')?.toString() || ''
    const storeName = formData.get('store_name')?.toString() || ''
    const image = formData.get('image') as File | null
    const turnstileToken = formData.get('cf-turnstile-response')?.toString() || ''

    if (!barcode || !productName || !oldSize || !newSize || !image) {
      return NextResponse.json({ error: 'Missing required report fields or evidence.' }, { status: 400 })
    }

    // 1b. Verify Turnstile token server-side
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    })
    const turnstileData = await turnstileRes.json() as { success: boolean }
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403 })
    }

    // 2. Init Admin Supabase Client
    // We strictly use the SUPABASE_SERVICE_ROLE_KEY instead of the anon key here
    // because pushing to storage programmatically via backend requires verified permissions
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '', 
      { cookies: { getAll() { return [] }, setAll() {} } }
    )

    // 3. Upload Binary Image Buffer to Cloud Storage
    const fileExt = image.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const arrayBuffer = await image.arrayBuffer()
    
    const { error: uploadError } = await supabase.storage
      .from('shrink_evidence')
      .upload(fileName, arrayBuffer, {
        contentType: image.type,
        upsert: false // Prevent malicious image overwrites
      })

    if (uploadError) throw new Error(`Evidence Upload Failed: ${uploadError.message}`)

    const { data: publicUrlData } = supabase.storage.from('shrink_evidence').getPublicUrl(fileName)
    const imageUrl = publicUrlData.publicUrl

    // 4. Securely Insert the Metadata Record into Queue
    const { error: dbError } = await supabase
      .from('shrink_reports')
      .insert({
        barcode,
        product_name: productName,
        old_size: oldSize,
        new_size: newSize,
        store_name: storeName,
        evidence_image_url: imageUrl,
        status: 'pending' 
      })

    if (dbError) throw new Error(`Database Insert Failed: ${dbError.message}`)

    // 5. Finalize Cloudflare Worker Response
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('API Report Ingestion Failure:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
