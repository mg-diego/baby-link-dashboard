export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-2">Resumen general del estado de tu bebé.</p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="h-32 bg-blue-50 rounded-xl border border-blue-100 p-6">
            <h3 className="text-blue-800 font-semibold">Último sueño</h3>
          </div>
          <div className="h-32 bg-green-50 rounded-xl border border-green-100 p-6">
            <h3 className="text-green-800 font-semibold">Última toma</h3>
          </div>
          <div className="h-32 bg-amber-50 rounded-xl border border-amber-100 p-6">
            <h3 className="text-amber-800 font-semibold">Último pañal</h3>
          </div>
        </div>
      </div>
    </div>
  )
}