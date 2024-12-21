import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Miprimercomponente from "./components/Componente";
import Calendar from "./components/HorarioSemanal";

export default function App() {
  return (
    <>
      <h1 className="text-3xl font-bold">GENERADOR HORARIOS</h1>
      <Miprimercomponente></Miprimercomponente>
      <h1>Scheduler Example</h1>
      <Calendar />
    </>
  );
}
