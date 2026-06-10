/**
 * ==========================================
 * Profile Page
 * ==========================================
 *
 * Displays and allows editing of the user's profile.
 * Shows skills, credits, and average rating.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Profile = () => {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState({ reviews: [], average: null })
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(data)
        setEditData({
          full_name: data.full_name,
          skills_offered: data.skills_offered?.join(', ') || '',
          skills_wanted: data.skills_wanted?.join(', ') || ''
        })

        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(username, full_name)')
          .eq('reviewee_id', user.id)
          .order('created_at', { ascending: false })

        const avg = reviewData?.length
          ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1)
          : null

        setReviews({ reviews: reviewData || [], average: avg })
      } catch (err) {
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user.id])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          skills_offered: editData.skills_offered.split(',').map(s => s.trim()).filter(s => s),
          skills_wanted: editData.skills_wanted.split(',').map(s => s.trim()).filter(s => s)
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Profile updated successfully!')
      setIsEditing(false)
      await refreshUser()

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    } catch (err) {
      setMessage('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container loading">Loading profile...</div>

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your skills and view your reputation</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            {isEditing ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  style={{ fontSize: '1.25rem', fontWeight: 700 }}
                />
              </div>
            ) : (
              <h2>{profile?.full_name}</h2>
            )}
            <p>@{profile?.username}</p>
            <div className="mt-1">
              <span className="badge badge-credit">{profile?.credits} Credits</span>
              {reviews.average && (
                <span className="badge badge-match">{reviews.average} avg</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid mt-4">
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Skills I Can Teach</h3>
          {isEditing ? (
            <div className="form-group">
              <input
                type="text"
                value={editData.skills_offered}
                onChange={(e) => setEditData({ ...editData, skills_offered: e.target.value })}
                placeholder="e.g. Photoshop, Guitar, Python"
              />
              <p className="form-hint">Separate with commas</p>
            </div>
          ) : (
            profile?.skills_offered?.length > 0 ? (
              <div>
                {profile.skills_offered.map((skill, i) => (
                  <span key={i} className="badge badge-offered">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No skills offered yet</p>
            )
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Skills I Want to Learn</h3>
          {isEditing ? (
            <div className="form-group">
              <input
                type="text"
                value={editData.skills_wanted}
                onChange={(e) => setEditData({ ...editData, skills_wanted: e.target.value })}
                placeholder="e.g. Excel, Cooking, French"
              />
              <p className="form-hint">Separate with commas</p>
            </div>
          ) : (
            profile?.skills_wanted?.length > 0 ? (
              <div>
                {profile.skills_wanted.map((skill, i) => (
                  <span key={i} className="badge badge-wanted">{skill}</span>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No skills wanted yet</p>
            )
          )}
        </div>
      </div>

      <div className="mt-4" style={{ textAlign: 'center' }}>
        {isEditing ? (
          <>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginRight: '0.5rem' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {reviews.reviews.length > 0 && (
        <div className="mt-4">
          <h3 style={{ marginBottom: '1rem' }}>Reviews</h3>
          <div className="card-grid">
            {reviews.reviews.map((review) => (
              <div key={review.id} className="card review-card">
                <div className="review-header">
                  <span className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
                <p className="form-hint mt-1">by {review.reviewer?.full_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
