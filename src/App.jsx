import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/LoginPage";
import AddStudent from "./pages/AddStudentPage";
import StudentList from "./pages/StudentListPage";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./pages/MainLayout";
import CollegePage from "./pages/CollegePage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/add-student" element={<MainLayout><AddStudent /></MainLayout>} />
        <Route path="/student-list" element={<MainLayout><StudentList /></MainLayout>} />
        <Route path="/add-college" element={<MainLayout><CollegePage /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
