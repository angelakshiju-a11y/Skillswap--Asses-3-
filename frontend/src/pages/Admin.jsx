/**
 * ==========================================
 * Admin Dashboard Page
 * ==========================================
 *
 * Admin-only page for managing the platform.
 * Shows all users, all sessions, and credit management.
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Admin = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setUsers(data || [])
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            *,
            student:profiles!student_id(id, username, full_name),
            teacher:profiles!teacher_id(id, username, full_name)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setSessions(data || [])
      }
    } catch (err) {
      console.error('Admin data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCredits = async (userId, currentCredits) => {
    const newCredits = prompt(`Enter new credit amount (current: ${currentCredits}):`, currentCredits)
    if (!newCredits || isNaN(newCredits)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: parseInt(newCredits) })
        .eq('id', userId)

      if (error) throw error

      setMessage('Credits updated successfully!')
      fetchData()
    } catch (err) {
      setMessage('Failed to update credits.')
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

  if (loading) return <div className="container loading">Loading admin data...</div>

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users, sessions, and platform settings</p>
      </div>

      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({sessions.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Credits</th>
                <th>Skills Offered</th>
                <th>Admin</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>@{u.username}</td>
                  <td>{u.credits}</td>
                  <td>{u.skills_offered?.join(', ') || '-'}</td>
                  <td>{u.is_admin ? 'Yes' : 'No'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleUpdateCredits(u.id, u.credits)}
                    >
                      Edit Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Student</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Credits</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.skill_name}</td>
                  <td>{s.student?.full_name}</td>
                  <td>{s.teacher?.full_name}</td>
                  <td>{getStatusBadge(s.status)}</td>
                  <td>{s.credits_used}</td>
                  <td>{new Date(s.session_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Admin
