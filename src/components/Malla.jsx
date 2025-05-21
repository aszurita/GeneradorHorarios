import React from "react";

// Ahora Malla recibe una prop onMateriaClick para guardar el código de la materia seleccionada
const Malla = ({ materias, onMateriaClick }) => (
  <div className="overflow-x-auto">
    <div
      className="grid gap-1 grid-rows-10 auto-rows-[45px] md:auto-rows-[50px] lg:auto-rows-[55px]"
      style={{
        gridTemplateColumns: "repeat(6, minmax(70px, 150px))", // Reducido de 90px-200px a 70px-150px
      }}
    >
      {materias.map((materia, index) => (
        <div
          key={materia.codigo + String(index)}
          className={`
            border rounded-lg p-1 text-center cursor-pointer
            ${materia.tipo === "basic" ? "bg-white" : ""}
            ${materia.tipo === "general" ? "bg-[#D6DFE6]" : ""}
            ${materia.tipo === "profesional" ? "bg-[#FDF3BA]" : ""}
            ${materia.tipo === "complementadi" ? "bg-[#F8C1A0" : ""}
            ${materia.tipo === "complementh" ? "bg-[#93D0CC" : ""}
            ${materia.tipo === "integradora" ? "bg-[#003566] text-white" : ""}
            ${materia.tipo === "Itenerario" ? "bg-[#81A5C8] text-white" : ""}
            ${materia.tipo === "comunitarias" ? "bg-[#FBDC7D]" : ""}
            ${materia.tipo === "pracprofesionales" ? "bg-[#FBDC7D]" : ""}
          `}
          style={{
            gridRow: materia.nivel + 1,
            gridColumn: materia.col + 1,
          }}
          onClick={() => {
            console.log(materia);
            if (onMateriaClick) {
              onMateriaClick(materia.CodigoExistente);
            }
          }}
        >
          <div className="flex flex-col justify-center items-center h-full">
            <div className="font-bold text-xs md:text-sm">{materia.codigo}</div>
            <div className="text-[10px] md:text-xs">{materia.Materia}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Malla;

