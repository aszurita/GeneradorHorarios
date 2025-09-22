import React, { useMemo, useState } from "react";

const Malla = ({ materias, onMateriaClick, eventos }) => {
  const isCourseAdded = (codigo) => {
    return eventos.some((evento) => evento.codigoMateria === codigo);
  };

  // Estado modal y materia activa
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  // Cargar y exponer Set de aprobadas 
  const aprobadasSet = useMemo(() => {
    try {
      const raw = localStorage.getItem("materiasAprobadas");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
    } catch {
      return new Set();
    }
  }, [open]);

  // Toggle de aprobada
  const toggleAprobada = (codigo) => {
    try {
      const raw = localStorage.getItem("materiasAprobadas");
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
      if (set.has(codigo)) set.delete(codigo);
      else set.add(codigo);
      localStorage.setItem("materiasAprobadas", JSON.stringify(Array.from(set)));
      setOpen(false);
    } catch {}
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
          const isAdded = isCourseAdded(materia.codigo);
          const isApproved = aprobadasSet.has(String(materia.codigo).trim()); // [NEW]

          return (
            <div
              key={materia.codigo + String(index)}
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
            ${isAdded ? "opacity-80 cursor-not-allowed select-none" : "cursor-pointer"}
            ${isApproved && !isAdded ? "ring-2 ring-emerald-500" : ""}
          `}
              style={{
                gridRow: materia.nivel + 1,
                gridColumn: materia.col + 1,
              }}
              onClick={() => {
                if (!isAdded) {
                  // [NEW] abrir modal con opciones
                  setActive(materia);
                  setOpen(true);
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

      {/* Modal simple */}
      {open && active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-lg mb-2">
              {active.codigo} — {active.Materia || "Materia"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">¿Qué deseas hacer?</p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded bg-emerald-600 text-white"
                onClick={() => toggleAprobada(String(active.codigo).trim())}
              >
                Aprobada
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={() => {
                  setOpen(false);
                  onMateriaClick && onMateriaClick(active.codigo);
                }}
              >
                Seleccionar
              </button>
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Malla;
