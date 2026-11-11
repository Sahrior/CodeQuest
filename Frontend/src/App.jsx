import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentHome from "./Student/Student_Pages/StudentHome";
import StudentProfile from "./Student/Student_Pages/StudentProfile";
import Edit_profile from "./Student/Student_Pages/Edit_profile";
import Messages from "./Student/Student_Pages/Messages";
import CompanyHome from "./Company/Company_Pages/CompanyHome";
import AdminHome from "./Admin/Admin_Pages/AdminHome";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="Student">
            <StudentHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile/:id"
        element={
          <ProtectedRoute role="Student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/edit-profile"
        element={
          <ProtectedRoute role="Student">
            <Edit_profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute role="Student">
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages/:studentId"
        element={
          <ProtectedRoute role="Student">
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company"
        element={
          <ProtectedRoute role="Company">
            <CompanyHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Admin">
            <AdminHome />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}