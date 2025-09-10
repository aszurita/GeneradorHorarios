import React from "react";

const Malla = ({ materias, onMateriaClick, eventos }) => {
  const isCourseAdded = (codigo) => { // Verifica si una materia ya ha sido agregada al horario
    return eventos.some((evento) => evento.codigoMateria === codigo);
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1 grid-rows-10 auto-rows-[45px] md:auto-rows-[50px] lg:auto-rows-[55px] relative"
        style={{
          gridTemplateColumns: "repeat(6, minmax(70px, 150px))",
        }}
      >
        {materias.map((materia, index) => {
          const isAdded = isCourseAdded(materia.CodigoExistente);

          return (
            <div
              key={materia.codigo + String(index)} // Usar un índice para evitar claves duplicadas 
              //Define el estilo de cada materia según su tipo y si ya ha sido agregada
              className={` 
            border rounded-lg p-1 text-center relative
            ${materia.tipo === "basic" ? "bg-white" : ""} 
            ${materia.tipo === "general" ? "bg-[#D6DFE6]" : ""}
            ${materia.tipo === "profesional" ? "bg-[#FDF3BA]" : ""}
            ${materia.tipo === "complementadi" ? "bg-[#F8C1A0]" : ""}
            ${materia.tipo === "complementh" ? "bg-[#93D0CC]" : ""}
            ${materia.tipo === "integradora" ? "bg-[#003566] text-white" : ""}
            ${materia.tipo === "Itenerario" ? "bg-[#81A5C8] text-white" : ""}
            ${materia.tipo === "comunitarias" ? "bg-[#FBDC7D]" : ""}
            ${materia.tipo === "pracprofesionales" ? "bg-[#FBDC7D]" : ""}
            ${
              isAdded
                ? "opacity-80 cursor-not-allowed select-none"
                : "cursor-pointer"
            }
          `}
              style={{ // Posiciona la materia en la cuadrícula según su nivel y columna
                gridRow: materia.nivel + 1,
                gridColumn: materia.col + 1,
              }}
              onClick={() => { // Maneja el clic en la materia
                if (!isAdded && onMateriaClick) {
                  console.log(materia);
                  onMateriaClick(materia.CodigoExistente); // Pasa el código de la materia al manejador de clics
                }
              }}
            >
              <div className="flex flex-col justify-center items-center h-full">
                <div className="font-bold text-xs md:text-sm">
                  {materia.codigo}
                </div>
                <div className="text-[10px] md:text-xs">{materia.Materia}</div>
              </div>
              {isAdded && (
                <div
                  className="absolute top-1 right-1 bg-green-500 text-white rounded-full 
                               w-5 h-5 flex items-center justify-center text-xs border-2 border-white
                               shadow-sm"
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Malla; // Componente principal de la malla curricular
