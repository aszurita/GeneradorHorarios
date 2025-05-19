import React, { useState, useEffect } from "react";

// Utilidad para generar color único por materia
const getColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
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
