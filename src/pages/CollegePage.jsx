import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/CollegePage.css"; 

const CollegePage = () => {
  const [collegeName, setCollegeName] = useState("");
  const [courses, setCourses] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!collegeName.trim()) {
      toast.error("Please enter a college name.");
      return;
    }

    const courseArray = courses
      .split(",")
      .map((course) => course.trim())
      .filter((course) => course);

    if (courseArray.length === 0) {
      toast.error("Please enter at least one course.");
      return;
    }

    try {
      await addDoc(collection(db, "colleges"), {
        name: collegeName,
        courses: courseArray,
      });

      toast.success("College added successfully!");
      setCollegeName("");
      setCourses("");
    } catch (error) {
      console.error("Error adding college:", error);
      toast.error("Failed to add college.");
    }
  };

  return (
    <div className="college-page-container">
      <h2>Add New College</h2>
      <form onSubmit={handleSubmit} className="college-form">
        <div className="form-group">
          <label htmlFor="collegeName">College Name</label>
          <input
            type="text"
            id="collegeName"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            placeholder="Enter college name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="courses">Courses (comma-separated)</label>
          <input
            type="text"
            id="courses"
            value={courses}
            onChange={(e) => setCourses(e.target.value)}
            placeholder="E.g., BCA, BBA, MCA"
          />
        </div>

        <button type="submit" className="submit-btn">Add College</button>
      </form>
    </div>
  );
};

export default CollegePage;
