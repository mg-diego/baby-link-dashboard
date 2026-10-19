import GrowthClient from './client'
import { getGrowthStats } from './data'

export default async function GrowthPage() {
  const stats = await getGrowthStats()
  return <GrowthClient stats={stats} />
}
