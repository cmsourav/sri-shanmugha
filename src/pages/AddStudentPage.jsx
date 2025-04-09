import { useEffect, useState } from "react";
import "../styles/AddStudent.css";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddStudent = () => {
  const [student, setStudent] = useState({
    studentId: "",
    candidateName: "",
    applicationStatus: "",
    candidateNumber: "",
    dob: "",
    gender: "",
    college: "",
    course: "",
    fatherName: "",
    parentNumber: "",
    adhaarNumber: "",
    amountPaid: "",
    transactionId: "",
    place: "",
    reference: "",
    createdBy: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isVerified, setIsVerified] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ name: "", text: "" });
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);

  const navigate = useNavigate();

  const enquiryFields = [
    "studentId", "applicationStatus", "candidateName", "candidateNumber", "dob", "course", "college", "reference"
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuth(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const collegesSnapshot = await getDocs(collection(db, "colleges"));
        const options = [];

        collegesSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(data)
          options.push({
            id: doc.id,
            name: data.name,
            courses: data.courses || [],
          });
        });

        setCollegeOptions(options);
      } catch (error) {
        console.error("Error fetching colleges:", error);
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
      setStudent((prev) => ({
        ...prev,
        course: "",
        [name]: value,
      }));
    } else {
      setStudent((prev) => ({ ...prev, [name]: value }));
    }

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerify = async () => {
    const trimmedId = student.studentId.trim();
    if (!trimmedId) {
      setFormErrors({ studentId: "Please enter a Student ID to verify." });
      return;
    }

    if (!/^\d+$/.test(trimmedId)) {
      setFormErrors({ studentId: "Student ID should be a number." });
      return;
    }

    const studentRef = doc(db, "students", trimmedId);
    const docSnap = await getDoc(studentRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setModalMessage({
        name: data.candidateName || "Student",
        text: "The student with this ID already enrolled.",
      });
      setIsModalOpen(true);
    } else {
      setIsVerified(true);
      setCurrentStep(2);
    }
  };

  const validate = () => {
    const errors = {};

    if (!student.applicationStatus) {
      errors.applicationStatus = "Please select an application status.";
      return errors;
    }

    const isEnquiry = student.applicationStatus === "Enquiry";
    const isConfirmed = student.applicationStatus === "Enroll";

    const requiredFields = isEnquiry
      ? enquiryFields
      : isConfirmed
        ? Object.keys(student).filter((key) => key !== "createdBy")
        : [];

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

    if (isConfirmed && student.parentNumber && !/^\d{10}$/.test(student.parentNumber)) {
      errors.parentNumber = "Enter a valid 10-digit number.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      return;
    }

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalMessage({ name: "Error", text: "Please fill in all required fields." });
      setIsModalOpen(true);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setModalMessage({ name: "Error", text: "User not authenticated." });
      setIsModalOpen(true);
      return;
    }

    setSubmissionStatus("loading");

    const isEnquiry = student.applicationStatus === "Enquiry";
    const isConfirmed = student.applicationStatus === "Enroll";

    let studentData = {};

    if (isEnquiry) {
      enquiryFields.forEach((key) => {
        studentData[key] = student[key];
      });
      studentData.createdBy = user.email;
      studentData.fatherName = "";
      studentData.parentNumber = "";
      studentData.gender = "";
      studentData.place = "";
      studentData.adhaarNumber = "";
      studentData.amountPaid = "";
      studentData.transactionId = "";
    } else if (isConfirmed) {
      studentData = {
        ...student,
      };
    }

    studentData.createdAt = Timestamp.now();

    try {
      const studentRef = doc(db, "shanmugha", student.studentId);
      await setDoc(studentRef, studentData);
      setSubmissionStatus("idle");

      setModalMessage({ name: student.candidateName.toUpperCase(), text: "Registration completed!" });
      setIsModalOpen(true);

      setStudent({
        studentId: "",
        candidateName: "",
        applicationStatus: "",
        candidateNumber: "",
        dob: "",
        gender: "",
        college: "",
        course: "",
        fatherName: "",
        parentNumber: "",
        adhaarNumber: "",
        amountPaid: "",
        transactionId: "",
        place: "",
        reference: "",
        createdBy: "",
      });

      setIsVerified(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error adding student:", error);
      setSubmissionStatus("idle");
      setModalMessage({ name: "Error", text: "Failed to add student. Try again." });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="add-student-container">
      <h2>Add Student</h2>
      {isAuth ? (
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
      ) : (
        <p>Please log in to add a student.</p>
      )}
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
