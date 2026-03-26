import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT USE getSession AS IT DOES NOT VALIDATE THE JWT.
  // ALWAYS USE getUser FOR AUTHENTICATION CHECKS.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  
  if (user) {
    // Check if user is admin
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    if (!isAdmin) {
      if (!isAuthPage) {
        // Logged in but not admin, redirect with verbose error
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        if (dbError) {
          url.searchParams.set('error', `db_${dbError.code}_${dbError.message.replace(/ /g, '+')}`)
        } else {
          url.searchParams.set('error', `not_admin_val_${profile?.is_admin}`)
        }
        return NextResponse.redirect(url)
      }
    } else {
      if (isAuthPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/products'
        return NextResponse.redirect(url)
      }
    }
  } else {
    // not logged in
    if (!isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
