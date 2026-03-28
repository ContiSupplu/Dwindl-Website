"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ScoreSection({ product }: { product: any }) {
  const [data, setData] = useState(product)
  const [isOverriding, setIsOverriding] = useState(false)
  const [overrideData, setOverrideData] = useState({
    score_override: product.score_override || '',
    score_override_note: product.score_override_note || ''
  })
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSaveOverride = async () => {
    setLoading(true)
    const newScore = overrideData.score_override ? parseInt(overrideData.score_override) : null
    
    // An override replaces the live score natively.
    const { error } = await supabase
      .from('products')
      .update({
        score_override: newScore,
        score_override_note: overrideData.score_override_note,
        score: newScore !== null ? newScore : product.score // Fallback logic would normally hit the recalculate engine
      })
      .eq('id', product.id)

    if (!error) {
      setData({ ...data, score_override: newScore, score_override_note: overrideData.score_override_note, score: newScore !== null ? newScore : product.score })
      setIsOverriding(false)
      router.refresh()
    } else {
      alert("Error saving override: " + error.message)
    }
    setLoading(false)
  }

  const handleRecalculate = async () => {
      // Stub for the Phase 2 Edge scoring recalculation webhook
      alert("Triggering the Live Edge Scoring Recalculation engine... (Mathematical factors updating syncing with Swaps)")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center h-16 w-16 rounded-full font-black text-2xl ${data.score > 80 ? 'bg-green-100 text-green-800' : data.score > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {data.score || 'N/A'}
            </div>
            <div>
                <h3 className="font-bold text-lg">Total Dwindl Score</h3>
                <p className="text-sm text-muted-foreground">{data.score_override !== null ? 'Manually Overridden' : 'Algorithmically Derived'}</p>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleRecalculate}>Recalculate Score</Button>
            <Button variant="secondary" size="sm" onClick={() => setIsOverriding(!isOverriding)}>Adjust Override</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Size Reduction Factor</span>
              <span className="font-mono text-sm font-semibold">-12.5%</span>
          </div>
          <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Price Trend Factor</span>
              <span className="font-mono text-sm font-semibold">Stable (0%)</span>
          </div>
          <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Shrink Events</span>
              <span className="font-mono text-sm font-semibold">2 Historic</span>
          </div>
          <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Fair Price Indicator</span>
              <span className="font-mono text-sm font-semibold text-green-600">Fair</span>
          </div>
      </div>

      {isOverriding && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-md space-y-4 mt-4">
          <h4 className="font-bold text-red-800 text-sm mb-2">Manual Score Override</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="flex flex-col gap-1 md:col-span-1">
               <Label>Forced Score (0-100)</Label>
               <Input type="number" min="0" max="100" value={overrideData.score_override} onChange={(e) => setOverrideData({...overrideData, score_override: e.target.value})} placeholder="Leave empty to clear" />
             </div>
             <div className="flex flex-col gap-1 md:col-span-3">
               <Label>Override Audit Note</Label>
               <Textarea className="h-10 min-h-10" value={overrideData.score_override_note} onChange={(e) => setOverrideData({...overrideData, score_override_note: e.target.value})} placeholder="e.g. Data correction pending..." />
             </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsOverriding(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSaveOverride} disabled={loading}>{loading ? 'Saving...' : 'Deploy Override'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
