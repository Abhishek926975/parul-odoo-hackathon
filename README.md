# Traveloop

Traveloop is a full-stack travel planning application built for the Odoo hackathon sprint. It helps travelers create multi-city trips, build day-wise itineraries, track budgets, manage packing and notes, publish read-only share links, and browse public community trip plans.

## Features

- [x] Register, login, logout, JWT auth, profile updates
- [x] Trip CRUD with public share slugs
- [x] Stops, itinerary sections, and trip activities
- [x] Budget tracker with category and daily charts
- [x] Packing checklist with progress and reset
- [x] Notes and trip journal
- [x] City and activity search
- [x] Community feed and likes
- [x] Public itinerary sharing at `/share/:slug`
- [x] Admin analytics dashboard
- [x] Docker deployment config
- [x] Demo data script

## Tech Stack

React 18, Vite, TailwindCSS, React Router, Recharts, Lucide React, Axios, Node.js, Express, PostgreSQL, pg, JWT, bcrypt, Multer, Docker.

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run migrate
npm run demo
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

Demo logins after `npm run demo`:

- `user1@traveloop.com` / `demo1234`
- `user2@traveloop.com` / `demo1234`
- `admin@traveloop.com` / `demo1234`

## Docker

```bash
docker compose up --build
```

The compose setup starts PostgreSQL, migrates the API schema, runs the backend on `:5000`, and serves the frontend on `http://localhost:3000`.

## Project Structure

```text
backend/
  src/controllers     REST business logic
  src/routes          Express route modules
  src/db              schema, migration, seed, demo data
  src/middleware      auth, uploads, errors
  src/utils           helpers
frontend/
  src/components      layout and reusable UI
  src/context         auth, trips, toasts
  src/pages           application screens
  src/services        API client
  src/utils           formatters and constants
```

## Schema Overview

```text
users ──< trips ──< trip_stops
   │        │  ├──< itinerary_sections
   │        │  ├──< trip_activities >── activities
   │        │  ├──< packing_items
   │        │  ├──< trip_notes
   │        │  ├──< expenses
   │        │  └──< community_posts
   └──────────────< community_posts

cities powers search and featured destination cards.
```

## API Endpoints

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`, `POST /api/auth/upload-photo` |
| Trips | `GET/POST /api/trips`, `GET/PUT/DELETE /api/trips/:id`, `GET /api/trips/public/:slug` |
| Stops | `GET/POST /api/trips/:tripId/stops`, `PUT/DELETE /api/trips/:tripId/stops/:stopId` |
| Sections | `GET/POST /api/trips/:tripId/sections`, `PUT/DELETE /api/trips/:tripId/sections/:sectionId` |
| Activities | `GET /api/activities`, `GET /api/activities/featured`, `GET /api/activities/:id` |
| Trip Activities | `GET/POST /api/trips/:tripId/activities`, `PUT/DELETE /api/trips/:tripId/activities/:id` |
| Packing | `GET/POST /api/trips/:tripId/packing`, `PATCH/DELETE /api/trips/:tripId/packing/:itemId`, `POST /api/trips/:tripId/packing/reset` |
| Notes | `GET/POST /api/trips/:tripId/notes`, `PUT/DELETE /api/trips/:tripId/notes/:noteId` |
| Expenses | `GET/POST /api/trips/:tripId/expenses`, `PUT/DELETE /api/trips/:tripId/expenses/:expId` |
| Cities | `GET /api/cities`, `GET /api/cities/featured` |
| Community | `GET/POST /api/community`, `GET /api/community/:postId`, `PATCH /api/community/:postId/like` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/trips` |

## Screenshots

Add screenshots for the dashboard, itinerary builder, budget tracker, community feed, and admin dashboard before final submission.

## Team

Built as a hackathon-ready implementation of Traveloop: "Where every journey loops back to you."
