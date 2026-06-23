import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

/**
 * Obtiene el total de filas con una query HEAD (sin datos) y luego
 * lanza todas las páginas en paralelo con Promise.all.
 * 
 * Mucho más eficiente que offset secuencial:
 * - N páginas secuenciales: N * latencia
 * - N páginas paralelas:    1 * latencia (+ overhead de conexiones)
 */
export async function fetchAllRows<T>(
  queryBuilderFn: () => any,
  pageSize: number = 1000
): Promise<T[]> {
  // Intentar obtener el count para fetch paralelo
  let totalCount: number | null = null

  try {
    const { count, error } = await queryBuilderFn()
      .select('*', { count: 'exact', head: true })

    if (!error && count !== null) totalCount = count
  } catch {
    // Si falla el count, caemos al fallback secuencial
  }

  // Sin datos
  if (totalCount === 0) return []

  // Count disponible y cabe en una página — caso más común
  if (totalCount !== null && totalCount <= pageSize) {
    const { data, error } = await queryBuilderFn().range(0, pageSize - 1)
    if (error) throw new Error(error.message)
    return (data as T[]) ?? []
  }

  // Count disponible y necesita varias páginas — fetch paralelo
  if (totalCount !== null && totalCount > pageSize) {
    const totalPages = Math.ceil(totalCount / pageSize)
    const pages = await Promise.all(
      Array.from({ length: totalPages }, (_, i) =>
        queryBuilderFn()
          .range(i * pageSize, (i + 1) * pageSize - 1)
          .then(({ data, error }: { data: T[] | null; error: any }) => {
            if (error) throw new Error(error.message)
            return (data as T[]) ?? []
          })
      )
    )
    return pages.flat()
  }

  // Fallback: paginación secuencial si el count no estuvo disponible
  const allRows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryBuilderFn().range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    allRows.push(...(data as T[]))
    if (data.length < pageSize) break
    from += pageSize
  }

  return allRows
}