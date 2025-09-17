import { useEffect, useState, useRef } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import ExamSchedule from "./components/ExamSchedule";
import DownloadAllPDF from "./components/DownloadAllPDF";
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from "./assets/Data/materias_paralelos.json";
import FiecMallas from "./assets/Data/FiecMallas_con_codigos.json";
import LogoEspol from "./assets/logo_espol.png";
import LogoTaws from "./assets/logo_taws.png";
import Malla from "./components/Malla";

export default function App() { // Componente principal de la aplicación
  const [codigoMateria, setCodigoMateria] = useState(""); //Inicializa el estado para el código de la materia seleccionada
  const [eventos, setEventos] = useState([]); //Inicializa el espacio para los eventos del horario
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(0); //Inicializa el espacio para la carrera seleccionada
  const scheduleRef = useRef(null);

useEffect(() => {
  const syncFromLS = () => {
    try {
      const stored = localStorage.getItem("horario"); //Carga los eventos guardados en el almacenamiento local al iniciar la aplicación
      const parsed = stored ? JSON.parse(stored) : { events: [] };  // Los eventos se almacenan como un array de objetos JSON
      setEventos(Array.isArray(parsed?.events) ? parsed.events : []);
    } catch (e) {
      console.error("Error releyendo localStorage:", e);
      setEventos([]);
    }
  };

  syncFromLS();

  const handleStorage = (e) => {
    if (!e || e.key === "horario") syncFromLS();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("localStorageChange", syncFromLS);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("localStorageChange", syncFromLS);
  };
}, []);


  const agregarEventos = (nuevos) => {
    const stored = localStorage.getItem("horario");
    const parsed = stored ? JSON.parse(stored) : null;
    const eventosActuales = parsed?.events || [];

    console.log(nuevos);

    const eventosUnicos = nuevos.filter( // Filtra los nuevos eventos para evitar duplicados
      (nuevo) =>
        !eventosActuales.some( // Compara cada nuevo evento con los existentes
          (existente) =>
            existente.title === nuevo.title &&
            existente.day === nuevo.day &&
            existente.startTime === nuevo.startTime
        )
    );

    const actualizados = [...eventosActuales, ...eventosUnicos];
    setEventos(actualizados);
    localStorage.setItem("horario", JSON.stringify({ events: actualizados }));
    window.dispatchEvent(new Event("localStorageChange"));
    setCodigoMateria("");
  };

  const handleCodigoMateria = (codigo) => { // Maneja la selección de una materia
    setCodigoMateria(""); // Resetea el código de materia para evitar múltiples actualizaciones
    const materiaExists = eventos.some(
      (evento) => evento.codigoMateria === codigo // Verifica si la materia ya ha sido agregada
    );

    if (!materiaExists) { // Solo actualiza si la materia no ha sido agregada
      setTimeout(() => {
        setCodigoMateria(codigo); 
      }, 0);
    } else {
      alert("Esta materia ya ha sido agregada a tu horario.");
    }
  };

  const handleCarreraChange = (index) => { // Maneja el cambio de carrera
    localStorage.removeItem("horario");
    setEventos([]); // Resetea los eventos al cambiar de carrera
    setCodigoMateria(""); // Resetea el código de materia seleccionada
    setCarreraSeleccionada(index); // Actualiza la carrera seleccionada
  };

  const handleBackToMalla = () => { // Maneja el regreso a la vista de malla curricular
    setCodigoMateria("");
  };

  return (
    <div className="flex flex-col">
      <nav className="bg-white">
        <div className="container mx-auto">
          <div
            className="flex items-center"
            style={{ marginLeft: "25px", height: "80px" }}
          >
            <img
              src={LogoEspol}
              alt="Logo Espol"
              style={{ width: "150px", height: "59px" }}
            />
            <h1 // Título de la aplicación
              className="text-xl mb-2 mt-6"
              style={{
                color: "#787878",
                fontFamily: "sans-serif",
                fontSize: "18px",
                marginLeft: "15px",
              }}
            >
              Generador de Horarios
            </h1>
            <img // Logo de TAWS
              src={LogoTaws}
              alt="Logo Taws"
              style={{ width: "55px", marginLeft: "825px" }}
            />
          </div>
        </div>
        <div
          style={{ width: "100%", height: "3px", backgroundColor: "#FAB900" }} // Línea amarilla decorativa
        ></div>
        <div
          className="flex justify-between items-center text-white"
          style={{ backgroundColor: "#001C43", height: "50px" }}
        >
          <div className="flex items-center">
            <select
              value={carreraSeleccionada}
              onChange={(e) => handleCarreraChange(parseInt(e.target.value))}
              className="px-4 py-2 pr-10 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              style={{
                minWidth: "200px",
                backgroundColor: "#001C43",
                color: "#FFFFFF",
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='white'><path d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "14px",
                borderColor: "#001C43",
              }}
            >
              {FiecMallas.Fiec.map((carrera, index) => (
                <option key={carrera.carrera} value={index}>
                  {carrera.carrera}
                </option>
              ))}
            </select>
          </div>
          {codigoMateria && (
            <button
            onClick={handleBackToMalla}
            className="p-2 rounded flex items-center justify-center group"
            aria-label="Volver a la malla"
            title="Volver a la malla"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-4.5 0 32 32"
              fill="white"
              stroke="white"
              className="w-7 h-7 transition-transform duration-200 group-hover:scale-110 group-hover:fill-blue-400"
            >
              <path d="M19.469 12.594l3.625 3.313c0.438 0.406 0.313 0.719-0.281 0.719h-2.719v8.656c0 0.594-0.5 1.125-1.094 1.125h-4.719v-6.063c0-0.594-0.531-1.125-1.125-1.125h-2.969c-0.594 0-1.125 0.531-1.125 1.125v6.063h-4.719c-0.594 0-1.125-0.531-1.125-1.125v-8.656h-2.688c-0.594 0-0.719-0.313-0.281-0.719l10.594-9.625c0.438-0.406 1.188-0.406 1.656 0l2.406 2.156v-1.719c0-0.594 0.531-1.125 1.125-1.125h2.344c0.594 0 1.094 0.531 1.094 1.125v5.875z"></path>
            </svg>
          </button>
          
          )}
        </div>
      </nav>

      <div className="flex w-full place-content-center">
        {!codigoMateria ? ( // Muestra la malla curricular si no se ha seleccionado una materia
          <Malla // Componente de la malla curricular
            materias={FiecMallas.Fiec[carreraSeleccionada].materias} 
            onMateriaClick={handleCodigoMateria} // Maneja el clic en una materia
            eventos={eventos}
          />
        ) : (
          <SelectorParalelos // Componente para seleccionar paralelos de la materia
            codigoMateria={codigoMateria} // Código de la materia seleccionada
            materiasParalelos={materiasParalelos} // Datos de materias y sus paralelos
            onConfirmar={agregarEventos} // Maneja la confirmación de selección de paralelos
            onBack={handleBackToMalla} // Maneja el regreso a la malla curricular
            nombreMateria={
              FiecMallas.Fiec[carreraSeleccionada].materias.find( // Busca el nombre de la materia seleccionada
                (m) => m.codigo === codigoMateria
              )?.Materia || codigoMateria
            }
          />
        )}
      </div>

      <div className="flex w-full place-items-center place-content-center">
        <div className="overflow-x-auto" id="weekly-schedule" ref={scheduleRef}> 
          <WeeklySchedule key={carreraSeleccionada} /> {/* Componente del horario semanal */}
        </div>
        <div className="overflow-x-auto" id="exam-schedule" ref={scheduleRef}>
          <ExamSchedule key={carreraSeleccionada} /> {/* Componente del horario de exámenes */}
        </div>
      </div>
      <div className="flex w-full place-content-center mt-4 mb-6">
        <DownloadAllPDF />
      </div>
    </div>
  );
}
