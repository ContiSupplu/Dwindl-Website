"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EyeOff, Eye, Trash2, GitMerge } from "lucide-react"

export function DangerZoneSection({ product }: { product: any }) {
  const [isHidden, setIsHidden] = useState(product.hidden)
  const [mergeTarget, setMergeTarget] = useState("")
  const [isMerging, setIsMerging] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleToggleHide = async () => {
    const { error } = await supabase
      .from('products')
      .update({ hidden: !isHidden })
      .eq('id', product.id)

    if (!error) {
      setIsHidden(!isHidden)
      router.refresh()
    } else {
      alert("Error hiding product: " + error.message)
    }
  }

  const handleDeleteParams = async () => {
    if (confirm(`CRITICAL WARNING: This will permanently wipe ${product.name} and ALL associated histories, prices, and swaps from the database forever. This cannot be undone.`)) {
      const { error } = await supabase.from('products').delete().eq('id', product.id)
      if (!error) {
          router.push('/products')
      } else {
          alert("Hard delete failed: " + error.message)
      }
    }
  }
  
  const handleMerge = async () => {
      alert("Mass relational ID merging requires migrating Price History, Size History, Swaps, and Queue Reports safely. This Edge Function is pending deployment.")
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
         <h4 className="text-red-800 font-bold mb-4">Danger Zone Configuration</h4>
         
         <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-red-100 pb-4">
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">Soft Hide Product</span>
                    <span className="text-xs text-muted-foreground">Strips the item from the mobile app and public website without erasing historical metric topologies.</span>
                </div>
                <Button variant={isHidden ? "default" : "secondary"} onClick={handleToggleHide}>
                    {isHidden ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    {isHidden ? "Unhide Product" : "Hide Product"}
                </Button>
            </div>

            <div className="flex items-center justify-between border-b border-red-100 pb-4">
                <div className="flex flex-col gap-1 max-w-[60%]">
                    <span className="font-semibold text-sm">Merge Duplicate</span>
                    <span className="text-xs text-muted-foreground">Absorb this product into a separate Barcode, transferring all size history points.</span>
                </div>
                {isMerging ? (
                    <div className="flex items-center gap-2">
                        <Input placeholder="Target Barcode" value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} className="h-9 w-40" />
                        <Button variant="destructive" size="sm" onClick={handleMerge}>Execute Merge</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsMerging(false)}>Cancel</Button>
                    </div>
                ) : (
                   <Button variant="outline" onClick={() => setIsMerging(true)}>
                       <GitMerge className="w-4 h-4 mr-2" />
                       Merge Product
                   </Button>
                )}
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col gap-1 max-w-[60%]">
                    <span className="font-semibold text-sm text-red-900">Hard Erase Product</span>
                    <span className="text-xs text-red-700">Irreversibly vaporize the product and cascade-delete every single connected foreign-key relational row.</span>
                </div>
                <Button variant="destructive" onClick={handleDeleteParams}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wipe Database Row
                </Button>
            </div>
         </div>
      </div>
    </div>
  )
}
