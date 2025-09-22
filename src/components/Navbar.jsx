// src/components/Navbar.jsx
import React from "react";
import FiecMallas from "../assets/Data/FiecMallas_con_codigos.json";
import LogoEspol from "../assets/logo_espol.png";
import LogoTaws from "../assets/logo_taws.png";

export default function Navbar({
  carreraSeleccionada,
  handleCarreraChange,
  codigoMateria,
  handleBackToMalla,
  redirectTo = null, // en Home pasa "/planificador" (o la ruta que uses). En App deja null.
}) {
  const onChangeCarrera = (e) => {
    const idx = parseInt(e.target.value, 10);
    if (Number.isNaN(idx)) return;

    // estado arriba
    if (typeof handleCarreraChange === "function") handleCarreraChange(idx);

    // persistir + notificar
    localStorage.setItem("carreraSeleccionada", String(idx));
    window.dispatchEvent(new Event("carreraSeleccionadaChange"));

    // navegación
    if (redirectTo) {
      window.location.href = `${redirectTo}?c=${idx}`;
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("c", String(idx));
      window.history.replaceState({}, "", url.toString());
    }
  };

  const goHome = () => {
    window.location.href = "/"; // cambia si tu home es otra ruta
  };

  return (
    <nav className="bg-white">
      {/* TOP (logos) con mismos márgenes laterales que la barra azul */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <img
              src={LogoEspol}
              alt="Logo Espol"
              className="w-[150px] h-[59px] object-contain"
            />
            <h1
              className="text-xl"
              style={{ color: "#787878", fontFamily: "sans-serif", fontSize: 18 }}
            >
              Generador de Horarios
            </h1>
          </div>

          <img
            src={LogoTaws}
            alt="Logo Taws"
            className="w-[55px] h-auto object-contain"
          />
        </div>
      </div>

      {/* Línea amarilla */}
      <div className="h-[3px]" style={{ backgroundColor: "#FAB900" }} />

      {/* BARRA AZUL */}
      <div className="text-white" style={{ backgroundColor: "#001C43" }}>
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* IZQ: selector de carrera */}
          <div className="flex items-center">
            <select
              value={carreraSeleccionada}
              onChange={onChangeCarrera}
              className="px-4 py-2 pr-10 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              style={{
                minWidth: "220px",
                backgroundColor: "#001C43",
                color: "#FFFFFF",
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='white'><path d='M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "14px",
                borderColor: "#001C43",
              }}
            >
              <option value="" disabled>
                Selecciona la carrera
              </option>
              {FiecMallas.Fiec.map((carrera, index) => (
                <option key={carrera.carrera} value={index}>
                  {carrera.carrera}
                </option>
              ))}
            </select>
          </div>

          {/* DER: volver a malla (si aplica) + HOME */}
          <div className="flex items-center gap-2">
            {codigoMateria && (
                <button
                    onClick={handleBackToMalla}
                    className="p-2 rounded hover:bg-blue-900 transition"
                    aria-label="Volver a la malla"
                    title="Volver a la malla"
                >
                    {/* Flecha hacia la izquierda */}
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    className="w-6 h-6"
                    >
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                )}

            {/* Home en la barra azul */}
            <button
              onClick={goHome}
              className="p-2 rounded hover:bg-blue-900 transition"
              title="Ir al inicio"
              aria-label="Ir al inicio"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-6 h-6"
              >
                <path d="M12 3l9 8h-3v10h-5V15h-2v6H6V11H3l9-8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
