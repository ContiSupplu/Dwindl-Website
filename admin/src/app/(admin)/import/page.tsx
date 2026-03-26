"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<string>("Products")
  const [conflictHandling, setConflictHandling] = useState<string>("skip")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  
  const supabase = createClient()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    setFile(uploadedFile)

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setColumns(results.meta.fields || [])
        setPreviewData(results.data.slice(0, 5))
      }
    })
  }

  const runImport = async (dryRun: boolean) => {
    if (!file) return
    setLoading(true)
    setLogs([`Starting ${dryRun ? 'dry run' : 'import'} for ${importType}...`])
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[]
        let created = 0, skipped = 0, errors = 0
        const table = importType === "Products" ? 'products' : importType === "Size History" ? 'size_history' : 'prices'

        setLogs(prev => [...prev, `Found ${data.length} rows.`])

        for (const row of data) {
          if (dryRun) {
            // Very simple dry run logic
            created++
            continue
          }

          // Format numeric fields based on table
          const payload = { ...row }
          if (payload.current_size) payload.current_size = parseFloat(payload.current_size)
          if (payload.size) payload.size = parseFloat(payload.size)
          if (payload.price) payload.price = parseFloat(payload.price)
          if (payload.price_per_unit) payload.price_per_unit = parseFloat(payload.price_per_unit)

          let res;
          if (table === 'products' && conflictHandling === 'skip') {
             // For simplicity, we just insert. Supabase handles unique constraints.
             res = await supabase.from(table).insert(payload)
          } else {
             res = await supabase.from(table).upsert(payload) // Assuming primary keys are correctly mapped
          }

          if (res.error) {
            errors++
            setLogs(prev => [...prev, `Error on barcode ${row.barcode}: ${res.error?.message}`])
          } else {
            created++
          }
        }

        setLogs(prev => [...prev, `Completed! Created/Updated: ${created}, Skipped: ${skipped}, Errors: ${errors}`])
        
        if (!dryRun) {
          await supabase.from('import_log').insert({
            import_type: importType,
            source: 'CSV Upload',
            records_total: data.length,
            records_created: created,
            records_skipped: skipped,
            records_errored: errors,
            imported_by: 'admin'
          })
        }
        setLoading(false)
      }
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Data Import</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Import Type</Label>
              <Select value={importType} onValueChange={(v) => setImportType(v || "Products")}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Products">Products</SelectItem>
                  <SelectItem value="Size History">Size History</SelectItem>
                  <SelectItem value="Prices">Prices</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Conflict Handling</Label>
              <RadioGroup value={conflictHandling} onValueChange={setConflictHandling} className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip">Skip duplicates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overwrite" id="overwrite" />
                  <Label htmlFor="overwrite">Overwrite duplicates</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>CSV File</Label>
              <Input type="file" accept=".csv" onChange={handleFileUpload} className="mt-2" />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={() => runImport(true)} variant="secondary" disabled={!file || loading}>Dry Run</Button>
              <Button onClick={() => runImport(false)} disabled={!file || loading}>
                {loading ? 'Importing...' : 'Run Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm space-y-1">
              {logs.length === 0 ? "Ready to import..." : logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview (First 5 Rows)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map(c => <TableHead key={c}>{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map(c => <TableCell key={c + i}>{row[c]?.toString()}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
