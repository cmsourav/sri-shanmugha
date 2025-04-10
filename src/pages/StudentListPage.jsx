import React, { useEffect, useState, useMemo } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import "../styles/StudentList.css";

const StudentList = () => {
    // Main state variables
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Modal state flags
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Filter and pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 9;

    // Fetch students for the authenticated user
    useEffect(() => {
        const fetchStudents = async (user) => {
            try {
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
                    const formattedAmount = data.amountPaid
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 0,
                        }).format(data.amountPaid)
                        : "₹ 0";
                    return {
                        id: docSnap.id,
                        ...data,
                        createdAt: formattedDate,
                        amountPaid: formattedAmount,
                    };
                });
                setStudents(list);
            } catch (err) {
                console.error(err);
                setError("Failed to load student data.");
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchStudents(user);
            } else {
                setLoading(false);
                setStudents([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // Compute filtered students on the fly using useMemo
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
        if (collegeFilter) {
            filtered = filtered.filter((s) =>
                s.college?.toLowerCase().includes(collegeFilter.toLowerCase())
            );
        }
        // Reset page to 1 when filtering changes
        setCurrentPage(1);
        return filtered;
    }, [students, searchTerm, statusFilter, collegeFilter]);

    // Get current page of students
    const currentStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * studentsPerPage;
        return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
    }, [filteredStudents, currentPage, studentsPerPage]);

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    // Open modal functions
    const openDetailsModal = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
    };

    const openEditModal = (student) => {
        setSelectedStudent({ ...student });
        setShowEditModal(true);
    };

    // Edit modal change handler
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedStudent((prev) => ({ ...prev, [name]: value }));
    };

    // Update student in Firestore and update state
    const updateStudent = async () => {
        setSaving(true);
        try {
            const studentRef = doc(db, "shanmugha", selectedStudent.id);
            const { id, ...updateData } = selectedStudent;
            await updateDoc(studentRef, updateData);
            setStudents((prev) =>
                prev.map((s) => (s.id === id ? selectedStudent : s))
            );
            setShowEditModal(false);
        } catch (err) {
            console.error(err);
            alert("Failed to update student.");
        } finally {
            setSaving(false);
        }
    };

    // Delete confirmation placeholder. Update as needed.
    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;
        try {
            const studentRef = doc(db, "shanmugha", studentToDelete.id);
            await deleteDoc(studentRef);
            setStudents((prev) =>
                prev.filter((student) => student.id !== studentToDelete.id)
            );
            setShowDeleteModal(false);
            setStudentToDelete(null);
        } catch (err) {
            console.error(err);
            alert("Failed to delete student.");
        }
    };

    // Render functions for modals for clarity
    const renderEditModal = () => (
        <div className="modal-overlay">
            <div className="edit-modal">
                <h2>Edit Student</h2>
                <div className="modal-content">
                    <label>Application Status</label>
                    <select
                        name="applicationStatus"
                        value={selectedStudent.applicationStatus}
                        onChange={handleEditChange}
                    >
                        <option value="Enquiry">Enquiry</option>
                        <option value="Enroll">Enroll</option>
                    </select>

                    <label>Candidate Name</label>
                    <input
                        name="candidateName"
                        value={selectedStudent.candidateName}
                        onChange={handleEditChange}
                    />

                    <label>Candidate Number</label>
                    <input
                        name="candidateNumber"
                        value={selectedStudent.candidateNumber}
                        onChange={handleEditChange}
                    />
                    <label>Father Name</label>
                    <input
                        name="fatherName"
                        value={selectedStudent.fatherName || ""}
                        onChange={handleEditChange}
                    />
                    <label>Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={selectedStudent.dob}
                        onChange={handleEditChange}
                    />
                    <label>Course</label>
                    <input
                        name="course"
                        value={selectedStudent.course}
                        onChange={handleEditChange}
                    />

                    <label>College</label>
                    <input
                        name="college"
                        value={selectedStudent.college}
                        onChange={handleEditChange}
                    />



                    {selectedStudent.applicationStatus === "Enroll" && (
                        <>

                            <label>Gender</label>
                            <select
                                name="gender"
                                value={selectedStudent.gender || ""}
                                onChange={handleEditChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>

                            <label>Parent Number</label>
                            <input
                                name="parentNumber"
                                value={selectedStudent.parentNumber || ""}
                                onChange={handleEditChange}
                            />

                            <label>Place</label>
                            <input
                                name="place"
                                value={selectedStudent.place || ""}
                                onChange={handleEditChange}
                            />

                            <label>Adhaar Number</label>
                            <input
                                name="adhaarNumber"
                                value={selectedStudent.adhaarNumber || ""}
                                onChange={handleEditChange}
                            />

                            <label>Amount Paid</label>
                            <input
                                name="amountPaid"
                                value={selectedStudent.amountPaid || ""}
                                onChange={handleEditChange}
                            />
                            <label>Transaction Id</label>
                            <input
                                name="transactionId"
                                value={selectedStudent.transactionId || ""}
                                onChange={handleEditChange}
                            />
                        </>
                    )}
                </div>

                <div className="modal-buttons">
                    <button className="save-btn" onClick={updateStudent} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="cancel-btn" onClick={() => setShowEditModal(false)} disabled={saving}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDetailsModal = () => (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="details-modal enhanced-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                <h2 className="modal-title">{selectedStudent.candidateName}'s Details</h2>
                <div className="details-grid">
                    {Object.entries({
                        ID: selectedStudent.studentId,
                        Status: selectedStudent.applicationStatus,
                        Phone: selectedStudent.candidateNumber,
                        DOB: selectedStudent.dob,
                        Father: selectedStudent.fatherName,
                        "Parent No": selectedStudent.parentNumber,
                        Gender: selectedStudent.gender,
                        "Adhaar No": selectedStudent.adhaarNumber,
                        Place: selectedStudent.place,
                        Course: selectedStudent.course,
                        College: selectedStudent.college,
                        "Amount Paid": selectedStudent.amountPaid,
                        "Transaction ID": selectedStudent.transactionId,
                        Reference: selectedStudent.reference?.userName,
                        "Consultancy Name": selectedStudent.reference?.consultancyName,
                        "Created At": selectedStudent.createdAt,
                    }).map(([label, value]) => (
                        <div key={label}>
                            <strong>{label}:</strong> {value || "N/A"}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="student-list-container">
            <h1>All Students</h1>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Application Status</option>
                    <option value="Enquiry">Enquiry</option>
                    <option value="Enroll">Enrolled</option>
                </select>
                <input
                    type="text"
                    placeholder="Filter by college..."
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : currentStudents.length === 0 ? (
                <p>No students found.</p>
            ) : (
                <>
                    <div className="student-grid">
                        {currentStudents.map((student) => (
                            <div
                                className="student-card"
                                key={student.id}
                                onClick={() => openDetailsModal(student)}
                            >
                                <div className="card-header">
                                    <h3>{student.candidateName}</h3>
                                    <span
                                        className={`status-badge ${student.applicationStatus === "Enroll" ? "confirmed" : "enquiry"
                                            }`}
                                    >
                                        {student.applicationStatus === "Enroll"
                                            ? "Enrolled"
                                            : student.applicationStatus}
                                    </span>
                                </div>
                                <p>
                                    <strong>{student.course}</strong>
                                </p>
                                <p>
                                    <strong>{student.candidateNumber}</strong>
                                </p>
                                <div className="card-actions">
                                    <button
                                        className="icon-btn edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(student);
                                        }}
                                    >
                                        ✏️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pagination">
                        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                            ◀ Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={currentPage === i + 1 ? "active" : ""}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next ▶
                        </button>
                    </div>
                </>
            )}

            {showEditModal && selectedStudent && renderEditModal()}
            {showDetailsModal && selectedStudent && renderDetailsModal()}
        </div>
    );
};

export default StudentList;
