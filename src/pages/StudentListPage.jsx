import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import "../styles/StudentList.css";

const StudentList = () => {
  // State variables
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 8;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async (user) => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, "shanmugha"),
          where("createdBy", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toDate?.();
          const formattedDate = createdAt
          ? `${createdAt.getDate().toString().padStart(2, "0")}-${(createdAt.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${createdAt.getFullYear()}`
          : data.createdAt || "N/A";
          const amount = Number(data.amountPaid) || 0;
          return {
            id: docSnap.id,
            ...data,
            createdAt: formattedDate,
            amountPaid: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(amount),
            rawAmount: amount
          };
        });
        setStudents(list);
      } catch (err) {
        setError("Failed to load student data.");
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchStudents(user);
      else {
        setIsLoading(false);
        setStudents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter and pagination logic
  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((s) => s.applicationStatus === statusFilter);
    }
    setCurrentPage(1);
    return filtered;
  }, [students, searchTerm, statusFilter]);

  const currentStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, currentPage, studentsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Modal handlers
  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent({ ...student });
    setShowEditModal(true);
  };

  // Student Card Component
  const StudentCard = ({ student }) => (
    <div className="student-card">
      <div className="student-card__header">
        <div className="student-card__avatar">
          {student.candidateName?.charAt(0) || "S"}
        </div>
        <div className="student-card__info">
          <h3 className="student-card__name">{student.candidateName}</h3>
          <p className="student-card__course">{student.course}</p>
          <span className={`student-card__status student-card__status--${student.applicationStatus === "Enroll" ? "enrolled" : "enquiry"}`}>
            {student.applicationStatus === "Enroll" ? "Enrolled" : student.applicationStatus}
          </span>
        </div>
      </div>
      <div className="student-card__details">
        <div className="student-card__detail-row">
          <span>Register No:</span>
          <span>{student.studentId || "N/A"}</span>
        </div>
        <div className="student-card__detail-row">
          <span>College:</span>
          <span>{student.college || "N/A"}</span>
        </div>
        <div className="student-card__detail-row">
          <span>Contact:</span>
          <span>{student.candidateNumber || "N/A"}</span>
        </div>
      </div>
      <div className="student-card__actions">
        <button className="student-card__button student-card__button--edit" onClick={() => openEditModal(student)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Edit</span>
        </button>
        <button className="student-card__button student-card__button--view" onClick={() => openDetailsModal(student)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>View</span>
        </button>
      </div>
    </div>
  );

  // Edit Modal Content
  const EditModal = ({ selectedStudent, setShowEditModal, isSaving }) => {
    if (!selectedStudent) return null; 

    const [localStudent, setLocalStudent] = useState(selectedStudent);

    useEffect(() => {
      if (selectedStudent) {
        setLocalStudent(selectedStudent);
      }
    }, [selectedStudent]);

    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setLocalStudent(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleAmountChange = (e) => {
      const value = parseFloat(e.target.value) || 0;
      setLocalStudent(prev => ({
        ...prev,
        rawAmount: value,
        amountPaid: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value)
      }));
    };

    const updateStudentData = async () => {
      setIsSaving(true);
      try {
        const studentRef = doc(db, "shanmugha", localStudent.id);
        const updateData = {
          ...localStudent,
          amountPaid: localStudent.rawAmount || 0
        };
        await updateDoc(studentRef, updateData);
        setStudents((prev) =>
          prev.map((s) =>
            s.id === localStudent.id ? localStudent : s
          )
        );
        setShowEditModal(false);
      } catch(err) {
        console.log(err)
        alert("Failed to update student.");
      } finally {
        setIsSaving(false);
      }
    }

    return (
      <div className="modal modal--edit">
        <div className="modal__overlay" onClick={() => setShowEditModal(false)}></div>
        <div className="modal__container">
          <div className="modal__header">
            <div className="modal__header-content">
              <h2 className="modal__title">Edit Student Details</h2>
              <p className="modal__subtitle">ID: {localStudent.id}</p>
            </div>
            <button
              className="modal__close-button"
              onClick={() => setShowEditModal(false)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="modal__content">
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-group__label">Application Status</label>
                  <select
                    className="form-outlined-input"
                    name="applicationStatus"
                    value={localStudent.applicationStatus}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="Enquiry">Enquiry</option>
                    <option value="Enroll">Enroll</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-group__label">Full Name</label>
                  <input
                    className="form-outlined-input"
                    name="candidateName"
                    value={localStudent.candidateName}
                    onChange={handleEditChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">Phone Number</label>
                  <input
                    className="form-outlined-input"
                    name="candidateNumber"
                    value={localStudent.candidateNumber}
                    onChange={handleEditChange}
                    type="tel"
                    pattern="[0-9]{10}"
                    placeholder="Enter 10-digit phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">Father's Name</label>
                  <input
                    className="form-outlined-input"
                    name="fatherName"
                    value={localStudent.fatherName || ""}
                    onChange={handleEditChange}
                    placeholder="Enter father's name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-outlined-input"
                    name="dob"
                    value={localStudent.dob}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">Course</label>
                  <input
                    className="form-outlined-input"
                    name="course"
                    value={localStudent.course}
                    onChange={handleEditChange}
                    required
                    placeholder="Enter course name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">College</label>
                  <input
                    className="form-outlined-input"
                    name="college"
                    value={localStudent.college}
                    onChange={handleEditChange}
                    required
                    placeholder="Enter college name"
                  />
                </div>

                {localStudent.applicationStatus === "Enroll" && (
                  <>
                    <div className="form-group">
                      <label className="form-group__label">Gender</label>
                      <select
                        className="form-outlined-input"
                        name="gender"
                        value={localStudent.gender || ""}
                        onChange={handleEditChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-group__label">Parent's Phone</label>
                      <input
                        className="form-outlined-input"
                        name="parentNumber"
                        value={localStudent.parentNumber || ""}
                        onChange={handleEditChange}
                        type="tel"
                        pattern="[0-9]{10}"
                        placeholder="Enter parent's phone number"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-group__label">Place</label>
                      <input
                        className="form-outlined-input"
                        name="place"
                        value={localStudent.place || ""}
                        onChange={handleEditChange}
                        placeholder="Enter city/town"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-group__label">Aadhaar Number</label>
                      <input
                        className="form-outlined-input"
                        name="adhaarNumber"
                        value={localStudent.adhaarNumber || ""}
                        onChange={handleEditChange}
                        type="text"
                        pattern="[0-9]{12}"
                        title="12-digit Aadhaar number"
                        placeholder="Enter 12-digit Aadhaar number"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-group__label">Amount Paid (₹)</label>
                      <input
                        className="form-outlined-input"
                        name="amountPaid"
                        value={localStudent.rawAmount || ""}
                        onChange={handleAmountChange}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-group__label">Transaction ID</label>
                      <input
                        className="form-outlined-input"
                        name="transactionId"
                        value={localStudent.transactionId || ""}
                        onChange={handleEditChange}
                        placeholder="Enter transaction ID"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="modal__footer">
            <button
              className="button button--outline"
              onClick={() => setShowEditModal(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="button button--primary"
              onClick={() => updateStudentData(localStudent)}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="button__spinner" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5"></circle>
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Details Modal Content
  const DetailsModal = () => (
    <div className="modal modal--details">
      <div className="modal__overlay" onClick={() => setShowDetailsModal(false)}></div>
      <div className="modal__container">
        <div className="modal__header">
          <div className="student-title">
            <div className="student-title__avatar">
              {selectedStudent.candidateName?.charAt(0) || "S"}
            </div>
            <h2 className="modal__title">
              {selectedStudent.candidateName}'s Details
            </h2>
          </div>
          <button
            className="modal__close-button"
            onClick={() => setShowDetailsModal(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="modal__content">
          <div className="details-section">
            <h3 className="details-section__title">Personal Information</h3>
            <div className="details-grid">
              <div className="details-item">
                <span className="details-item__label">Application Status</span>
                <span className={`details-item__value details-item__value--${selectedStudent.applicationStatus === "Enroll" ? "enrolled" : "enquiry"}`}>
                  {selectedStudent.applicationStatus === "Enroll" ? "Enrolled" : selectedStudent.applicationStatus}
                </span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Student ID</span>
                <span className="details-item__value">{selectedStudent.studentId || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Phone Number</span>
                <span className="details-item__value">{selectedStudent.candidateNumber || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Date of Birth</span>
                <span className="details-item__value">{selectedStudent.dob || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Father's Name</span>
                <span className="details-item__value">{selectedStudent.fatherName || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Parent's Number</span>
                <span className="details-item__value">{selectedStudent.parentNumber || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Gender</span>
                <span className="details-item__value">{selectedStudent.gender || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Adhaar Number</span>
                <span className="details-item__value">{selectedStudent.adhaarNumber || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Place</span>
                <span className="details-item__value">{selectedStudent.place || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3 className="details-section__title">Academic Information</h3>
            <div className="details-grid">
              <div className="details-item">
                <span className="details-item__label">Course</span>
                <span className="details-item__value">{selectedStudent.course || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">College</span>
                <span className="details-item__value">{selectedStudent.college || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3 className="details-section__title">Financial Information</h3>
            <div className="details-grid">
              <div className="details-item">
                <span className="details-item__label">Amount Paid</span>
                <span className="details-item__value">{selectedStudent.amountPaid || "₹ 0"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Transaction ID</span>
                <span className="details-item__value">{selectedStudent.transactionId || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3 className="details-section__title">Other Information</h3>
            <div className="details-grid">
              <div className="details-item">
                <span className="details-item__label">Reference</span>
                <span className="details-item__value">{selectedStudent.reference?.userName || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Consultancy</span>
                <span className="details-item__value">{selectedStudent.reference?.consultancyName || "N/A"}</span>
              </div>

              <div className="details-item">
                <span className="details-item__label">Created At</span>
                <span className="details-item__value">{selectedStudent.createdAt || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button
            className="button button--primary"
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="student-management">
      <header className="student-management__header">
        <div className="header-container">
          <h1 className="student-management__title">Student Portal</h1>
          <div className="header-controls">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Enquiry">Enquiry</option>
              <option value="Enroll">Enrolled</option>
            </select>
          </div>
        </div>
      </header>

      <main className="student-management__content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12V8ZM12 16H12.01H12ZM21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>{error}</p>
            <button className="button button--primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : currentStudents.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V14V5ZM12 14L16 10L12 14ZM12 14L8 10L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 18L5 6C5 5.46957 5.21071 4.96086 5.58579 4.58579C5.96086 4.21071 6.46957 4 7 4H17C17.5304 4 18.0391 4.21071 18.4142 4.58579C18.7893 4.96086 19 5.46957 19 6V18L15.5 16L12.5 18L12 17.5L11.5 18L8.5 16L5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>No students found</h3>
            <p>{searchTerm ? "Try a different search term" : "Add a new student to get started"}</p>
            {searchTerm && (
              <button className="button button--outline" onClick={() => setSearchTerm('')}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="student-list">
              {currentStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Previous</span>
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`page-button ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="page-ellipsis">...</span>
                      <button
                        className="page-button"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span>Next</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showEditModal && 
      <EditModal 
      selectedStudent={selectedStudent}
      setShowEditModal={setShowEditModal}
      isSaving={isSaving}
      />}
      {showDetailsModal && <DetailsModal />}
    </div>
  );
};

export default StudentList;