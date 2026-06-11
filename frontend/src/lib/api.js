/**
 * ==========================================
 * API Client Configuration
 * ==========================================
 *
 * Configures Axios with the correct base URL
 * for both development and production.
 */

import axios from 'axios'

// Use environment variable for API URL, fallback to local proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession())
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
