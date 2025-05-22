import React, { useState, useEffect } from "react";
import CourseFilterBar from "./CourseFilterBar/CourseFilterBar";

// Lista de colores predefinidos para las materias
const MATERIA_COLORS = [
  "#FF6B6B", // Rojo coral
  "#4ECDC4", // Turquesa
  "#45B7D1", // Azul cielo
  "#96CEB4", // Verde menta
  "#FFEEAD", // Amarillo suave
  "#D4A5A5", // Rosa pálido
  "#9B59B6", // Púrpura
  "#3498DB", // Azul
  "#E67E22", // Naranja
  "#2ECC71", // Verde esmeralda
  "#F1C40F", // Amarillo
  "#1ABC9C", // Verde agua
  "#E74C3C", // Rojo
  "#34495E", // Azul oscuro
  "#16A085", // Verde oscuro
];

// Mapa para mantener un registro de los colores asignados
const colorAssignments = new Map();

// Función para obtener un color único para cada materia
const getColorFromString = (codigoMateria) => {
  // Si la materia ya tiene un color asignado, retornarlo
  if (colorAssignments.has(codigoMateria)) {
    return colorAssignments.get(codigoMateria);
  }

  // Si no hay colores disponibles, reiniciar el mapa
  if (colorAssignments.size >= MATERIA_COLORS.length) {
    colorAssignments.clear();
  }

  // Asignar el siguiente color disponible
  const color = MATERIA_COLORS[colorAssignments.size];
  colorAssignments.set(codigoMateria, color);
  return color;
};

function SelectorParalelos({
  codigoMateria,
  materiasParalelos,
  onConfirmar,
  nombreMateria,
}) {
  const [filters, setFilters] = useState({
    sectionNumber: "",
    professor: "",
    day: "",
    startTime: "",
    endTime: "",
  });
  const handleFilterChange = (newFilters) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const filterParalelos = (paralelos) => {
    return paralelos.filter((paralelo) => {
      // Filter by section number
      if (
        filters.sectionNumber &&
        !paralelo.Paralelo.toString().includes(filters.sectionNumber)
      ) {
        return false;
      }

      // Filter by professor
      if (
        filters.professor &&
        !paralelo.Profesor.toLowerCase().includes(
          filters.professor.toLowerCase()
        )
      ) {
        return false;
      }

      // Filter by day and time
      if (filters.day || filters.startTime || filters.endTime) {
        const hasMatchingSchedule = paralelo.horarios.some((horario) => {
          // Check day
          if (filters.day && horario.Dia !== filters.day) {
            return false;
          }

          // Convert times to minutes for comparison
          const classStart = timeToMinutes(horario.HoraInicio);
          const classEnd = timeToMinutes(horario.HoraFin);
          const filterStart = timeToMinutes(filters.startTime);
          const filterEnd = timeToMinutes(filters.endTime);

          // Check start time
          if (filters.startTime && classStart < filterStart) {
            return false;
          }

          // Check end time
          if (filters.endTime && classEnd > filterEnd) {
            return false;
          }

          return true;
        });

        if (!hasMatchingSchedule) {
          return false;
        }
      }

      return true;
    });
  };

  const [paraleloSeleccionado, setParaleloSeleccionado] = useState(null);
  const [paraleloPractico, setParaleloPractico] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [startIndexPractico, setStartIndexPractico] = useState(0);
  const [errorMensaje, setErrorMensaje] = useState(null);
  const PARALELOS_POR_PAGINA = 3;

  // Cargar horario desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("horario");
    if (saved) {
      setEventos(JSON.parse(saved));
    }
  }, []);

  // Resetear selecciones cuando cambia la materia
  useEffect(() => {
    setParaleloSeleccionado(null);
    setParaleloPractico(null);
    setStartIndex(0);
    setStartIndexPractico(0);
  }, [codigoMateria]);

  if (!materiasParalelos[codigoMateria]) {
    return <div>No se encontró la materia.</div>;
  }

  const teoricos = materiasParalelos[codigoMateria].Teorico;
  const practicos = materiasParalelos[codigoMateria].Practico;
  const color = getColorFromString(codigoMateria);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - PARALELOS_POR_PAGINA));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(
        teoricos.length - PARALELOS_POR_PAGINA,
        prev + PARALELOS_POR_PAGINA
      )
    );
  };

  const handlePrevPractico = () => {
    setStartIndexPractico((prev) => Math.max(0, prev - PARALELOS_POR_PAGINA));
  };

  const handleNextPractico = () => {
    setStartIndexPractico((prev) =>
      Math.min(
        practicos.length - PARALELOS_POR_PAGINA,
        prev + PARALELOS_POR_PAGINA
      )
    );
  };

  const convertirAHorario = (paralelo, tipo) =>
    paralelo.horarios.map((h) => ({
      title: `${nombreMateria}\n${h.HoraInicio.slice(0, 5)} - ${h.HoraFin.slice(
        0,
        5
      )}\n📍${h.Aula}`,
      day: h.Dia,
      startTime: h.HoraInicio,
      endTime: h.HoraFin,
      fechaexa_primer: h.FechaExa_Primer,
      horaInicioExamen: h.HoraInicioE,
      horaFinExamen: h.HoraFinE,
      color,
    }));

  const hayConflictoHorario = (eventosNuevos, eventosExistentes) => {
    for (const nuevo of eventosNuevos) {
      for (const existente of eventosExistentes) {
        // Verificar si es el mismo día
        if (nuevo.day === existente.day) {
          // Convertir horas a minutos para facilitar la comparación
          const nuevoInicio = convertirHoraAMinutos(nuevo.startTime);
          const nuevoFin = convertirHoraAMinutos(nuevo.endTime);
          const existenteInicio = convertirHoraAMinutos(existente.startTime);
          const existenteFin = convertirHoraAMinutos(existente.endTime);

          // Verificar si hay solapamiento
          if (
            (nuevoInicio >= existenteInicio && nuevoInicio < existenteFin) ||
            (nuevoFin > existenteInicio && nuevoFin <= existenteFin) ||
            (nuevoInicio <= existenteInicio && nuevoFin >= existenteFin)
          ) {
            return {
              hayConflicto: true,
              materiaConflicto: existente.title.split("\n")[0],
              dia: nuevo.day,
              hora: `${nuevo.startTime.slice(0, 5)} - ${nuevo.endTime.slice(
                0,
                5
              )}`,
            };
          }
        }
      }
    }
    return { hayConflicto: false };
  };

  const hayConflictoConExamen = (eventosNuevos) => {
    const materia = materiasParalelos[codigoMateria];
    if (!materia || !materia.fechaexa_primer) return { hayConflicto: false };

    const diaExamen = materia.fechaexa_primer;
    const horaInicioExamen = materia.horaInicioE;
    const horaFinExamen = materia.horaFinE;

    for (const evento of eventosNuevos) {
      if (evento.day === diaExamen) {
        const eventoInicio = convertirHoraAMinutos(evento.startTime);
        const eventoFin = convertirHoraAMinutos(evento.endTime);
        const examenInicio = convertirHoraAMinutos(horaInicioExamen);
        const examenFin = convertirHoraAMinutos(horaFinExamen);

        if (
          (eventoInicio >= examenInicio && eventoInicio < examenFin) ||
          (eventoFin > examenInicio && eventoFin <= examenFin) ||
          (eventoInicio <= examenInicio && eventoFin >= examenFin)
        ) {
          return {
            hayConflicto: true,
            dia: diaExamen,
            hora: `${horaInicioExamen.slice(0, 5)} - ${horaFinExamen.slice(
              0,
              5
            )}`,
          };
        }
      }
    }
    return { hayConflicto: false };
  };

  const convertirHoraAMinutos = (hora) => {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  };

  const confirmarSeleccion = () => {
    if (paraleloSeleccionado === null) return;

    const eventosTeorico = convertirAHorario(
      teoricos[paraleloSeleccionado],
      "Teórico"
    );
    const eventosPractico =
      paraleloPractico !== null
        ? convertirAHorario(practicos[paraleloPractico], "Práctico")
        : [];

    // Leer eventos actuales
    const stored = localStorage.getItem("horario");
    const parsed = stored ? JSON.parse(stored) : null;
    const eventosActuales = parsed?.events || [];

    // Obtener el código de la materia del primer evento teórico
    const codigoMateria = eventosTeorico[0].title.split("\n")[0];

    // Filtrar eventos que no sean de esta materia
    const otrosEventos = eventosActuales.filter(
      (ev) => !ev.title.startsWith(codigoMateria)
    );

    // Verificar conflictos con los eventos existentes
    const conflictosTeoricos = hayConflictoHorario(
      eventosTeorico,
      otrosEventos
    );
    if (conflictosTeoricos.hayConflicto) {
      setErrorMensaje({
        titulo: "¡Conflicto de Horario!",
        mensaje: `No se puede agregar la materia porque hay un conflicto con ${conflictosTeoricos.materiaConflicto} el día ${conflictosTeoricos.dia} a las ${conflictosTeoricos.hora}`,
        tipo: "error",
      });
      return;
    }

    if (eventosPractico.length > 0) {
      const conflictosPracticos = hayConflictoHorario(
        eventosPractico,
        otrosEventos
      );
      if (conflictosPracticos.hayConflicto) {
        setErrorMensaje({
          titulo: "¡Conflicto de Horario!",
          mensaje: `No se puede agregar la materia porque hay un conflicto con ${conflictosPracticos.materiaConflicto} el día ${conflictosPracticos.dia} a las ${conflictosPracticos.hora}`,
          tipo: "error",
        });
        return;
      }
    }

    // Verificar conflictos con exámenes
    const conflictosExamenTeorico = hayConflictoConExamen(eventosTeorico);
    if (conflictosExamenTeorico.hayConflicto) {
      setErrorMensaje({
        titulo: "¡Conflicto con Examen!",
        mensaje: `No se puede agregar la materia porque hay un conflicto con el examen del primer parcial el día ${conflictosExamenTeorico.dia} a las ${conflictosExamenTeorico.hora}`,
        tipo: "error",
      });
      return;
    }

    if (eventosPractico.length > 0) {
      const conflictosExamenPractico = hayConflictoConExamen(eventosPractico);
      if (conflictosExamenPractico.hayConflicto) {
        setErrorMensaje({
          titulo: "¡Conflicto con Examen!",
          mensaje: `No se puede agregar la materia porque hay un conflicto con el examen del primer parcial el día ${conflictosExamenPractico.dia} a las ${conflictosExamenPractico.hora}`,
          tipo: "error",
        });
        return;
      }
    }

    // Combinar los otros eventos con los nuevos
    const nuevosEventos = [
      ...otrosEventos,
      ...eventosTeorico,
      ...eventosPractico,
    ].map((ev, i) => ({
      ...ev,
      id: Date.now() + i,
    }));

    onConfirmar(nuevosEventos);
    window.dispatchEvent(new Event("localStorageChange"));
    setParaleloSeleccionado(null);
    setParaleloPractico(null);
    setErrorMensaje({
      titulo: "¡Éxito!",
      mensaje: "Paralelos guardados en el horario correctamente.",
      tipo: "success",
    });
  };

  const filteredTeoricos = filterParalelos(teoricos);
  const filteredPracticos = filterParalelos(practicos);

  const paralelosVisibles = filteredTeoricos.slice(
    startIndex,
    startIndex + PARALELOS_POR_PAGINA
  );
  const paralelosPracticosVisibles = filteredPracticos.slice(
    startIndexPractico,
    startIndexPractico + PARALELOS_POR_PAGINA
  );

  return (
    <div className="p-4">
      {/* Alerta de error/éxito */}
      {errorMensaje && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transform transition-all duration-500 ${
            errorMensaje.tipo === "error"
              ? "bg-red-100 border-l-4 border-red-500"
              : "bg-green-100 border-l-4 border-green-500"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {errorMensaje.tipo === "error" ? (
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  errorMensaje.tipo === "error"
                    ? "text-red-800"
                    : "text-green-800"
                }`}
              >
                {errorMensaje.titulo}
              </h3>
              <div
                className={`mt-2 text-sm ${
                  errorMensaje.tipo === "error"
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                {errorMensaje.mensaje}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMensaje(null)}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  errorMensaje.tipo === "error"
                    ? "text-red-500 hover:bg-red-200 focus:ring-red-600"
                    : "text-green-500 hover:bg-green-200 focus:ring-green-600"
                }`}
              >
                <svg
                  className="h-5 w-5"
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
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-2">Paralelos Teóricos</h2>
      <div>
        <CourseFilterBar onFilterChange={handleFilterChange} />
        {/* Your course listing component */}
      </div>
      <div className="relative">
        {/* Flecha izquierda */}
        {teoricos.length > PARALELOS_POR_PAGINA && (
          <button
            onClick={handlePrev}
            disabled={startIndex === 0}
            className={`
                            absolute left-0 top-1/2 -translate-y-1/2 z-10
                            w-10 h-10 rounded-full bg-white/80 shadow-lg
                            flex items-center justify-center
                            transition-all duration-300
                            ${
                              startIndex === 0
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-white hover:shadow-xl"
                            }
                        `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        <div className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-transform duration-500 ease-in-out">
            {paralelosVisibles.map((paralelo, idx) =>
              paraleloSeleccionado === null ||
              paraleloSeleccionado === startIndex + idx ? (
                <div
                  key={startIndex + idx}
                  className={`border rounded p-3 cursor-pointer hover:bg-blue-100 ${
                    paraleloSeleccionado === startIndex + idx
                      ? "bg-blue-200"
                      : ""
                  }`}
                  onClick={() => setParaleloSeleccionado(startIndex + idx)}
                >
                  <div className="font-bold text-center mb-2">
                    PAR. {paralelo.Paralelo}
                  </div>
                  <div className="text-center mb-3">
                    <span className="inline-flex items-center justify-center">
                      👤 {paralelo.Profesor}
                    </span>
                  </div>
                  <div
                    className={`grid ${
                      paralelo.horarios.length === 1
                        ? "grid-cols-1"
                        : "grid-cols-2"
                    } gap-4`}
                  >
                    {paralelo.horarios.map((h, i) => (
                      <div key={i} className="text-center">
                        <div className="font-medium">{h.Dia}</div>
                        <div>
                          ⏱️{h.HoraInicio.slice(0, 5)} - {h.HoraFin.slice(0, 5)}
                        </div>
                        {paralelo.horarios.length === 1 ? (
                          <div className="text-sm text-gray-600">
                            📍{h.Aula}
                          </div>
                        ) : (
                          paralelo.horarios[0].Aula !==
                            paralelo.horarios[1].Aula && (
                            <div className="text-sm text-gray-600">
                              📍{h.Aula}
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                  {paralelo.horarios.length > 1 &&
                    paralelo.horarios[0].Aula === paralelo.horarios[1].Aula && (
                      <div className="text-sm text-gray-600 text-center mt-2">
                        📍{paralelo.horarios[0].Aula}
                      </div>
                    )}
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Flecha derecha */}
        {teoricos.length > PARALELOS_POR_PAGINA && (
          <button
            onClick={handleNext}
            disabled={startIndex + PARALELOS_POR_PAGINA >= teoricos.length}
            className={`
                            absolute right-0 top-1/2 -translate-y-1/2 z-10
                            w-10 h-10 rounded-full bg-white/80 shadow-lg
                            flex items-center justify-center
                            transition-all duration-300
                            ${
                              startIndex + PARALELOS_POR_PAGINA >=
                              teoricos.length
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-white hover:shadow-xl"
                            }
                        `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {paraleloSeleccionado !== null && practicos.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-2">Paralelos Prácticos</h2>
          <div className="relative">
            {/* Flecha izquierda */}
            {practicos.length > PARALELOS_POR_PAGINA &&
              paraleloPractico === null && (
                <button
                  onClick={handlePrevPractico}
                  disabled={startIndexPractico === 0}
                  className={`
                                    absolute left-0 top-1/2 -translate-y-1/2 z-10
                                    w-10 h-10 rounded-full bg-white/80 shadow-lg
                                    flex items-center justify-center
                                    transition-all duration-300
                                    ${
                                      startIndexPractico === 0
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-white hover:shadow-xl"
                                    }
                                `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-transform duration-500 ease-in-out">
                {paralelosPracticosVisibles.map((paralelo, idx) =>
                  paraleloPractico === null ||
                  paraleloPractico === startIndexPractico + idx ? (
                    <div
                      key={startIndexPractico + idx}
                      className={`border rounded p-3 cursor-pointer hover:bg-green-100 ${
                        paraleloPractico === startIndexPractico + idx
                          ? "bg-green-200"
                          : ""
                      }`}
                      onClick={() =>
                        setParaleloPractico(startIndexPractico + idx)
                      }
                    >
                      <div className="font-bold text-center mb-2">
                        PAR. {paralelo.Paralelo}
                      </div>
                      <div className="text-center mb-3">
                        <span className="inline-flex items-center justify-center">
                          👤 {paralelo.Profesor}
                        </span>
                      </div>
                      <div
                        className={`grid ${
                          paralelo.horarios.length === 1
                            ? "grid-cols-1"
                            : "grid-cols-2"
                        } gap-4`}
                      >
                        {paralelo.horarios.map((h, i) => (
                          <div key={i} className="text-center">
                            <div className="font-medium">{h.Dia}</div>
                            <div>
                              ⏱️{h.HoraInicio.slice(0, 5)} -{" "}
                              {h.HoraFin.slice(0, 5)}
                            </div>
                            {paralelo.horarios.length === 1 ? (
                              <div className="text-sm text-gray-600">
                                📍{h.Aula}
                              </div>
                            ) : (
                              paralelo.horarios[0].Aula !==
                                paralelo.horarios[1].Aula && (
                                <div className="text-sm text-gray-600">
                                  📍{h.Aula}
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                      {paralelo.horarios.length > 1 &&
                        paralelo.horarios[0].Aula ===
                          paralelo.horarios[1].Aula && (
                          <div className="text-sm text-gray-600 text-center mt-2">
                            📍{paralelo.horarios[0].Aula}
                          </div>
                        )}
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Flecha derecha */}
            {practicos.length > PARALELOS_POR_PAGINA &&
              paraleloPractico === null && (
                <button
                  onClick={handleNextPractico}
                  disabled={
                    startIndexPractico + PARALELOS_POR_PAGINA >=
                    practicos.length
                  }
                  className={`
                                    absolute right-0 top-1/2 -translate-y-1/2 z-10
                                    w-10 h-10 rounded-full bg-white/80 shadow-lg
                                    flex items-center justify-center
                                    transition-all duration-300
                                    ${
                                      startIndexPractico +
                                        PARALELOS_POR_PAGINA >=
                                      practicos.length
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-white hover:shadow-xl"
                                    }
                                `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
          </div>
        </>
      )}

      {paraleloSeleccionado !== null && (
        <div className="flex justify-center mt-8">
          <button
            className="bg-blue-800 text-white px-8 py-3 rounded-lg text-lg font-semibold 
                                 shadow-lg hover:bg-blue-900 hover:shadow-xl transform hover:scale-105 
                                 transition-all duration-300 ease-in-out"
            onClick={confirmarSeleccion}
          >
            Confirmar selección
          </button>
        </div>
      )}
    </div>
  );
}

export default SelectorParalelos;
