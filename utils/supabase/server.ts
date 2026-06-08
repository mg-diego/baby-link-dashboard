import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
}

export async function fetchAllRows<T>(
  queryBuilderFn: () => any,
  step: number = 1000
): Promise<T[]> {
  let allRows: T[] = []
  let hasMore = true
  let offset = 0

  while (hasMore) {
    const { data, error } = await queryBuilderFn().range(offset, offset + step - 1)

    if (error) throw new Error(error.message)

    if (data && data.length > 0) {
      allRows = [...allRows, ...data]
    }

    if (!data || data.length < step) {
      hasMore = false
    } else {
      offset += step
    }
  }

  return allRows
}