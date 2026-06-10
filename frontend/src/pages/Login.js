               /**
 * ==========================================
 * Login Page
 * ==========================================
 * 
 * Simple username-based authentication with no passwords.
 * Orange-themed login form with link to registration.
 * 
 * Props:
 *   - onLogin: callback function passed from App.js
 *     Called with user data on successful login
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  // Form state
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Handle form submission
   * Validates input and calls backend login endpoint
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend login API - no password needed
      const response = await axios.post('/login', { username: username.trim() });
      
      // Store user data and redirect to home
      onLogin(response.data.user);
      navigate('/');
    } catch (err) {
      // Display error message from backend or generic message
      setError(
        err.response?.data?.error || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container fade-in">
        {/* Page Title */}
        <h1 className="form-title">Welcome to SkillSwap</h1>
        <p className="form-subtitle">
          Exchange skills, learn new things
        </p>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Link to Register */}
        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?
        </p>
        <Link 
          to="/register" 
          className="btn btn-secondary btn-full mt-2"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default Login;
