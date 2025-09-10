import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HOURS = Array.from({ length: 25 }, (_, i) => { //Tamaño del Horario (7:00 AM a 19:00 PM)
  const hour = Math.floor((i + 14) / 2); 
  const minute = (i + 14) % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});
const getExamDay = (dateString) => {   //Convierte una fecha "dd/mm/yyyy" a un día de la semana
  const [day, month, year] = dateString.split("/");
  const date = new Date(`${month}/${day}/${year}`);
  return DAYS[date.getDay() - 1 ] || DAYS[0]; 
};

const WeeklySchedule = () => {
  const [grid, setGrid] = useState([]); //Inicializa la cuadrícula del horario
  const scheduleRef = useRef(null);

  const updateGrid = () => {
    const stored = localStorage.getItem("horario");
    console.log(stored);
    const parsed = stored ? JSON.parse(stored) : null; //lectura segura desde localStorage 
    const events = parsed?.events || []; //Obtiene los eventos almacenados

    const examMap = new Map();

    events.forEach((event) => { //Filtra eventos duplicados por código de materia
      if (!examMap.has(event.codigoMateria)) {
        examMap.set(event.codigoMateria, event);
      }
    });

    const newGrid = DAYS.map(() => Array(HOURS.length).fill(null));

    Array.from(examMap.values()).forEach((event) => {
      const examDay = getExamDay(event.fechaexa_primer);
      const dayIdx = DAYS.findIndex( //Busca el índice del día en la matriz DAYS
        (d) => d.toUpperCase() === examDay.toUpperCase()
      );
      if (dayIdx === -1) return;

      const [startHour, startMinute] = event.horaInicioExamen.split(":").map(Number); //Convierte la hora de inicio y fin a números
      const [endHour, endMinute] = event.horaFinExamen.split(":").map(Number);

      const startIdx = (startHour - 7) * 2 + (startMinute === 30 ? 1 : 0); //Convierte la hora a índice de media hora en la matriz
      const endIdx = (endHour - 7) * 2 + (endMinute === 30 ? 1 : 0);

      if (startIdx >= 0 && startIdx < HOURS.length) {
        newGrid[dayIdx][startIdx] = { //Agrega el evento a la cuadrícula
          ...event,
          duration: endIdx - startIdx,
        };

        for (let i = startIdx + 1; i < endIdx; i++) { //Valida que no se salga de los límites del horario y marca las celdas ocupadas
          if (i < HOURS.length) {
            newGrid[dayIdx][i] = "occupied";
          }
        }
      }
    });

    setGrid(newGrid);
  };

  const handleDownload = async () => { //Descarga el horario como imagen PNG
    if (!scheduleRef.current) return;

    try {
      const canvas = await html2canvas(scheduleRef.current, {
        scale: 2,
        backgroundColor: "#f3f4f6",
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png"); 

      const link = document.createElement("a"); //Crea un enlace para descargar la imagen
      link.href = image;
      link.download = "horario-semanal.png"; 
      document.body.appendChild(link);
      link.click(); // Inicia la descarga
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al generar la imagen:", error);
      alert("Error al generar la imagen del horario");
    }
  };

  const handleDownloadPDF = () => { //Descarga el horario como PDF
    if (!scheduleRef.current) return;

    const opt = {
      margin: 0.5,
      filename: "horario-semanal.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
    };

    html2pdf().set(opt).from(scheduleRef.current).save(); //Genera y guarda el PDF
  };

  const eliminarEvento = (evento) => {
    const stored = localStorage.getItem("horario"); //Obtiene los eventos almacenados
    const parsed = stored ? JSON.parse(stored) : null;  
    const eventos = parsed?.events || [];

    const codigoMateria = evento.title.split("\n")[0];

    const eventosActualizados = eventos.filter( //Filtra los eventos para eliminar la materia de la cuadrícula
      (ev) => !ev.title.startsWith(codigoMateria)
    );

    localStorage.setItem( //Actualiza el almacenamiento local
      "horario",
      JSON.stringify({ events: eventosActualizados })
    );
    window.dispatchEvent(new Event("localStorageChange")); //Notifica a otros componentes del cambio
  };

  useEffect(() => {
    setGrid(DAYS.map(() => Array(HOURS.length).fill(null)));

    updateGrid(); // Actualiza la cuadrícula al montar el componente

    const handleStorageChange = (e) => { // Maneja cambios en el almacenamiento local
      if (e.key === "horario") {
        updateGrid();
      }
    };

    const handleLocalStorageChange = () => { // Maneja eventos personalizados para cambios en el almacenamiento local
      updateGrid();
    };

    window.addEventListener("storage", handleStorageChange); //Si se realiza un cambio en la pestaña, actualiza la cuadrícula
    window.addEventListener("localStorageChange", handleLocalStorageChange); 

    return () => {
      window.removeEventListener("storage", handleStorageChange); //Limpia los event listeners
      window.removeEventListener(
        "localStorageChange",
        handleLocalStorageChange
      );
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded mx-10 w-11/12 place-content-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Horario de Examenes</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownload} //BOTON DESCARGAR PNG
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg  //ICONO DESCARGAR PNG
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
          <button
            onClick={handleDownloadPDF} //BOTON DESCARGAR PDF
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
          >
            <svg //ICONO DESCARGAR PDF
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto" ref={scheduleRef}>
        <table className="border-separate border-spacing-0 w-full">
          <thead>
            <tr>
              <th className="bg-gray-100"></th>
              {DAYS.map((day) => (  //Encabezados de los días
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
                  if (cell === "occupied") return null; //Si la celda está ocupada, no renderiza nada
                  if (cell) {
                    return (
                      <td
                        key={`${dayIdx}-${hourIdx}`} //Si hay un evento, renderiza la celda con la información del evento
                        rowSpan={cell.duration}  //Combina las celdas según la duración del evento
                        className="align-top px-1 py-0 border-b border-gray-200 relative group"
                        style={{ backgroundColor: cell.color, minWidth: 140 }}
                      >
                        <div className="text-white font-semibold text-xs leading-tight whitespace-pre-line">
                          {` ${cell.codigoMateria}\n${ 
                            cell.nombreMateria
                          }\n${cell.horaInicioExamen.slice( //Corta la hora a formato HH:MM
                            0,
                            5
                          )} - ${cell.horaFinExamen.slice(0, 5)}\n📍${
                            cell.aula
                          }`}
                        </div>
                        <button //Botón para eliminar Materia
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
                  return ( //Si la celda está libre, renderiza una celda vacía
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

export default WeeklySchedule; //Componente principal del horario semanal
