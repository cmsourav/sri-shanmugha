import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginPage";
import AddStudent from "./pages/AddStudentPage";
import StudentList from "./pages/StudentListPage";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./pages/MainLayout";
import CollegePage from "./pages/CollegePage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <MainLayout><Dashboard /></MainLayout>
        }
        />
        <Route path="/add-student" element={
          <MainLayout><AddStudent /></MainLayout>
        }
        />
        <Route path="/student-list" element={
          <MainLayout><StudentList /> </MainLayout>
        }
        />
        <Route path="/add-college" element={
          <MainLayout><CollegePage /> </MainLayout>
        }
        />
      </Routes>
    </Router>
  );
}

export default App;
