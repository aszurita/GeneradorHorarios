// src/RouterApp.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";    // Pantalla de inicio
import App from "./App";      // Tu aplicación actual (planificador)

export default function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/planificador" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
