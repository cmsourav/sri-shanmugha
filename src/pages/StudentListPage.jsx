import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import "../styles/StudentList.css";

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentToDelete, setStudentToDelete] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 8;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const snapshot = await getDocs(collection(db, "students"));
                const list = snapshot.docs.map((doc) => {
                    const data = doc.data();
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
                        id: doc.id,
                        ...data,
                        createdAt: formattedDate,
                        amountPaid: formattedAmount,
                    };
                });

                setStudents(list);
                setFilteredStudents(list);
            } catch (err) {
                setError("Failed to load student data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    useEffect(() => {
        let filtered = students;

        if (searchTerm)
            filtered = filtered.filter((s) =>
                s.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        if (statusFilter)
            filtered = filtered.filter((s) => s.applicationStatus === statusFilter);

        if (collegeFilter)
            filtered = filtered.filter((s) =>
                s.college?.toLowerCase().includes(collegeFilter.toLowerCase())
            );

        setFilteredStudents(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, collegeFilter, students]);

    const currentStudents = filteredStudents.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
    );
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    const openDetailsModal = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
    };

    const openEditModal = (student) => {
        setSelectedStudent({ ...student });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setSelectedStudent((prev) => ({ ...prev, [name]: value }));
    };

    const updateStudent = async () => {
        setSaving(true);
        try {
            const studentRef = doc(db, "students", selectedStudent.id);
            const { id, ...updateData } = selectedStudent;
            await updateDoc(studentRef, updateData);

            setStudents((prev) =>
                prev.map((s) => (s.id === id ? selectedStudent : s))
            );
            setShowEditModal(false);
        } catch (err) {
            alert("Failed to update student.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteStudent = (id) => {
        setStudentToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteDoc(doc(db, "students", studentToDelete));
            setStudents((prev) => prev.filter((s) => s.id !== studentToDelete));
            setShowDeleteModal(false);
        } catch (err) {
            alert("Failed to delete student.");
            console.error(err);
        }
    };

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
                    <option value="Enrolled">Enrolled</option>
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
                        {currentStudents.map((s) => (
                            <div
                                className="student-card"
                                key={s.id}
                                onClick={() => openDetailsModal(s)}
                            >
                                <div className="card-header">
                                    <h3>{s.candidateName}</h3>
                                    <span
                                        className={`status-badge ${s.applicationStatus === "Enrolled"
                                                ? "confirmed"
                                                : "enquiry"
                                            }`}
                                    >
                                        {s.applicationStatus}
                                    </span>
                                </div>
                                <p>
                                    <strong>{s.course}</strong>
                                </p>
                                <p>
                                    <strong>{s.candidateNumber}</strong>
                                </p>
                                <div className="card-actions">
                                    <button
                                        className="icon-btn edit-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(s);
                                        }}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="icon-btn delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDeleteStudent(s.id);
                                        }}
                                    >
                                        🗑️
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
                        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                            Next ▶
                        </button>
                    </div>
                </>
            )}

            {showEditModal && selectedStudent && (
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
                                <option value="Enrolled">Enrolled</option>
                            </select>

                            <label>Candidate Name</label>
                            <input name="candidateName" value={selectedStudent.candidateName} onChange={handleEditChange} />

                            <label>Candidate Number</label>
                            <input name="candidateNumber" value={selectedStudent.candidateNumber} onChange={handleEditChange} />

                            <label>Course</label>
                            <input name="course" value={selectedStudent.course} onChange={handleEditChange} />

                            <label>College</label>
                            <input name="college" value={selectedStudent.college} onChange={handleEditChange} />

                            <label>Date of Birth</label>
                            <input type="date" name="dob" value={selectedStudent.dob} onChange={handleEditChange} />

                            <label>Reference</label>
                            <input name="reference" value={selectedStudent.reference} onChange={handleEditChange} />

                            {selectedStudent.applicationStatus === "Enrolled" && (
                                <>
                                    <label>Father Name</label>
                                    <input name="fatherName" value={selectedStudent.fatherName || ""} onChange={handleEditChange} />

                                    <label>Parent Number</label>
                                    <input name="parentNumber" value={selectedStudent.parentNumber || ""} onChange={handleEditChange} />

                                    <label>Place</label>
                                    <input name="place" value={selectedStudent.place || ""} onChange={handleEditChange} />

                                    <label>Adhaar Number</label>
                                    <input name="adhaarNumber" value={selectedStudent.adhaarNumber || ""} onChange={handleEditChange} />

                                    <label>Amount Paid</label>
                                    <input name="amountPaid" value={selectedStudent.amountPaid || ""} onChange={handleEditChange} />

                                    <label>Gender</label>
                                    <select name="gender" value={selectedStudent.gender || ""} onChange={handleEditChange}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
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
            )}




            {showDetailsModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="details-modal enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        <h2 className="modal-title">{selectedStudent.candidateName}'s Details</h2>
                        <div className="details-grid">
                            {Object.entries({
                                ID: selectedStudent.studentId,
                                Phone: selectedStudent.candidateNumber,
                                DOB: selectedStudent.dob,
                                Gender: selectedStudent.gender,
                                "Adhaar No": selectedStudent.adhaarNumber,
                                Course: selectedStudent.course,
                                College: selectedStudent.college,
                                Father: selectedStudent.fatherName,
                                "Parent No": selectedStudent.parentNumber,
                                Place: selectedStudent.place,
                                "Amount Paid": selectedStudent.amountPaid,
                                "Transaction ID": selectedStudent.transactionId,
                                Reference: selectedStudent.reference,
                                Status: selectedStudent.applicationStatus,
                                "Created At": selectedStudent.createdAt,
                            }).map(([label, value]) => (
                                <div key={label}>
                                    <strong>{label}:</strong> {value || "N/A"}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Are you sure you want to delete this student?</h3>
                        <div className="modal-buttons">
                            <button onClick={handleDeleteConfirm}>Yes, Delete</button>
                            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentList;
