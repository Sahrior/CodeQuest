import React from "react";
import "./Navbar.css";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      
      <Link to="/">
        <img src="/logo.png" alt="Logo" className="logo" />
      </Link>

      
      <ul className="nav-menu">
        <li>
          <Link to="/play">Play & Learn</Link>
        </li>

        <li>
          <Link to="/practice">Practice</Link>
        </li>

        <li>
          <Link to="/compete">Compete</Link>
        </li>

        <li>
          <Link to="/prepare">Prepare</Link>
        </li>

        <li>
          <Link to="/apply">Apply</Link>
        </li>

        <li>
          <Link to="/community">Community</Link>
        </li>
      </ul>

      
      <button className="profile-btn">
        <FaUserCircle />
      </button>
    </nav>
  );
};

export default Navbar;