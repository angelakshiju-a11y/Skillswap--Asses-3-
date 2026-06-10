/**
 * ==========================================
 * Matches Page
 * ==========================================
 * 
 * Core feature page that finds users offering skills
 * the current user wants to learn. Displays match cards
 * with booking functionality.
 * 
 * Matching Logic (handled by backend):
 * - Gets current user's skills_wanted
 * - Finds other users whose skills_offered overlap
 * 
 * Booking Logic:
 * - Each booking costs 1 credit
 * - Credits are deducted from the learner
 * - Success/error messages displayed inline
 * 
 * Props:
 *   - user: current authenticated user object
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Matches = ({ user }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  
  // Track current credits locally for immediate UI updates
  const [currentUser, setCurrentUser] = useState(user);

  // Fetch matches on page load
  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch matching users from backend
   */
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/matches/${user.username}`);
      setMatches(response.data);
    } catch (err) {
      setError('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle booking a learning session
   * Deducts 1 credit from learner
   */
  const handleBook = async (teacher, skill) => {
    setBookingMessage('');
    setBookingError('');

    try {
      const response = await axios.post('/book', {
        learner_username: user.username,
        teacher_username: teacher.username,
        skill: skill
      });

      // Update local user credits for immediate UI feedback
      setCurrentUser({
        ...currentUser,
        credits: response.data.credits_remaining
      });

      // Update localStorage with new credit balance
      const storedUser = JSON.parse(
        localStorage.getItem('skillswap_user') || '{}'
      );
      localStorage.setItem('skillswap_user', JSON.stringify({
        ...storedUser,
        credits: response.data.credits_remaining
      }));

      setBookingMessage(
        `Successfully booked a ${skill} session with ${teacher.name}!`
      );
    } catch (err) {
      setBookingError(
        err.response?.data?.error || 'Booking failed. Please try again.'
      );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container loading">
        Finding matches...
      </div>
    );
  }

  return (
    <div className="container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Find Your Matches</h1>
        <p>
          People who can teach you what you want to learn. 
          You have <strong>{currentUser.credits} credits</strong> remaining.
        </p>
      </div>

      {/* Booking Success Message */}
      {bookingMessage && (
        <div className="alert alert-success">{bookingMessage}</div>
      )}

      {/* Booking Error Message */}
      {bookingError && (
        <div className="alert alert-error">{bookingError}</div>
      )}

      {/* General Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* No Matches State */}
      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No matches found</h3>
          <p>
            No one is currently offering the skills you're looking for. 
            Check back later or update your wanted skills in your profile.
          </p>
        </div>
      ) : (
        /* Match Cards Grid */
        <div className="card-grid">
          {matches.map((match) => {
            // Calculate which specific skills match
            const matchingSkills = user.skills_wanted.filter(wanted =>
              match.skills_offered.includes(wanted)
            );

            return (
              <div key={match.username} className="card match-card">
                <div className="match-card-content">
                  {/* Match Header */}
                  <div className="card-header">
                    <div>
                      <div className="card-title">{match.name}</div>
                      <div className="card-subtitle">
                        @{match.username}
                      </div>
                    </div>
                  </div>

                  {/* Matching Skills */}
                  <p style={{ 
                    marginBottom: '0.75rem', 
                    fontWeight: 600, 
                    color: 'var(--text-secondary)' 
                  }}>
                    Can teach you:
                  </p>
                  
                  {matchingSkills.map((skill, idx) => (
                    <div key={idx} className="match-skill">
                      <span>✨</span> {skill}
                    </div>
                  ))}

                  {/* Additional Skills (non-matching) */}
                  {match.skills_offered.length > matchingSkills.length && (
                    <p className="form-hint mt-2">
                      Also offers: {match.skills_offered
                        .filter(s => !matchingSkills.includes(s))
                        .join(', ')}
                    </p>
                  )}
                </div>

                {/* Booking Button */}
                <div className="match-card-footer">
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleBook(match, matchingSkills[0])}
                    disabled={currentUser.credits < 1}
                  >
                    {currentUser.credits < 1 
                      ? 'Insufficient Credits' 
                      : `Book ${matchingSkills[0]} Session (-1 Credit)`
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Matches;
