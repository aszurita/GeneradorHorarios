import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const HOURS = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor((i + 14) / 2); // Start from 7 AM (14 half-hours)
  const minute = (i + 14) % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

const WeeklySchedule = () => {
  const [grid, setGrid] = useState([]);
  const scheduleRef = useRef(null);

  const updateGrid = () => {
    // Leer desde localStorage
    const stored = localStorage.getItem("horario");
    console.log(stored);
    const parsed = stored ? JSON.parse(stored) : null;
    const events = parsed?.events || [];

    // Crear matriz de slots vacíos
    const newGrid = DAYS.map(() => Array(HOURS.length).fill(null));

    // Llenar matriz con eventos
    events.forEach((event) => {
      const dayIdx = DAYS.findIndex(
        (d) => d.toUpperCase() === event.day.toUpperCase()
      );
      if (dayIdx === -1) return;

      const [startHour, startMinute] = event.horaInicioExamen
        .split(":")
        .map(Number);
      const [endHour, endMinute] = event.horaFinExamen.split(":").map(Number);

      // Convertir a índices de media hora
      const startIdx = (startHour - 7) * 2 + (startMinute === 30 ? 1 : 0);
      const endIdx = (endHour - 7) * 2 + (endMinute === 30 ? 1 : 0);

      if (startIdx >= 0 && startIdx < HOURS.length) {
        newGrid[dayIdx][startIdx] = {
          ...event,
          duration: endIdx - startIdx,
        };

        for (let i = startIdx + 1; i < endIdx; i++) {
          if (i < HOURS.length) {
            newGrid[dayIdx][i] = "occupied";
          }
        }
      }
    });

    setGrid(newGrid);
  };

  const handleDownload = async () => {
    if (!scheduleRef.current) return;

    try {
      const canvas = await html2canvas(scheduleRef.current, {
        scale: 2, // Mejor calidad
        backgroundColor: "#f3f4f6", // Color de fondo gris claro
        logging: false,
        useCORS: true,
      });

      // Convertir canvas a imagen
      const image = canvas.toDataURL("image/png");

      // Crear link de descarga
      const link = document.createElement("a");
      link.href = image;
      link.download = "horario-semanal.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert("Error al generar la imagen del horario");
    }
  };

  const eliminarEvento = (evento) => {
    // Leer eventos actuales
    const stored = localStorage.getItem("horario");
    const parsed = stored ? JSON.parse(stored) : null;
    const eventos = parsed?.events || [];

    // Extraer el código de la materia del título (asumiendo que el código está al inicio del título)
    const codigoMateria = evento.title.split("\n")[0];

    // Filtrar todos los eventos que contengan el mismo código de materia
    const eventosActualizados = eventos.filter(
      (ev) => !ev.title.startsWith(codigoMateria)
    );

    // Guardar eventos actualizados
    localStorage.setItem(
      "horario",
      JSON.stringify({ events: eventosActualizados })
    );
    window.dispatchEvent(new Event("localStorageChange"));
  };

  useEffect(() => {
    // Inicializar grid vacío
    setGrid(DAYS.map(() => Array(HOURS.length).fill(null)));

    // Actualizar grid con datos del localStorage
    updateGrid();

    // Escuchar cambios en el localStorage
    const handleStorageChange = (e) => {
      if (e.key === "horario") {
        updateGrid();
      }
    };

    // Escuchar cambios en la misma pestaña
    const handleLocalStorageChange = () => {
      updateGrid();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("localStorageChange", handleLocalStorageChange);

    // Limpiar los event listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleLocalStorageChange
      );
    };
  }, []); // El array vacío asegura que el efecto solo se ejecute al montar y desmontar

  return (
    <div className="p-4 bg-gray-100 rounded mx-10 w-11/12 place-content-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Horario de Examenes</h2>
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Descargar Horario
        </button>
      </div>
      <div className="overflow-x-auto" ref={scheduleRef}>
        <table className="border-separate border-spacing-0 w-full">
          <thead>
            <tr>
              <th className="bg-gray-100"></th>
              {DAYS.map((day) => (
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
                <td
                  className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 px-2 py-1"
                  style={{ minWidth: 50 }}
                >
                  {hour}
                </td>
                {DAYS.map((_, dayIdx) => {
                  const cell = grid[dayIdx]?.[hourIdx];
                  if (cell === "occupied") return null;
                  if (cell) {
                    return (
                      <td
                        key={`${dayIdx}-${hourIdx}`}
                        rowSpan={cell.duration}
                        className="align-top px-1 py-0 border-b border-gray-200 relative group"
                        style={{ backgroundColor: cell.color, minWidth: 140 }}
                      >
                        <div className="text-white font-semibold text-xs leading-tight whitespace-pre-line">
                          {cell.title}
                        </div>
                        <button
                          onClick={() => eliminarEvento(cell)}
                          className="absolute top-1 right-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-200"
                          title="Eliminar materia"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
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
