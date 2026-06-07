export default function Loader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex flex-col h-64 items-center justify-center gap-4 rounded-2xl bg-surface border border-outline">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-outline" />
        <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-sm text-on-surface/50">{text}</p>
    </div>
  )
}