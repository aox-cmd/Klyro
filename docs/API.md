# Klyro API Reference

Base URL (development): `http://localhost:3000`

## Authentication

### Register

`POST /auth/register`

Example request:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

### Login

`POST /auth/login`

Example request:

```json
{
  "email": "test@example.com",
  "password": "StrongPassword123!"
}
```

Successful response:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

## Authorization

Protected endpoints require:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

A missing, invalid, or expired token results in HTTP 401.

Users can only access projects they own and tasks belonging to those projects.

## Projects

### List projects

`GET /projects`

### Create project

`POST /projects`

Example body:

```json
{
  "name": "Portfolio Website",
  "description": "My personal portfolio project"
}
```

## Tasks

### List project tasks

`GET /projects/1/tasks`

### Create task

`POST /projects/1/tasks`

```json
{
  "title": "Design homepage",
  "description": "Create the homepage layout"
}
```

New tasks start with status `TODO`.

### Update task

`PATCH /projects/1/tasks/10`

```json
{
  "status": "IN_PROGRESS"
}
```

Supported task statuses:

- `TODO`
- `IN_PROGRESS`
- `DONE`

Task titles must contain between 3 and 150 characters.

### Delete task

`DELETE /projects/1/tasks/10`

## Common HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required or invalid |
| 404 | Resource not found or inaccessible |
| 409 | Conflict, where applicable |
| 429 | Rate limit exceeded |

## Notes

The API uses JSON requests and responses. Project ownership is derived from the authenticated JWT, not from client-supplied ownership fields.
