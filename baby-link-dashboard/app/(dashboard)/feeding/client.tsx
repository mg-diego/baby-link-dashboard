'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Utensils, Milk, Timer } from 'lucide-react'

export default function FeedingClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { kpis, dailyComposition, bottleTrends, nursingTrends } = stats

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-outline">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">🍼 Alimentación</h1>
          <p className="text-onSurfaceVariant">Tomas de pecho, biberón y sólidos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-lg text-primary"><Utensils size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Tomas / Día</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgFeeds}</p>
            </div>
          </div>
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-secondary/20 p-3 rounded-lg text-secondary"><Milk size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Media Biberón (ml)</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgMl} ml</p>
            </div>
          </div>
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-error/20 p-3 rounded-lg text-error"><Timer size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Media Pecho (min)</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgNursingMins} m</p>
            </div>
          </div>
        </div>

        <div className="border-b border-outline mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              Composición Diaria
            </button>
            <button
              onClick={() => setActiveTab('bottle')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bottle' ? 'border-secondary text-secondary' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              Volumen Biberón
            </button>
            <button
              onClick={() => setActiveTab('nursing')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'nursing' ? 'border-error text-error' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              Duración Pecho
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500 bg-background p-6 rounded-xl border border-outline">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tipos de Tomas por Día</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyComposition} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                  <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="nursing" name="Pecho" stackId="a" fill="#F09595" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="bottle" name="Biberón" stackId="a" fill="#B8A0E8" />
                  <Bar dataKey="solids" name="Sólidos" stackId="a" fill="#7BB8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'bottle' && (
          <div className="animate-in fade-in duration-500 bg-background p-6 rounded-xl border border-outline">
            <h3 className="text-lg font-semibold text-foreground mb-6">Cantidad Diaria (ml)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottleTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                  <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} cursor={{fill: '#242746'}} />
                  <Bar dataKey="totalMl" name="Mililitros" fill="#B8A0E8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'nursing' && (
          <div className="animate-in fade-in duration-500 bg-background p-6 rounded-xl border border-outline">
            <h3 className="text-lg font-semibold text-foreground mb-6">Minutos de Pecho Diarios</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nursingTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                  <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="L" name="Izquierdo" stackId="a" fill="#F09595" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="R" name="Derecho" stackId="a" fill="#E8A0A0" />
                  <Bar dataKey="U" name="Indefinido" stackId="a" fill="#DCA0A0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}