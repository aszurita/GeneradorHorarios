import React, { useState } from "react";
import ListaDesplegable from "./ListaDesplegable";

const ControladorListaDesplegable = () => {
  const [primeraSeleccion, modfPrimeraSelec] = useState("");
  const [segundaSeleccion, modfSegundaSelec] = useState("");
  const [terceraSeleccion, modfTerceraSelec] = useState("");

  const listaCarreras = [
    { value: "cdh", label: "Ciencia de Datos e Inteligencia Artificial (H)" },
    { value: "cdo", label: "Ciencia de Datos e Inteligencia Artificial (O)" },
    { value: "cs", label: "Ciencias de la Computación" },
    { value: "elec", label: "Electricidad" },
    { value: "elyaut", label: "Electrónica y Automatización" },
    { value: "telec", label: "Telecomunicaciones" },
    { value: "telem", label: "Telemática" },
  ];

  const listaNiveles = [
    { value: "nivel1001", label: "Nivel 100-I" },
    { value: "nivel1002", label: "Nivel 100-II" },
    { value: "nivel2001", label: "Nivel 200-I" },
    { value: "nivel2002", label: "Nivel 200-II" },
    { value: "nivel3001", label: "Nivel 300-I" },
    { value: "nivel3002", label: "Nivel 300-II" },
    { value: "nivel4001", label: "Nivel 400-I" },
    { value: "nivel4002", label: "Nivel 400-II" },
  ];


  const listaMaterias = {
    cdh: {
        nivel1001: [
          { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
          { value: "MATG1045", label: "Cálculo de una variable" },
          { value: "MATG1049", label: "Álgebra Lineal" },
          { value: "CCPG1043", label: "Fundamentos de programación" },
          { value: "IDIG1006", label: "Inglés I" },
        ],
        nivel1002: [
            { value: "TICG1018", label: "Sistema de Bases de Datos" },
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "CDIAG1003", label: "Fundamentos de Ciencia de Datos e Inteligencia Artificial" },
            { value: "CCPG1052", label: "Programación Orientada a Objetos" },
            { value: "IDIG1007", label: "Inglés II" },
          ],
        nivel2001: [
            { value: "CCPG1034", label: "Estructuras de Datos" },
            { value: "ESTG1036", label: "Estadística I" },
            { value: "CCPG1046", label: "Interacción Humano Computador" },
            { value: "IDIG2012", label: "Comunicación" },
            { value: "CDIAG1002", label: "Machine Learning" },
            { value: "IDIG1008", label: "Inglés III" },
          ],
      },
    cdo: {
        nivel1001: [
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "MATG1049", label: "Álgebra Lineal" },
            { value: "CCPG1043", label: "Fundamentos de programación" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
          nivel1002: [
              { value: "TICG1018", label: "Sistema de Bases de Datos" },
              { value: "MATG1046", label: "Cálculo Vectorial" },
              { value: "CDIAG1003", label: "Fundamentos de Ciencia de Datos e Inteligencia Artificial" },
              { value: "CCPG1052", label: "Programación Orientada a Objetos" },
              { value: "IDIG1007", label: "Inglés II" },
            ],
          nivel2001: [
              { value: "CCPG1034", label: "Estructuras de Datos" },
              { value: "ESTG1036", label: "Estadística I" },
              { value: "CCPG1046", label: "Interacción Humano Computador" },
              { value: "IDIG2012", label: "Comunicación" },
              { value: "CDIAG1002", label: "Machine Learning" },
              { value: "IDIG1008", label: "Inglés III" },
            ],
        },
    cs: {
        nivel1001: [
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "FISG1005", label: "Física Mecánica" },
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "CCPG1043", label: "Fundamentos de programación" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
        nivel1002: [
            { value: "TICG1018", label: "Álgebra Lineal" },
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "CDIAG1003", label: "Computación y Sociedad" },
            { value: "CCPG1052", label: "Programación Orientada a Objetos" },
            { value: "IDIG2012", label: "Comunicación" },
            { value: "IDIG1007", label: "Inglés II" },
          ], 
    },
    elec: {
        nivel1001: [
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "FISG1005", label: "Física Mecánica" },
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "QUIG1032", label: "Química General" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
        nivel1002: [
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "FISG1006", label: "Física Eléctricidad y Magnetismo" },
            { value: "INDG1034", label: "Fundamentos de Programación" },
            { value: "MATG1049", label: "Álgebra Lineal" },
            { value: "IDIG1007", label: "Inglés II" },
          ],
    },
    elyaut: {
        nivel1001: [
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "FISG1005", label: "Física Mecánica" },
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "QUIG1032", label: "Química General" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
        nivel1002: [
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "FISG1006", label: "Física Eléctricidad y Magnetismo" },
            { value: "INDG1034", label: "Fundamentos de Programación" },
            { value: "MATG1049", label: "Álgebra Lineal" },
            { value: "IDIG1007", label: "Inglés II" },
          ],
        },
    telec: {
        nivel1001: [
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "FISG1005", label: "Física Mecánica" },
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "QUIG1032", label: "Química General" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
        nivel1002: [
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "FISG1006", label: "Física Eléctricidad y Magnetismo" },
            { value: "INDG1034", label: "Fundamentos de Programación" },
            { value: "MATG1049", label: "Álgebra Lineal" },
            { value: "IDIG1007", label: "Inglés II" },
            ],
        },
    telem: {
        nivel1001: [
            { value: "MATG1045", label: "Cálculo de una variable" },
            { value: "FISG1005", label: "Física Mecánica" },
            { value: "INDG1033", label: "Análisis y Resolución de Problemas" },
            { value: "CCPG1043", label: "Fundamentos de programación" },
            { value: "IDIG1006", label: "Inglés I" },
          ],
        nivel1002: [
            { value: "MATG1046", label: "Cálculo Vectorial" },
            { value: "FISG1006", label: "Física Eléctricidad y Magnetismo" },
            { value: "TLMG1036", label: "Telemática y Transformación Digital" },
            { value: "IDIG2012", label: "Comunicación" },
            { value: "CCPG1052", label: "Programación Orientada a Objetos" },
            { value: "IDIG1007", label: "Inglés II" },
          ],
        },
  };

  return (
    <div className="flex flex-col gap-6 p-6 justify-center">
      {/* Primera lista */}
      <div>
        <ListaDesplegable
          data={listaCarreras}
          onChange={(value) => {
            modfPrimeraSelec(value);
            modfTerceraSelec(""); // Resetear la tercera lista
          }}
          placeholder="Seleccione una carrera..."
        />
      </div>

      {/* Segunda lista (fija) */}
      <div>
        <ListaDesplegable
          data={listaNiveles}
          onChange={(value) => {
            modfSegundaSelec(value);
            modfTerceraSelec(""); // Resetear la tercera lista
          }}
          placeholder="Seleccione un nivel..."
        />
      </div>

      {/* Tercera lista */}
      <div>
        <ListaDesplegable
          data={
            primeraSeleccion && segundaSeleccion
              ? listaMaterias[primeraSeleccion]?.[segundaSeleccion] || []
              : []
          }
          onChange={(value) => modfTerceraSelec(value)}
          placeholder="Seleccione una materia..."
        />
      </div>
    </div>
  );
};

export default ControladorListaDesplegable;
