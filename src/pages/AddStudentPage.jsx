import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/AddStudent.css";

const validateStudent = (student, enquiryFields) => {
  const errors = {};
  const requiredFields = student.applicationStatus === "Enquiry"
    ? enquiryFields
    : Object.keys(student).filter((k) => k !== "createdBy");

  requiredFields.forEach((key) => {
    if (!student[key]) {
      errors[key] = "This field is required.";
    }
  });

  if (student.studentId && !/^\d+$/.test(student.studentId)) {
    errors.studentId = "Student ID should contain only numbers.";
  }

  if (student.candidateNumber && !/^\d{10}$/.test(student.candidateNumber)) {
    errors.candidateNumber = "Enter a valid 10-digit number.";
  }

  if (
    student.applicationStatus === "Enroll" &&
    student.parentNumber &&
    !/^\d{10}$/.test(student.parentNumber)
  ) {
    errors.parentNumber = "Enter a valid 10-digit number.";
  }

  return errors;
};

const Stepper = ({ currentStep }) => (
  <div className="stepper">
    <div className={`step ${currentStep === 1 ? "active" : ""}`}>
      <div className="circle">1</div>
      <span>Verify</span>
    </div>
    <div className={`step ${currentStep === 2 ? "active" : ""}`}>
      <div className="circle">2</div>
      <span>Details</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <h2>{message.name}</h2>
        <p>{message.text}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const AddStudent = () => {
  const [student, setStudent] = useState({
    studentId: "", candidateName: "", applicationStatus: "",
    candidateNumber: "", fatherName: "", parentNumber: "",
    dob: "", gender: "", adhaarNumber: "", college: "", course: "",
    place: "", amountPaid: "", transactionId: "",
    createdBy: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ name: "", text: "" });
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);

  const enquiryFields = [
    "studentId", "applicationStatus", "candidateName", "fatherName", "candidateNumber",
    "dob", "course", "college",
  ];

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const snapshot = await getDocs(collection(db, "colleges"));
        const options = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          courses: doc.data().courses || [],
        }));
        setCollegeOptions(options);
      } catch {
        toast.error("Failed to load colleges.");
      }
    };

    fetchColleges();
  }, []);

  
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "college") {
      const selected = collegeOptions.find((c) => c.name === value);
      setCourseOptions(selected?.courses || []);
      setStudent((prev) => ({ ...prev, course: "", [name]: value }));
    } else {
      setStudent((prev) => ({ ...prev, [name]: value }));
    }

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerify = async () => {
    const id = student.studentId.trim();

    if (!id || !/^\d+$/.test(id)) {
      setFormErrors({ studentId: "Please enter a valid numeric Student ID." });
      return;
    }

    const docSnap = await getDoc(doc(db, "shanmugha", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setModalMessage({ name: data.candidateName, text: "Student ID already exists." });
      setIsModalOpen(true);
    } else {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 2) return;

    const errors = validateStudent(student, enquiryFields);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalMessage({ name: "Validation", text: "Please correct the errors." });
      setIsModalOpen(true);
      return;
    }

    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!user) {
      setModalMessage({ name: "Error", text: "User not authenticated." });
      setIsModalOpen(true);
      return;
    }
    const userData = userDoc.data();
    const userName = userData.fullName || "Unknown";
    const consultancyName = userData.userType === "Freelance Associate" ? "" : userData.consultancyName || "";
    const referenceValue = {
      userName,
      consultancyName,
    };

    setSubmissionStatus("loading");

    const isEnquiry = student.applicationStatus === "Enquiry";
    const studentData = isEnquiry
      ? enquiryFields.reduce((acc, key) => ({ ...acc, [key]: student[key] }), {
        parentNumber: "", gender: "", place: "",
        adhaarNumber: "", amountPaid: "", transactionId: ""
      })
      : { ...student };

    studentData.createdAt = Timestamp.now();
    studentData.reference = referenceValue
    studentData.createdBy = user.uid

    try {
      await setDoc(doc(db, "shanmugha", student.studentId), studentData);
      setSubmissionStatus("idle");
      setModalMessage({ name: student.candidateName, text: "Student successfully registered!" });
      setIsModalOpen(true);
      setStudent({
        studentId: "", candidateName: "", applicationStatus: "", candidateNumber: "",
        dob: "", gender: "", college: "", course: "", fatherName: "", parentNumber: "",
        adhaarNumber: "", amountPaid: "", transactionId: "", place: "",
        createdBy: "",
      });
      setCurrentStep(1);
    } catch (err) {
      setSubmissionStatus("idle");
      setModalMessage({ name: "Error", text: "Something went wrong." });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="add-student-container">
      <h2>Add Student</h2>
      <form className="student-form" onSubmit={handleSubmit}>
        <div className="stepper">
          <div className={`step ${currentStep === 1 ? "active" : ""}`}>
            <div className="circle">1</div>
            <span>Verify</span>
          </div>
          <div className={`step ${currentStep === 2 ? "active" : ""}`}>
            <div className="circle">2</div>
            <span>Details</span>
          </div>
        </div>

        {currentStep === 1 && (
          <>
            <div className="form-group">
              <label htmlFor="studentId">Register Number</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={student.studentId}
                onChange={handleChange}
              />
              {formErrors.studentId && <span className="error-text">{formErrors.studentId}</span>}
            </div>
            <div className="form-footer center">
              <button type="button" className="submit-btn" onClick={handleVerify}>Verify</button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="applicationStatus">Application Status</label>
              <select
                id="applicationStatus"
                name="applicationStatus"
                value={student.applicationStatus}
                onChange={handleChange}
              >
                <option value="">Select Status</option>
                <option value="Enquiry">Enquiry</option>
                <option value="Enroll">Enroll</option>
              </select>
              {formErrors.applicationStatus && (
                <span className="error-text">{formErrors.applicationStatus}</span>
              )}
            </div>

            {Object.keys(student).map((key) => {
              if (["studentId", "applicationStatus", "createdBy"].includes(key)) return null;
              if (student.applicationStatus === "Enquiry" && !enquiryFields.includes(key)) return null;

              if (key === "college") {
                return (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>College</label>
                    <select
                      id={key}
                      name={key}
                      value={student[key]}
                      onChange={handleChange}
                    >
                      <option value="">Select College</option>
                      {collegeOptions.map((college) => (
                        <option key={college.id} value={college.name}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                    {formErrors[key] && <span className="error-text">{formErrors[key]}</span>}
                  </div>
                );
              }

              if (key === "course") {
                return (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>Course</label>
                    <select
                      id={key}
                      name={key}
                      value={student[key]}
                      onChange={handleChange}
                      disabled={!student.college}
                    >
                      <option value="">Select Course</option>
                      {courseOptions.map((course, index) => (
                        <option key={index} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                    {formErrors[key] && <span className="error-text">{formErrors[key]}</span>}
                  </div>
                );
              }

              return (
                <div className="form-group" key={key}>
                  <label htmlFor={key}>
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </label>
                  {key === "gender" ? (
                    <select
                      id={key}
                      name={key}
                      value={student[key]}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <input
                      type={key === "dob" ? "date" : "text"}
                      id={key}
                      name={key}
                      value={student[key]}
                      onChange={handleChange}
                    />
                  )}
                  {formErrors[key] && <span className="error-text">{formErrors[key]}</span>}
                </div>
              );
            })}

            <div className="form-footer">
              <button type="submit" className="submit-btn" disabled={submissionStatus === "loading"}>
                {submissionStatus === "loading" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </form>
      {isModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <h2 className="student-name">{modalMessage.name.toUpperCase()}</h2>
            <p className="modal-text">{modalMessage.text}</p>
            <button className="custom-modal-close" onClick={() => setIsModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStudent;