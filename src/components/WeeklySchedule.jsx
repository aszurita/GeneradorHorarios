// WeeklySchedule.jsx
import { useEffect, useState } from 'react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor((i + 14) / 2); // Start from 7 AM (14 half-hours)
  const minute = (i + 14) % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const WeeklySchedule = () => {
  const [grid, setGrid] = useState([]);

  useEffect(() => {
    // Leer desde localStorage
    const stored = localStorage.getItem("horario");
    const parsed = stored ? JSON.parse(stored) : null;
    const events = parsed?.events || [];
    console.log(events);
    // Crear matriz de slots vacíos
    const newGrid = DAYS.map(() => Array(HOURS.length).fill(null));

    // Llenar matriz con eventos
    events.forEach(event => {
      const dayIdx = DAYS.findIndex(d => d.toUpperCase() === event.day.toUpperCase());
      if (dayIdx === -1) return;

      const [startHour, startMinute] = event.startTime.split(':').map(Number);
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      
      // Convertir a índices de media hora
      const startIdx = (startHour - 7) * 2 + (startMinute === 30 ? 1 : 0);
      const endIdx = (endHour - 7) * 2 + (endMinute === 30 ? 1 : 0);

      if (startIdx >= 0 && startIdx < HOURS.length) {
        newGrid[dayIdx][startIdx] = {
          ...event,
          duration: endIdx - startIdx
        };

        for (let i = startIdx + 1; i < endIdx; i++) {
          if (i < HOURS.length) {
            newGrid[dayIdx][i] = 'occupied';
          }
        }
      }
    });

    setGrid(newGrid);
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded mx-10 w-11/12 place-content-center">
      <h2 className="text-2xl font-bold mb-4">Horario Semanal</h2>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0 w-full">
          <thead>
            <tr>
              <th className="bg-gray-100"></th>
              {DAYS.map(day => (
                <th key={day} className="text-center bg-gray-100 font-semibold px-2 py-2 border-b border-gray-300" style={{ minWidth: 140 }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hourIdx) => (
              <tr key={hour}>
                <td className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 px-2 py-1" style={{ minWidth: 50 }}>{hour}</td>
                {DAYS.map((_, dayIdx) => {
                  const cell = grid[dayIdx]?.[hourIdx];
                  if (cell === 'occupied') return null;
                  if (cell) {
                    return (
                      <td
                        key={`${dayIdx}-${hourIdx}`}
                        rowSpan={cell.duration}
                        className="align-top px-1 py-0 border-b border-gray-200"
                        style={{ backgroundColor: cell.color, minWidth: 140 }}
                      >
                        <div className="text-white font-semibold text-xs leading-tight">{cell.title}</div>
                        <div className="text-white text-[10px]">{cell.startTime} - {cell.endTime}</div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={`${dayIdx}-${hourIdx}`}
                      className="border-b border-gray-200 px-1 py-0 h-8"
                      style={{ minWidth: 140 }}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklySchedule;
