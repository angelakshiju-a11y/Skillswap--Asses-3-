              /**
 * ==========================================
 * SkillSwap Main App Component
 * ==========================================
 * 
 * Handles application routing and authentication state management.
 * Uses React Router v6 for client-side routing.
 * 
 * Auth Strategy:
 * - Simple username-based login (no passwords, no JWT)
 * - User data stored in localStorage for session persistence
 * - Protected routes redirect to login if not authenticated
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import './styles.css';

function App() {
  // Authentication state - persists across page refreshes via localStorage
  const [user, setUser] = useState(null);

  // Check for existing session when app mounts
  useEffect(() => {
    const storedUser = localStorage.getItem('skillswap_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Invalid stored data - clear it
        localStorage.removeItem('skillswap_user');
      }
    }
  }, []);

  /**
   * Handle successful login/registration
   * Stores user data in state and localStorage
   */
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('skillswap_user', JSON.stringify(userData));
  };

  /**
   * Handle logout
   * Clears user data from state and localStorage
   */
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('skillswap_user');
  };

  /**
   * Protected Route wrapper
   * Redirects to login if user is not authenticated
   */
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app">
        {/* Show Navbar only when user is logged in */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <main>
          <Routes>
            {/* Public routes - redirect to home if already logged in */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? <Navigate to="/" replace /> : <Register onLogin={handleLogin} />
              } 
            />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/matches" 
              element={
                <ProtectedRoute>
                  <Matches user={user} />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all: redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
