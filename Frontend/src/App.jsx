import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentHome from "./Student/Student_Pages/StudentHome";
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