import { Calendar, Home, Inbox, Search, Settings, Package, Import, ListCollapse } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const items = [
  {
    title: "Review Queue",
    url: "/queue",
    icon: Inbox,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Import",
    url: "/import",
    icon: Import,
  },
  {
    title: "Import Log",
    url: "/import-log",
    icon: ListCollapse,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center space-x-2 px-4 py-4">
            <span className="font-bold text-lg">Dwindl Admin</span>
          </div>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
