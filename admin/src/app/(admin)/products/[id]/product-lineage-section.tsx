"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Link as LinkIcon, Unlink } from "lucide-react"

export function ProductLineageSection({ productId, initialData }: { productId: string, initialData: any[] }) {
  const [data, setData] = useState(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [linkType, setLinkType] = useState<"prev" | "next">("prev")
  const [targetBarcode, setTargetBarcode] = useState("")
  
  const supabase = createClient()
  const router = useRouter()

  const handleCreateLink = async () => {
    const { data: altProduct, error: lookupError } = await supabase
        .from('products')
        .select('id, name, current_size')
        .eq('barcode', targetBarcode)
        .single()
        
    if (lookupError || !altProduct) return alert("Could not find product with that barcode.")

    const pushPayload = linkType === "prev"
        ? { old_product_id: altProduct.id, new_product_id: productId }
        : { old_product_id: productId, new_product_id: altProduct.id }

    const { data: inserted, error } = await supabase
      .from('product_lineage')
      .insert({ ...pushPayload, notes: 'Manually linked via dashboard' })
      .select(`*, old_product:products!old_product_id(id, branch_name:name, current_size), new_product:products!new_product_id(id, branch_name:name, current_size)`)
      .single()

    if (!error && inserted) {
      setData([...data, inserted])
      setIsAdding(false)
      setTargetBarcode("")
      router.refresh()
    } else {
      alert("Error linking product: " + error?.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Sever this lineage connection?")) {
      await supabase.from('product_lineage').delete().eq('id', id)
      setData(data.filter(d => d.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => { setIsAdding(true); setLinkType("prev") }} variant="outline" size="sm" className="w-full">
           Link Previous UPC
        </Button>
        <Button onClick={() => { setIsAdding(true); setLinkType("next") }} variant="outline" size="sm" className="w-full">
           Link Next UPC
        </Button>
      </div>

      {isAdding && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-md space-y-4">
          <h4 className="font-bold text-sm">Chain {linkType === 'prev' ? 'Older Formulations' : 'Future Formulations'}</h4>
          <div className="flex w-full items-center space-x-2">
            <Input placeholder="Enter the Barcode of the target product..." value={targetBarcode} onChange={(e) => setTargetBarcode(e.target.value)} />
            <Button onClick={handleCreateLink}><LinkIcon className="h-4 w-4 mr-2"/> Link</Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
          {data.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">This product is an isolated SKU.</p>
          ) : (
             data.map(link => {
                 const isPrev = link.new_product_id === productId;
                 return (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                        <div className="flex items-center gap-3">
                            {isPrev ? <ArrowRight className="h-4 w-4 text-orange-400" /> : <ArrowRight className="h-4 w-4 text-emerald-400" />}
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{isPrev ? "Replaces" : "Replaced By"}</span>
                                <span className="text-sm font-medium">
                                    {isPrev ? link.old_product?.branch_name : link.new_product?.branch_name} 
                                    <span className="text-xs text-muted-foreground ml-2">({isPrev ? link.old_product?.current_size : link.new_product?.current_size}oz)</span>
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)} className="text-red-500 h-8 w-8"><Unlink className="h-4 w-4" /></Button>
                    </div>
                 )
             })
          )}
      </div>
    </div>
  )
}
