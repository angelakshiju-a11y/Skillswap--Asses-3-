                 /**
 * ==========================================
 * Register Page
 * ==========================================
 * 
 * User registration form for creating a new SkillSwap profile.
 * Collects name, username, skills offered, and skills wanted.
 * New users automatically receive 5 credits (handled by backend).
 * 
 * Props:
 *   - onLogin: callback function passed from App.js
 *     Automatically logs in user after successful registration
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = ({ onLogin }) => {
  // Form state with all required fields
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    skills_offered: '',
    skills_wanted: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  /**
   * Handle input changes for all form fields
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handle form submission
   * Sends user data to backend and auto-logs in on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend create user API
      const response = await axios.post('/users', formData);
      
      // Automatically log in the new user
      onLogin(response.data.user);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container fade-in">
        {/* Page Title */}
        <h1 className="form-title">Create Your Profile</h1>
        <p className="form-subtitle">
          Start with 5 free credits!
        </p>
        
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
              required
              autoFocus
            />
          </div>
          
          {/* Full Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>
          
          {/* Skills Offered Field */}
          <div className="form-group">
            <label htmlFor="skills_offered">Skills You Can Teach</label>
            <input
              type="text"
              id="skills_offered"
              name="skills_offered"
              value={formData.skills_offered}
              onChange={handleChange}
              placeholder="e.g. Photoshop, Guitar, Python"
              required
            />
            <p className="form-hint">Separate multiple skills with commas</p>
          </div>
          
          {/* Skills Wanted Field */}
          <div className="form-group">
            <label htmlFor="skills_wanted">Skills You Want to Learn</label>
            <input
              type="text"
              id="skills_wanted"
              name="skills_wanted"
              value={formData.skills_wanted}
              onChange={handleChange}
              placeholder="e.g. Excel, Cooking, French"
              required
            />
            <p className="form-hint">Separate multiple skills with commas</p>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        {/* Link to Login */}
        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ color: 'var(--primary)', fontWeight: 600 }}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
