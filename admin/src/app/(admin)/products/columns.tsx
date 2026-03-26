"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type ProductRow = {
  id: string
  barcode: string
  name: string
  brand: string | null
  category: string | null
  current_size: number | null
  unit: string | null
  score: number | null
  verified: boolean
  data_source: string
  size_changes: number
  updated_at: string
}

export const columns: ColumnDef<ProductRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          table.getIsSomePageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <Link href={`/products/${row.original.id}`} className="font-medium hover:underline">
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "brand",
    header: "Brand",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "current_size",
    header: "Size",
    cell: ({ row }) => (
      <span>
        {row.original.current_size ? `${row.original.current_size} ${row.original.unit || ''}` : '-'}
      </span>
    )
  },
  {
    accessorKey: "score",
    header: "Score",
  },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => {
      const isVerified = row.getValue("verified")
      return isVerified ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>
    }
  },
  {
    accessorKey: "data_source",
    header: "Source",
  },
  {
    accessorKey: "size_changes",
    header: "Size Changes",
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
    cell: ({ row }) => {
      return new Date(row.getValue("updated_at")).toLocaleDateString()
    }
  },
]
