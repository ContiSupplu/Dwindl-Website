import { createClient } from '@/utils/supabase/server'
import { DataTable } from './data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

// Note: In Next.js 15, searchParams is a Promise
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Simple fetch for Phase 1 MVP
  // Ideally, parsing searchParams for filtering, pagination, search logic goes here.
  let query = supabase
    .from('products')
    .select('*, size_history:size_history(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,barcode.ilike.%${params.search}%,brand.ilike.%${params.search}%`)
  }

  const { data, error, count } = await query

  const products = data?.map(p => ({
    ...p,
    size_changes: p.size_history[0]?.count || 0
  })) || []

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <DataTable columns={columns} data={products} />
      </div>
    </div>
  )
}
