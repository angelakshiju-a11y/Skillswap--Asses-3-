/**
 * ==========================================
 * Reviews Page
 * ==========================================
 *
 * Displays reviews for a specific user.
 * Allows leaving a review after a completed session.
 */

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Reviews = () => {
  const { userId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [average, setAverage] = useState(null)
  const [loading, setLoading] = useState(true)

  // Review form state
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const sessionId = searchParams.get('session')

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(profileData)

      // Get reviews
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviewer_id(username, full_name)')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })

      setReviews(reviewData || [])

      const avg = reviewData?.length
        ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1)
        : null
      setAverage(avg)
    } catch (err) {
      console.error('Reviews error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          session_id: sessionId,
          reviewer_id: user.id,
          reviewee_id: userId,
          rating,
          comment
        })

      if (error) throw error

      setMessage('Review submitted successfully!')
      setShowForm(false)
      setRating(5)
      setComment('')
      fetchData()
    } catch (err) {
      setMessage(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container loading">Loading reviews...</div>

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Reviews for {profile?.full_name}</h1>
        <p>
          @{profile?.username}
          {average && <span className="badge badge-match" style={{ marginLeft: '0.5rem' }}>★ {average}</span>}
        </p>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {sessionId && !showForm && (
        <button className="btn btn-primary mb-3" onClick={() => setShowForm(true)}>
          Leave a Review
        </button>
      )}

      {showForm && (
        <div className="card mb-4">
          <h3 style={{ marginBottom: '1rem' }}>Write a Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating</label>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? '#F59E0B' : '#D1D5DB'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="comment">Comment</label>
              <textarea
                id="comment"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <h3>No reviews yet</h3>
          <p>Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="card-grid">
          {reviews.map((review) => (
            <div key={review.id} className="card review-card">
              <div className="review-header">
                <span className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="review-comment">{review.comment}</p>
              <p className="form-hint mt-1">by {review.reviewer?.full_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reviews
