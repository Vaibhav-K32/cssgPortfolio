# VolunteerConnect — Progress Log

CS + Social Good (UNC) final project. Students find volunteer opportunities and sign up; organizers post opportunities and manage attendees.

**Deadline:** November 30, 2026
**Last updated:** November 18, 2026

---

## Quick status

| Part | Status |
|---|---|
| Repo + starter code | ✅ Done |
| Database (Supabase) | ✅ Connected (starter example table only) |
| Backend running locally | ✅ Done |
| Frontend running locally | ✅ Done |
| Backend deployed (Render) | ✅ Done |
| Frontend deployed (Vercel) | ✅ Done |
| Frontend ↔ backend connected in production (CORS) | ✅ Done |
| Login / sign-up | 🔄 Next (Lesson 7 Starter Code guide) |
| Real tables (opportunities, registrations) | ⬜ Not started |
| Volunteer + organizer features | ⬜ Not started |
| README + demo prep | ⬜ Not started |

**Live site:** https://cssg-portfolio.vercel.app
**Backend:** `https://<my-service>.onrender.com` (health check: `/health`)

---

## What I built (November 18)

1. Cloned my empty GitHub repo (`cssgPortfolio`) to `Desktop\Projects\cssgPortfolio`.
2. Copied the course starter (`CSSG_Education/Lesson 6 Bug Fixing/boilerPlateEducationTeam`) into the repo. It has a `frontend/` folder (React + Vite) and a `backend/` folder (Express).
3. Created a Supabase project (`Volunteer-Shifts`, East US) and ran `backend/schema.sql` to make the starter's example table.
4. Made `backend/.env` and `frontend/.env` from the `.env.example` files.
5. Ran both locally: backend on `localhost:3000`, frontend on `localhost:5173`. Adding an item in the form saves it to Supabase.
6. Committed and pushed to GitHub (checked that `.env` files were **not** uploaded).
7. Deployed the backend to Render (root directory `backend`, health check `/health`).
8. Deployed the frontend to Vercel (root directory `frontend`, `VITE_API_URL` = Render URL).
9. Set `CORS_ORIGIN` on Render to `http://localhost:5173,https://cssg-portfolio.vercel.app` so both local and live frontends work.

---

## Concepts I learned

- **Three-part app architecture.** Browser (React on Vercel) → API (Express on Render) → database (Supabase Postgres). The frontend only talks to my backend; the backend talks to the database.
- **Cloning a repo.** Downloads a GitHub repo to my computer as a folder connected to GitHub (the hidden `.git` folder).
- **Environment variables and `.env`.** Settings and secrets live outside the code. `.env` stays on my computer (blocked by `.gitignore`); `.env.example` is the shareable template. Render and Vercel get the same values typed into their dashboards.
- **Secret vs. publishable keys.** The Supabase secret key has full access and skips all security rules, so it only goes in the backend and is never shared or committed. The publishable key is safe in a browser.
- **Ports and localhost.** `localhost` means my own computer, and the port is which program answers (3000 = backend, 5173 = frontend). Two programs can't share one port.
- **Routes and 404s.** `localhost:3000` returned `{"error":"Not found"}` because the backend has no route there; `/health` and `/api/example` are real routes.
- **`npm install` / `npm run dev`.** Install a folder's dependencies, then start it in development mode. Each must run *inside* the folder with that `package.json`.
- **Git workflow.** `git status` (check what's changing) → `git add .` → `git commit -m "..."` → `git push`.
- **Deploying from a monorepo.** One repo holds two apps, so Render and Vercel each need a **root directory** (`backend` / `frontend`).
- **CORS.** The backend only accepts browser requests from websites listed in `CORS_ORIGIN`. A new frontend URL means updating that list.
- **Build-time variables.** `VITE_` values are baked into the frontend when Vercel builds it, so changing one requires a redeploy.

---

## Open decision: backend language

My project plan says **Python + FastAPI**, but the course starter (now deployed) is **Express (Node.js)**, and its frontend uses **TypeScript**, not plain JavaScript.

- **Keep Express + TypeScript (recommended unless the class requires FastAPI):** already working and deployed, and the Lesson 7 login + database-rules guide is written for exactly this setup.
- **Switch to FastAPI:** means rewriting the backend and redoing the Render setup, and the Lesson 7 guide's backend files won't apply.

→ Decide before starting Phase 2 work, then update the plan to match.

---

## What remains

The original plan put deployment in Phase 5, but it's already done, which frees up time at the end.

### Phase 1 — Frontend foundations (Nov 18–19)
- [ ] Understand the `frontend/src` folder structure
- [ ] Navigation bar
- [ ] Opportunity card component
- [ ] Homepage listing opportunities (mock data first)
- [ ] Opportunity detail page

### Phase 2 — Backend and database (Nov 20–21)
- [ ] Design tables: `profiles` (with a volunteer/organizer role), `opportunities` (title, description, category, location, start/end time, capacity, organizer), `registrations` (opportunity + user)
- [ ] Primary keys, foreign keys, and a **unique** rule on (opportunity, user) to block duplicate sign-ups
- [ ] REST endpoints for opportunities (list, detail, create, edit, delete)
- [ ] Frontend loads real opportunities from the backend

### Phase 3 — Login and registrations (Nov 22–23)
- [ ] Add login/sign-up (Lesson 7 Starter Code guide; turn off "Confirm email" in Supabase while testing)
- [ ] Row Level Security rules (users can only change their own data)
- [ ] Register for an opportunity
- [ ] Prevent duplicate registrations
- [ ] Enforce capacity safely on the server, even when two people grab the last spot at once
- [ ] Cancel a registration

### Phase 4 — Dashboards and organizer features (Nov 24–25)
- [ ] Volunteer dashboard: upcoming and past registrations
- [ ] Organizer permissions
- [ ] Create, edit, delete opportunities
- [ ] Attendee list (visible only to that opportunity's organizer)
- [ ] Search and filter opportunities

### Phase 5 — Production check (Nov 26–27)
- [x] Frontend on Vercel, backend on Render, CORS configured
- [ ] Add any new env variables from the login step to **Vercel** and **Render**, then redeploy
- [ ] Test login and database actions on the live site with two accounts

### Phase 6 — Testing and submission (Nov 28–30)
- [ ] Test main workflows (volunteer and organizer)
- [ ] Loading states and error messages
- [ ] Responsive styling (phone-sized screens)
- [ ] Rewrite README: what the app does, live link, architecture, how to run locally
- [ ] Prepare a short demo

---

## Next task

**Add login using the Lesson 7 Starter Code guide.**
1. In the `CSSG_Education` folder: `python -m http.server 8080`
2. Open `http://localhost:8080/lesson7--FINAL/` → **Starter Code** tab
3. Follow the steps in order, putting each file at the exact path shown
4. Test locally with two accounts before pushing

---

## How to run locally

Two terminals, both kept open:

```
cd C:\Users\komv\Desktop\Projects\cssgPortfolio\backend
npm run dev        # http://localhost:3000/health → {"ok":true}
```

```
cd C:\Users\komv\Desktop\Projects\cssgPortfolio\frontend
npm run dev        # http://localhost:5173
```

## Gotchas to remember

- Never commit `.env` or paste the secret key anywhere public. Run `git status` before every commit.
- Render's free tier sleeps after ~15 min idle; the first request then takes ~30 seconds. Open `/health` before a demo.
- Changed a `VITE_` variable on Vercel? Redeploy.
- CORS error on the live site? `CORS_ORIGIN` on Render must exactly match the Vercel URL (`https://`, no trailing `/`).
- Port already in use? Use a different number (e.g. `8080` instead of `8000`).
