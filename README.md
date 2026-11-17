# Klyro

**A full-stack project management application with a Kanban task board.**

Klyro helps users organize projects, manage tasks, and track progress through a simple, interactive dashboard.

## Features

- User registration and login
- JWT-based authentication
- User-specific projects
- Project creation and management
- Kanban task board with three columns: To Do, In Progress, and Done
- Drag-and-drop task status updates
- Task creation, editing, and deletion
- Persistent PostgreSQL storage
- Backend and frontend automated tests
- API security headers, validation, and rate limiting

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | NestJS, TypeScript, Node.js |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | JWT, Argon2 |
| Testing | Jest, Vitest, React Testing Library |
| Security | Helmet, NestJS Throttler, class-validator |

## Project Structure

```text
Klyro/
├── api/                 # NestJS backend
│   ├── prisma/          # Prisma schema and migrations
│   ├── src/
│   │   ├── auth/        # Registration, login, JWT guard
│   │   ├── projects/    # Project endpoints
│   │   ├── tasks/       # Task endpoints
│   │   └── prisma/      # Prisma database service
│   └── package.json
├── web/                 # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── App.test.tsx
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 24 or a compatible version
- npm
- PostgreSQL database (Neon or local PostgreSQL)

### Backend Setup

```bash
cd api
npm install
```

Create an `api/.env` file:

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_long_random_secret"
```

Generate the Prisma client and apply existing migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the backend:

```bash
npm run start:dev
```

Backend URL: `http://localhost:3000`

### Frontend Setup

Open another terminal:

```bash
cd web
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Log in and receive a JWT |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | List authenticated user's projects |
| POST | `/projects` | Create a project |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects/:projectId/tasks` | List project tasks |
| POST | `/projects/:projectId/tasks` | Create a task |
| PATCH | `/projects/:projectId/tasks/:taskId` | Update a task |
| DELETE | `/projects/:projectId/tasks/:taskId` | Delete a task |

Project and task endpoints require an `Authorization: Bearer <token>` header.

## Testing

Run backend tests:

```bash
cd api
npm test -- --runInBand
```

Run frontend tests:

```bash
cd web
npm test
```

Check the builds:

```bash
cd api
npm run build

cd ../web
npm run build
npm run lint
```

## Security

Klyro uses:

- Argon2 password hashing
- JWT authentication
- Ownership checks on projects and tasks
- DTO validation and rejection of unexpected properties
- Helmet HTTP security headers
- API rate limiting

## Current Status

The core application is implemented and automated testing is underway. Production deployment and CI configuration are planned.

## License

License not yet specified.
