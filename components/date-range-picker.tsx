'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format, parseISO, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

const quickRanges = [
    {
        label: 'Últimos 7 días',
        range: () => ({ from: subDays(new Date(), 6), to: new Date() }),
    },
    {
        label: 'Últimos 30 días',
        range: () => ({ from: subDays(new Date(), 29), to: new Date() }),
    },
    {
        label: 'Últimos 3 meses',
        range: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
    },
    {
        label: 'Últimos 6 meses',
        range: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
    },
    {
        label: 'Este mes',
        range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
    },
    {
        label: 'Mes anterior',
        range: () => {
            const prev = subMonths(new Date(), 1)
            return { from: startOfMonth(prev), to: endOfMonth(prev) }
        },
    },
]

interface DateRangePickerProps {
    defaultDays?: number; // Permite pasarle 7, 30, 90... desde la page si fuera necesario
}

export default function DateRangePicker({ defaultDays = 30 }: DateRangePickerProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const popoverRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)

    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    // Si no hay parámetros en la URL, asume los últimos N días definidos
    const [date, setDate] = useState<DateRange | undefined>({
        from: startParam ? parseISO(startParam) : subDays(new Date(), defaultDays - 1),
        to: endParam ? parseISO(endParam) : new Date(),
    })

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const applyRange = (range: DateRange | undefined) => {
        setDate(range)
        const params = new URLSearchParams(searchParams.toString())

        if (range?.from) {
            params.set('start', format(range.from, 'yyyy-MM-dd'))
        } else {
            params.delete('start')
        }
        if (range?.to) {
            params.set('end', format(range.to, 'yyyy-MM-dd'))
        } else {
            params.delete('end')
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    const clearDates = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Al limpiar, volvemos al estado inicial por defecto para mantener la coherencia
        const defaultRange = {
            from: subDays(new Date(), defaultDays - 1),
            to: new Date()
        }
        setDate(defaultRange)
        
        const params = new URLSearchParams(searchParams.toString())
        params.delete('start')
        params.delete('end')
        router.push(`${pathname}?${params.toString()}`)
        setIsOpen(false)
    }

    const label = date?.from
        ? date.to
            ? `${format(date.from, 'dd LLL', { locale: es })} - ${format(date.to, 'dd LLL, y', { locale: es })}`
            : format(date.from, 'dd LLL, y', { locale: es })
        : 'Seleccionar fechas'

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl border border-outline hover:bg-surface-container/80 transition-colors"
            >
                <CalendarIcon size={16} className="text-primary shrink-0" />
                <span className="text-sm text-on-surface">{label}</span>
                {startParam || endParam ? (
                    <X
                        size={14}
                        className="text-on-surface/40 hover:text-error transition-colors cursor-pointer ml-1"
                        onClick={clearDates}
                    />
                ) : (
                    <ChevronDown size={14} className="text-on-surface/40 ml-1" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-surface border border-outline rounded-xl shadow-2xl flex overflow-hidden">

                    {/* Quick ranges */}
                    <div className="flex flex-col gap-1 p-3 border-r border-outline w-44 shrink-0">
                        {quickRanges.map(({ label, range }) => (
                            <button
                                key={label}
                                onClick={() => { applyRange(range()); setIsOpen(false) }}
                                className="text-left text-sm px-3 py-2 rounded-lg text-on-surface/70 hover:bg-surface-container hover:text-on-surface transition-colors"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="p-4">
                        {/* Estilos en globals.css (.rdp-dark) */}
                        <DayPicker
                            className="rdp-dark"
                            mode="range"
                            selected={date}
                            onSelect={applyRange}
                            locale={es}
                            numberOfMonths={1}
                            pagedNavigation
                        />
                    </div>
                </div>
            )}
        </div>
    )
}