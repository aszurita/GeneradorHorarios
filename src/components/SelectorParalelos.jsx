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

function SelectorParalelos({ // Componente para seleccionar paralelos de una materia
  codigoMateria,
  materiasParalelos, //Parametros recibidos del componente padre
  onConfirmar,
  onBack,
  nombreMateria,
}) {
  const [filters, setFilters] = useState({ //Inicializa los filtros de búsqueda
    sectionNumber: "",
    profesor: "",
    day: "",
    startTime: "",
    endTime: "",
  });
  const handleFilterChange = (newFilters) => { // Maneja los cambios en los filtros
    console.log("Filters changed:", newFilters); // Depuración
    setFilters(newFilters); // Actualiza el estado de los filtros
  };

  const timeToMinutes = (timeStr) => { // Convierte una cadena de tiempo "HH:MM" a minutos
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const filterParalelos = (paralelos) => {
    return paralelos.filter((paralelo) => { // Filtrar por número de sección y profesor
      if (
        filters.sectionNumber && //validar que el filtro no esté vacío
        !paralelo.Paralelo.toString().includes(filters.sectionNumber)
      ) {
        return false;
      }

      if ( // Filtrar por profesor 
        filters.profesor &&
        !paralelo.Profesor.toLowerCase().includes(
          filters.profesor.toLowerCase()
        )
      ) {
        return false;
      }

      // Filtrar por día y horas
      if (filters.day || filters.startTime || filters.endTime) {
        const hasMatchingSchedule = paralelo.horarios.some((horario) => {
          // Filtrar por día
          if (filters.day && horario.Dia !== filters.day) {
            return false;
          }

          // Convertir horas a minutos para comparación
          const classStart = timeToMinutes(horario.HoraInicio);
          const classEnd = timeToMinutes(horario.HoraFin);
          const filterStart = timeToMinutes(filters.startTime);
          const filterEnd = timeToMinutes(filters.endTime);

          // filtro por hora de inicio
          if (filters.startTime && classStart < filterStart) {
            return false;
          }

          // filtro por hora de fin
          if (filters.endTime && classEnd >= filterEnd) {
            return false;
          }

          return true;
        });

        if (!hasMatchingSchedule) { // Si ningún horario coincide, excluir el paralelo
          return false;
        }
      }

      return true;
    });
  };

  const [paraleloSeleccionado, setParaleloSeleccionado] = useState(null); // Inicializa el espacio para el paralelo seleccionado
  const [paraleloPractico, setParaleloPractico] = useState(null); // Inicializa el espacio para el paralelo práctico seleccionado
  const [eventos, setEventos] = useState([]); //Inicializa el espacio para los eventos del horario
  const [startIndex, setStartIndex] = useState(0); // Índice de inicio para la paginación de paralelos teóricos
  const [startIndexPractico, setStartIndexPractico] = useState(0); // Índice de inicio para la paginación de paralelos prácticos
  const [errorMensaje, setErrorMensaje] = useState(null); // Estado para mensajes de error o éxito
  const PARALELOS_POR_PAGINA = 3; // Número de paralelos a mostrar por página

  // Cargar horario desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("horario");
    if (saved) {
      setEventos(JSON.parse(saved));
    }
  }, []);

  // Resetear selecciones al cambiar de materia
  useEffect(() => {
    setParaleloSeleccionado(null);
    setParaleloPractico(null);
    setStartIndex(0);
    setStartIndexPractico(0);
  }, [codigoMateria]);

  if (!materiasParalelos[codigoMateria]) { // Manejo de error si la materia no existe
    return <div>No se encontró la materia.</div>;
  }

  const teoricos = materiasParalelos[codigoMateria].Teorico; // Obtiene los paralelos teóricos y prácticos de la materia seleccionada
  const practicos = materiasParalelos[codigoMateria].Practico; // Puede ser un array vacío si no hay prácticos
  const color = getColorFromString(codigoMateria); // Obtiene un color único para la materia

  const handlePrev = () => { // Maneja el movimiento entre paginas hacia atrás
    setStartIndex((prev) => Math.max(0, prev - PARALELOS_POR_PAGINA)); // Asegura que no se pase del límite
  };

  const handleNext = () => {  // Maneja el movimiento entre paginas hacia adelante
    setStartIndex((prev) => // Asegura que no se pase del límite
      Math.min(
        teoricos.length - PARALELOS_POR_PAGINA,
        prev + PARALELOS_POR_PAGINA
      )
    );
  };

  const handlePrevPractico = () => { // Maneja el movimiento entre paginas hacia atrás para prácticos
    setStartIndexPractico((prev) => Math.max(0, prev - PARALELOS_POR_PAGINA)); // Asegura que no se pase del límite
  };

  const handleNextPractico = () => { // Maneja el movimiento entre paginas hacia adelante para prácticos
    setStartIndexPractico((prev) => // Asegura que no se pase del límite
      Math.min(
        practicos.length - PARALELOS_POR_PAGINA,
        prev + PARALELOS_POR_PAGINA
      )
    );
  };

  const convertirAHorario = (paralelo, tipo) => // Convierte un paralelo en eventos de horario
    paralelo.horarios.map((h) => ({
      title: `${nombreMateria}\n${h.HoraInicio.slice(0, 5)} - ${h.HoraFin.slice( // Título del evento con nombre de materia y horario en formato HH:MM
        0,
        5
      )}\n📍${h.Aula}`,
      nombreMateria: nombreMateria,
      aula: h.Aula,
      paraleloSeleccionado: paraleloSeleccionado,
      codigoMateria: codigoMateria,
      day: h.Dia,
      startTime: h.HoraInicio,
      endTime: h.HoraFin,
      fechaexa_primer: h.FechaExa_Primer,
      horaInicioExamen: h.HoraInicioE,
      horaFinExamen: h.HoraFinE,
      color,
    }));

  const hayConflictoHorario = (eventosNuevos, eventosExistentes) => { // Verifica si hay conflictos entre nuevos eventos y eventos existentes
    for (const nuevo of eventosNuevos) { 
      for (const existente of eventosExistentes) { // Recorre cada nuevo evento y lo compara con los existentes
        // Verificar si es el mismo día
        if (nuevo.day === existente.day) {
          // Convertir horas a minutos para facilitar la comparación
          const nuevoInicio = convertirHoraAMinutos(nuevo.startTime);
          const nuevoFin = convertirHoraAMinutos(nuevo.endTime);
          const existenteInicio = convertirHoraAMinutos(existente.startTime);
          const existenteFin = convertirHoraAMinutos(existente.endTime);

          // Verificar si hay solapamiento
          if ( // Tres condiciones para detectar solapamiento
            (nuevoInicio >= existenteInicio && nuevoInicio < existenteFin) ||
            (nuevoFin > existenteInicio && nuevoFin <= existenteFin) ||
            (nuevoInicio <= existenteInicio && nuevoFin >= existenteFin)
          ) {
            return { // Si hay conflicto, retorna detalles del conflicto
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
    return { hayConflicto: false }; // Si no hay conflictos, retorna falso
  };

  const hayConflictoConExamen = (eventosNuevos) => { // Verifica si los nuevos eventos entran en conflicto con la fecha y hora del examen del primer parcial
    const materia = materiasParalelos[codigoMateria]; // Obtiene los detalles de la materia actual
    if (!materia || !materia.fechaexa_primer) return { hayConflicto: false }; // Si no hay materia o fecha de examen, no hay conflicto

    const diaExamen = materia.fechaexa_primer;
    const horaInicioExamen = materia.horaInicioE;
    const horaFinExamen = materia.horaFinE;

    for (const evento of eventosNuevos) {
      if (evento.day === diaExamen) { // Verifica si el evento es el mismo día que el examen
        const eventoInicio = convertirHoraAMinutos(evento.startTime); 
        const eventoFin = convertirHoraAMinutos(evento.endTime);
        const examenInicio = convertirHoraAMinutos(horaInicioExamen);
        const examenFin = convertirHoraAMinutos(horaFinExamen);

        if ( // Verifica si hay solapamiento
          (eventoInicio >= examenInicio && eventoInicio < examenFin) || 
          (eventoFin > examenInicio && eventoFin <= examenFin) ||
          (eventoInicio <= examenInicio && eventoFin >= examenFin)
        ) {
          return { // Si hay conflicto, retorna detalles del conflicto
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

  const convertirHoraAMinutos = (hora) => { // Convierte una cadena de hora "HH:MM" a minutos
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
  };

  const confirmarSeleccion = () => { // Confirma la selección de paralelos y los agrega al horario si no hay conflictos 
    if (paraleloSeleccionado === null) return; // Asegura que se haya seleccionado un paralelo teórico

    const eventosTeorico = convertirAHorario( // Convierte el paralelo teórico seleccionado en eventos de horario
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
    if (conflictosTeoricos.hayConflicto) { // Si hay conflicto, muestra un mensaje de error y detiene el proceso
      setErrorMensaje({
        titulo: "¡Conflicto de Horario!",
        mensaje: `No se puede agregar la materia porque hay un conflicto con ${conflictosTeoricos.materiaConflicto} el día ${conflictosTeoricos.dia} a las ${conflictosTeoricos.hora}`,
        tipo: "error",
      });
      return;
    }

    if (eventosPractico.length > 0) { // Verificar conflictos para el práctico si existe
      const conflictosPracticos = hayConflictoHorario(
        eventosPractico,
        otrosEventos
      );
      if (conflictosPracticos.hayConflicto) { // Si hay conflicto, muestra un mensaje de error y detiene el proceso
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
    if (conflictosExamenTeorico.hayConflicto) { // Si hay conflicto, muestra un mensaje de error y detiene el proceso
      setErrorMensaje({
        titulo: "¡Conflicto con Examen!",
        mensaje: `No se puede agregar la materia porque hay un conflicto con el examen del primer parcial el día ${conflictosExamenTeorico.dia} a las ${conflictosExamenTeorico.hora}`,
        tipo: "error",
      });
      return;
    }

    if (eventosPractico.length > 0) { // Verificar conflictos de examen para el práctico si existe
      const conflictosExamenPractico = hayConflictoConExamen(eventosPractico);
      if (conflictosExamenPractico.hayConflicto) { // Si hay conflicto, muestra un mensaje de error y detiene el proceso
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
      ...otrosEventos, // Mantener otros eventos
      ...eventosTeorico, // Agregar nuevos eventos teóricos
      ...eventosPractico, // Agregar nuevos eventos prácticos si existen
    ].map((ev, i) => ({
      ...ev,
      id: Date.now() + i,
    }));

    onConfirmar(nuevosEventos); // Notificar al componente padre
    window.dispatchEvent(new Event("localStorageChange")); // Notificar a otros componentes del cambio en localStorage
    setParaleloSeleccionado(null); // Resetear selecciones
    setParaleloPractico(null); // Resetear selecciones  
    setErrorMensaje({ // Mostrar mensaje de éxito
      titulo: "¡Éxito!",
      mensaje: "Paralelos guardados en el horario correctamente.",
      tipo: "success",
    });
  };

  const filteredTeoricos = filterParalelos(teoricos); // Aplica los filtros a los paralelos teóricos y prácticos
  const filteredPracticos = filterParalelos(practicos); // Puede ser un array vacío si no hay prácticos

  const paralelosVisibles = filteredTeoricos.slice( // Obtiene los paralelos teóricos visibles según la paginación
    startIndex,
    startIndex + PARALELOS_POR_PAGINA
  );
  const paralelosPracticosVisibles = filteredPracticos.slice( // Obtiene los paralelos prácticos visibles según la paginación
    startIndexPractico,
    startIndexPractico + PARALELOS_POR_PAGINA
  );

  return ( 
    <>
      <div className="p-4">
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
                  onClick={() => setErrorMensaje(null)} // Cierra el mensaje al hacer clic en el botón de cierre
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
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button
              onClick={onBack}
              className="text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Back to Curriculum"
            >
              🏠⬅️
            </button>
            <div className="absolute hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap -bottom-8 left-1/2 transform -translate-x-1/2">
              Back to Curriculum
            </div>
          </div>
          <CourseFilterBar onFilterChange={handleFilterChange} />
        </div>
        <div className="relative">
          {teoricos.length > PARALELOS_POR_PAGINA && (
            <button
              onClick={handlePrev} // Flecha avanzar a la pag izquierda
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
              {paralelosVisibles.map((paralelo, idx) => // Muestra solo los paralelos visibles según la paginación y los filtros
                paraleloSeleccionado === null ||
                paraleloSeleccionado === startIndex + idx ? (
                  <div
                    key={startIndex + idx}
                    className={`border rounded p-3 cursor-pointer hover:bg-blue-100 ${
                      paraleloSeleccionado === startIndex + idx
                        ? "bg-blue-200"
                        : ""
                    }`}
                    onClick={() => setParaleloSeleccionado(startIndex + idx)} // Maneja la selección del paralelo
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
                      {paralelo.horarios.map((h, i) => ( // Muestra los horarios del paralelo
                        <div key={i} className="text-center">
                          <div className="font-medium">{h.Dia}</div> 
                          <div> 
                            ⏱️{h.HoraInicio.slice(0, 5) } -{" "}  
                            {h.HoraFin.slice(0, 5)}
                          </div>
                          {paralelo.horarios.length === 1  ? (
                            <div className="text-sm text-gray-600">
                              📍{h.Aula}
                            </div>
                          ) : (
                            paralelo.horarios[0].Aula !== // Muestra el aula si es diferente en horarios múltiples
                              paralelo.horarios[1].Aula && (
                              <div className="text-sm text-gray-600">
                                📍{h.Aula}
                              </div>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                    {paralelo.horarios.length > 1 && // Muestra el aula si es la misma en horarios múltiples
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
          {teoricos.length > PARALELOS_POR_PAGINA && (
            <button
              onClick={handleNext} // Flecha avanzar a la pag derecha
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

        {paraleloSeleccionado !== null && practicos.length > 0 && ( // Mostrar sección de prácticos solo si hay prácticos disponibles
          <>
            <h2 className="text-xl font-bold mt-6 mb-2">Paralelos Prácticos</h2>
            <div className="relative">
              {/* Flecha izquierda */}
              {practicos.length > PARALELOS_POR_PAGINA &&
                paraleloPractico === null && (
                  <button
                    onClick={handlePrevPractico} // Flecha izquierda
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
                  {paralelosPracticosVisibles.map((paralelo, idx) => // Muestra solo los paralelos prácticos visibles según la paginación y los filtros
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
                          setParaleloPractico(startIndexPractico + idx) // Maneja la selección del paralelo práctico
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
                          {paralelo.horarios.map((h, i) => ( // Muestra los horarios del paralelo práctico
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
                                paralelo.horarios[0].Aula !== // Muestra el aula si es diferente en horarios múltiples
                                  paralelo.horarios[1].Aula && (
                                  <div className="text-sm text-gray-600">
                                    📍{h.Aula}
                                  </div>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                        {paralelo.horarios.length > 1 && // Muestra el aula si es la misma en horarios múltiples
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
                    onClick={handleNextPractico} // Flecha derecha
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

        {paraleloSeleccionado !== null && ( // Mostrar botón de confirmar solo si se ha seleccionado al menos un paralelo teórico
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
    </>
  );
}

export default SelectorParalelos; // Exporta el componente SelectorParalelos
