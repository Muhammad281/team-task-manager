# Team Task Manager

A full stack web app where users can register, create teams, add members, and create, assign and manage tasks within teams.

## Features

- Secure register/login (Passport.js, bcrypt, HTTP-only session cookies)
- Sessions stored in PostgreSQL
- Create and manage teams, add/remove members by email
- Role-based access: only the team owner can update/delete the team or manage members
- Create, assign, update and delete tasks
- Search and filter tasks by assignee and status, per team
- Input validation (Joi) and parameterized SQL queries
- Responsive UI

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** Passport.js (local strategy), express-session, connect-pg-simple

## Project Structure

- `Backend/` : Express API (routes, middleware, db)
- `frontend/Team task/` : React app

## Local Setup

### Prerequisites

Node.js 20+, PostgreSQL 16+, Git

### 1. Clone

```
git clone https://github.com/Muhammad281/team-task-manager.git
cd team-task-manager
```

### 2. Database

```
psql -U postgres -c "CREATE DATABASE taskmanager;"
```

### 3. Backend

```
cd Backend
npm install
```

Create a file `Backend/.env`:

```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager
SESSION_SECRET=any-long-random-string
CLIENT_URL=http://localhost:5173
```

Create the tables and start the server:

```
npm run db:init
npm run dev
```

### 4. Frontend

```
cd "frontend/Team task"
npm install
npm run dev
```

Open http://localhost:5173

## API Routes

All routes except `/api/auth/register` and `/api/auth/login` require login.

### Auth

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |

### Teams

| Method | Route | Description |
|---|---|---|
| POST | /api/teams | Create team |
| GET | /api/teams | My teams |
| GET | /api/teams/:id | Team detail with members |
| PUT | /api/teams/:id | Rename team (owner) |
| DELETE | /api/teams/:id | Delete team (owner) |
| POST | /api/teams/:id/members | Add member by email (owner) |
| DELETE | /api/teams/:id/members/:userId | Remove member / leave |

### Tasks

| Method | Route | Description |
|---|---|---|
| POST | /api/tasks | Create task (can assign) |
| GET | /api/tasks | List; filters: team_id, assigned_to, status, search |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Deployment

Live link: _to be added_

## Security

- Passwords hashed with bcrypt
- HTTP-only session cookies
- Auth middleware on all non-auth routes
- Joi validation and parameterized queries
- Helmet security headers