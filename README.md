# VolunteerConnect

A full-stack web app that connects students with local volunteer opportunities. Volunteers browse, register for, and cancel events. Organizers post opportunities and see who signed up.

Built as the final project for **CS + Social Good @ UNC Chapel Hill**.

**Live site:** https://cssg-portfolio.vercel.app
**API:** `https://cssg-portfolio-api.onrender.com` (health check: `/health`)

## Features

**Volunteers**
- Sign up and log in
- Browse upcoming opportunities, search by title, filter by category
- View details and spots remaining
- Register and cancel (no duplicates, can't exceed capacity)
- Dashboard of upcoming and past registrations

**Organizers**
- Organizer accounts with their own permissions
- Create opportunities (date, time, location, category, capacity)
- Delete their own opportunities
- See the list of registered volunteers for their events

## Tech stack

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | React + Vite + TypeScript | Vercel |
| Backend | Node.js + Express | Render |
| Database | PostgreSQL | Supabase |
| Auth | Supabase Auth (JWT) | Supabase |

## Architecture

```
Browser (React, Vercel)
   │  logs in with Supabase Auth → receives a JWT
   │  calls the REST API with  Authorization: Bearer <token>
   ▼
Express API (Render)
   │  verifies the JWT (jose + Supabase JWKS), validates input,
   │  queries the database AS the logged-in user
   ▼
Supabase Postgres
      Row Level Security enforces who can read/change which rows
```

The frontend only uses Supabase to log in. All data goes through the Express API.

## Data model

- **profiles** (`id` → auth user, `full_name`, `role`: volunteer | organizer). Created automatically by a trigger on sign-up.
- **opportunities** (`organizer_id` → profiles, title, description, category, location, `starts_at`, `ends_at`, `capacity`, `spots_taken`)
- **registrations** (`opportunity_id` → opportunities, `user_id` → profiles), with `unique (opportunity_id, user_id)` to block duplicate sign-ups

SQL: `backend/schema-volunteer.sql` (tables), `backend/schema-security.sql` (RLS, functions, trigger).

## Security and correctness

- **Row Level Security:** anyone can read opportunities, only organizers can create them, only the creator can delete one, and registrations are visible only to the volunteer and the event's organizer.
- **Race-safe capacity:** registering runs in a Postgres function that locks the opportunity row (`SELECT ... FOR UPDATE`), checks capacity, and inserts in one step, so two people can't take the last spot at the same time.
- **Server-side validation:** required fields, end time after start time, start time in the future, capacity 1–1000.
- The Supabase secret key lives only on the backend and is never sent to the browser.

## API

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/opportunities?category=&search=` | – | Upcoming opportunities |
| GET | `/api/opportunities/:id` | – | One opportunity |
| POST | `/api/opportunities` | organizer | Create (201) |
| DELETE | `/api/opportunities/:id` | its organizer | Delete (204) |
| GET | `/api/opportunities/:id/registrations` | its organizer | Attendee list |
| POST | `/api/opportunities/:id/register` | user | Register (201, or 409 if full or already registered) |
| DELETE | `/api/opportunities/:id/register` | user | Cancel (204) |
| GET | `/api/me` | user | My profile |
| GET | `/api/me/registrations` | user | My registrations |
| GET | `/api/me/opportunities` | user | Opportunities I organize |

## Run locally

1. Create a Supabase project. In the SQL Editor, run `backend/schema-volunteer.sql`, then `backend/schema-security.sql`.
2. Backend:
   ```
   cd backend
   cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, SUPABASE_JWKS_URL, CORS_ORIGIN
   npm install
   npm run dev            # http://localhost:3000/health
   ```
3. Frontend (second terminal):
   ```
   cd frontend
   cp .env.example .env   # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
   npm install
   npm run dev            # http://localhost:5173
   ```

## Possible next steps
- Editing opportunities
- Email reminders before an event
- Organizer-confirmed attendance and volunteer hour totals