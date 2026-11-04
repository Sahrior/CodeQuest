import React from 'react'

import { useNavigate } from "react-router-dom";







const CompanyHome = () => {

  const navigate = useNavigate();
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};


  return (
    <div>

      <button onClick={logout}>Logout</button>
      company home
      
    </div>
  )
}

export default CompanyHome
