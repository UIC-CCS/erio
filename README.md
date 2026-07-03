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

## Deploy to Ubuntu VPS (Nginx)

These instructions assume a fresh Ubuntu 22.04+ VPS with Node.js 18+ installed.

### 1. Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### 2. Clone the Repository

```bash
git clone https://github.com/UIC-CCS/erio.git /opt/erio
cd /opt/erio
```

### 3. Install Dependencies & Build Frontend

```bash
npm install --legacy-peer-deps
npm run build
cd server && npm install && cd ..
```

### 4. Set Up Environment Variables

Create `.env` in the `server/` directory:

```bash
cat > server/.env << 'EOF'
PORT=3001
JWT_SECRET=change_this_to_a_random_secret_key
FRONTEND_URL=http://your-domain.com
ADMIN_EMAIL=paung_230000001724@uic.edu.ph
ADMIN_PASSWORD=erio2026pass!
EOF
```

The SQLite database at `server/database/erio.db` will auto-create on first run.

### 5. Set Up a Systemd Service for the API

```bash
sudo tee /etc/systemd/system/erio-api.service << 'EOF'
[Unit]
Description=ERIO Dashboard API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/erio/server
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable erio-api
sudo systemctl start erio-api
sudo systemctl status erio-api
```

### 6. Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/erio << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates — install via Certbot or your provider
    ssl_certificate     /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    root /opt/erio/dist;
    index index.html;

    # SPA fallback — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/erio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. (Optional) SSL with Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 8. File Permissions

The SQLite database is written by the API process. Ensure `www-data` can write to the database directory:

```bash
sudo chown -R www-data:www-data /opt/erio/server/database
sudo chmod 755 /opt/erio/server/database
```

### 9. Restart & Verify

```bash
sudo systemctl restart erio-api
sudo systemctl restart nginx
```

Visit `https://your-domain.com`. The API health check is at `https://your-domain.com/health`.

### Updating

```bash
cd /opt/erio
git pull
npm install --legacy-peer-deps
npm run build
cd server && npm install && cd ..
sudo systemctl restart erio-api
```
