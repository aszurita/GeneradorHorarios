import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import CourseGrid from "./components/curriculum_flow_chart/curriculum_flow_chart";
import Calendar from "./components/schedule/schedule";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <p>My University Schedule Planner</p>
      <CourseGrid />
      <Calendar />
    </div>
  );
}

export default App;
