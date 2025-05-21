import { useEffect, useState, useRef } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import ExamSchedule from "./components/ExamSchedule";
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from "./assets/Data/materias_paralelos.json";
import FiecMallas from "./assets/Data/FiecMallas_con_codigos.json";
import Malla from "./components/Malla";

export default function App() {
  const [codigoMateria, setCodigoMateria] = useState("");
  const [eventos, setEventos] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(0);
  const scheduleRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("horario");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.events && Array.isArray(parsed.events)) {
          setEventos(parsed.events);
        }
      } catch (error) {
        console.error("Error parsing localStorage horario:", error);
      }
    }
  }, []);

  const agregarEventos = (nuevos) => {
    // Leer eventos actuales
    const stored = localStorage.getItem("horario");
    const parsed = stored ? JSON.parse(stored) : null;
    const eventosActuales = parsed?.events || [];

    console.log(nuevos);

    // Filtrar eventos que ya existen
    const eventosUnicos = nuevos.filter(
      (nuevo) =>
        !eventosActuales.some(
          (existente) =>
            existente.title === nuevo.title &&
            existente.day === nuevo.day &&
            existente.startTime === nuevo.startTime
        )
    );

    // Combinar eventos actuales con los nuevos
    const actualizados = [...eventosActuales, ...eventosUnicos];
    setEventos(actualizados);
    localStorage.setItem("horario", JSON.stringify({ events: actualizados }));
    setCodigoMateria("");
  };

  const handleCodigoMateria = (codigo) => {
    setCodigoMateria("");
    setTimeout(() => {
      setCodigoMateria(codigo);
    }, 0);
  };

  const handleCarreraChange = (index) => {
    // Limpiar localStorage
    localStorage.removeItem("horario");
    // Limpiar eventos
    setEventos([]);
    // Limpiar materia seleccionada
    setCodigoMateria("");
    // Actualizar carrera seleccionada
    setCarreraSeleccionada(index);
  };

  return (
    <div className="flex flex-col">
      {/* Sección de selección de carrera */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-b-3xl shadow-lg mb-8">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Generador de Horarios
          </h1>
          <div className="flex flex-wrap justify-center gap-3">
            {FiecMallas.Fiec.map((carrera, index) => (
              <button
                key={carrera.carrera}
                onClick={() => handleCarreraChange(index)}
                className={`
                  px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105
                  ${
                    carreraSeleccionada === index
                      ? "bg-white text-blue-600 shadow-lg"
                      : "bg-blue-500/30 text-white hover:bg-blue-500/50"
                  }
                `}
              >
                {carrera.carrera}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full place-content-center">
        <Malla
          materias={FiecMallas.Fiec[carreraSeleccionada].materias}
          onMateriaClick={handleCodigoMateria}
        />
      </div>

      <div className="flex w-full place-content-center">
        {codigoMateria && (
          <SelectorParalelos
            codigoMateria={codigoMateria}
            materiasParalelos={materiasParalelos}
            onConfirmar={agregarEventos}
            nombreMateria={
              FiecMallas.Fiec[carreraSeleccionada].materias.find(
                (m) => m.codigo === codigoMateria
              )?.Materia || codigoMateria
            }
          />
        )}
      </div>

      <div className="flex w-full place-items-center place-content-center">
        <div className="overflow-x-auto" ref={scheduleRef}>
          <WeeklySchedule key={carreraSeleccionada} />
        </div>
        <div className="overflow-x-auto" ref={scheduleRef}>
          <ExamSchedule key={carreraSeleccionada} />
        </div>
      </div>
    </div>
  );
}
