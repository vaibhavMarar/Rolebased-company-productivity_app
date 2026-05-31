# Weekly Calendar & Productivity App

A full-stack web application for managing weekly tasks, meetings, and team productivity. It supports **role-based access** with separate experiences for **Administrators** and **Employees**, backed by a REST API, JWT authentication, and MongoDB.

Built as a placement / portfolio project so reviewers and peers can clone the repo, run it locally, and explore both admin and user flows end to end.

---

## For reviewers & peers (quick access)

If you only want to **see how the app works**, follow these steps.

### Option A — Use the live demo (if deployed)

> Replace the URL below with your Vercel (or other) deployment link after you deploy.

| | |
|---|---|
| **App URL** | `https://your-app.vercel.app` |
| **Health check** | `https://your-app.vercel.app/api/health` |

### Option B — Run locally (recommended for full exploration)

1. Clone the repository and open the project root (`Calendar_app` folder).
2. Complete [Local setup](#local-setup) (MongoDB + env + install).
3. Create the default admin account (one-time):

   ```bash
   npm run seed:admin --prefix backend
   ```

4. Start the app:

   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   npm run dev
   ```

5. Open **http://localhost:5173** in your browser.

### Demo login credentials

| Role | Username | Password | What you will see |
|------|----------|----------|-------------------|
| **Admin** | `admin` | `admin123` | Admin dashboard — user management, company analytics, assign tasks to employees, calendar view |
| **Employee (user)** | Register a new account | (your choice) | Employee dashboard — personal tasks, calendar, personal analytics |

> **Note:** The admin account is created by the seed script. Employee accounts are created via **Register** on the login screen (new users are always `employee` role).

### How to check Admin vs User side

| Goal | Steps |
|------|--------|
| **Admin side** | Login with `admin` / `admin123` → you are routed to **Admin Dashboard** automatically (`role: admin`). |
| **User (employee) side** | Log out → click **Register** → create any username/email/password → login → you are routed to **Employee Dashboard** (`role: employee`). |
| **Switch between roles** | Use **Logout**, then login with the other account. |

The app chooses the dashboard based on the JWT role after login — no separate URLs for admin vs user.

---

## Features overview

### Admin dashboard

- View and manage **all users** (create, edit, delete, assign roles)
- Create and assign **tasks** to specific employees or all employees
- **Weekly calendar** view for tasks and meetings
- **Company-wide analytics** (charts: productivity, employee performance, task distribution)
- Filter and search users and tasks
- Granular **permissions** for employees (e.g. can update/delete tasks)

### Employee dashboard

- View **tasks assigned to you**
- Update task status, use filters and search
- **Weekly calendar** for your schedule
- **Personal analytics** (completion trends, productivity charts)
- Read-only view of meetings/tasks relevant to your account

### Shared

- JWT-based **login / register / logout**
- Token stored in browser `localStorage`; sent as `Authorization: Bearer <token>`
- Responsive dark-themed UI (React + Vite)
- REST API under `/api/*`

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite, Recharts, Framer Motion |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas or local) |
| Auth | JSON Web Tokens (JWT), bcrypt |
| Deployment | Vercel (static frontend + serverless API) |

---

## Project structure

```
Calendar_app/
├── api/                 # Vercel serverless entry (exports Express app)
├── backend/
│   ├── config/          # MongoDB connection
│   ├── middleware/      # JWT auth, admin guard
│   ├── models/          # User, Task, Meeting
│   ├── routes/          # auth, tasks, meetings, users, analytics
│   └── scripts/         # seedAdmin.js, seedData.js
├── frontend/
│   └── src/
│       ├── components/  # Login, Register, AdminDashboard, EmployeeDashboard, ...
│       └── services/    # api.js (HTTP client)
├── vercel.json          # Deploy config
└── package.json         # Root scripts (dev, build)
```

---

## Local setup

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — either:
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier), or
  - Local MongoDB on `mongodb://localhost:27017`

### 1. Environment variables

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/calendar_app
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

For Atlas, set `MONGODB_URI` to your connection string (allow network access from your IP or `0.0.0.0/0` for development).

### 2. Install dependencies

From the `Calendar_app` directory:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 3. Seed data (optional)

**Default admin account** (required for admin demo):

```bash
npm run seed:admin --prefix backend
```

**Sample tasks & meetings** for the current week (optional):

```bash
npm run seed --prefix backend
```

### 4. Run development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API health | http://localhost:3000/api/health |

The frontend proxies `/api` requests to the backend during development (see `frontend/vite.config.js`).

**Run backend only:**

```bash
npm run dev:backend
```

**Run frontend only** (backend must be running on port 3000):

```bash
npm run dev:frontend
```

---

## API overview

All protected routes require header: `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (employee role by default) |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout (authenticated) |
| POST | `/api/auth/verify-token` | Verify token body |
| GET | `/api/tasks` | List tasks |
| GET/POST/PUT/DELETE | `/api/meetings`, `/api/users`, `/api/analytics/*` | CRUD & analytics |
| GET | `/api/health` | Health check |

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com) with root directory **`Calendar_app`** (if the repo root is one level above).
3. Set environment variables in Vercel:

   | Variable | Required |
   |----------|----------|
   | `MONGODB_URI` | Yes |
   | `JWT_SECRET` | Yes |
   | `JWT_EXPIRES_IN` | No (default `24h`) |

4. Deploy. After deploy, run the admin seed **once** against your Atlas database (from your machine):

   ```bash
   # Point MONGODB_URI in backend/.env to Atlas, then:
   npm run seed:admin --prefix backend
   ```

5. Share the live URL and demo credentials (`admin` / `admin123`) with reviewers.

Simulate production locally:

```bash
npm run vercel:dev
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot login as admin | Run `npm run seed:admin --prefix backend` and ensure MongoDB is running / Atlas URI is correct |
| API errors on frontend | Start backend on port 3000; use `npm run dev` from project root |
| `401` / logged out suddenly | Token expired (default 24h) or invalid `JWT_SECRET` — login again |
| Empty tasks for employee | Admin must assign tasks, or run `npm run seed --prefix backend` (global sample data) |
| CORS errors in dev | Use Vite proxy (`npm run dev:frontend`) or run full `npm run dev` |

---

## Security note (demo / academic use)

Default credentials (`admin` / `admin123`) are for **demonstration only**. Change the admin password and use a strong `JWT_SECRET` before any public production use. Do not commit `backend/.env` to GitHub.

---

## Authors

Add your team names, college, and project links here.

---

## License

This project is submitted for academic / placement review. Add a license (e.g. MIT) here if your institution requires it.
