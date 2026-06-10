                   /**
 * ==========================================
 * Home Page (Dashboard)
 * ==========================================
 * 
 * Main landing page after login. Displays:
 * - Welcome banner with user's name
 * - Stats grid showing credits, skills, and community size
 * - Quick action links to Matches and Profile
 * 
 * Props:
 *   - user: current authenticated user object
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users on mount to show community stats
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="container fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>Welcome back, {user.name}!</h1>
        <p>Connect with others and exchange skills today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Credits Available */}
        <div className="stat-card">
          <div className="stat-value">{user.credits}</div>
          <div className="stat-label">Credits Available</div>
        </div>
        
        {/* Skills Offered */}
        <div className="stat-card">
          <div className="stat-value">
            {user.skills_offered?.length || 0}
          </div>
          <div className="stat-label">Skills Offered</div>
        </div>
        
        {/* Skills Wanted */}
        <div className="stat-card">
          <div className="stat-value">
            {user.skills_wanted?.length || 0}
          </div>
          <div className="stat-label">Skills Wanted</div>
        </div>
        
        {/* Total Members */}
        <div className="stat-card">
          <div className="stat-value">
            {loading ? '...' : users.length}
          </div>
          <div className="stat-label">Total Members</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-4" style={{ textAlign: 'center' }}>
        <Link 
          to="/matches" 
          className="btn btn-primary" 
          style={{ marginRight: '1rem' }}
        >
          Find Matches
        </Link>
        <Link to="/profile" className="btn btn-outline">
          View Profile
        </Link>
      </div>
    </div>
  );
};

export default Home;
