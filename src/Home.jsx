// src/Home.jsx
import React, { useState } from "react";
import heroBg from "./assets/banner_GeneradorHorarios.svg";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";

export default function Home() {
  const [carrera, setCarrera] = useState(""); // Siempre vacío en Home para mostrar "Selecciona la carrera"

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        carreraSeleccionada={carrera}
        handleCarreraChange={setCarrera}
        codigoMateria={""}            // en Home no hay materia activa
        handleBackToMalla={() => {}}  // noop
        redirectTo="/planificador"     // <-- RUTA donde está tu App.jsx (ajústala si es otra)
      />

      {/* Hero */}
      <main>
        <section
          className="relative bg-cover bg-center py-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight max-w-2xl">
              ¡Hola, politécnico! <br />
              Bienvenido a tu{" "}
              <span className="text-blue-700">Planificador de Horarios</span>
            </h1>
            <p className="mt-4 text-slate-600 text-lg max-w-xl">
              Organiza tu semestre sin complicaciones. Filtra materias, paralelos y evita
              choques.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="#como-funciona"
                className="rounded-xl bg-blue-700 text-white px-5 py-3 font-medium hover:bg-blue-800 transition"
              >
                ¿Cómo funciona?
              </a>
            </div>
          </div>
        </section>

        {/* Bloque “Cómo funciona” (tu contenido) */}
        <section id="como-funciona" className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-slate-900">¿Cómo funciona?</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {[
                { t: "1. Elige tu carrera", d: "Cargamos el catálogo de materias y paralelos." },
                { t: "2. Filtra y combina", d: "Selecciona materias y genera horarios sin choques." },
                { t: "3. Exporta/Guarda", d: "Descarga como PDF o guarda tu configuración." },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border p-5">
                  <p className="font-medium text-slate-900">{s.t}</p>
                  <p className="text-slate-600 mt-1">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
