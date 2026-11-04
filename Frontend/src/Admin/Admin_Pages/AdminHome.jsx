import React from 'react'

import { useNavigate } from "react-router-dom";






const AdminHome = () => {

const navigate = useNavigate();
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};  
  return (
    <div>
      <button onClick={logout}>Logout</button>
      Admin page
    </div>
  )
}

export default AdminHome
