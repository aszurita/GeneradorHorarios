// src/App.jsx
import { useEffect, useState, useRef } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import ExamSchedule from "./components/ExamSchedule";
import DownloadAllPDF from "./components/DownloadAllPDF";
import SelectorParalelos from "./components/SelectorParalelos";
import materiasParalelos from "./assets/Data/materias_paralelos.json";
import FiecMallas from "./assets/Data/FiecMallas_con_codigos.json";
import Malla from "./components/Malla";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";

export default function App() {
  const [codigoMateria, setCodigoMateria] = useState("");
  const [eventos, setEventos] = useState([]);

  const [carreraSeleccionada, setCarreraSeleccionada] = useState(() => {
    const url = new URL(window.location.href);
    const fromUrl = parseInt(url.searchParams.get("c") ?? "", 10);
    if (!Number.isNaN(fromUrl)) return fromUrl;
    const ls = parseInt(localStorage.getItem("carreraSeleccionada") ?? "", 10);
    if (!Number.isNaN(ls)) return ls;
    return ""; // Valor vacío por defecto para mostrar "Selecciona la carrera"
  });

  const scheduleRef = useRef(null);

  useEffect(() => {
    const syncFromLS = () => {
      try {
        const stored = localStorage.getItem("horario");
        const parsed = stored ? JSON.parse(stored) : { events: [] };
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

    const eventosUnicos = nuevos.filter(
      (nuevo) =>
        !eventosActuales.some(
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

  const handleCodigoMateria = (codigo) => {
    setCodigoMateria("");
    const materiaExists = eventos.some((e) => e.codigoMateria === codigo);
    if (!materiaExists) {
      setTimeout(() => setCodigoMateria(codigo), 0);
    } else {
      alert("Esta materia ya ha sido agregada a tu horario.");
    }
  };

  const handleCarreraChange = (index) => {
    localStorage.removeItem("horario");
    setEventos([]);
    setCodigoMateria("");
    setCarreraSeleccionada(index);

    localStorage.setItem("carreraSeleccionada", String(index));
    window.dispatchEvent(new Event("carreraSeleccionadaChange"));

    const url = new URL(window.location.href);
    if (url.searchParams.get("c") !== String(index)) {
      url.searchParams.set("c", String(index));
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleBackToMalla = () => setCodigoMateria("");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        carreraSeleccionada={carreraSeleccionada}
        handleCarreraChange={handleCarreraChange}
        codigoMateria={codigoMateria}
        handleBackToMalla={handleBackToMalla}
        // NO pases redirectTo aquí, así no navega fuera de App
      />

      {/* Botón Extraer materias disponibles debajo del encabezado */}
      {carreraSeleccionada !== "" && !codigoMateria && (
        <div className="mt-8 mb-4 w-full flex justify-center">
          <button
            className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#003566' }}
            onClick={() => alert('Materias disponibles extraídas')}
          >
            Extraer materias disponibles
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="flex w-full place-content-center">
        {carreraSeleccionada === "" ? (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Selecciona una carrera para comenzar
            </h2>
            <p className="text-gray-500">
              Elige tu carrera desde el menú desplegable para ver las materias disponibles
            </p>
          </div>
        ) : !codigoMateria ? (
          <div className="w-full flex flex-col items-center">
            <Malla
              materias={FiecMallas.Fiec[carreraSeleccionada].materias}
              onMateriaClick={handleCodigoMateria}
              eventos={eventos}
            />
          </div>
        ) : (
          <SelectorParalelos
            codigoMateria={codigoMateria}
            materiasParalelos={materiasParalelos}
            onConfirmar={agregarEventos}
            onBack={handleBackToMalla}
            nombreMateria={
              FiecMallas.Fiec[carreraSeleccionada].materias.find(
                (m) => m.codigo === codigoMateria
              )?.Materia || codigoMateria
            }
          />
        )}
      </div>

      {carreraSeleccionada !== "" && (
        <div className="flex w-full place-items-center place-content-center">
          <div className="overflow-x-auto" id="weekly-schedule" ref={scheduleRef}>
            <WeeklySchedule key={carreraSeleccionada} />
          </div>
          <div className="overflow-x-auto" id="exam-schedule" ref={scheduleRef}>
            <ExamSchedule key={carreraSeleccionada} />
          </div>
        </div>
      )}

      {carreraSeleccionada !== "" && (
        <div className="flex w-full place-content-center mt-4 mb-6">
          <DownloadAllPDF />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
