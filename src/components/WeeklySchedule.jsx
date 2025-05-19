import { useState, useEffect } from 'react';
import scheduleData from '../data/schedule.json';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const WeeklySchedule = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Cargar eventos desde el archivo JSON
    setEvents(scheduleData.events);
  }, []);

  // Genera una matriz vacía para los slots de la semana
  const grid = DAYS.map(day => HOURS.map(hour => null));

  // Coloca los eventos en la matriz
  events.forEach(event => {
    const dayIdx = DAYS.indexOf(event.day);
    const startIdx = parseInt(event.startTime.split(':')[0]);
    const endIdx = parseInt(event.endTime.split(':')[0]);
    grid[dayIdx][startIdx] = { ...event, duration: endIdx - startIdx };
    // Marca las horas ocupadas por el evento para no renderizar slots vacíos ahí
    for (let i = startIdx + 1; i < endIdx; i++) {
      grid[dayIdx][i] = 'occupied';
    }
  });

  return (
    <div className="p-4 bg-gray-100 rounded mx-10 w-11/12 place-content-center">
      <h2 className="text-2xl font-bold mb-4">Horario Semanal</h2>
      <div className="overflow-x-auto">
        <table
          className="border-separate border-spacing-0 w-full"
          style={{
            // minWidth will be determined by column widths
          }}
        >
          <thead>
            <tr>
              {/* Hours column header - leave empty */}
              <th className="bg-gray-100"></th>
              {DAYS.map(day => (
                <th
                  key={day}
                  className="text-center bg-gray-100 font-semibold px-2 py-2 border-b border-gray-300"
                  style={{ minWidth: 140 }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hourIdx) => (
              <tr key={hour}>
                {/* Hours column */}
                <td className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 px-2 py-1" style={{ minWidth: 50 }}>
                  {hour}
                </td>
                {DAYS.map((day, dayIdx) => {
                  const cell = grid[dayIdx][hourIdx];
                  if (cell === 'occupied') return null;
                  if (cell) {
                    return (
                      <td
                        key={day + hour}
                        rowSpan={cell.duration}
                        className="align-top px-1 py-0 border-b border-gray-200"
                        style={{ backgroundColor: cell.color, minWidth: 140 }}
                      >
                        <div className="text-white font-semibold text-xs leading-tight">
                          {cell.title}
                        </div>
                        <div className="text-white text-[10px]">
                          {cell.startTime} - {cell.endTime}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={day + hour}
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