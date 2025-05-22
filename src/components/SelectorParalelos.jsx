import React, { useState, useEffect } from "react";

// Lista de colores predefinidos para las materias
const MATERIA_COLORS = [
    '#FF6B6B', // Rojo coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul cielo
    '#96CEB4', // Verde menta
    '#FFEEAD', // Amarillo suave
    '#D4A5A5', // Rosa pálido
    '#9B59B6', // Púrpura
    '#3498DB', // Azul
    '#E67E22', // Naranja
    '#2ECC71', // Verde esmeralda
    '#F1C40F', // Amarillo
    '#1ABC9C', // Verde agua
    '#E74C3C', // Rojo
    '#34495E', // Azul oscuro
    '#16A085', // Verde oscuro
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

function SelectorParalelos({ codigoMateria, materiasParalelos,onConfirmar }) {
    const [paraleloSeleccionado, setParaleloSeleccionado] = useState(null);
    const [paraleloPractico, setParaleloPractico] = useState(null);
    const [eventos, setEventos] = useState([]);

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
    }, [codigoMateria]);

    if (!materiasParalelos[codigoMateria]) {
        return <div>No se encontró la materia.</div>;
    }

    const teoricos = materiasParalelos[codigoMateria].Teorico;
    const practicos = materiasParalelos[codigoMateria].Practico;
    const color = getColorFromString(codigoMateria);

    const convertirAHorario = (paralelo, tipo) =>
        paralelo.horarios.map((h) => ({
            title: `${tipo} ${codigoMateria}`,
            day: h.Dia,
            startTime: h.HoraInicio,
            endTime: h.HoraFin,
            color,
        }));

    const confirmarSeleccion = () => {
        if (paraleloSeleccionado === null) return;

        const eventosTeorico = convertirAHorario(teoricos[paraleloSeleccionado], "Teórico");
        const eventosPractico =
            paraleloPractico !== null ? convertirAHorario(practicos[paraleloPractico], "Práctico") : [];

        const nuevosEventos = [...eventosTeorico, ...eventosPractico].map((ev, i) => ({
            ...ev,
            id: Date.now() + i,
        }));

        onConfirmar(nuevosEventos);
        // Disparar evento personalizado para notificar el cambio en localStorage
        window.dispatchEvent(new Event('localStorageChange'));
        
        // Reiniciar las selecciones después de confirmar
        setParaleloSeleccionado(null);
        setParaleloPractico(null);
        
        alert("Paralelos guardados en el horario.");
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Paralelos Teóricos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teoricos.map((paralelo, idx) =>
                    paraleloSeleccionado === null || paraleloSeleccionado === idx ? (
                        <div
                            key={idx}
                            className={`border rounded p-3 cursor-pointer hover:bg-blue-100 ${paraleloSeleccionado === idx ? "bg-blue-200" : ""
                                }`}
                            onClick={() => setParaleloSeleccionado(idx)}
                        >
                            <div className="font-semibold">Paralelo: {paralelo.Paralelo}</div>
                            <div>Profesor: {paralelo.Profesor}</div>
                            {paralelo.horarios.map((h, i) => (
                                <div key={i}>
                                    {h.Dia}: {h.HoraInicio} - {h.HoraFin} ({h.Aula})
                                </div>
                            ))}
                        </div>
                    ) : null
                )}
            </div>

            {paraleloSeleccionado !== null && practicos.length > 0 && (
                <>
                    <h2 className="text-xl font-bold mt-6 mb-2">Paralelos Prácticos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {practicos.map((paralelo, idx) => (
                            <div
                                key={idx}
                                className={`border rounded p-3 cursor-pointer hover:bg-green-100 ${paraleloPractico === idx ? "bg-green-200" : ""
                                    }`}
                                onClick={() => setParaleloPractico(idx)}
                            >
                                <div className="font-semibold">Paralelo: {paralelo.Paralelo}</div>
                                <div>Profesor: {paralelo.Profesor}</div>
                                {paralelo.horarios.map((h, i) => (
                                    <div key={i}>
                                        {h.Dia}: {h.HoraInicio} - {h.HoraFin} ({h.Aula})
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {paraleloSeleccionado !== null && (
                <button
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={confirmarSeleccion}
                >
                    Confirmar selección
                </button>
            )}
        </div>
    );
}

export default SelectorParalelos;
