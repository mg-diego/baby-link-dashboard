import { ReferenceLine } from 'recharts'

export const renderMonthDividers = (data: any[], primary: any) => {
  const boundaries: { date: string, label: string }[] = [];
  let lastMonth = '';

  data.forEach((d) => {
    if (!d?.date) return;
    
    const currentMonth = d.date.substring(0, 7); // Extrae "YYYY-MM"
    
    // Si ya teníamos un mes registrado y el actual es diferente, ¡hay salto de mes!
    if (lastMonth && currentMonth !== lastMonth) {
      const dateObj = new Date(d.date);
      boundaries.push({
        date: d.date,
        // Formatea el nombre del mes (ej: "JUN")
        label: dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
      });
    }
    lastMonth = currentMonth;
  });

  return boundaries.map(b => (
    <ReferenceLine 
      key={b.date} 
      x={b.date} 
      stroke={primary} 
      strokeOpacity={0.3}
      strokeDasharray="4 4"
      label={{ 
        position: 'insideTopLeft', 
        value: b.label, 
        fill: primary, 
        fontSize: 10, 
        fontWeight: 'bold',
        offset: 10 // Lo separa un poco de la línea
      }} 
    />
  ));
};