# SkillSwap - Advanced Peer-to-Peer Skill Exchange Platform

A modern full-stack web application where users can offer skills, request skills, find AI-powered matches, book learning sessions, leave reviews, and manage credits.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Database Setup](#database-setup)
6. [Installation](#installation)
7. [Running the Application](#running-the-application)
8. [API Endpoints](#api-endpoints)
9. [Project Flow](#project-flow)
10. [Testing Instructions](#testing-instructions)
11. [MVP Limitations](#mvp-limitations)
12. [Future Improvements](#future-improvements)

---

## Features

- **Supabase Auth**: Email/password authentication with JWT session management
- **User Profiles**: Create profile with skills offered and wanted
- **Credit System**: New users start with 5 credits; each session costs 1 credit
- **Skill Matching**: Find users who teach what you want to learn with match scores
- **Session Booking**: Book, complete, and cancel learning sessions
- **Reviews & Ratings**: Leave 1-5 star reviews after completed sessions
- **Notifications**: In-app notifications for bookings and matches
- **Admin Dashboard**: Manage users, sessions, and credits (admin only)
- **AI Placeholders**: Stubs for OpenAI-powered recommendations, match scoring, learning paths
- **Responsive Design**: Modern orange theme that works on all devices

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router DOM v6 |
| Backend | Node.js, Express.js, CORS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, JWT) |
| Styling | CSS only (custom orange theme) |

**Design System:**
- Primary: `#FF6B00`
- Background: `#FFF7F0`
- Cards: White with subtle shadows

---

## Project Structure

```
skillswap/
├── backend/
│   ├── server.js          # Express API v2.0
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── index.html         # Vite entry
│   ├── vite.config.js     # Vite config with proxy
│   ├── package.json       # Vite + React + Supabase
│   ├── .env               # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   └── src/
│       ├── main.jsx       # React entry point
│       ├── App.jsx        # Router + AuthProvider
│       ├── index.css      # Orange theme stylesheet
│       ├── lib/
│       │   └── supabase.js    # Supabase client setup
│       ├── context/
│       │   └── AuthContext.jsx # Global auth state
│       ├── components/
│       │   └── Navbar.jsx     # Navigation with notification badge
│       └── pages/
│           ├── Login.jsx      # Supabase email auth
│           ├── Register.jsx   # Create account
│           ├── Dashboard.jsx  # Overview + AI recommendations
│           ├── Profile.jsx    # Edit profile + view reviews
│           ├── Matches.jsx    # Find matches + book sessions
│           ├── Sessions.jsx   # View/manage sessions
│           ├── Notifications.jsx # In-app notifications
│           ├── Reviews.jsx    # View/leave reviews
│           └── Admin.jsx      # Admin dashboard
│
└── supabase/
    └── schema.sql         # Complete database schema
```

---

## Prerequisites

- **Node.js** v16 or higher
- **npm**
- **Supabase account** with a project

---

## Database Setup

### 1. Run the Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL

This creates:
- `profiles` table (linked to auth.users)
- `matches` table (pre-computed matches)
- `sessions` table (learning sessions)
- `reviews` table (ratings and comments)
- `notifications` table (in-app notifications)
- Triggers for auto-creating profiles and notifications
- RLS policies for security
- AI placeholder functions

### 2. Enable Email Auth

In Supabase Dashboard → Authentication → Settings:
- Enable "Email" provider
- Disable "Confirm email" for easier testing (optional)

### 3. Set Admin User

After creating your first account, run this SQL to make yourself admin:

```sql
UPDATE profiles SET is_admin = true WHERE username = 'your_username';
```

---

## Installation

### Step 1: Backend

```bash
cd backend
npm install
```

### Step 2: Frontend

```bash
cd frontend
npm install
```

### Step 3: Environment Variables

**Backend** (`backend/.env`):
```
SUPABASE_URL=https://tttinuqepucvjfdbggln.supabase.co
SUPABASE_ANON_KEY=sb_publishable_GQj6_o3ugFrMHa7fgJWWyg_e_lcKihL
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=https://tttinuqepucvjfdbggln.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GQj6_o3ugFrMHa7fgJWWyg_e_lcKihL
```

---

## Running the Application

You need **two terminal windows**.

### Terminal 1: Backend

```bash
cd backend
npm start
```

Runs on `http://localhost:5000`

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Runs on `http://localhost:5173`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all profiles |
| GET | `/api/profiles/:id` | Get single profile with rating |
| PUT | `/api/profiles/:id` | Update own profile |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches/:userId` | Find matches for user |
| GET | `/api/matches/recommended/:userId` | Get pre-computed matches |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/:userId` | Get user's sessions |
| POST | `/api/sessions` | Book a session |
| PUT | `/api/sessions/:id/cancel` | Cancel and refund |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:userId` | Get reviews for user |
| POST | `/api/reviews` | Submit a review |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/:userId` | Get notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/sessions` | List all sessions |
| PUT | `/api/admin/credits/:userId` | Update credits |

### AI Placeholders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommendations` | Skill recommendations |
| POST | `/api/ai/match-score` | AI match scoring |
| POST | `/api/ai/learning-path` | Learning path generation |
| POST | `/api/ai/session-summary` | Session summary |

---

## Project Flow

```
1. REGISTER
   - Email, password, username, full name
   - Supabase Auth creates user
   - Trigger auto-creates profile with 5 credits

2. LOGIN
   - Supabase email/password auth
   - JWT session stored by Supabase client
   - Profile fetched and merged with user object

3. DASHBOARD
   - Welcome banner, stats, quick actions
   - AI skill recommendations (placeholder)

4. PROFILE
   - View/edit skills offered and wanted
   - View credit balance and average rating
   - See reviews received

5. MATCHES
   - System finds users whose skills_offered overlap with your skills_wanted
   - Match score calculated based on overlap count
   - Book session directly from match card

6. SESSIONS
   - View scheduled, completed, cancelled sessions
   - Cancel scheduled session (refunds credits)
   - Mark session as completed

7. REVIEWS
   - Leave review after completed session
   - 1-5 star rating + comment
   - View all reviews for a user

8. NOTIFICATIONS
   - Real-time notifications via Supabase realtime
   - Booking confirmations, match alerts
   - Mark as read individually or all at once

9. ADMIN
   - View all users and sessions
   - Edit user credits
   - Protected by admin role check
```

---

## Testing Instructions

### Test 1: Registration and Login
1. Open `http://localhost:5173`
2. Click "Create Account"
3. Fill: email, password (min 6 chars), username, full name
4. Click "Create Account"
5. Sign in with email and password

### Test 2: Profile Setup
1. Go to Profile
2. Click "Edit Profile"
3. Add skills offered: `Photoshop, Illustrator`
4. Add skills wanted: `Guitar, Piano`
5. Click "Save Changes"

### Test 3: Create Second User for Matching
1. Log out
2. Create another account with:
   - Skills offered: `Guitar, Bass`
   - Skills wanted: `Photoshop, Excel`
3. Log back in as first user

### Test 4: Find Matches
1. Go to Matches
2. Should see second user with match score
3. Click "Book Guitar Session (-1 Credit)"
4. Credits should decrease from 5 to 4

### Test 5: View Sessions
1. Go to Sessions
2. See scheduled session
3. Click "Mark Complete"

### Test 6: Leave Review
1. After marking complete, click "Leave Review"
2. Select rating and write comment
3. Submit

### Test 7: Notifications
1. Go to Notifications
2. Should see booking confirmation
3. Click to mark as read

### Test 8: Admin (if set as admin)
1. Go to Admin
2. View all users and sessions
3. Try editing a user's credits

---

## MVP Limitations

1. **No real AI**: AI features are placeholders using PostgreSQL functions
2. **No real-time chat**: Users must communicate outside the app
3. **No calendar integration**: Sessions don't have specific time slots
4. **No payment processing**: Credits are virtual only
5. **No email verification**: For easier testing, email confirmation is optional
6. **Basic matching**: Only exact string matching, no semantic understanding
7. **No skill levels**: All skills treated equally
8. **No image uploads**: Profile pictures use initials only

---

## Future Improvements

- **OpenAI Integration**: Real AI recommendations, match scoring, learning paths
- **Real-time Chat**: Socket.io or Supabase realtime for messaging
- **Calendar Sync**: Google Calendar API integration
- **Video Calls**: WebRTC for in-app video sessions
- **Mobile App**: React Native version
- **Payment Gateway**: Stripe for buying credits
- **Skill Verification**: Assessment-based verified skills
- **Advanced Search**: Filter by location, availability, skill level

---

## License

University MVP demonstration project.

**Happy SkillSwapping!** 🔄
