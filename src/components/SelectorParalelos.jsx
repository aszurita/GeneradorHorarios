import React, { useState } from "react";

// Recibe el código de materia y el JSON completo
function SelectorParalelos({ codigoMateria, materiasParalelos }) {
    const [paraleloSeleccionado, setParaleloSeleccionado] = useState(null);

    // Si no existe la materia, muestra mensaje
    if (!materiasParalelos[codigoMateria]) {
        return <div>No se encontró la materia.</div>;
    }

    const teoricos = materiasParalelos[codigoMateria].Teorico;
    const practicos = materiasParalelos[codigoMateria].Practico;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Paralelos Teóricos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teoricos.map((paralelo, idx) => (
                    <div
                        key={idx}
                        className={`border rounded p-3 cursor-pointer hover:bg-blue-100 ${paraleloSeleccionado === idx ? "bg-blue-200" : ""}`}
                        onClick={() => setParaleloSeleccionado(idx)}
                    >
                        <div className="font-semibold">Paralelo: {paralelo.Paralelo}</div>
                        <div>Profesor: {paralelo.Profesor}</div>
                        <div>
                            {paralelo.horarios.map((h, i) => (
                                <div key={i}>
                                    {h.Dia}: {h.HoraInicio} - {h.HoraFin} ({h.Aula})
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {paraleloSeleccionado !== null && (
                <>
                    <h2 className="text-xl font-bold mt-6 mb-2">Paralelos Prácticos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {practicos.map((paralelo, idx) => (
                            <div key={idx} className="border rounded p-3">
                                <div className="font-semibold">Paralelo: {paralelo.Paralelo}</div>
                                <div>Profesor: {paralelo.Profesor}</div>
                                <div>
                                    {paralelo.horarios.map((h, i) => (
                                        <div key={i}>
                                            {h.Dia}: {h.HoraInicio} - {h.HoraFin} ({h.Aula})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default SelectorParalelos;