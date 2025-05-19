import { useEffect, useState, useRef } from "react";
import WeeklySchedule from './components/WeeklySchedule';
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from './assets/Data/materias_paralelos.json';
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
    const actualizados = [...eventos, ...nuevos];
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
      {/* Navbar con selección de carrera */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold mb-2">Generador de Horarios</h1>
          <div className="flex gap-4">
            {FiecMallas.Fiec.map((carrera, index) => (
              <button
                key={carrera.carrera}
                onClick={() => handleCarreraChange(index)}
                className={`px-4 py-2 rounded ${
                  carreraSeleccionada === index
                    ? "bg-white text-blue-600"
                    : "hover:bg-blue-500"
                }`}
              >
                {carrera.carrera}
              </button>
            ))}
          </div>
        </div>
      </nav>

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
          />
        )}
      </div>

      <div className="flex w-full place-items-center place-content-center">
        <div className="overflow-x-auto" ref={scheduleRef}>
          <WeeklySchedule key={carreraSeleccionada} />
        </div>
      </div>
    </div>
  );
}
