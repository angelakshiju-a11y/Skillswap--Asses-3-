                                                                                                                                                                                                                                                                                                            /**
 * ==========================================
 * Navbar Component
 * ==========================================
 * 
 * Top navigation bar displayed when user is authenticated.
 * Features responsive design and logout functionality.
 * 
 * Props:
 *   - user: current user object
 *   - onLogout: callback function to handle logout
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  /**
   * Handle logout click
   * Calls parent logout handler and redirects to login page
   */
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo - links to Home */}
        <Link to="/" className="nav-logo">
          <span>🔄</span> SkillSwap
        </Link>

        {/* Navigation Links */}
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/profile">Profile</Link>
          </li>
          <li>
            <Link to="/matches">Matches</Link>
          </li>
          <li>
            <button onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
