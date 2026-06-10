/**
 * ==========================================
 * SkillSwap Advanced Backend Server v2.0
 * Express API with Supabase PostgreSQL Integration
 * Includes AI-powered feature placeholders
 * ==========================================
 *
 * Endpoints:
 * Auth:     POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout
 * Profiles: GET /api/profiles, GET /api/profiles/:id, PUT /api/profiles/:id
 * Matches:  GET /api/matches/:userId, POST /api/matches/generate
 * Sessions: GET /api/sessions/:userId, POST /api/sessions, PUT /api/sessions/:id/cancel
 * Reviews:  GET /api/reviews/:userId, POST /api/reviews
 * Notifications: GET /api/notifications/:userId, PUT /api/notifications/:id/read
 * Admin:    GET /api/admin/users, GET /api/admin/sessions, PUT /api/admin/credits
 * AI:       POST /api/ai/recommendations, POST /api/ai/match-score, POST /api/ai/learning-path
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ==========================================
// SUPABASE CLIENTS
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase credentials');
  process.exit(1);
}

// Regular client for most operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

const requireAdmin = async (req, res, next) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!profile?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==========================================
// AUTH ROUTES
// ==========================================

/** POST /api/auth/register - Register new user with Supabase Auth */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, full_name } = req.body;
    if (!email || !password || !username || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name }
      }
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      message: 'Registration successful. Check your email to confirm.',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/** POST /api/auth/login - Login with email/password */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: data.user,
      session: data.session,
      profile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/** POST /api/auth/logout - Sign out user */
app.post('/api/auth/logout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

/** GET /api/auth/me - Get current user */
app.get('/api/auth/me', authenticateUser, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json({ user: req.user, profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ==========================================
// PROFILE ROUTES
// ==========================================

/** GET /api/profiles - List all profiles */
app.get('/api/profiles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, skills_offered, skills_wanted, credits, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

/** GET /api/profiles/:id - Get single profile */
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, reviews:reviews!reviewee_id(rating)')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Profile not found' });

    // Calculate average rating
    const avgRating = data.reviews?.length
      ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
      : null;

    res.json({ ...data, avg_rating: avgRating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/** PUT /api/profiles/:id - Update profile */
app.put('/api/profiles/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Can only update your own profile' });
    }

    const { full_name, skills_offered, skills_wanted } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, skills_offered, skills_wanted })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated', profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// MATCH ROUTES
// ==========================================

/** GET /api/matches/:userId - Find matches for user */
app.get('/api/matches/:userId', authenticateUser, async (req, res) => {
  try {
    // First get user's wanted skills
    const { data: user } = await supabase
      .from('profiles')
      .select('skills_wanted')
      .eq('id', req.params.userId)
      .single();

    if (!user?.skills_wanted?.length) return res.json([]);

    // Find profiles offering those skills
    const { data: matches, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, skills_offered, skills_wanted, credits')
      .neq('id', req.params.userId);

    if (error) throw error;

    // Calculate overlap and score
    const scoredMatches = (matches || []).map(match => {
      const overlap = user.skills_wanted.filter(skill =>
        match.skills_offered.includes(skill)
      );
      return {
        ...match,
        matched_skills: overlap,
        match_score: overlap.length
      };
    }).filter(m => m.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score);

    // Store matches in database for tracking
    for (const match of scoredMatches) {
      await supabase.from('matches').upsert({
        requester_id: req.params.userId,
        matched_user_id: match.id,
        match_score: match.match_score,
        matched_skills: match.matched_skills
      }, { onConflict: 'requester_id,matched_user_id' });
    }

    res.json(scoredMatches);
  } catch (err) {
    console.error('Matches error:', err);
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

/** GET /api/matches/recommended/:userId - Get pre-computed recommended matches */
app.get('/api/matches/recommended/:userId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, matched_user:profiles!matched_user_id(id, username, full_name, skills_offered)')
      .eq('requester_id', req.params.userId)
      .order('match_score', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// ==========================================
// SESSION ROUTES
// ==========================================

/** GET /api/sessions/:userId - Get user's sessions */
app.get('/api/sessions/:userId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        student:profiles!student_id(id, username, full_name),
        teacher:profiles!teacher_id(id, username, full_name)
      `)
      .or(`student_id.eq.${req.params.userId},teacher_id.eq.${req.params.userId}`)
      .order('session_date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/** POST /api/sessions - Book a new session */
app.post('/api/sessions', authenticateUser, async (req, res) => {
  try {
    const { teacher_id, skill_name, session_date } = req.body;
    const student_id = req.user.id;

    if (!teacher_id || !skill_name) {
      return res.status(400).json({ error: 'Teacher and skill are required' });
    }

    // Check student credits
    const { data: student } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', student_id)
      .single();

    if (!student || student.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        student_id,
        teacher_id,
        skill_name,
        session_date: session_date || new Date().toISOString(),
        credits_used: 1
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Deduct credits
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: student.credits - 1 })
      .eq('id', student_id);

    if (creditError) throw creditError;

    res.status(201).json({
      message: 'Session booked successfully',
      session,
      credits_remaining: student.credits - 1
    });
  } catch (err) {
    console.error('Book session error:', err);
    res.status(500).json({ error: 'Failed to book session' });
  }
});

/** PUT /api/sessions/:id/cancel - Cancel a session */
app.put('/api/sessions/:id/cancel', authenticateUser, async (req, res) => {
  try {
    // Verify user is participant
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.student_id !== req.user.id && session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Refund credits to student
    const { data: student } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', session.student_id)
      .single();

    await supabase
      .from('profiles')
      .update({ credits: student.credits + session.credits_used })
      .eq('id', session.student_id);

    // Update session status
    const { data, error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Session cancelled and credits refunded', session: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// ==========================================
// REVIEW ROUTES
// ==========================================

/** GET /api/reviews/:userId - Get reviews for a user */
app.get('/api/reviews/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, username, full_name),
        session:sessions!session_id(skill_name)
      `)
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate average
    const avgRating = data?.length
      ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1)
      : null;

    res.json({ reviews: data || [], average: avgRating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/** POST /api/reviews - Submit a review */
app.post('/api/reviews', authenticateUser, async (req, res) => {
  try {
    const { session_id, reviewee_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!session_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify session exists and reviewer participated
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.student_id !== reviewer_id && session.teacher_id !== reviewer_id) {
      return res.status(403).json({ error: 'Only session participants can review' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ session_id, reviewer_id, reviewee_id, rating, comment })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Review submitted', review: data });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

/** GET /api/notifications/:userId - Get user's notifications */
app.get('/api/notifications/:userId', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/** PUT /api/notifications/:id/read - Mark notification as read */
app.put('/api/notifications/:id/read', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Notification marked as read', notification: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/** GET /api/notifications/:userId/unread-count */
app.get('/api/notifications/:userId/unread-count', authenticateUser, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.params.userId)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ unread_count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

/** GET /api/admin/users - List all users (admin only) */
app.get('/api/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/** GET /api/admin/sessions - List all sessions (admin only) */
app.get('/api/admin/sessions', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        student:profiles!student_id(id, username, full_name),
        teacher:profiles!teacher_id(id, username, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/** PUT /api/admin/credits/:userId - Manage user credits (admin only) */
app.put('/api/admin/credits/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { credits } = req.body;
    if (typeof credits !== 'number' || credits < 0) {
      return res.status(400).json({ error: 'Valid credit amount required' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ credits })
      .eq('id', req.params.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Credits updated', profile: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

// ==========================================
// AI PLACEHOLDER ROUTES
// ==========================================

/** POST /api/ai/recommendations - AI skill recommendations */
app.post('/api/ai/recommendations', authenticateUser, async (req, res) => {
  // Placeholder for OpenAI integration
  const { current_skills } = req.body;

  // Simulated AI response
  const recommendations = [
    { skill: 'Machine Learning', reason: 'Popular next step after Data Analysis' },
    { skill: 'Public Speaking', reason: 'Complements technical skills' },
    { skill: 'UI/UX Design', reason: 'Natural extension of frontend skills' }
  ];

  res.json({
    source: 'ai_placeholder',
    recommendations,
    note: 'Connect OPENAI_API_KEY for real recommendations'
  });
});

/** POST /api/ai/match-score - AI-enhanced match scoring */
app.post('/api/ai/match-score', authenticateUser, async (req, res) => {
  const { user_a_id, user_b_id } = req.body;

  // Placeholder: Call PostgreSQL function
  const { data, error } = await supabase
    .rpc('calculate_ai_match_score', {
      user_a: user_a_id,
      user_b: user_b_id
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    source: 'ai_placeholder',
    match_score: data,
    note: 'Future: Integrate OpenAI for semantic skill matching'
  });
});

/** POST /api/ai/learning-path - AI-generated learning path */
app.post('/api/ai/learning-path', authenticateUser, async (req, res) => {
  const { target_skill } = req.body;

  // Simulated AI learning path
  const path = [
    { step: 1, milestone: `Learn basics of ${target_skill}` },
    { step: 2, milestone: `Practice ${target_skill} with small projects` },
    { step: 3, milestone: `Join community ${target_skill} groups` },
    { step: 4, milestone: `Teach ${target_skill} to others` }
  ];

  res.json({
    source: 'ai_placeholder',
    target_skill,
    learning_path: path,
    note: 'Connect OPENAI_API_KEY for personalized learning paths'
  });
});

/** POST /api/ai/session-summary - AI session summary */
app.post('/api/ai/session-summary', authenticateUser, async (req, res) => {
  const { session_notes } = req.body;

  // Simulated AI summary
  res.json({
    source: 'ai_placeholder',
    summary: `Session summary placeholder. Notes: "${session_notes?.substring(0, 50) || 'No notes'}..."`,
    key_takeaways: ['Practice consistently', 'Set specific goals', 'Track progress weekly'],
    note: 'Connect OPENAI_API_KEY for GPT-powered session summaries'
  });
});

// ==========================================
// HEALTH & ROOT ENDPOINTS
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: ['auth', 'profiles', 'matches', 'sessions', 'reviews', 'notifications', 'admin', 'ai_placeholders']
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'SkillSwap API v2.0',
    description: 'Advanced peer-to-peer skill exchange platform',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/auth/me',
      'GET  /api/profiles',
      'GET  /api/profiles/:id',
      'PUT  /api/profiles/:id',
      'GET  /api/matches/:userId',
      'GET  /api/matches/recommended/:userId',
      'GET  /api/sessions/:userId',
      'POST /api/sessions',
      'PUT  /api/sessions/:id/cancel',
      'GET  /api/reviews/:userId',
      'POST /api/reviews',
      'GET  /api/notifications/:userId',
      'PUT  /api/notifications/:id/read',
      'GET  /api/notifications/:userId/unread-count',
      'GET  /api/admin/users',
      'GET  /api/admin/sessions',
      'PUT  /api/admin/credits/:userId',
      'POST /api/ai/recommendations',
      'POST /api/ai/match-score',
      'POST /api/ai/learning-path',
      'POST /api/ai/session-summary',
      'GET  /api/health'
    ]
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('  SkillSwap Advanced Server v2.0 Started');
  console.log('==========================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log('  AI Features: Placeholder mode');
  console.log('==========================================');
});
