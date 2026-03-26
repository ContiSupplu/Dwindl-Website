"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export function ProductForm({ initialData }: { initialData: any }) {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const categories = ["Cereal", "Household", "Beverage", "Pet", "Grocery", "Personal Care", "Snacks", "Dairy", "Frozen", "Other"]
  const units = ["oz", "lb", "fl oz", "g", "kg", "ml", "L", "sheets", "count"]
  const dataSources = ["openfoodfacts", "upcitemdb", "manual", "user_report"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleCheckedChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked })
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('products')
      .update(formData)
      .eq('id', formData.id)

    if (!error) {
      router.refresh()
    } else {
      alert("Error saving product: " + error.message)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (confirm(`This will permanently delete ${formData.name}. Type the product name to confirm:`)) {
      await supabase.from('products').delete().eq('id', formData.id)
      router.push('/products')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Barcode</Label>
        <Input disabled value={formData.barcode || ''} />
      </div>
      <div>
        <Label>Name</Label>
        <Input name="name" value={formData.name || ''} onChange={handleChange} />
      </div>
      <div>
        <Label>Brand</Label>
        <Input name="brand" value={formData.brand || ''} onChange={handleChange} />
      </div>
      <div>
        <Label>Category</Label>
        <Select name="category" value={formData.category || ''} onValueChange={(val) => handleSelectChange('category', val)}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Variant</Label>
        <Input name="variant" value={formData.variant || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Current Size</Label>
          <Input type="number" step="0.01" name="current_size" value={formData.current_size || ''} onChange={handleChange} />
        </div>
        <div>
          <Label>Unit</Label>
          <Select name="unit" value={formData.unit || ''} onValueChange={(val) => handleSelectChange('unit', val)}>
            <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
            <SelectContent>
              {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Image URL</Label>
        <Input name="image_url" value={formData.image_url || ''} onChange={handleChange} />
      </div>
      <div>
        <Label>Data Source</Label>
        <Select name="data_source" value={formData.data_source || ''} onValueChange={(val) => handleSelectChange('data_source', val)}>
          <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
          <SelectContent>
            {dataSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2 my-2">
        <Checkbox 
          id="verified" 
          checked={formData.verified} 
          onCheckedChange={(val) => handleCheckedChange('verified', !!val)} 
        />
        <Label htmlFor="verified">Verified</Label>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
      </div>
    </div>
  )
}
