/**
 * ==========================================
 * Matches Page
 * ==========================================
 *
 * Finds users offering skills the current user wants.
 * Displays match cards with match score and booking.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Matches = () => {
  const { user, refreshUser } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    fetchMatches()
  }, [user.id])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, matched_user:profiles!matched_user_id(*)')
        .eq('requester_id', user.id)
        .order('match_score', { ascending: false })

      if (error) throw error

      // If no pre-computed matches, calculate them
      if (!data || data.length === 0) {
        await calculateMatches()
        return
      }

      setMatches(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch matches error:', err)
      setLoading(false)
    }
  }

  const calculateMatches = async () => {
    try {
      // Get current user's wanted skills
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('skills_wanted')
        .eq('id', user.id)
        .single()

      if (!currentUser?.skills_wanted?.length) {
        setMatches([])
        setLoading(false)
        return
      }

      // Find all other users
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (error) throw error

      // Calculate overlap
      const scoredMatches = (allUsers || []).map(match => {
        const overlap = currentUser.skills_wanted.filter(skill =>
          match.skills_offered.includes(skill)
        )
        return {
          matched_user: match,
          match_score: overlap.length,
          matched_skills: overlap
        }
      }).filter(m => m.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score)

      setMatches(scoredMatches)
    } catch (err) {
      console.error('Calculate matches error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (teacher, skill) => {
    setBookingMessage('')
    setBookingError('')

    try {
      // Check credits
      const { data: student } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (!student || student.credits < 1) {
        setBookingError('Insufficient credits. You need at least 1 credit to book a session.')
        return
      }

      // Create session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          student_id: user.id,
          teacher_id: teacher.id,
          skill_name: skill,
          credits_used: 1
        })

      if (sessionError) throw sessionError

      // Deduct credits
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: student.credits - 1 })
        .eq('id', user.id)

      if (creditError) throw creditError

      setBookingMessage(`Successfully booked a ${skill} session with ${teacher.full_name}!`)
      await refreshUser()
    } catch (err) {
      setBookingError(err.message || 'Booking failed. Please try again.')
    }
  }

  if (loading) return <div className="container loading">Finding matches...</div>

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Find Your Matches</h1>
        <p>
          People who can teach you what you want to learn.
          You have <strong>{user.profile?.credits || 0} credits</strong> remaining.
        </p>
      </div>

      {bookingMessage && <div className="alert alert-success">{bookingMessage}</div>}
      {bookingError && <div className="alert alert-error">{bookingError}</div>}

      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No matches found</h3>
          <p>
            No one is currently offering the skills you're looking for.
            Update your wanted skills in your profile.
          </p>
          <Link to="/profile" className="btn btn-primary mt-2">Edit Profile</Link>
        </div>
      ) : (
        <div className="card-grid">
          {matches.map((match) => {
            const matchedUser = match.matched_user
            const skills = match.matched_skills || []

            return (
              <div key={matchedUser.id} className="card match-card">
                <div className="match-card-content">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{matchedUser.full_name}</div>
                      <div className="card-subtitle">@{matchedUser.username}</div>
                    </div>
                    <span className="badge badge-match">Score: {match.match_score}</span>
                  </div>

                  <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Can teach you:
                  </p>
                  {skills.map((skill, idx) => (
                    <div key={idx} className="match-skill">
                      <span>✨</span> {skill}
                    </div>
                  ))}

                  <Link to={`/reviews/${matchedUser.id}`} className="form-hint mt-2">
                    View reviews →
                  </Link>
                </div>

                <div className="match-card-footer">
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => handleBook(matchedUser, skills[0])}
                    disabled={user.profile?.credits < 1}
                  >
                    {user.profile?.credits < 1
                      ? 'Insufficient Credits'
                      : `Book ${skills[0]} Session (-1 Credit)`
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Matches
