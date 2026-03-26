"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function SizeHistoryTable({ productId, initialData, currentUnit }: { productId: string, initialData: any[], currentUnit: string }) {
  const [data, setData] = useState(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({
    size: '',
    unit: currentUnit || 'oz',
    date_detected: new Date().toISOString().split('T')[0],
    date_approximate: false,
    source: 'manual_research',
    source_url: '',
    evidence_notes: ''
  })
  const supabase = createClient()
  const router = useRouter()

  const units = ["oz", "lb", "fl oz", "g", "kg", "ml", "L", "sheets", "count"]
  const sources = ["mouseprint", "reddit", "manufacturer_website", "wayback_machine", "openfoodfacts", "user_report", "manual_research"]

  const handleSaveNew = async () => {
    const { data: inserted, error } = await supabase
      .from('size_history')
      .insert({
        product_id: productId,
        ...newEntry,
        size: parseFloat(newEntry.size)
      })
      .select()
      .single()

    if (!error && inserted) {
      setData([inserted, ...data])
      setIsAdding(false)
      setNewEntry({ ...newEntry, size: '', source_url: '', evidence_notes: '' })
      router.refresh()
    } else {
      alert("Error adding entry: " + error?.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this size entry?")) {
      await supabase.from('size_history').delete().eq('id', id)
      setData(data.filter(d => d.id !== id))
    }
  }

  const toggleVerified = async (id: string, currentStatus: boolean) => {
    // We assume the verified_by would be populated via RLS trigger or we just set it manually here.
    const { error } = await supabase
      .from('size_history')
      .update({ verified: !currentStatus })
      .eq('id', id)

    if (!error) {
      setData(data.map(d => d.id === id ? { ...d, verified: !currentStatus } : d))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Size Entry
        </Button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 border p-4 rounded-md space-y-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Input placeholder="Size (e.g. 12.5)" type="number" step="0.01" value={newEntry.size} onChange={(e) => setNewEntry({...newEntry, size: e.target.value})} />
             <Select value={newEntry.unit} onValueChange={(v) => setNewEntry({...newEntry, unit: v || 'oz'})}>
               <SelectTrigger><SelectValue/></SelectTrigger>
               <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
             </Select>
             <Input type="date" value={newEntry.date_detected} onChange={(e) => setNewEntry({...newEntry, date_detected: e.target.value})} />
             <div className="flex items-center space-x-2">
                <Checkbox checked={newEntry.date_approximate} onCheckedChange={(v) => setNewEntry({...newEntry, date_approximate: !!v})} />
                <span className="text-sm">Approximate Date?</span>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Select value={newEntry.source} onValueChange={(v) => setNewEntry({...newEntry, source: v || 'manual_research'})}>
               <SelectTrigger><SelectValue/></SelectTrigger>
               <SelectContent>{sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
             </Select>
             <Input placeholder="Source URL" value={newEntry.source_url} onChange={(e) => setNewEntry({...newEntry, source_url: e.target.value})} />
             <Input placeholder="Evidence notes" value={newEntry.evidence_notes} onChange={(e) => setNewEntry({...newEntry, evidence_notes: e.target.value})} />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleSaveNew}>Save Entry</Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Size</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.size} {row.unit}</TableCell>
              <TableCell>
                {row.date_detected}
                {row.date_approximate && <span className="text-xs text-muted-foreground ml-2">(Approx)</span>}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{row.source}</span>
                  {row.source_url && (
                    <a href={row.source_url} target="_blank" className="text-xs text-blue-500 hover:underline">Link</a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                 <Checkbox checked={row.verified} onCheckedChange={() => toggleVerified(row.id, row.verified)} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No size history recorded.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
