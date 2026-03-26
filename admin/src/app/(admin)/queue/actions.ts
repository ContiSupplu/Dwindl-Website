'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveReport(reportId: string, barcode: string, oldSize: string, newSize: string) {
  const supabase = await createClient()

  // 1. Mark as approved
  const { error: updateError } = await supabase
    .from('shrink_reports')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', reportId)

  if (updateError) throw updateError

  // 2. Note: For Phase 2 simplicity, the data automatically enters the global verified pool.
  // In a full production app, you might explicitly insert these sizes into `size_history` here.

  revalidatePath('/queue')
}

export async function rejectReport(reportId: string) {
  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('shrink_reports')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', reportId)

  if (updateError) throw updateError

  revalidatePath('/queue')
}
