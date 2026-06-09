import { getOverviewStats } from './data'
import OverviewClient from './client'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  // Si manejas múltiples bebés, extrae el ID de la URL o usa uno por defecto
  const babyId = (resolvedParams.babyId as string) || "336351d0-40a3-4f4a-a04f-969a58212cb0"

  const stats = await getOverviewStats(babyId)

  return <OverviewClient stats={stats} />
}