import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ProductForm } from './product-form'
import { SizeHistoryTable } from './size-history-table'
import { PriceHistoryTable } from './price-history-table'
import { SwapsSection } from './swaps-section'
import { ScoreSection } from './score-section'
import { ProductLineageSection } from './product-lineage-section'
import { DangerZoneSection } from './danger-zone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const { data: sizeHistory } = await supabase
    .from('size_history')
    .select('*')
    .eq('product_id', id)
    .order('date_detected', { ascending: false })

  const { data: priceHistory } = await supabase
    .from('prices')
    .select('*')
    .eq('product_id', id)
    .order('date_recorded', { ascending: false })

  const { data: swapsData } = await supabase
    .from('swaps')
    .select(`*, alternative:products!alternative_id(id, name, brand, current_size, unit, score)`)
    .eq('product_id', id)

  const { data: lineageData } = await supabase
    .from('product_lineage')
    .select(`*, old_product:products!old_product_id(id, branch_name:name, current_size), new_product:products!new_product_id(id, branch_name:name, current_size)`)
    .or(`old_product_id.eq.${id},new_product_id.eq.${id}`)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4 mb-4">
        <Link href="/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Edit Product: {product.name}</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreSection product={product} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity & Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm initialData={product} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Lineage</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductLineageSection productId={id} initialData={lineageData || []} />
            </CardContent>
          </Card>

          <DangerZoneSection product={product} />
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Size History</CardTitle>
            </CardHeader>
            <CardContent>
              <SizeHistoryTable productId={id} initialData={sizeHistory || []} currentUnit={product.unit} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
            </CardHeader>
            <CardContent>
               <PriceHistoryTable productId={id} initialData={priceHistory || []} currentSize={product.current_size} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Swaps & Alternatives</CardTitle>
            </CardHeader>
            <CardContent>
               <SwapsSection productId={id} initialData={swapsData || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
