import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Although middleware protects the routes, we also verify in layout
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col">
        {/* Simple header where you might want a User dropdown later */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger />
          <div className="w-full flex-1">
          </div>
        </header>
        <div className="p-4 md:p-6 flex-1 bg-gray-50/50">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
