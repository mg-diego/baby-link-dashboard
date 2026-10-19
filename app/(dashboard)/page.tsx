import { getOverviewStats } from './data'
import OverviewClient from './client'

export default async function OverviewPage() {
  const stats = await getOverviewStats()
  return <OverviewClient stats={stats} />
}
