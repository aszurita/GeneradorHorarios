import { useEffect, useState, useRef } from "react";
import WeeklySchedule from './components/WeeklySchedule';
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from './assets/Data/materias_paralelos.json';
import FiecMallas from "./assets/Data/FiecMallas_con_codigos.json";
import LogoEspol from "./assets/logo_espol.png";
import LogoTaws from "./assets/logo_taws.png";
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
      <nav className="bg-white">
        <div className="container mx-auto">
          <div className="flex items-center" style={{ marginLeft: "25px", height: "80px" }}>
            <img src={LogoEspol} alt="Logo Espol" style={{ width: "150px", height: "59px" }}/>
            <h1 className="text-xl mb-2 mt-6" style={{color: "#787878", fontFamily: "sans-serif", fontSize: "18px", marginLeft: "15px" }}>Generador de Horarios</h1>
            <img src={LogoTaws} alt="Logo Taws" style={{ width:"55px", marginLeft: "825px" }}/>
          </div>
        </div>
        <div style={{ width: "100%", height: "3px", backgroundColor: "#FAB900" }}></div>
        <div className="flex gap-4 text-white" style={{ backgroundColor: "#001C43", height: "50px"}}>
            {FiecMallas.Fiec.map((carrera, index) => (
              <button
                key={carrera.carrera}
                onClick={() => handleCarreraChange(index)}
                className={`px-4 py-2 rounded ${
                  carreraSeleccionada === index
                    ? "text-yellow-500"
                    : "hover:bg-blue-500"
                }`}
              >
                {carrera.carrera}
              </button>
            ))}
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