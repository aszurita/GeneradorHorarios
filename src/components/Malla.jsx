import React, { useMemo, useState, useEffect } from "react";

const Malla = ({ materias, onMateriaClick, eventos, highlightComplementariaCodigoSet = new Set(), highlightMatchedCodigoSet = new Set() }) => {
  const isCourseAdded = (codigo) => {
    return eventos.some((evento) => evento.codigoMateria === codigo);
  };

  // Estado modal y materia activa - COMENTADO: Ya no se usa modal
  // const [open, setOpen] = useState(false);
  // const [active, setActive] = useState(null);
  
  // Estado para modo de aprobación
  const [approvalMode, setApprovalMode] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Para forzar actualización

  // Forzar re-render cuando cambien los eventos
  useEffect(() => {
    // Este efecto se ejecuta cuando cambia la prop 'eventos'
    // No necesita hacer nada, solo forzar el re-render
  }, [eventos]);

  // Cargar y exponer Set de aprobadas 
  const aprobadasSet = useMemo(() => {
    try {
      const raw = localStorage.getItem("materiasAprobadas");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
    } catch {
      return new Set();
    }
  }, [approvalMode, refreshTrigger]); // Agregar refreshTrigger para forzar actualización - removido 'open' ya que no se usa modal

  // Toggle de aprobada - COMENTADO: Ya no se usa modal
  // const toggleAprobada = (codigo) => {
  //   try {
  //     const raw = localStorage.getItem("materiasAprobadas");
  //     const arr = raw ? JSON.parse(raw) : [];
  //     const set = new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
  //     if (set.has(codigo)) set.delete(codigo);
  //     else set.add(codigo);
  //     localStorage.setItem("materiasAprobadas", JSON.stringify(Array.from(set)));
  //     setOpen(false);
  //   } catch {}
  // };

  // Toggle de aprobación pendiente en modo aprobación
  const togglePendingApproval = (codigo) => {
    const newPending = new Set(pendingApprovals);
    if (newPending.has(codigo)) {
      newPending.delete(codigo);
    } else {
      newPending.add(codigo);
    }
    setPendingApprovals(newPending);
  };

  // Toggle de aprobación existente (para desmarcar las ya guardadas)
  const toggleExistingApproval = (codigo) => {
    try {
      const raw = localStorage.getItem("materiasAprobadas");
      const arr = raw ? JSON.parse(raw) : [];
      const set = new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
      if (set.has(codigo)) {
        set.delete(codigo);
      } else {
        set.add(codigo);
      }
      localStorage.setItem("materiasAprobadas", JSON.stringify(Array.from(set)));
      setRefreshTrigger(prev => prev + 1); // Forzar actualización del estado
    } catch {}
  };

  // Guardar aprobaciones pendientes
  const saveApprovals = () => {
    try {
      const raw = localStorage.getItem("materiasAprobadas");
      const arr = raw ? JSON.parse(raw) : [];
      const currentSet = new Set(Array.isArray(arr) ? arr.map((c) => String(c).trim()) : []);
      
      // Agregar las nuevas aprobaciones
      pendingApprovals.forEach(codigo => currentSet.add(codigo));
      
      localStorage.setItem("materiasAprobadas", JSON.stringify(Array.from(currentSet)));
      setPendingApprovals(new Set());
      setApprovalMode(false);
    } catch {}
  };

  // Cancelar modo aprobación
  const cancelApprovalMode = () => {
    setPendingApprovals(new Set());
    setApprovalMode(false);
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
          const isPendingApproval = pendingApprovals.has(String(materia.codigo).trim());
          const isDisabled = isAdded || (isApproved && !approvalMode) || (approvalMode && isPendingApproval); // En modo aprobación, permitir desmarcar las aprobadas

          // Determinar si este bloque debe tener borde verde por complementaria o match
          const isComplementaria = highlightComplementariaCodigoSet.has(String(materia.codigo).trim());
          const isMatched = highlightMatchedCodigoSet.has(String(materia.codigo).trim());
          const bordeExtra = (isComplementaria || isMatched) ? 'border-2 border-green-600' : 'border';

          return (
            <div
              key={materia.codigo + String(index)}
              className={` 
            ${bordeExtra} rounded-lg p-1 text-center relative
            ${materia.tipo === "basic" ? "bg-white" : ""} 
            ${materia.tipo === "general" ? "bg-[#D6DFE6]" : ""}
            ${materia.tipo === "profesional" ? "bg-[#FDF3BA]" : ""}
            ${materia.tipo === "complementadi" ? "bg-[#F8C1A0]" : ""}
            ${materia.tipo === "complementh" ? "bg-[#93D0CC]" : ""}
            ${materia.tipo === "integradora" ? "bg-[#003566] text-white" : ""}
            ${materia.tipo === "Itenerario" ? "bg-[#81A5C8] text-white" : ""}
            ${materia.tipo === "comunitarias" ? "bg-[#FBDC7D]" : ""}
            ${materia.tipo === "pracprofesionales" ? "bg-[#FBDC7D]" : ""}
            ${isDisabled ? "opacity-80 cursor-not-allowed select-none" : approvalMode ? "cursor-pointer hover:opacity-70" : "cursor-pointer"}
          `}
              style={{
                gridRow: materia.nivel + 1,
                gridColumn: materia.col + 1,
              }}
              onClick={() => {
                if (approvalMode) {
                  // En modo aprobación, toggle según el estado actual
                  const codigo = String(materia.codigo).trim();
                  if (isApproved) {
                    // Si ya está aprobada, desmarcarla directamente
                    toggleExistingApproval(codigo);
                  } else {
                    // Si no está aprobada, toggle de aprobación pendiente
                    togglePendingApproval(codigo);
                  }
                } else if (!isDisabled) {
                  // Seleccionar materia directamente - sin modal
                  onMateriaClick && onMateriaClick(materia.codigo);
                }
              }}
            >
              <div className="flex flex-col justify-center items-center h-full">
                <div className="font-bold text-xs md:text-sm">
                  {materia.codigo}
                </div>
                <div className="text-[10px] md:text-xs">{materia.Materia}</div>
              </div>
              {(isAdded || isApproved || (approvalMode && isPendingApproval)) && (
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

      {/* Modal simple - COMENTADO: Ya no se usa modal, selección directa */}
      {/* {open && active && (
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
      )} */}

      {/* Botones de modo aprobación */}
      <div className="mt-4 flex justify-start gap-4 pb-4">
        {!approvalMode ? (
          <button
            className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#001c43' }}
            onClick={() => setApprovalMode(true)}
          >
            Marcar materias aprobadas
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-600 mb-2">
              Modo aprobación activo - Haz clic en las materias para marcarlas/desmarcarlas como aprobadas
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={saveApprovals}
              >
                Guardar selección ({pendingApprovals.size})
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={cancelApprovalMode}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Malla;
