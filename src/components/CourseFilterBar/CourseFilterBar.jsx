import React, { useState } from "react";

const CourseFilterBar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    sectionNumber: "",
    profesor: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const timeOptions = [];

  for (let hour = 6; hour < 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <div style={styles.filterBar}>
      <div style={styles.filterGroup}>
        <label style={styles.label}>Numero de paralelo:</label>
        <input
          type="text"
          name="sectionNumber"
          value={filters.sectionNumber}
          onChange={handleInputChange}
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
          onChange={handleInputChange}
          style={styles.input}
          placeholder="Nombre del profesor"
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Dia:</label>
        <select
          name="day"
          value={filters.day}
          onChange={handleInputChange}
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
          onChange={handleInputChange}
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
          onChange={handleInputChange}
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
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    minWidth: "150px",
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

export default CourseFilterBar;
