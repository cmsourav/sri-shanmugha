import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const studentsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      setUser(user);

      try {
        // Get user's name
        const userSnapshot = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserName(userData.fullName);
        }

        // Fetch students created by the logged-in user
        const studentSnapshot = await getDocs(
          query(collection(db, "shanmugha"), where("createdBy", "==", user.uid))
        );

        const studentList = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by newest first
        const sortedStudents = studentList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setStudents(sortedStudents);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const confirmedCount = students.filter((s) => s.applicationStatus === "Enroll").length;
  const enquiryCount = students.filter((s) => s.applicationStatus === "Enquiry").length;

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <main className="main-content">
      <header className="dashboard-header">
        <h1>Welcome {userName || user?.email}</h1>
      </header>

      <section className="cards">
        <div className="card">
          <h3>Total Students</h3>
          <p>{students.length}</p>
        </div>
        <div className="card">
          <h3>Enrolled</h3>
          <p>{confirmedCount}</p>
        </div>
        <div className="card">
          <h3>Enquiries</h3>
          <p>{enquiryCount}</p>
        </div>
      </section>

      <section className="student-table">
        <h2>Recently Added</h2>

        {error && <p className="error">{error}</p>}
        {!error && students.length === 0 && <p>No students found.</p>}

        {students.length > 0 && (
          <div className="table-wrapper">
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
                {currentStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentId || s.id}</td>
                    <td>{s.candidateName}</td>
                    <td>{s.applicationStatus}</td>
                    <td>{s.course}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        <div className="mobile-table-disabled">
          <p>Student table is not available on mobile view.</p>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
