# ERIO Dashboard — University International Office

A glassmorphism dashboard for the University International Office to track and visualize international partnerships, student exchanges, and engagement metrics. Data is served from a local SQLite database via an Express API.

## Features

- **Dashboard** — Partner counts, active agreements, student exchanges, events, engagement trends, recent activities
- **World Map** — Interactive map with partner university markers, clickable for details
- **Modals** — Partner universities list by region, mobility programmes, events
- **Admin Panel** — CRUD management for stats, partners, activities, mobility programmes, events
- **Glassmorphism UI** — Frosted-glass cards, warm beige/pink palette, organic shapes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Charts | Recharts |
| Maps | React Simple Maps |
| Icons | Lucide React |
| Backend | Node.js, Express |
| Database | SQLite (via sql.js — pure WASM, no native deps) |

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx
│   │   ├── WorldMap.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── PartnerUniversitiesModal.jsx
│   │   ├── MobilityProgrammeModal.jsx
│   │   ├── EventsModal.jsx
│   │   ├── RecentActivities.jsx
│   │   ├── EngagementChart.jsx
│   │   ├── StatsCard.jsx
│   │   ├── Header.jsx / OrganicShapes.jsx / PartnerDetails.jsx
│   │   └── admin/           # Admin panel pages
│   ├── services/api.js      # API client (talks to Express backend)
│   ├── lib/regionMapping.js # Country → region mapping
│   └── main.jsx / App.jsx   # Entry point & routing
├── server/
│   ├── server.js            # Express app
│   ├── config/database.js   # SQLite init, schema, seed data, query helpers
│   ├── routes/              # REST API route handlers
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── partners.js
│   │   ├── activities.js
│   │   ├── programOfferings.js
│   │   ├── mobilityProgrammes.js
│   │   ├── events.js
│   │   ├── websiteViews.js
│   │   └── facebook.js
│   └── database/
│       └── erio.db          # SQLite database (auto-generated)
└── package.json
```

## Getting Started

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### 2. Start the Backend

```bash
cd server
npm run dev
```

On first run, `server/database/erio.db` is automatically created with the schema and 76 seed partner universities. The API runs on `http://localhost:3001`.

### 3. Start the Frontend

In a separate terminal:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | — | Health check |
| `/api/auth/login` | POST | — | Admin login |
| `/api/auth/verify` | GET | JWT | Verify token |
| `/api/dashboard/stats` | GET | — | Get stats |
| `/api/dashboard/stats` | PUT | JWT | Update stats |
| `/api/partners` | GET | — | List partners |
| `/api/partners/:id` | GET | — | Get partner |
| `/api/partners` | POST | JWT | Create partner |
| `/api/partners/:id` | PUT | JWT | Update partner |
| `/api/partners/:id` | DELETE | JWT | Delete partner |
| `/api/activities` | GET | — | List activities |
| `/api/activities` | POST | JWT | Create activity |
| `/api/activities/:id` | PUT | JWT | Update activity |
| `/api/activities/:id` | DELETE | JWT | Delete activity |
| `/api/program-offerings` | GET | — | List program offerings |
| `/api/program-offerings/type/:type` | GET | — | Filter by type |
| `/api/program-offerings` | POST | JWT | Create offering |
| `/api/program-offerings/:id` | DELETE | JWT | Delete offering |
| `/api/mobility-programmes` | GET | — | List mobility programmes |
| `/api/mobility-programmes/count` | GET | — | Get count |
| `/api/mobility-programmes` | POST | JWT | Create |
| `/api/mobility-programmes/:id` | PUT | JWT | Update |
| `/api/mobility-programmes/:id` | DELETE | JWT | Delete |
| `/api/events` | GET | — | List events |
| `/api/events/count` | GET | — | Get count |
| `/api/events` | POST | JWT | Create |
| `/api/events/:id` | PUT | JWT | Update |
| `/api/events/:id` | DELETE | JWT | Delete |
| `/api/website-views/increment` | POST | — | Record a view |
| `/api/website-views/total` | GET | — | Get total unique views |
| `/api/facebook/posts` | GET | — | Fetch Facebook posts |

## Default Admin Login

- **Email:** `paung_230000001724@uic.edu.ph`
- **Password:** `erio2026pass!`

Configure via `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

## Database

The SQLite database is at `server/database/erio.db`. It contains 8 tables:

- `dashboard_stats` — 1 row with aggregate metrics
- `partner_universities` — 76 seed partner universities
- `program_offerings` — Program type breakdown
- `recent_activities` — Activity/news feed
- `admin_users` — Admin accounts (password hashed with bcrypt)
- `events` — Calendar events
- `mobility_programmes` — Student/faculty exchange programmes
- `website_views` — View tracking (session-based)

To reset, delete the `.db` file and restart the server.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `JWT_SECRET` | *(hardcoded dev secret)* | JWT signing key |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `ADMIN_EMAIL` | `paung_230000001724@uic.edu.ph` | Default admin |
| `ADMIN_PASSWORD` | `erio2026pass!` | Default password |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | — | For Facebook posts feature |
| `VITE_API_URL` | `http://localhost:3001/api` | API base URL (frontend) |

## Design

Glassmorphism with translucent cards, backdrop blur, warm beige/sand background, pink gradients, and organic decorative shapes. Colors are configured in `tailwind.config.js`.

## Build for Production

```bash
npm run build          # Frontend → dist/
cd server && npm start # Backend
```
