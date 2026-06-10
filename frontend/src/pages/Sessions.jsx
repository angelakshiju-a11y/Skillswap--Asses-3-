/**
 * ==========================================
 * Sessions Page
 * ==========================================
 *
 * View and manage learning sessions.
 * Shows scheduled, completed, and cancelled sessions.
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Sessions = () => {
  const { user, refreshUser } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [user.id])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:profiles!student_id(id, username, full_name),
          teacher:profiles!teacher_id(id, username, full_name)
        `)
        .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
        .order('session_date', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      console.error('Sessions error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (session) => {
    if (!window.confirm('Are you sure you want to cancel this session? Your credits will be refunded.')) {
      return
    }

    try {
      // Refund credits
      const { data: student } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', session.student_id)
        .single()

      await supabase
        .from('profiles')
        .update({ credits: student.credits + session.credits_used })
        .eq('id', session.student_id)

      // Update session status
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'cancelled' })
        .eq('id', session.id)

      if (error) throw error

      setMessage('Session cancelled and credits refunded.')
      await refreshUser()
      fetchSessions()
    } catch (err) {
      setMessage('Failed to cancel session.')
    }
  }

  const handleComplete = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (error) throw error
      setMessage('Session marked as completed!')
      fetchSessions()
    } catch (err) {
      setMessage('Failed to update session.')
    }
  }

  const getStatusBadge = (status) => {
    const classes = {
      scheduled: 'badge-status scheduled',
      completed: 'badge-status completed',
      cancelled: 'badge-status cancelled'
    }
    return <span className={classes[status] || 'badge'}>{status}</span>
  }

  if (loading) return <div className="container loading">Loading sessions...</div>

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>My Sessions</h1>
        <p>View and manage your learning sessions</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') || message.includes('refunded') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>No sessions yet</h3>
          <p>Book a session with a matched user to get started.</p>
        </div>
      ) : (
        <div className="card-grid">
          {sessions.map((session) => {
            const isStudent = session.student_id === user.id
            const otherPerson = isStudent ? session.teacher : session.student

            return (
              <div key={session.id} className="card session-card">
                <div className="session-header">
                  <div>
                    <div className="card-title">{session.skill_name}</div>
                    <div className="card-subtitle">
                      {isStudent ? 'Learning from' : 'Teaching'} {otherPerson?.full_name}
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                <div className="session-details">
                  <div className="session-detail-row">
                    <span>📅</span>
                    {new Date(session.session_date).toLocaleDateString()} at{' '}
                    {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="session-detail-row">
                    <span>💳</span>
                    {session.credits_used} credit{session.credits_used > 1 ? 's' : ''} used
                  </div>
                </div>

                {session.status === 'scheduled' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    {isStudent && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(session)}>
                        Cancel
                      </button>
                    )}
                    <button className="btn btn-success btn-sm" onClick={() => handleComplete(session.id)}>
                      Mark Complete
                    </button>
                  </div>
                )}

                {session.status === 'completed' && isStudent && (
                  <div className="mt-2">
                    <a href={`#/reviews/${session.teacher_id}?session=${session.id}`} className="btn btn-secondary btn-sm">
                      Leave Review
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Sessions
