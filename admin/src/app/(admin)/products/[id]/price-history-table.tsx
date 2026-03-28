"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function PriceHistoryTable({ productId, initialData, currentSize }: { productId: string, initialData: any[], currentSize: number | null }) {
  const [data, setData] = useState(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({
    price: '',
    store_chain: '',
    date_recorded: new Date().toISOString().split('T')[0],
    source: 'manual'
  })
  const supabase = createClient()
  const router = useRouter()

  const sources = ["kroger_api", "amazon_api", "user_scan", "manual"]
  const chains = ["Kroger", "Walmart", "Target", "Amazon", "Walgreens", "Meijer", "Other"]

  const handleSaveNew = async () => {
    const priceVal = parseFloat(newEntry.price)
    if (isNaN(priceVal)) return alert("Invalid price")

    const { data: inserted, error } = await supabase
      .from('prices')
      .insert({
        product_id: productId,
        price: priceVal,
        price_per_unit: currentSize ? parseFloat((priceVal / currentSize).toFixed(3)) : null,
        store_chain: newEntry.store_chain,
        date_recorded: newEntry.date_recorded,
        source: newEntry.source,
        currency: 'USD'
      })
      .select()
      .single()

    if (!error && inserted) {
      setData([inserted, ...data])
      setIsAdding(false)
      setNewEntry({ ...newEntry, price: '' })
      router.refresh()
    } else {
      alert("Error adding entry: " + error?.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this price entry?")) {
      await supabase.from('prices').delete().eq('id', id)
      setData(data.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Price Entry
        </Button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 border p-4 rounded-md space-y-4 mb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Price (USD)</span>
               <Input placeholder="e.g. 4.99" type="number" step="0.01" value={newEntry.price} onChange={(e) => setNewEntry({...newEntry, price: e.target.value})} />
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Store Chain</span>
               <Select value={newEntry.store_chain} onValueChange={(v) => setNewEntry({...newEntry, store_chain: v})}>
                 <SelectTrigger><SelectValue placeholder="Chain"/></SelectTrigger>
                 <SelectContent>{chains.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
               </Select>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Date Recorded</span>
               <Input type="date" value={newEntry.date_recorded} onChange={(e) => setNewEntry({...newEntry, date_recorded: e.target.value})} />
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Data Source</span>
               <Select value={newEntry.source} onValueChange={(v) => setNewEntry({...newEntry, source: v})}>
                 <SelectTrigger><SelectValue/></SelectTrigger>
                 <SelectContent>{sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
               </Select>
             </div>
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
            <TableHead>Price</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id}>
              <TableCell className="font-medium font-mono">${Number(row.price).toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground font-mono">{row.price_per_unit ? `$${Number(row.price_per_unit).toFixed(3)}` : 'N/A'}</TableCell>
              <TableCell>{row.store_chain || 'Unknown'}</TableCell>
              <TableCell>{row.date_recorded}</TableCell>
              <TableCell className="text-xs">{row.source}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-4">No price history recorded.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
