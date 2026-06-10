/**
 * ==========================================
 * Dashboard Page
 * ==========================================
 *
 * Main landing page after login. Shows:
 * - Welcome banner with user's name
 * - Stats: credits, skills, community size
 * - Upcoming sessions preview
 * - Match recommendations
 * - AI skill recommendations placeholder
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    upcomingSessions: 0,
    matchCount: 0
  })
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Get upcoming sessions
        const { count: sessionCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
          .eq('status', 'scheduled')

        // Get match count
        const { count: matchCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('requester_id', user.id)

        setStats({
          totalUsers: userCount || 0,
          upcomingSessions: sessionCount || 0,
          matchCount: matchCount || 0
        })

        // Fetch AI recommendations (placeholder)
        const { data: recs } = await supabase
          .rpc('get_ai_recommendations', { user_uuid: user.id })

        setAiRecommendations(recs || [])
      } catch (err) {
        console.error('Dashboard data error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user.id])

  return (
    <div className="container fade-in">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>Welcome back, {user.profile?.full_name || 'User'}!</h1>
        <p>Connect with others and exchange skills today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{user.profile?.credits || 0}</div>
          <div className="stat-label">Credits Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.profile?.skills_offered?.length || 0}</div>
          <div className="stat-label">Skills Offered</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.profile?.skills_wanted?.length || 0}</div>
          <div className="stat-label">Skills Wanted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '...' : stats.totalUsers}</div>
          <div className="stat-label">Total Members</div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="card-grid mt-4">
        <div className="card">
          <div className="card-title">Upcoming Sessions</div>
          <div className="stat-value mt-2">{stats.upcomingSessions}</div>
          <Link to="/sessions" className="btn btn-outline btn-sm mt-2">View Sessions</Link>
        </div>
        <div className="card">
          <div className="card-title">Your Matches</div>
          <div className="stat-value mt-2">{stats.matchCount}</div>
          <Link to="/matches" className="btn btn-outline btn-sm mt-2">Find Matches</Link>
        </div>
      </div>

      {/* AI Recommendations Placeholder */}
      {aiRecommendations.length > 0 && (
        <div className="card mt-4">
          <div className="card-title">🤖 AI Skill Recommendations</div>
          <p className="form-hint mb-2">Based on your profile and community trends</p>
          <div>
            {aiRecommendations.map((skill, idx) => (
              <span key={idx} className="badge badge-match">{skill}</span>
            ))}
          </div>
          <p className="form-hint mt-2" style={{ fontStyle: 'italic' }}>
            Connect OpenAI API key for personalized recommendations
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4" style={{ textAlign: 'center' }}>
        <Link to="/matches" className="btn btn-primary" style={{ marginRight: '1rem' }}>
          Find Matches
        </Link>
        <Link to="/profile" className="btn btn-outline">
          Edit Profile
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
