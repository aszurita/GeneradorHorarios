import { useState } from "react";
import { courses } from "../courseData/courseData";
import styles from "./curriculum_flow_chart.module.css";

const CourseGrid = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div>
      <div className={styles.coursegrid}>
        {courses.map((course) => (
          <div
            className={`${styles.coursebox} ${styles[course.type]}`}
            key={course.id}
            style={{
              gridColumn: course.col + 1,
              gridRow: course.row + 1,
            }}
            onClick={() => {
              console.log(course);
              setSelectedCourse(course);
            }}
          >
            {course.name}
          </div>
        ))}
      </div>
      {selectedCourse &&
        (console.log("Rendering popup for:", selectedCourse),
        (
          <div>
            <p>{selectedCourse.name}</p>
            <button onClick={() => setSelectedCourse(null)}>Close</button>
          </div>
        ))}
    </div>
  );
};

export default CourseGrid;
