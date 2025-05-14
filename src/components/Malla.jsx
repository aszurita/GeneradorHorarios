import React from "react";

const Malla = ({ materias }) => (
  <div
    className="grid gap-2"
    style={{
      gridTemplateRows: "repeat(10, 80px)",
      gridTemplateColumns: "repeat(6, 180px)",
    }}
  >
    {materias.map((materia) => (
      <div
        key={materia.codigo}
        className={`
          border rounded-lg p-2 text-center
          ${materia.tipo === "basic" ? "bg-white" : ""}
          ${materia.tipo === "general" ? "bg-[#D6DFE6]" : ""}
          ${materia.tipo === "profesional" ? "bg-[#FDF3BA]" : ""}
          ${materia.tipo === "complementadi" ? "bg-[#F8C1A0]" : ""}
          ${materia.tipo === "complementh" ? "bg-[#93D0CC]" : ""}
          ${materia.tipo === "integradora" ? "bg-[#003566]" : ""}
          ${materia.tipo === "Itenerario" ? "bg-[#81A5C8]" : ""}
          ${materia.tipo === "comunitarias" ? "bg-[#FBDC7D]" : ""}
          ${materia.tipo === "pracprofesionales" ? "bg-[#FBDC7D]" : ""}
          // ...agrega más colores según tipo
        `}
        style={{
          gridRow: materia.nivel + 1,
          gridColumn: materia.col + 1,
        }}
      >
        <div className="font-bold">{materia.codigo}</div>
        <div className="text-xs">{materia.nombre}</div>
      </div>
    ))}
  </div>
);

export default Malla;

