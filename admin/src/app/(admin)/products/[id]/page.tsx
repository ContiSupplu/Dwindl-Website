import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ProductForm } from './product-form'
import { SizeHistoryTable } from './size-history-table'
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
            <CardHeader>
              <CardTitle>Identity & Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm initialData={product} />
            </CardContent>
          </Card>
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
               <p className="text-sm text-gray-500">Price history tracking coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
