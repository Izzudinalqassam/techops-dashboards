# TechOps Dashboard - Automated Deployment Guide

This guide provides comprehensive instructions for deploying the TechOps Dashboard using automated deployment scripts.

## 🚀 Quick Start

### For Linux/macOS Users
```bash
# Make the script executable (if not already)
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### For Windows Users
```cmd
# Run the deployment script
deploy.bat
```

## 📋 Prerequisites

Before running the deployment scripts, ensure you have:

### Required Software
- **Docker Desktop** (latest version)
  - Download: https://www.docker.com/products/docker-desktop
  - Ensure Docker daemon is running
- **Docker Compose** (usually included with Docker Desktop)
- **curl** (for health checks)
  - Linux/macOS: Usually pre-installed
  - Windows: Available in Windows 10/11 or install separately

### Optional but Recommended
- **Make** (for additional management commands)
  - Linux: `sudo apt-get install make` or `sudo yum install make`
  - macOS: Install Xcode Command Line Tools
  - Windows: Install via Chocolatey `choco install make` or use WSL

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space
- **Ports**: 8080, 8081, 5433 should be available

## 🔧 Configuration

### Environment Files

The deployment scripts will validate the following environment files:

#### 1. Frontend Environment (`.env.production`)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8081
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_API_RETRY_DELAY=1000

# Authentication
VITE_JWT_SECRET=your_secure_jwt_secret_here
VITE_JWT_EXPIRES_IN=24h
VITE_REFRESH_TOKEN_EXPIRES_IN=7d

# Session
VITE_SESSION_TIMEOUT=30m
VITE_REMEMBER_ME_DURATION=30d
```

#### 2. Backend Environment (`backend/.env.production`)
```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dashboard
DB_USER=postgres
DB_PASSWORD=your_secure_db_password_here

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration - CHANGE THESE IN PRODUCTION
JWT_SECRET=your_very_secure_jwt_secret_here_64_chars_minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_here_64_chars_minimum
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=warn
LOG_FILE=logs/app.log
```

### 🔐 Security Configuration

**IMPORTANT**: Before deploying to production, update these security-critical values:

1. **JWT Secrets**: Generate secure random strings (64+ characters)
   ```bash
   # Generate secure JWT secret
   openssl rand -hex 32
   ```

2. **Database Password**: Use a strong, unique password

3. **CORS Origins**: Update to match your production domain

## 📖 Deployment Process

The automated deployment scripts perform the following steps:

### 1. Prerequisites Check ✅
- Verifies Docker and Docker Compose installation
- Checks if Docker daemon is running
- Validates curl availability for health checks
- Confirms required ports are available

### 2. Environment Validation 🔍
- Checks for required environment files
- Warns about default/insecure configuration values
- Validates file permissions

### 3. Container Management 🛑
- Stops any existing containers
- Removes orphaned containers
- Cleans up previous deployments

### 4. Build Process 🔨
- Builds Docker containers with no cache
- Compiles frontend assets
- Prepares backend services
- Optimizes for production

### 5. Service Startup 🚀
- Starts PostgreSQL database
- Initializes database schema
- Starts backend API server
- Starts frontend web server

### 6. Health Verification 🏥
- Waits for database readiness
- Performs backend API health checks
- Verifies frontend accessibility
- Confirms all services are operational

### 7. Status Report 📊
- Shows container status
- Displays access URLs
- Provides useful management commands

## 🌐 Access URLs

After successful deployment:

- **Frontend Application**: http://localhost:8080
- **Backend API**: http://localhost:8081/api
- **Health Check**: http://localhost:8081/api/health
- **Database**: localhost:5433 (PostgreSQL)

## 🛠️ Management Commands

### Using Docker Compose
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Access container shell
docker-compose exec app sh

# Check container status
docker-compose ps
```

### Using Make (if available)
```bash
# View logs
make logs

# Show status
make status

# Health check
make health

# Stop services
make down

# Restart services
make restart

# Complete reset
make reset
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
netstat -tulpn | grep :8080
# or
lsof -i :8080

# Kill process if safe to do so
kill -9 <PID>
```

#### 2. Docker Daemon Not Running
- **Windows/macOS**: Start Docker Desktop
- **Linux**: `sudo systemctl start docker`

#### 3. Permission Denied (Linux/macOS)
```bash
# Make script executable
chmod +x deploy.sh

# Or run with bash
bash deploy.sh
```

#### 4. Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 5. Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d dashboard
```

#### 6. Health Check Failures
```bash
# Check backend logs
docker-compose logs app

# Manual health check
curl http://localhost:8081/api/health
```

### Log Files

- **Deployment Log**: `deployment.log` (created by deployment script)
- **Application Logs**: `docker-compose logs`
- **Backend Logs**: `backend/logs/app.log` (inside container)

### Getting Help

1. **Check Logs**: Always start with `docker-compose logs -f`
2. **Verify Configuration**: Ensure environment files are correct
3. **Resource Check**: Verify sufficient RAM and disk space
4. **Network Check**: Confirm ports are available
5. **Clean Restart**: Try `make reset` or manual cleanup

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh  # or deploy.bat on Windows
```

### Database Backup
```bash
# Create backup
make backup
# or
docker-compose exec postgres pg_dump -U postgres dashboard > backup.sql
```

### Database Restore
```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres dashboard < backup.sql
```

## 🚨 Emergency Procedures

### Complete Reset
```bash
# Stop everything
docker-compose down -v --remove-orphans

# Clean Docker system
docker system prune -a

# Redeploy
./deploy.sh
```

### Force Stop All Containers
```bash
# Stop all Docker containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)
```

## 📈 Performance Monitoring

### Resource Usage
```bash
# Monitor container resources
docker stats

# Container status
make status
```

### Application Monitoring
```bash
# Health check
curl http://localhost:8081/api/health

# Response time test
time curl http://localhost:8080
```

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default credentials
2. **Secure JWT Secrets**: Use cryptographically secure random strings
3. **Network Security**: Configure firewall rules for production
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Backup Strategy**: Implement regular database backups
6. **Log Monitoring**: Monitor logs for suspicious activity

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](./README.md)
- [API Documentation](./docs/api.md)
- [Database Documentation](./docs/database.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

---

**Note**: This deployment is configured for development and testing. For production deployment, additional security hardening, SSL certificates, and infrastructure considerations are required.