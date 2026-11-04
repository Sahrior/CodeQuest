import React from 'react'

import { useNavigate } from "react-router-dom";





const StudentHome = () => {

const navigate = useNavigate();
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

  return (
    <div>
      student home page
      <button onClick={logout}>Logout</button>
      
    </div>
  )
}

export default StudentHome
