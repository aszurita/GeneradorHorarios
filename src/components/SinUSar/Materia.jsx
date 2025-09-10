import React from "react";

function Materia({ infoMateria }) {
    const materia = infoMateria;
    return (
        <div className="text-2xl">
            <div>
                {infoMateria.creditos}
            </div>
            <p className="text-center"> {infoMateria.creditos}</p>
            <p className="text-center"> {infoMateria.creditos}</p>
        </div>
    )
}

export default Miprimercomponente