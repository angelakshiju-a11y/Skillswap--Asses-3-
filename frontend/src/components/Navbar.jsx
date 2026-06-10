/**
 * ==========================================
 * Navbar Component
 * ==========================================
 *
 * Top navigation bar with notification badge count.
 * Shows admin link for admin users.
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.id) return

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span>🔄</span> SkillSwap
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/matches">Matches</Link></li>
          <li><Link to="/sessions">Sessions</Link></li>
          <li>
            <Link to="/notifications">
              Notifications
              {unreadCount > 0 && (
                <span className="badge-count">{unreadCount}</span>
              )}
            </Link>
          </li>
          {isAdmin && (
            <li><Link to="/admin">Admin</Link></li>
          )}
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
