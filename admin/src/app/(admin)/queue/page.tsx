import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { approveReport, rejectReport } from './actions'

export const dynamic = 'force-dynamic'

export default async function ReviewQueuePage() {
  const supabase = await createClient()

  const { data: reports, error } = await supabase
    .from('shrink_reports')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Failed to load reports queue: {error.message}</div>
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <h2 className="text-2xl font-bold text-foreground">Inbox Zero! 🎉</h2>
          <p className="mt-2">There are no pending shrinkflation reports from the public.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Evidence Queue</h1>
        <p className="text-muted-foreground">Review photos submitted by the public before adding them to the database.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
              {report.evidence_image_url ? (
                <img 
                  src={report.evidence_image_url} 
                  alt="Evidence" 
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{report.product_name}</CardTitle>
              <CardDescription className="font-mono text-xs">{report.barcode}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">OLD SIZE</p>
                  <p className="text-lg font-bold">{report.old_size}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">NEW SIZE</p>
                  <p className="text-lg font-bold text-red-500">{report.new_size}</p>
                </div>
              </div>
              {report.store_name && (
                <p className="text-sm"><span className="font-semibold">Spotted at:</span> {report.store_name}</p>
              )}
              <p className="text-xs text-muted-foreground">Submitted: {new Date(report.created_at).toLocaleDateString()}</p>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-4">
              <form action={rejectReport.bind(null, report.id)} className="w-full">
                <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">Reject</Button>
              </form>
              <form action={approveReport.bind(null, report.id, report.barcode, report.old_size, report.new_size)} className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Approve Data</Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
