"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export function SwapsSection({ productId, initialData }: { productId: string, initialData: any[] }) {
  const [data, setData] = useState(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [newEntry, setNewEntry] = useState({
    alternative_barcode: '',
    swap_type: 'algorithmic',
    source: 'manual_override'
  })
  const supabase = createClient()
  const router = useRouter()

  const handleSaveNew = async () => {
    // Look up the alternative product by barcode
    const { data: altProduct, error: lookupError } = await supabase
        .from('products')
        .select('id, name, brand, score')
        .eq('barcode', newEntry.alternative_barcode)
        .single()
        
    if (lookupError || !altProduct) return alert("Could not find alternative product with that barcode.")

    const { data: inserted, error } = await supabase
      .from('swaps')
      .insert({
        product_id: productId,
        alternative_id: altProduct.id,
        swap_type: newEntry.swap_type,
        source: newEntry.source,
        active: true
      })
      .select(`*, alternative:products!alternative_id(id, name, brand, current_size, unit, score)`)
      .single()

    if (!error && inserted) {
      setData([inserted, ...data])
      setIsAdding(false)
      setNewEntry({ ...newEntry, alternative_barcode: '' })
      router.refresh()
    } else {
      alert("Error adding swap: " + error?.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Remove this swap linkage?")) {
      await supabase.from('swaps').delete().eq('id', id)
      setData(data.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Manual Swap
        </Button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 border p-4 rounded-md space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Alternative Barcode</span>
               <Input placeholder="UPC/EAN format" value={newEntry.alternative_barcode} onChange={(e) => setNewEntry({...newEntry, alternative_barcode: e.target.value})} />
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-xs font-semibold">Swap Type</span>
               <Select value={newEntry.swap_type} onValueChange={(v) => setNewEntry({...newEntry, swap_type: v})}>
                 <SelectTrigger><SelectValue/></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="algorithmic">Algorithmic Best</SelectItem>
                    <SelectItem value="community">Community Sub</SelectItem>
                    <SelectItem value="sponsored">Sponsored (Ad)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="flex items-end justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleSaveNew}>Establish Link</Button>
             </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Target Product</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Switches</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                  {row.alternative?.brand} {row.alternative?.name} <span className="text-xs text-muted-foreground ml-2">({row.alternative?.current_size}{row.alternative?.unit})</span>
              </TableCell>
              <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${row.alternative?.score > 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.alternative?.score || 'N/A'}
                  </span>
              </TableCell>
              <TableCell className="text-xs capitalize">{row.swap_type}</TableCell>
              <TableCell className="text-xs">{row.switch_count} users</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-500">Unlink</Button>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No alternative swaps linked to this product.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
