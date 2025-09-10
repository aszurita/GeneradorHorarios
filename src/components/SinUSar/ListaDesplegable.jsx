import React from "react";

const ListaDesplegable = ({ data, onChange, placeholder }) => {
  return (
    <div className="w-full">
      <select
        id="select"
        className="mt-1 h-10 w-full rounded-md border-grey-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-[#001c43] text-white text-opacity-80"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled selected>
          {placeholder}
        </option>
        {data.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ListaDesplegable;
