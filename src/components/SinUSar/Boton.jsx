// eslint-disable-next-line no-unused-vars
import React from "react";
import PropTypes from 'prop-types'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Boton({color,texto,ancho,alto,icono}) {
    const estilo = {
      backgroundColor: color,
      width: ancho,
      height: alto,
      border: 'none',
      cursor: 'pointer',
      borderRadius: '10px',
      padding: '10px 20px',
      color: 'white',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
      



    };
  return (
    <button style={estilo}>
      {icono && <FontAwesomeIcon icon={icono} style={{ marginRight: '8px' }} />}
      {texto}
    </button>
  )
}
Boton.propTypes = {
  color: PropTypes.string.isRequired, // Asegura que 'color' sea una cadena de texto
  texto: PropTypes.string.isRequired, 
  ancho: PropTypes.string.isRequired, 
  alto: PropTypes.string.isRequired,  
  icono: PropTypes.object,
};
