# 🚀 TechOps Dashboard

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://docker.com/)

A comprehensive, modern dashboard application for managing technical operations, projects, deployments, users, and maintenance requests. Built with React 18, TypeScript, Node.js, and PostgreSQL.

## 📋 Table of Contents

- [🎯 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🐳 Quick Start (Docker)](#-quick-start-docker)
- [💻 Local Development](#-local-development)
- [🔧 Configuration](#-configuration)
- [📊 Database Schema](#-database-schema)
- [🔌 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🛠️ Development Tools](#️-development-tools)
- [📚 Additional Documentation](#-additional-documentation)
- [🤝 Contributing](#-contributing)
- [📞 Support](#-support)

## 🎯 Features

### 📈 Project Management
- **Comprehensive Project Tracking**: Create, view, edit, and manage projects with detailed metadata
- **Project Grouping**: Organize projects into logical groups for better management
- **Repository Integration**: Link projects to their source code repositories
- **Engineer Assignment**: Assign engineers to projects with role-based access
- **Bulk Operations**: Perform bulk actions across multiple projects

### 🚀 Deployment Management
- **Deployment Tracking**: Monitor and manage deployments across different environments
- **Status Monitoring**: Real-time deployment status tracking (pending, running, completed, failed)
- **Service Management**: Track multiple services within a single deployment
- **Deployment History**: Complete audit trail of all deployment activities
- **Engineer Attribution**: Track who performed each deployment

### 👥 User Management
- **Role-Based Access Control**: Admin, Engineer, and User roles with appropriate permissions
- **User Administration**: Complete user lifecycle management
- **Authentication & Authorization**: Secure JWT-based authentication with refresh tokens
- **Activity Tracking**: Monitor user login activity and system usage

### 🔧 Maintenance Request System
- **Request Management**: Create, track, and manage maintenance requests
- **Priority System**: Categorize requests by priority (Low, Medium, High, Critical)
- **Status Workflow**: Complete status tracking (Pending, In Progress, Completed, etc.)
- **Client Information**: Comprehensive client contact and company information
- **Work Logging**: Detailed work logs with time tracking
- **Engineer Assignment**: Assign maintenance requests to specific engineers

### 🎨 User Experience
- **Responsive Design**: Mobile-first, responsive interface that works on all devices
- **Modern UI Components**: Clean, intuitive interface built with Tailwind CSS
- **Real-time Notifications**: Comprehensive notification system for all operations
- **Bulk Operations**: Efficient bulk selection and operations across all modules
- **Export Functionality**: Export data to Excel/CSV formats
- **Dark/Light Theme Support**: User preference-based theming

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development with excellent IDE support
- **Vite** - Lightning-fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router v7** - Client-side routing with data loading
- **Axios** - Promise-based HTTP client for API communication
- **Lucide React** - Beautiful, customizable SVG icons

#### Backend
- **Node.js** - JavaScript runtime built on Chrome's V8 engine
- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Advanced open-source relational database
- **JWT** - JSON Web Tokens for secure authentication
- **bcryptjs** - Password hashing for security
- **Express Rate Limiting** - API protection against abuse
- **Helmet** - Security middleware for Express
- **CORS** - Cross-Origin Resource Sharing configuration

#### Infrastructure
- **Docker & Docker Compose** - Containerization for consistent deployments
- **PostgreSQL 15** - Production-ready database with advanced features
- **Redis** (optional) - Caching and session storage
- **Nginx** (production) - Reverse proxy and static file serving

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 8080    │    │   Port: 8081    │    │   Port: 5433    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   API Routes    │    │   Data Storage  │
│   (Vite Build)  │    │   (Express)     │    │   (Tables/Views)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🐳 Quick Start (Docker)

> **Recommended**: Docker setup avoids port conflicts and provides a consistent environment.

### Prerequisites
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (included with Docker Desktop)
- **4GB+ RAM** available for containers
- **Ports Available**: 8080, 8081, 5433, 6380

### 🚀 Automated Deployment (Recommended)

#### Option 1: Full Automated Deployment
```bash
# Linux/macOS
./deploy.sh

# Windows
deploy.bat
```

#### Option 2: Quick Deployment (Minimal Output)
```bash
# Linux/macOS
./quick-deploy.sh

# Windows
quick-deploy.bat
```

**Features of Automated Scripts:**
- ✅ Prerequisites validation
- ✅ Environment configuration check
- ✅ Automatic container management
- ✅ Health checks and verification
- ✅ Detailed logging and error handling
- ✅ Security warnings for default values
- ✅ Cross-platform compatibility

### 🛠️ Manual Deployment

If you prefer manual control:

```bash
# 1. Clone and navigate to the project
git clone <repository-url>
cd techops-dashboards

# 2. Start all services (PostgreSQL, Frontend, Backend)
docker-compose up --build -d

# 3. Verify services are running
docker-compose ps

# 4. Check application health
curl http://localhost:8081/api/health
```

### 🌐 Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:8080 | Main web application |
| **Backend API** | http://localhost:8081/api | REST API endpoints |
| **Health Check** | http://localhost:8081/api/health | API health status |
| **Database** | localhost:5433 | PostgreSQL (external access) |

### 🛑 Stop the Application

```bash
# Stop all services
docker-compose down

# Stop and remove all data (⚠️ destructive)
docker-compose down -v
```

### 🔧 Development with Docker

```bash
# Start development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build -d

# Access development servers
# Frontend: http://localhost:5173 (with hot reload)
# Backend: http://localhost:3001/api (with auto-restart)
```

### ⚡ Using Make Commands

```bash
# Production commands
make prod      # Build and start production
make down      # Stop all services
make logs      # View application logs
make health    # Check system health
make restart   # Restart all services

# Development commands
make dev       # Start development environment
make dev-down  # Stop development environment
make dev-logs  # View development logs

# Database commands
make db-only   # Start only database services
make db-shell  # Connect to PostgreSQL shell
make backup    # Backup database
make restore   # Restore database from backup

# Utility commands
make status    # Show container status
make clean     # Clean up containers and volumes
make reset     # Complete reset (clean + build + up)
```

📖 **For detailed Docker setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)**

---

## 💻 Local Development

> **Note**: Local development requires manual setup of PostgreSQL and Node.js. Docker is recommended for easier setup.

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** v15+ ([Download](https://postgresql.org/download/))
- **npm** or **yarn** package manager
- **Git** for version control

### 🛠️ Installation Steps

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd techops-dashboards

# Install all dependencies (frontend + backend)
npm run install:all
```

#### 2. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE dashboard;"

# Run database schema
psql -U postgres -d dashboard -f database/clean-schema.sql

# Verify database setup
psql -U postgres -d dashboard -c "\dt"
```

#### 3. Environment Configuration
```bash
# Backend configuration
cd backend
cp .env.production .env

# Edit .env with your local database settings
# Update DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
```

#### 4. Frontend Configuration
```bash
# Root directory configuration
cp .env.example .env

# Edit .env to set VITE_API_BASE_URL=http://localhost:3001
```

### 🚀 Development Commands

#### Start Full Development Environment
```bash
# Start both frontend and backend with hot reload
npm run dev

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
```

#### Individual Services
```bash
# Frontend only (React + Vite)
npm run dev:frontend

# Backend only (Node.js + Express)
npm run dev:backend
```

#### Build Commands
```bash
# Build frontend for production
npm run build:frontend

# Build backend (install production dependencies)
npm run build:backend

# Build everything
npm run build
```

#### Production Commands
```bash
# Start production servers
npm start

# Individual production servers
npm run start:frontend  # Serves built frontend on port 5173
npm run start:backend   # Starts backend on port 3001
```

### 🔧 Development Tools

#### Code Quality
```bash
# Lint code
npm run lint

# Preview production build
npm run preview
```

#### Database Management
```bash
# Connect to database
psql -U postgres -d dashboard

# Reset database (⚠️ destructive)
psql -U postgres -c "DROP DATABASE IF EXISTS dashboard;"
psql -U postgres -c "CREATE DATABASE dashboard;"
psql -U postgres -d dashboard -f database/clean-schema.sql
```

### 📁 Project Structure

```
techops-dashboards/
├── 📁 src/                    # Frontend source code
│   ├── 📁 components/         # React components
│   ├── 📁 contexts/           # React contexts
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 services/           # API services
│   ├── 📁 types/              # TypeScript type definitions
│   └── 📁 utils/              # Utility functions
├── 📁 backend/                # Backend source code
│   ├── 📁 controllers/        # Route controllers
│   ├── 📁 middleware/         # Express middleware
│   ├── 📁 models/             # Database models
│   ├── 📁 routes/             # API routes
│   └── 📁 utils/              # Backend utilities
├── 📁 database/               # Database files
│   ├── 📁 migrations/         # Database migrations
│   └── clean-schema.sql       # Complete database schema
├── 📁 docker/                 # Docker configuration
├── 📄 docker-compose.yml      # Production Docker setup
├── 📄 docker-compose.dev.yml  # Development Docker setup
├── 📄 Dockerfile              # Production container
├── 📄 Dockerfile.dev          # Development container
└── 📄 Makefile                # Development commands
```

---

## 🔧 Configuration

### Environment Variables

#### Backend Configuration (`backend/.env`)

```env
# Database Configuration
DB_HOST=localhost                    # Database host (postgres for Docker)
DB_PORT=5432                        # Database port (5432 internal, 5433 external)
DB_NAME=dashboard                   # Database name
DB_USER=postgres                    # Database username
DB_PASSWORD=your_secure_password    # Database password

# Server Configuration
PORT=3001                          # Backend server port
NODE_ENV=production                # Environment (development/production)

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_here           # JWT signing secret (256-bit)
JWT_EXPIRES_IN=24h                                     # Access token expiration
JWT_REFRESH_SECRET=your_super_secure_refresh_secret    # Refresh token secret
JWT_REFRESH_EXPIRES_IN=7d                             # Refresh token expiration

# API Security
RATE_LIMIT_WINDOW_MS=900000        # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window

# CORS Configuration
CORS_ORIGIN=http://localhost:8080  # Frontend URL (production)
# CORS_ORIGIN=http://localhost:5173  # Frontend URL (development)
```

#### Frontend Configuration (`.env`)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8081    # Backend API URL (production)
# VITE_API_BASE_URL=http://localhost:3001   # Backend API URL (development)

# Application Configuration
VITE_APP_NAME=TechOps Dashboard
VITE_APP_VERSION=1.0.0
```

### Security Best Practices

#### JWT Secrets Generation
```bash
# Generate secure JWT secrets (Linux/Mac)
openssl rand -base64 64

# Generate secure JWT secrets (Windows PowerShell)
[System.Web.Security.Membership]::GeneratePassword(64, 10)

# Generate secure JWT secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

#### Database Security
- Use strong, unique passwords for database users
- Limit database user permissions to only required operations
- Enable SSL/TLS for database connections in production
- Regular database backups and security updates

#### Application Security
- Change all default passwords and secrets
- Use HTTPS in production environments
- Configure proper CORS origins
- Enable rate limiting and monitoring
- Regular security audits and dependency updates

---

## 🔌 API Documentation

### Base URL
- **Production**: `http://localhost:8081/api`
- **Development**: `http://localhost:3001/api`
- **Health Check**: `GET /api/health`

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | User login with email/password | ❌ |
| `POST` | `/api/auth/register` | User registration | ❌ |
| `POST` | `/api/auth/refresh` | Refresh JWT access token | ✅ |
| `POST` | `/api/auth/logout` | Logout and invalidate tokens | ✅ |

#### Login Request Example
```json
{
  "email": "admin@company.com",
  "password": "your_password"
}
```

#### Login Response Example
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@company.com",
      "role": "admin",
      "first_name": "Admin",
      "last_name": "User"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Projects

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| `GET` | `/api/projects` | Get all projects with pagination | ✅ | ❌ |
| `GET` | `/api/projects/:id` | Get specific project details | ✅ | ❌ |
| `POST` | `/api/projects` | Create new project | ✅ | ✅ |
| `PUT` | `/api/projects/:id` | Update existing project | ✅ | ✅ |
| `DELETE` | `/api/projects/:id` | Delete project | ✅ | ✅ |
| `POST` | `/api/projects/bulk-delete` | Delete multiple projects | ✅ | ✅ |

### Deployments

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| `GET` | `/api/deployments` | Get all deployments | ✅ | ❌ |
| `GET` | `/api/deployments/:id` | Get specific deployment | ✅ | ❌ |
| `POST` | `/api/deployments` | Create new deployment | ✅ | ❌ |
| `PUT` | `/api/deployments/:id` | Update deployment status | ✅ | ❌ |
| `DELETE` | `/api/deployments/:id` | Delete deployment | ✅ | ✅ |

### Users (Admin Only)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| `GET` | `/api/users` | Get all users | ✅ | ✅ |
| `GET` | `/api/users/:id` | Get specific user | ✅ | ✅ |
| `POST` | `/api/users` | Create new user | ✅ | ✅ |
| `PUT` | `/api/users/:id` | Update user information | ✅ | ✅ |
| `DELETE` | `/api/users/:id` | Delete user | ✅ | ✅ |
| `POST` | `/api/users/bulk-delete` | Delete multiple users | ✅ | ✅ |

### Maintenance Requests

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| `GET` | `/api/maintenance` | Get maintenance requests | ✅ | ❌ |
| `GET` | `/api/maintenance/:id` | Get specific request | ✅ | ❌ |
| `POST` | `/api/maintenance` | Create maintenance request | ✅ | ❌ |
| `PUT` | `/api/maintenance/:id` | Update request | ✅ | ❌ |
| `DELETE` | `/api/maintenance/:id` | Delete request | ✅ | ✅ |
| `POST` | `/api/maintenance/:id/work-logs` | Add work log entry | ✅ | ❌ |

### Response Format

All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["Email is required", "Password must be at least 8 characters"]
  }
}
```

---

## 📊 Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'engineer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Projects Table
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    group_id INTEGER REFERENCES project_groups(id),
    repository_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    assigned_engineer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Deployments Table
```sql
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    deployment_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    deployed_by INTEGER REFERENCES users(id),
    notes TEXT,
    services TEXT,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Maintenance Requests Table
```sql
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold')),
    category VARCHAR(50),
    assigned_engineer_id INTEGER REFERENCES users(id),
    created_by_id INTEGER REFERENCES users(id) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(100) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_company VARCHAR(100) NOT NULL,
    scheduled_date TIMESTAMP,
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Features

- **Automatic Timestamps**: All tables have `created_at` and `updated_at` fields with triggers
- **Foreign Key Constraints**: Proper relationships between tables with cascading deletes
- **Check Constraints**: Data validation at the database level
- **Indexes**: Performance optimization for common queries
- **Views**: Pre-built views for common data access patterns
- **Triggers**: Automatic timestamp updates and audit logging

### Database Management

```bash
# Connect to database
psql -U postgres -d dashboard

# View all tables
\dt

# View table structure
\d users

# View indexes
\di

# View database size
SELECT pg_size_pretty(pg_database_size('dashboard'));
```

---

## 🚀 Deployment

### Production Deployment Options

#### Option 1: Docker Deployment (Recommended)

```bash
# 1. Clone repository on production server
git clone <repository-url>
cd techops-dashboards

# 2. Configure production environment
cp .env.example .env
cp backend/.env.production backend/.env
# Edit environment files with production values

# 3. Deploy with Docker
docker-compose up --build -d

# 4. Verify deployment
curl http://localhost:8081/api/health
```

#### Option 2: Manual Deployment

```bash
# 1. Setup production server
# Install Node.js 18+, PostgreSQL 15+, and PM2
npm install -g pm2

# 2. Clone and build
git clone <repository-url>
cd techops-dashboards
npm run install:all
npm run build

# 3. Setup database
psql -U postgres -c "CREATE DATABASE dashboard;"
psql -U postgres -d dashboard -f database/clean-schema.sql

# 4. Configure environment
cp backend/.env.production backend/.env
# Edit backend/.env with production database settings

# 5. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Production Checklist

#### Security
- [ ] Generate secure JWT secrets (256-bit)
- [ ] Use strong database passwords
- [ ] Configure HTTPS with SSL certificates
- [ ] Set up firewall rules (ports 80, 443, 5433)
- [ ] Enable database SSL connections
- [ ] Configure CORS for production domains only
- [ ] Set up rate limiting and monitoring

#### Performance
- [ ] Configure database connection pooling
- [ ] Set up Redis for session storage (optional)
- [ ] Configure Nginx reverse proxy
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure database backups

#### Monitoring
- [ ] Set up application logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure database monitoring
- [ ] Set up alerts for critical issues

### Environment-Specific Configuration

#### Production
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com
```

#### Staging
```env
NODE_ENV=staging
CORS_ORIGIN=https://staging.yourdomain.com
VITE_API_BASE_URL=https://api-staging.yourdomain.com
```

---

## 🛠️ Development Tools

### Code Quality Tools

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting (configured in IDE)
- **TypeScript**: Type checking and IntelliSense
- **Husky**: Git hooks for pre-commit checks

### Development Scripts

```bash
# Code quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run type-check        # TypeScript type checking

# Testing
npm run test              # Run tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report

# Database
npm run db:migrate        # Run database migrations
npm run db:seed           # Seed database with test data
npm run db:reset          # Reset database

# Utilities
npm run clean             # Clean build artifacts
npm run analyze           # Analyze bundle size
```

### Debugging

#### Backend Debugging
```bash
# Enable debug logging
DEBUG=app:* npm run dev:backend

# Database query logging
DB_LOGGING=true npm run dev:backend
```

#### Frontend Debugging
```bash
# Enable React DevTools
REACT_EDITOR=code npm run dev:frontend

# Bundle analysis
npm run build:analyze
```

---

## 📚 Additional Documentation

- **[Automated Deployment Guide](./DEPLOYMENT.md)** - Comprehensive automated deployment instructions
- **[Docker Setup Guide](./DOCKER_SETUP.md)** - Detailed Docker configuration and troubleshooting
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Complete production deployment guide
- **[API Documentation](./docs/api.md)** - Detailed API endpoint documentation
- **[Database Schema](./docs/database.md)** - Complete database documentation
- **[Contributing Guide](./CONTRIBUTING.md)** - Development workflow and guidelines
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (Admin, Engineer, User)
- **Password hashing** with bcryptjs (12 rounds)
- **Session management** with secure token storage
- **Automatic token refresh** for seamless user experience

### API Security
- **Rate limiting** to prevent API abuse
- **CORS protection** with configurable origins
- **Input validation** and sanitization
- **SQL injection prevention** with parameterized queries
- **XSS protection** with content security policies
- **Helmet.js** for security headers

### Data Protection
- **Encrypted database connections** (SSL/TLS)
- **Secure environment variable management**
- **Regular security audits** and dependency updates
- **Data backup** and recovery procedures
- **GDPR compliance** considerations

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Set up development environment** using Docker or local setup
3. **Make changes** following the coding standards
4. **Write tests** for new functionality
5. **Run quality checks** (lint, type-check, test)
6. **Submit a pull request** with detailed description

### Coding Standards

- **TypeScript** for type safety
- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **Conventional commits** for clear history
- **Component-driven development** for frontend
- **RESTful API design** for backend

### Testing Guidelines

- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **Component tests** for React components
- **E2E tests** for critical user flows
- **Minimum 80% code coverage**

---

## 📞 Support

### Getting Help

1. **Check the documentation** - Most common issues are covered
2. **Search existing issues** - Someone might have faced the same problem
3. **Check application logs** - Look for error details and stack traces
4. **Verify configuration** - Ensure environment variables are correct
5. **Test API endpoints** - Use tools like Postman or curl

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Test connection
psql -h localhost -p 5433 -U postgres -d dashboard
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### API Authentication Issues
```bash
# Check JWT configuration
echo $JWT_SECRET

# Test login endpoint
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

### Performance Monitoring

- **Application metrics**: Response times, error rates, throughput
- **Database metrics**: Connection pool, query performance, locks
- **System metrics**: CPU, memory, disk usage
- **User metrics**: Active users, feature usage, conversion rates

### Maintenance

- **Regular updates**: Dependencies, security patches
- **Database maintenance**: Vacuum, reindex, analyze
- **Log rotation**: Prevent disk space issues
- **Backup verification**: Test restore procedures
- **Security audits**: Regular vulnerability assessments

---

## 📄 License

This project is proprietary software. All rights reserved.

**Copyright © 2024 TechOps Dashboard. All rights reserved.**

---

## 🎯 Project Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: August 2024
- **Maintainer**: TechOps Team

### Roadmap

- [ ] **v1.1**: Advanced reporting and analytics
- [ ] **v1.2**: Mobile application
- [ ] **v1.3**: Integration with external tools
- [ ] **v2.0**: Microservices architecture

---

**Built with ❤️ by the TechOps Team**
