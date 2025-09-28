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

// Añadido: helper para fetch seguro
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function App() {
  const [codigoMateria, setCodigoMateria] = useState("");
  const [eventos, setEventos] = useState([]);
  const [extraccionLogs, setExtraccionLogs] = useState([]);
  const [extraccionActiva, setExtraccionActiva] = useState(false);
  const [captchaImg, setCaptchaImg] = useState(null);
  const [creds, setCreds] = useState({ usuario: '', password: '' });
  const [token, setToken] = useState(null);
  const [enviandoCreds, setEnviandoCreds] = useState(false);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(() => {
    const url = new URL(window.location.href);
    const fromUrl = parseInt(url.searchParams.get("c") ?? "", 10);
    if (!Number.isNaN(fromUrl)) return fromUrl;
    const ls = parseInt(localStorage.getItem("carreraSeleccionada") ?? "", 10);
    if (!Number.isNaN(ls)) return ls;
    return ""; // Valor vacío por defecto para mostrar "Selecciona la carrera"
  });

  const scheduleRef = useRef(null);
  const logsIntervalRef = useRef(null);

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

  const solicitarToken = async () => {
    try {
      const r = await fetch('/api/extraccion/token');
      if (r.ok) {
        const j = await r.json();
        setToken(j.token);
      }
    } catch {}
  };

  useEffect(() => { solicitarToken(); }, []);

  const enviarCredenciales = async () => {
    if (!creds.usuario || !creds.password) return alert('Completa usuario y contraseña');
    if (!token) return alert('Token no listo, recarga la página');
    setEnviandoCreds(true);
    try {
      await postJSON('/api/extraccion/credenciales', { ...creds, token });
      await iniciarExtraccion(true);
    } catch (e) {
      alert('Error enviando credenciales: ' + e.message);
    } finally {
      setEnviandoCreds(false);
    }
  };

  const iniciarExtraccion = async (yaTieneCreds = false) => {
    try {
      if (!yaTieneCreds && (!creds.usuario || !creds.password)) {
        return alert('Primero ingresa credenciales y pulsa Guardar/Iniciar');
      }
      if (!yaTieneCreds) {
        await enviarCredenciales();
        return; // enviarCredenciales llama a iniciarExtraccion(true)
      }
      await postJSON('/api/extraccion/iniciar');
      setExtraccionActiva(true);
      // Poll logs
      logsIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/extraccion/logs');
          const data = await res.json();
          setExtraccionLogs(data.logs || []);
        } catch {}
        // Intentar obtener captcha si aun no lo tenemos
        if (!captchaImg) {
          try {
            const r = await fetch('/api/extraccion/captcha');
            if (r.ok) {
              const j = await r.json();
              setCaptchaImg(j.image);
            }
          } catch {}
        }
      }, 1500);
    } catch (e) {
      alert('Error iniciando extracción: ' + e.message);
    }
  };

  const enviarEntradaProceso = async (texto) => {
    try {
      await postJSON('/api/extraccion/input', { texto });
    } catch (e) {
      alert('Error enviando entrada: ' + e.message);
    }
  };

  useEffect(() => {
    return () => {
      if (logsIntervalRef.current) clearInterval(logsIntervalRef.current);
    };
  }, []);

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
        <div className="mt-8 mb-4 w-full flex flex-col items-center gap-4">
          {!extraccionActiva && (
            <div className="w-full max-w-md p-4 border rounded bg-white shadow flex flex-col gap-3">
              <h3 className="font-semibold text-gray-700">Credenciales (no se guardan)</h3>
              <input
                className="border px-2 py-1 rounded"
                placeholder="Usuario"
                value={creds.usuario}
                onChange={e => setCreds(c => ({ ...c, usuario: e.target.value }))}
              />
              <input
                className="border px-2 py-1 rounded"
                placeholder="Contraseña"
                type="password"
                value={creds.password}
                onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
              />
              <button
                className="px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#003566' }}
                onClick={() => iniciarExtraccion(false)}
                disabled={enviandoCreds}
              >
                {enviandoCreds ? 'Enviando...' : 'Guardar e iniciar extracción'}
              </button>
              <p className="text-[10px] text-gray-500">Las credenciales solo viven en memoria mientras dura el proceso.</p>
            </div>
          )}
          {extraccionActiva && (
            <button
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#003566' }}
              disabled
            >Extracción en curso...</button>
          )}
          {extraccionActiva && (
            <div className="w-full max-w-3xl text-left p-4 border rounded bg-gray-50 text-xs h-64 overflow-auto">
              {extraccionLogs.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap font-mono">{l}</div>
              ))}
              {captchaImg && (
                <div className="mt-3 flex flex-col items-start gap-1">
                  <span className="font-semibold text-gray-700">Captcha detectado:</span>
                  <img src={captchaImg} alt="captcha" className="border rounded max-h-24" />
                  <span className="text-[10px] text-gray-500">Escribe el texto del captcha en el campo y presiona Enter</span>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Ingresa usuario / contraseña / captcha según pida"
                  className="border px-2 py-1 flex-1 rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      enviarEntradaProceso(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <span className="text-gray-500 text-[10px] self-center">Pulsa Enter para enviar</span>
              </div>
            </div>
          )}
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
