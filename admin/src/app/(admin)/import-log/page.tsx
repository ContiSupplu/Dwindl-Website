import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function ImportLogPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('import_log')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Import Logs</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Records</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Imported By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{log.import_type}</Badge></TableCell>
                  <TableCell>{log.records_total || 0}</TableCell>
                  <TableCell>{log.records_created || 0}</TableCell>
                  <TableCell>
                    {log.records_errored > 0 ? (
                      <span className="text-red-500 font-bold">{log.records_errored}</span>
                    ) : (
                      '0'
                    )}
                  </TableCell>
                  <TableCell>{log.imported_by}</TableCell>
                </TableRow>
              ))}
              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No import logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
