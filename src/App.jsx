import { useEffect, useState } from "react";
import WeeklySchedule from './components/WeeklySchedule';
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from './assets/Data/materias_paralelos.json';
import FiecMallas from "./assets/Data/FiecMallas_con_codigos.json";
import Malla from "./components/Malla";

export default function App() {
  const [codigoMateria, setCodigoMateria] = useState("");
  const [eventos, setEventos] = useState([]);

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
  };

  const handleCodigoMateria = (codigo) => {
    setCodigoMateria(codigo);
  };

  return (
    <div className="flex flex-col">
      <div className="flex w-full place-content-center">
        <Malla
          materias={FiecMallas.Fiec[0].materias}
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
        <WeeklySchedule />
      </div>
    </div>
  );
}
