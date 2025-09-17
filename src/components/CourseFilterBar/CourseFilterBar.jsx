import React, { useState } from "react";

const CourseFilterBar = ({ onFilterChange }) => { // Componente para la barra de filtros
  const [filters, setFilters] = useState({ // Estado local para los filtros
    sectionNumber: "",
    profesor: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  const daysOfWeek = [ // Opciones para los días de la semana
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const timeOptions = []; // Generar opciones de tiempo en intervalos de 30 minutos

  for (let hour = 7; hour < 22; hour+= 2) { // Desde las 6 AM hasta las 10 PM
    for (let minute = 0; minute < 60; minute += 120) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const amPm = hour >= 12 ? "PM" : "AM";
      const timeString = `${displayHour}:${
        minute === 0 ? "00" : minute
      } ${amPm}`;
      const value = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeOptions.push({ display: timeString, value });
    }
  }

  const handleInputChange = (e) => { // Manejar cambios en los inputs y actualizar el estado
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters); // Actualizar estado local
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <div style={{...styles.filterBar, width: '100%'}}>
      <div style={styles.filterGroup}>
        <label style={styles.label}>Numero de paralelo:</label>
        <input
          type="text"
          name="sectionNumber"
          value={filters.sectionNumber}
          onChange={handleInputChange} // Actualizar estado al cambiar el input
          style={styles.input}
          placeholder="ej: 101"
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Profesor:</label>
        <input
          type="text"
          name="profesor"
          value={filters.profesor}
          onChange={handleInputChange} // Actualizar estado al cambiar el input
          style={styles.input}
          placeholder="Nombre del profesor"
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Dia:</label>
        <select
          name="day"
          value={filters.day}
          onChange={handleInputChange} // Actualizar estado al cambiar el select
          style={styles.select}
        >
          <option value="">Todos los dias</option>
          {daysOfWeek.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Hora de Inicio:</label>
        <select
          name="startTime"
          value={filters.startTime} 
          onChange={handleInputChange} //  disparar cambios al componente padre
          style={styles.select}
        >
          <option value="">Cualquiera</option>
          {timeOptions.map((time, index) => (
            <option key={`start-${index}`} value={time.value}>
              {time.display}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Hora de Fin:</label>
        <select
          name="endTime"
          value={filters.endTime}
          onChange={handleInputChange} // enviar cambios al componente padre
          style={styles.select}
        >
          <option value="">Cualquiera</option>
          {timeOptions.map((time, index) => (
            <option key={`end-${index}`} value={time.value}>
              {time.display}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const styles = {
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    padding: "15px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    marginBottom: "20px",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    flex: "1",
    minWidth: "120px",
    maxWidth: "200px",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "14px",
  },
  input: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "14px",
  },
  select: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "14px",
    backgroundColor: "white",
  },
};

export default CourseFilterBar; // Exportar el componente para usarlo en otros archivos
