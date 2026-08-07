import fs from 'fs'
import path from 'path'
import GrowthClient from './client'

function parseCSV(filePath: string) {
  try {
    const absolutePath = path.join(process.cwd(), filePath)
    const fileContent = fs.readFileSync(absolutePath, 'utf-8')
    const lines = fileContent.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',')
      const obj: any = {}
      headers.forEach((header, i) => {
        obj[header] = values[i] ? parseFloat(values[i]) : null
      })
      return obj
    })
  } catch (error) {
    return []
  }
}

export default async function GrowthPage() {
  const weightPercentiles = parseCSV('resources/weight-girls-percentiles.csv')
  const heightPercentiles = parseCSV('resources/height-girls-percentiles.csv')
  const headPercentiles = parseCSV('resources/head-girls-percentiles.csv')

  const measurements = [
    { age: 0.2, weight: 3.2, height: 49, head: 34.8 },
    { age: 1, weight: 4.7, height: 54.5, head: 37.2 },
    { age: 3, weight: 6.1, height: 59.8, head: 39.8 },
    { age: 6, weight: 7.8, height: 67.1, head: 43.5 },
    { age: 12, weight: 9.4, height: 75.6, head: 46.2 },
  ]

  const stats = {
    weightPercentiles,
    heightPercentiles,
    headPercentiles,
    measurements
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Crecimiento</h1>
        <p className="text-gray-500 mt-2">Aquí visualizaremos las gráficas de peso, altura y diámetro craneal basadas en percentiles.</p>

        <div className="mt-6">
          <GrowthClient stats={stats} />
        </div>
      </div>
    </div>
  )
}