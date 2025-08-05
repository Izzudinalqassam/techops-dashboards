# TechOps Dashboard API Documentation

## Overview

The TechOps Dashboard API is a RESTful service built with Node.js and Express.js that provides endpoints for managing projects, deployments, users, and maintenance requests.

## Base URLs

- **Development**: `http://localhost:8081/api`
- **Production**: `https://api.yourdomain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-08-15T10:30:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  },
  "timestamp": "2024-08-15T10:30:00.000Z"
}
```

## Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

---

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@company.com",
      "name": "Admin User",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### POST /auth/logout

Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## User Management

### GET /users

Get all users (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "admin@company.com",
        "name": "Admin User",
        "role": "admin",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastLogin": "2024-08-15T09:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### GET /users/:id

Get user by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@company.com",
      "name": "Admin User",
      "role": "admin",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-08-15T09:15:00.000Z"
    }
  }
}
```

### POST /users

Create new user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "email": "engineer@company.com",
  "name": "John Engineer",
  "password": "securePassword123",
  "role": "engineer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 2,
      "email": "engineer@company.com",
      "name": "John Engineer",
      "role": "engineer",
      "isActive": true,
      "createdAt": "2024-08-15T10:30:00.000Z"
    }
  }
}
```

### PUT /users/:id

Update user (Admin only or own profile).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "John Senior Engineer",
  "role": "senior_engineer",
  "isActive": true
}
```

### DELETE /users/:id

Delete user (Admin only).

**Headers:** `Authorization: Bearer <token>`

---

## Project Management

### GET /projects

Get all projects.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `group_id` (optional): Filter by project group
- `search` (optional): Search by name or description

**Response:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "E-commerce Platform",
        "description": "Main e-commerce application",
        "status": "active",
        "repository_url": "https://github.com/company/ecommerce",
        "production_url": "https://shop.company.com",
        "staging_url": "https://staging-shop.company.com",
        "group": {
          "id": 1,
          "name": "Web Applications"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-08-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### GET /projects/:id

Get project by ID.

**Headers:** `Authorization: Bearer <token>`

### POST /projects

Create new project (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Mobile App",
  "description": "Company mobile application",
  "repository_url": "https://github.com/company/mobile-app",
  "production_url": "https://app.company.com",
  "staging_url": "https://staging-app.company.com",
  "group_id": 2,
  "status": "active"
}
```

### PUT /projects/:id

Update project (Admin only).

### DELETE /projects/:id

Delete project (Admin only).

---

## Deployment Management

### GET /deployments

Get all deployments.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `project_id` (optional): Filter by project
- `status` (optional): Filter by status
- `environment` (optional): Filter by environment
- `date_from` (optional): Filter from date (YYYY-MM-DD)
- `date_to` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "message": "Deployments retrieved successfully",
  "data": {
    "deployments": [
      {
        "id": 1,
        "project": {
          "id": 1,
          "name": "E-commerce Platform"
        },
        "version": "v2.1.0",
        "environment": "production",
        "status": "success",
        "deployedBy": {
          "id": 2,
          "name": "John Engineer"
        },
        "deployedAt": "2024-08-15T10:30:00.000Z",
        "duration": 180,
        "notes": "Bug fixes and performance improvements"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### GET /deployments/:id

Get deployment by ID.

### POST /deployments

Create new deployment.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "project_id": 1,
  "version": "v2.1.1",
  "environment": "staging",
  "notes": "Testing new features"
}
```

### PUT /deployments/:id

Update deployment status.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "success",
  "duration": 165,
  "notes": "Deployment completed successfully"
}
```

---

## Maintenance Requests

### GET /maintenance

Get all maintenance requests.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `project_id` (optional): Filter by project
- `assigned_to` (optional): Filter by assigned engineer

**Response:**
```json
{
  "success": true,
  "message": "Maintenance requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": 1,
        "title": "Database Performance Optimization",
        "description": "Optimize slow queries in user management module",
        "priority": "high",
        "status": "in_progress",
        "project": {
          "id": 1,
          "name": "E-commerce Platform"
        },
        "requestedBy": {
          "id": 1,
          "name": "Admin User"
        },
        "assignedTo": {
          "id": 2,
          "name": "John Engineer"
        },
        "createdAt": "2024-08-10T10:30:00.000Z",
        "updatedAt": "2024-08-15T10:30:00.000Z",
        "dueDate": "2024-08-20T23:59:59.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### GET /maintenance/:id

Get maintenance request by ID.

### POST /maintenance

Create new maintenance request.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Security Update",
  "description": "Apply latest security patches to all dependencies",
  "priority": "high",
  "project_id": 1,
  "assigned_to": 2,
  "due_date": "2024-08-25T23:59:59.000Z"
}
```

### PUT /maintenance/:id

Update maintenance request.

### DELETE /maintenance/:id

Delete maintenance request (Admin only).

---

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-08-15T10:30:00.000Z",
    "version": "1.0.0",
    "uptime": 86400,
    "database": "connected",
    "memory": {
      "used": "45.2 MB",
      "total": "512 MB"
    }
  }
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute per user

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "message": "Too many requests",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": "Rate limit exceeded. Try again in 60 seconds."
  },
  "retryAfter": 60
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Internal server error |

---

## SDK and Examples

### JavaScript/TypeScript Example

```typescript
class TechOpsAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      this.token = data.data.accessToken;
    }
    return data;
  }

  async getProjects() {
    const response = await fetch(`${this.baseURL}/projects`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    return response.json();
  }
}

// Usage
const api = new TechOpsAPI('http://localhost:8081/api');
await api.login('admin@company.com', 'admin123');
const projects = await api.getProjects();
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'

# Get projects
curl -X GET http://localhost:8081/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create deployment
curl -X POST http://localhost:8081/api/deployments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "version": "v2.1.1",
    "environment": "staging",
    "notes": "Testing new features"
  }'
```

---

## Changelog

### v1.0.0 (2024-08-15)
- Initial API release
- Authentication with JWT
- User management
- Project management
- Deployment tracking
- Maintenance request system
- Rate limiting
- Health check endpoint

---

**For more information, see the [main documentation](../README.md).**