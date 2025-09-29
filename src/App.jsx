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

/* ============================
   Helpers HTTP (frontend)
   ============================
   - postJSON: simple POST con JSON y manejo de errores
   - getJSONNoCache: GET que evita cache del navegador (útil para captcha)
*/
async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || "Error HTTP");
  return txt ? JSON.parse(txt) : {};
}

async function getJSONNoCache(url) {
  const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function App() {
  /* ============================
     Estados principales de la App
     ============================ */
  const [codigoMateria, setCodigoMateria] = useState(""); // Materia seleccionada para ver paralelos
  const [eventos, setEventos] = useState([]);             // Eventos agregados al horario
  const [extraccionLogs, setExtraccionLogs] = useState([]);     // Logs que vienen del script Python
  const [extraccionActiva, setExtraccionActiva] = useState(false); // True cuando Python está corriendo
  const [captchaImg, setCaptchaImg] = useState(null);      // Imagen del captcha (base64)
  const [creds, setCreds] = useState({ usuario: "", password: "" }); // Credenciales temporales
  const [token, setToken] = useState(null);                // Token anti-CSRF generado por el backend
  const [enviandoCreds, setEnviandoCreds] = useState(false); // Evita doble envío de credenciales
  const [highlightComplementaria, setHighlightComplementaria] = useState(new Set()); // Códigos de complementarias disponibles
  const [highlightMatched, setHighlightMatched] = useState(new Set()); // Códigos de materias disponibles normales
  const [resultadoExtraccion, setResultadoExtraccion] = useState(null); // JSON final extraído
  const [paralelosDinamicos, setParalelosDinamicos] = useState({}); // Paralelos obtenidos dinámicamente del backend
  const HIGHLIGHT_KEY = "extraccionHighlightsV1";

  /* Fases del flujo de extracción:
     - idle: aún no corremos Python
     - captcha: Python nos pide captcha
     - procesando: ya enviamos captcha y estamos esperando
     - completado: llegó el JSON final
  */
  const [faseExtraccion, setFaseExtraccion] = useState("idle");
  const [captchaEnviado, setCaptchaEnviado] = useState(false);

  /* 🔴 NUEVO: controla si se muestra el panel de credenciales/captcha.
     Se oculta automáticamente al terminar la extracción (cuando ya podemos resaltar en la malla).
  */
  const [mostrarPanelExtraccion, setMostrarPanelExtraccion] = useState(true);

  /* ============================
     Limpieza de estado persistido al cargar
     - borramos horario/selecciones previas para un flujo "limpio"
     ============================ */
  useEffect(() => {
    try {
      localStorage.removeItem("horario");
      localStorage.removeItem("materiasAprobadas");
      localStorage.removeItem(HIGHLIGHT_KEY);
      localStorage.removeItem("paralelosDinamicosV1");
    } catch {}
    setEventos([]);
    setHighlightComplementaria(new Set());
    setHighlightMatched(new Set());
    setParalelosDinamicos({});
    setResultadoExtraccion(null);
  }, []);

  /* ============================
     Cargar highlights previos (si existieran)
     ============================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIGHLIGHT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setHighlightComplementaria(new Set(parsed.comp || []));
        setHighlightMatched(new Set(parsed.mats || []));
      }
    } catch {}
  }, []);

  /* ============================
     Selección de carrera (desde URL o localStorage)
     ============================ */
  const [carreraSeleccionada, setCarreraSeleccionada] = useState(() => {
    const url = new URL(window.location.href);
    const fromUrl = parseInt(url.searchParams.get("c") ?? "", 10);
    if (!Number.isNaN(fromUrl)) return fromUrl;
    const ls = parseInt(localStorage.getItem("carreraSeleccionada") ?? "", 10);
    if (!Number.isNaN(ls)) return ls;
    return "";
  });

  const scheduleRef = useRef(null);
  const logsIntervalRef = useRef(null);

  /* ============================
     Sincronizar eventos ↔ localStorage
     ============================ */
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

  /* ============================
     Agregar eventos sin duplicar
     ============================ */
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

  /* ============================
     Handlers UI de carrera/materia
     ============================ */
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

  /* ============================
     Token anti-CSRF desde backend
     ============================ */
  const solicitarToken = async () => {
    try {
      const r = await fetch("/api/extraccion/token");
      if (r.ok) {
        const j = await r.json();
        setToken(j.token);
      } else {
        setToken(null);
      }
    } catch {
      setToken(null);
    }
  };

  useEffect(() => {
    solicitarToken();
  }, []);

  /* ============================
     Envío de credenciales al backend
     - Requiere token válido
     ============================ */
  const enviarCredenciales = async () => {
    if (!creds.usuario || !creds.password) return alert("Completa usuario y contraseña");
    if (!token) {
      await solicitarToken();
      if (!token) return alert("Token no listo, recarga la página");
    }
    setEnviandoCreds(true);
    try {
      await postJSON("/api/extraccion/credenciales", { ...creds, token });
      await iniciarExtraccion(true);
    } catch (e) {
      // Si falla por token, intentamos refrescar una vez
      if ((e.message || "").toLowerCase().includes("token")) {
        await solicitarToken();
        try {
          await postJSON("/api/extraccion/credenciales", { ...creds, token });
          await iniciarExtraccion(true);
          return;
        } catch {}
      }
      alert("Error enviando credenciales: " + e.message);
    } finally {
      setEnviandoCreds(false);
    }
  };

  /* ============================
     Lanzar extracción (Python) y "polling" de logs
     - Detecta cuándo hay captcha
     - Cuando finaliza, trae el JSON y procesa
     - Trae captcha con no-cache
     ============================ */
  const iniciarExtraccion = async (yaTieneCreds = false) => {
    try {
      if (!yaTieneCreds && (!creds.usuario || !creds.password)) {
        return alert("Primero ingresa credenciales y pulsa Guardar/Iniciar");
      }
      if (!yaTieneCreds) {
        await enviarCredenciales();
        return; // enviarCredenciales vuelve a llamar con true
      }

      await postJSON("/api/extraccion/iniciar");
      setExtraccionActiva(true);

      logsIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/extraccion/logs");
          const data = await res.json();
          setExtraccionLogs(data.logs || []);
          const logsTxt = (data.logs || []).join("\n");

          // Si Python pide captcha, mostramos la fase "captcha"
          if (logsTxt.includes("Introduce el texto del captcha")) {
            if (!captchaEnviado) setFaseExtraccion("captcha");
          } else if (captchaEnviado && faseExtraccion !== "completado") {
            setFaseExtraccion("procesando");
          }

          // Si Python terminó, solicitamos el JSON final
          if ((data.logs || []).some((l) => l.includes("EXTRACCION COMPLETADA"))) {
            try {
              const rj = await fetch("/api/extraccion/result");
              if (rj.ok) {
                const json = await rj.json();
                procesarResultado(json);     // ⬅️ aquí procesamos y (más abajo) ocultamos el panel
                clearInterval(logsIntervalRef.current);
                setFaseExtraccion("completado");
              }
            } catch {}
          }
        } catch {}

        // Traer la imagen del captcha sin caché (se repite mientras estemos en la fase de captcha)
        if (!captchaImg || faseExtraccion === "captcha") {
          try {
            const j = await getJSONNoCache("/api/extraccion/captcha");
            if (j.image) setCaptchaImg(j.image);
          } catch {}
        }
      }, 1500);
    } catch (e) {
      alert("Error iniciando extracción: " + e.message);
    }
  };

  /* ============================
     Enviar entrada dinámica (usuario/contraseña/captcha) hacia Python
     ============================ */
  const enviarEntradaProceso = async (texto) => {
    try {
      await postJSON("/api/extraccion/input", { texto });
    } catch (e) {
      alert("Error enviando entrada: " + e.message);
    }
  };

  // Limpieza del interval al desmontar el componente
  useEffect(() => {
    return () => {
      if (logsIntervalRef.current) clearInterval(logsIntervalRef.current);
    };
  }, []);

  /* ============================
     Cálculo de "highlights" en la malla
     - Verde para complementarias disponibles
     - Contorno para materias disponibles
     ============================ */
  const computeHighlights = (json, carreraIdx) => {
    if (!json || carreraIdx === "" || carreraIdx == null) return;
    try {
      const comp = json["Materias Complementarias"] || {};
      const mats = json["Materias"] || {};
      const compCodes = new Set(Object.keys(comp).map((c) => String(c).trim()));
      const matchedSet = new Set(Object.keys(mats).map((c) => String(c).trim()));

      // Filtrar complementarias según criterio de la malla
      const listaMalla = FiecMallas.Fiec[carreraIdx]?.materias || [];
      const compFiltered = new Set();
      listaMalla.forEach((m) => {
        const code = String(m.codigo).trim();
        if (compCodes.has(code)) {
          const nombre = (m.Materia || "").toUpperCase();
          if (m.tipo === "complementh" || nombre.includes("DEPORT")) {
            compFiltered.add(code);
          }
        }
      });

      setHighlightComplementaria(compFiltered);
      setHighlightMatched(matchedSet);

      // Persistimos para recargas
      try {
        localStorage.setItem(
          HIGHLIGHT_KEY,
          JSON.stringify({ comp: Array.from(compFiltered), mats: Array.from(matchedSet) })
        );
      } catch {}
    } catch (e) {
      console.error("Error computando highlights:", e);
    }
  };

  /* ============================
     Procesar JSON final
     - Actualiza highlights
     - Construye el mapa de paralelos dinámicos
     - 🔴 Oculta panel de credenciales/captcha (requisito)
     ============================ */
  const procesarResultado = (json) => {
    setResultadoExtraccion(json);
    computeHighlights(json, carreraSeleccionada);

    try {
      const dyn = {};
      const secciones = ["Materias Complementarias", "Materias"];
      secciones.forEach((sec) => {
        const grupo = json[sec] || {};
        Object.entries(grupo).forEach(([codigo, data]) => {
          if (!data) return;
          dyn[codigo.trim()] = {
            Teorico: data.Teorico || [],
            Practico: data.Practico || [],
          };
        });
      });
      setParalelosDinamicos(dyn);
      localStorage.setItem("paralelosDinamicosV1", JSON.stringify(dyn));
    } catch (e) {
      console.error("No se pudo construir paralelos dinamicos", e);
    }

    // 🔴 IMPORTANTE: al completar, ocultamos el panel de credenciales/captcha
    setMostrarPanelExtraccion(false);
  };

  /* ============================
     Cargar paralelos dinámicos previos (si existieran)
     ============================ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("paralelosDinamicosV1");
      if (raw) setParalelosDinamicos(JSON.parse(raw));
    } catch {}
  }, []);

  /* ============================
     Recalcular highlights si cambia la carrera
     ============================ */
  useEffect(() => {
    if (resultadoExtraccion) computeHighlights(resultadoExtraccion, carreraSeleccionada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carreraSeleccionada]);

  /* ============================
     Render principal
     ============================ */
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        carreraSeleccionada={carreraSeleccionada}
        handleCarreraChange={handleCarreraChange}
        codigoMateria={codigoMateria}
        handleBackToMalla={handleBackToMalla}
      />

      {/* Panel de credenciales / captcha
          🔴 Solo se muestra si:
             - hay carrera seleccionada
             - NO estamos dentro del selector de paralelos
             - y mostrarPanelExtraccion === true (se oculta al terminar) */}
      {mostrarPanelExtraccion && carreraSeleccionada !== "" && !codigoMateria && (
        <div className="mt-8 mb-4 w-full flex flex-col items-center gap-4">
          {/* Bloque de credenciales (visible antes de iniciar) */}
          {!extraccionActiva && (
            <div className="w-full max-w-md p-4 border rounded bg-white shadow flex flex-col gap-3 relative">
              <h3 className="font-semibold text-gray-700">Credenciales (no se guardan)</h3>
              <input
                className="border px-2 py-1 rounded"
                placeholder="Usuario"
                value={creds.usuario}
                onChange={(e) => setCreds((c) => ({ ...c, usuario: e.target.value }))}
              />
              <input
                className="border px-2 py-1 rounded"
                placeholder="Contraseña"
                type="password"
                value={creds.password}
                onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
              />
              <button
                className="px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#003566" }}
                onClick={() => iniciarExtraccion(false)}
                disabled={enviandoCreds}
              >
                {enviandoCreds ? "Enviando..." : "Guardar e iniciar extracción"}
              </button>
              <p className="text-[10px] text-gray-500">
                Las credenciales solo viven en memoria mientras dura el proceso.
              </p>
            </div>
          )}

          {/* Indicador de proceso en curso */}
          {extraccionActiva && (
            <button
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#003566" }}
              disabled
            >
              Extracción en curso...
            </button>
          )}

          {/* Consola de interacción (captcha/logs) */}
          {extraccionActiva && (
            <div className="w-full max-w-3xl text-left p-4 border rounded bg-gray-50 text-xs h-64 overflow-auto">
              {faseExtraccion === "captcha" && (
                <div className="flex flex-col gap-2">
                  <div className="font-mono text-sm">
                    Introduce el texto del captcha (mira la imagen):
                  </div>
                  {captchaImg && (
                    <img
                      src={captchaImg}
                      alt="captcha"
                      className="border rounded max-h-24 w-auto"
                    />
                  )}
                  <div className="text-[11px] text-gray-500">
                    Tus materias disponibles aparecerán con un contorno verde en la malla.
                  </div>
                </div>
              )}

              {faseExtraccion === "procesando" && (
                <div className="flex flex-col gap-1">
                  <div className="font-mono text-sm">
                    Procesando datos… (si te vuelve a pedir captcha, aparecerá arriba)
                  </div>
                  <div className="text-[12px] text-gray-700 font-medium">
                    Cargando materias disponibles...
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Cuando finalice, verás resaltos en la malla y este panel se ocultará.
                  </div>
                </div>
              )}

              {faseExtraccion === "completado" && (
                <div className="flex flex-col gap-1">
                  <div className="text-[12px] text-gray-700 font-medium">
                    Proceso completado. Revisa la malla para ver las materias disponibles resaltadas.
                  </div>
                </div>
              )}

              {/* Input que SOLO acepta texto cuando estamos en fase "captcha" */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder={
                    faseExtraccion === "captcha"
                      ? "Ingresa el CAPTCHA y pulsa Enter"
                      : "Esperando… (no enviar nada ahora)"
                  }
                  className="border px-2 py-1 flex-1 rounded"
                  disabled={faseExtraccion !== "captcha"}
                  onKeyDown={(e) => {
                    if (faseExtraccion !== "captcha") return;
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const val = e.currentTarget.value.trim();
                      enviarEntradaProceso(val);
                      setCaptchaEnviado(true);
                      setFaseExtraccion("procesando");
                      setCaptchaImg(null); // opcional: limpia imagen mostrada
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <span className="text-gray-500 text-[10px] self-center">Pulsa Enter para enviar</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido principal (malla / selector de paralelos) */}
      <div className="flex w-full place-content-center">
        {carreraSeleccionada === "" ? (
          // Mensaje inicial cuando no hay carrera
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Selecciona una carrera para comenzar
            </h2>
            <p className="text-gray-500">
              Elige tu carrera desde el menú desplegable para ver las materias disponibles
            </p>
          </div>
        ) : !codigoMateria ? (
          // Malla de la carrera (con resaltos de disponibles)
          <div className="w-full flex flex-col items-center">
            <Malla
              materias={FiecMallas.Fiec[carreraSeleccionada].materias}
              onMateriaClick={handleCodigoMateria}
              eventos={eventos}
              highlightComplementariaCodigoSet={highlightComplementaria}
              highlightMatchedCodigoSet={highlightMatched}
              onClickHighlighted={(codigo) => {
                if (paralelosDinamicos[codigo]) {
                  setCodigoMateria(codigo); // abre selector con datos dinámicos
                } else {
                  handleCodigoMateria(codigo); // usa datos estáticos
                }
              }}
            />
          </div>
        ) : (
          // Selector de paralelos de la materia escogida
          <SelectorParalelos
            codigoMateria={codigoMateria}
            materiasParalelos={
              paralelosDinamicos[codigoMateria] ? paralelosDinamicos : materiasParalelos
            }
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

      {/* Tablas de horario/exámenes + PDF */}
      {carreraSeleccionada !== "" && (
        <>
          <div className="flex w-full place-items-center place-content-center">
            <div className="overflow-x-auto" id="weekly-schedule" ref={scheduleRef}>
              <WeeklySchedule key={carreraSeleccionada} />
            </div>
            <div className="overflow-x-auto" id="exam-schedule" ref={scheduleRef}>
              <ExamSchedule key={carreraSeleccionada} />
            </div>
          </div>

          <div className="flex w-full place-content-center mt-4 mb-6">
            <DownloadAllPDF />
          </div>
        </>
      )}

      <SiteFooter />
    </div>
  );
}
