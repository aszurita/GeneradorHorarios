import { useEffect, useState, useRef } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import ExamSchedule from "./components/ExamSchedule";
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
    const stored = localStorage.getItem("horario"); //Carga los eventos guardados en el almacenamiento local al iniciar la aplicación
    if (stored) { 
      try {
        const parsed = JSON.parse(stored); // Los eventos se almacenan como un array de objetos JSON
        if (parsed && parsed.events && Array.isArray(parsed.events)) { // Verifica que los datos sean válidos
          setEventos(parsed.events);
        }
      } catch (error) {
        console.error("Error parsing localStorage horario:", error);
      }
    }
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
            <h1
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
            <img // Logo de la TAWS
              src={LogoTaws}
              alt="Logo Taws"
              style={{ width: "55px", marginLeft: "825px" }}
            />
          </div>
        </div>
        <div
          style={{ width: "100%", height: "3px", backgroundColor: "#FAB900" }}
        ></div>
        <div
          className="flex gap-4 text-white"
          style={{ backgroundColor: "#001C43", height: "50px" }}
        >
          {FiecMallas.Fiec.map((carrera, index) => ( // Mapea las carreras disponibles para crear botones de selección
            <button
              key={carrera.carrera}
              onClick={() => handleCarreraChange(index)} // Maneja el cambio de carrera al hacer clic
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
        <div className="overflow-x-auto" ref={scheduleRef}> 
          <WeeklySchedule key={carreraSeleccionada} /> {/* Componente del horario semanal */}
        </div>
        <div className="overflow-x-auto" ref={scheduleRef}>
          <ExamSchedule key={carreraSeleccionada} /> {/* Componente del horario de exámenes */}
        </div>
      </div>
    </div>
  );
}
