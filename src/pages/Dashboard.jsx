import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;


  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "shanmugha"));
        const studentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentList);
        console.log(studentList)
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleOutsideClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSidebarOpen]);

  const confirmedCount = students.filter(s => s.applicationStatus === "Enroll").length;
  const enquiryCount = students.filter(s => s.applicationStatus === "Enquiry").length;
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  return (

    <main className="main-content">
      <header className="dashboard-header">
        <h1>Welcome Admin</h1>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Total Students</h3>
          <p>{loading ? "..." : students.length}</p>
        </div>
        <div className="card">
          <h3>Entrolled</h3>
          <p>{loading ? "..." : confirmedCount}</p>
        </div>
        <div className="card">
          <h3>Enquiries</h3>
          <p>{loading ? "..." : enquiryCount}</p>
        </div>
      </section>

      <section className="student-table">
        <h2>Recently Added</h2>

        {loading && <p>Loading students...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <p>No students found.</p>
        )}

        <div className="table-wrapper">
          {!loading && !error && students.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentId || s.id}</td>
                    <td>{s.candidateName}</td>
                    <td>{s.applicationStatus}</td>
                    <td>{s.course}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mobile-table-disabled">
          <p>Student table is not available on mobile view.</p>
        </div>
      </section>
    </main>
    // </div>
  );
};

export default Dashboard;
