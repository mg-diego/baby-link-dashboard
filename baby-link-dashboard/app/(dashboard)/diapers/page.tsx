export default function DiapersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Pañales</h1>
        <p className="text-gray-500 mt-2">Aquí visualizaremos las gráficas de peso y altura.</p>
        
        {/* Placeholder de Gráfico */}
        <div className="mt-8 h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
          Próximamente: Gráficos de Percentiles
        </div>
      </div>
    </div>
  )
}