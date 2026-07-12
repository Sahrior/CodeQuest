import React from "react";
import "./Navbar.css";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  return (
    <nav className="navbar">
      <img src="/logo.png" alt="Logo" className="logo" />

      <ul className="nav-menu">
        <li className="active">Play & Learn</li>
        <li>Practice</li>
        <li>Compete</li>
        <li>Prepare</li>
        <li>Apply</li>
        <li>Community</li>
      </ul>

      <button className="profile-btn">
        <FaUserCircle />
      </button>
    </nav>
  );
};

export default Navbar;