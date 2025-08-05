# TechOps Dashboard Troubleshooting Guide

## Common Issues and Solutions

### 🐳 Docker Issues

#### Issue: Container fails to start

**Symptoms:**
- `docker-compose up` fails
- Container exits immediately
- "Port already in use" errors

**Solutions:**

1. **Check port conflicts:**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :8080
   netstat -tulpn | grep :8081
   netstat -tulpn | grep :5433
   
   # Kill processes using the ports (if safe)
   sudo kill -9 $(lsof -ti:8080)
   ```

2. **Clean Docker environment:**
   ```bash
   # Stop all containers
   docker-compose down
   
   # Remove containers and volumes
   docker-compose down -v
   
   # Clean Docker system
   docker system prune -f
   
   # Rebuild and start
   docker-compose up --build
   ```

3. **Check Docker logs:**
   ```bash
   # View container logs
   docker-compose logs app
   docker-compose logs postgres
   
   # Follow logs in real-time
   docker-compose logs -f app
   ```

#### Issue: Database connection refused

**Symptoms:**
- "Connection refused" errors
- "Database does not exist" errors
- Application can't connect to PostgreSQL

**Solutions:**

1. **Verify database container:**
   ```bash
   # Check container status
   docker-compose ps postgres
   
   # Check database logs
   docker-compose logs postgres
   
   # Test database connection
   docker-compose exec postgres psql -U postgres -d dashboard -c "SELECT 1;"
   ```

2. **Reset database:**
   ```bash
   # Stop containers
   docker-compose down
   
   # Remove database volume
   docker volume rm techops-dashboards_postgres_data
   
   # Restart with fresh database
   docker-compose up --build
   ```

3. **Check environment variables:**
   ```bash
   # Verify database configuration
   docker-compose exec app env | grep DB_
   ```

---

### 🌐 Frontend Issues

#### Issue: Frontend not loading or showing blank page

**Symptoms:**
- White/blank page in browser
- Console errors about failed to fetch
- "Cannot GET /" errors

**Solutions:**

1. **Check frontend build:**
   ```bash
   # Rebuild frontend
   npm run build:frontend
   
   # Check build output
   ls -la dist/
   ```

2. **Verify API connection:**
   ```bash
   # Test API endpoint
   curl http://localhost:8081/api/health
   
   # Check frontend environment
   cat .env
   ```

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache and cookies
   - Try incognito/private mode

#### Issue: API calls failing with CORS errors

**Symptoms:**
- CORS policy errors in browser console
- "Access-Control-Allow-Origin" errors
- API requests blocked by browser

**Solutions:**

1. **Check CORS configuration:**
   ```bash
   # Verify backend CORS settings
   grep -r "CORS_ORIGIN" backend/
   
   # Check environment variables
   echo $CORS_ORIGIN
   ```

2. **Update CORS settings:**
   ```env
   # In backend/.env
   CORS_ORIGIN=http://localhost:8080,http://localhost:5173
   ```

3. **Restart backend:**
   ```bash
   # Restart backend container
   docker-compose restart app
   ```

---

### 🔐 Authentication Issues

#### Issue: Login fails with "Invalid credentials"

**Symptoms:**
- Cannot login with admin credentials
- "Authentication failed" errors
- JWT token errors

**Solutions:**

1. **Verify default credentials:**
   ```bash
   # Check if admin user exists
   docker-compose exec postgres psql -U postgres -d dashboard -c "SELECT email, name, role FROM users WHERE role = 'admin';"
   ```

2. **Reset admin password:**
   ```sql
   -- Connect to database
   docker-compose exec postgres psql -U postgres -d dashboard
   
   -- Update admin password (bcrypt hash for 'admin123')
   UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJflHQrxG' WHERE email = 'admin@company.com';
   ```

3. **Check JWT configuration:**
   ```bash
   # Verify JWT secret is set
   docker-compose exec app env | grep JWT_SECRET
   
   # Generate new JWT secret if needed
   openssl rand -base64 64
   ```

#### Issue: Token expires too quickly

**Solutions:**

1. **Adjust token expiration:**
   ```env
   # In backend/.env
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

2. **Implement token refresh:**
   - Frontend should automatically refresh tokens
   - Check browser network tab for refresh requests

---

### 💾 Database Issues

#### Issue: Database schema not created

**Symptoms:**
- "Table does not exist" errors
- Empty database
- Migration errors

**Solutions:**

1. **Manually run schema:**
   ```bash
   # Copy schema to container
   docker cp database/clean-schema.sql techops-app:/tmp/
   
   # Run schema
   docker-compose exec postgres psql -U postgres -d dashboard -f /tmp/clean-schema.sql
   ```

2. **Check schema file:**
   ```bash
   # Verify schema file exists
   ls -la database/clean-schema.sql
   
   # Check file content
   head -20 database/clean-schema.sql
   ```

#### Issue: Database performance problems

**Symptoms:**
- Slow query responses
- High CPU usage
- Connection timeouts

**Solutions:**

1. **Check database stats:**
   ```sql
   -- Connect to database
   docker-compose exec postgres psql -U postgres -d dashboard
   
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check slow queries
   SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```

2. **Optimize database:**
   ```sql
   -- Analyze tables
   ANALYZE;
   
   -- Vacuum tables
   VACUUM ANALYZE;
   
   -- Reindex if needed
   REINDEX DATABASE dashboard;
   ```

---

### 🚀 Performance Issues

#### Issue: Slow application response

**Symptoms:**
- Long loading times
- Timeouts
- High memory usage

**Solutions:**

1. **Check resource usage:**
   ```bash
   # Monitor Docker containers
   docker stats
   
   # Check system resources
   htop
   free -h
   df -h
   ```

2. **Optimize application:**
   ```bash
   # Enable production mode
   export NODE_ENV=production
   
   # Build optimized frontend
   npm run build
   
   # Use PM2 for backend
   pm2 start backend/app.js --name techops-api
   ```

3. **Database optimization:**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_deployments_project_id ON deployments(project_id);
   CREATE INDEX CONCURRENTLY idx_maintenance_status ON maintenance_requests(status);
   ```

---

### 🔧 Development Issues

#### Issue: Hot reload not working

**Symptoms:**
- Changes not reflected in browser
- Need to manually refresh
- Vite/React not updating

**Solutions:**

1. **Check development server:**
   ```bash
   # Restart development server
   npm run dev:frontend
   
   # Check if files are being watched
   npm run dev -- --debug
   ```

2. **File system issues:**
   ```bash
   # Increase file watchers (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

#### Issue: TypeScript errors

**Symptoms:**
- Build fails with TS errors
- Type checking errors
- Import/export issues

**Solutions:**

1. **Check TypeScript configuration:**
   ```bash
   # Run type checking
   npm run type-check
   
   # Check tsconfig.json
   cat tsconfig.json
   ```

2. **Fix common issues:**
   ```bash
   # Clear TypeScript cache
   rm -rf node_modules/.cache
   
   # Reinstall dependencies
   npm install
   
   # Update TypeScript
   npm update typescript
   ```

---

### 🌍 Environment Issues

#### Issue: Environment variables not loading

**Symptoms:**
- Configuration not applied
- Default values being used
- "undefined" in logs

**Solutions:**

1. **Check environment files:**
   ```bash
   # Verify files exist
   ls -la .env*
   ls -la backend/.env*
   
   # Check file content (without secrets)
   grep -v "SECRET\|PASSWORD" .env
   ```

2. **Verify loading:**
   ```bash
   # Check if variables are loaded
   docker-compose exec app env | grep -E "DB_|JWT_|CORS_"
   
   # Test specific variable
   docker-compose exec app node -e "console.log(process.env.DB_HOST)"
   ```

3. **Fix common issues:**
   ```bash
   # Ensure no spaces around = in .env files
   # Correct: DB_HOST=localhost
   # Wrong:   DB_HOST = localhost
   
   # Restart containers after env changes
   docker-compose down && docker-compose up
   ```

---

## Debugging Tools

### Backend Debugging

```bash
# Enable debug logging
DEBUG=app:* npm run dev:backend

# Database query logging
DB_LOGGING=true npm run dev:backend

# Node.js debugging
node --inspect backend/app.js
```

### Frontend Debugging

```bash
# React DevTools
# Install browser extension

# Vite debugging
npm run dev -- --debug

# Bundle analysis
npm run build:analyze
```

### Database Debugging

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check locks
SELECT * FROM pg_locks WHERE NOT granted;
```

---

## Log Analysis

### Application Logs

```bash
# Docker logs
docker-compose logs -f app
docker-compose logs --tail=100 app

# Filter logs
docker-compose logs app | grep ERROR
docker-compose logs app | grep -i "database"

# Save logs to file
docker-compose logs app > app.log 2>&1
```

### Database Logs

```bash
# PostgreSQL logs
docker-compose logs postgres

# Query logs (if enabled)
docker-compose exec postgres tail -f /var/log/postgresql/postgresql-*.log
```

### System Logs

```bash
# System logs (Linux)
sudo journalctl -u docker
sudo journalctl -f

# Check disk space
df -h
du -sh /var/lib/docker
```

---

## Performance Monitoring

### Application Metrics

```bash
# Monitor containers
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Memory usage
docker-compose exec app node -e "console.log(process.memoryUsage())"

# Response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8081/api/health
```

### Database Metrics

```sql
-- Connection stats
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes;
```

---

## Emergency Procedures

### Complete Reset

```bash
# Stop everything
docker-compose down -v

# Remove all containers and images
docker system prune -a

# Remove node_modules
rm -rf node_modules backend/node_modules

# Fresh install
npm run install:all
docker-compose up --build
```

### Backup and Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres dashboard > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres dashboard < backup.sql

# Backup volumes
docker run --rm -v techops-dashboards_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Health Checks

```bash
# Quick health check script
#!/bin/bash
echo "=== TechOps Dashboard Health Check ==="

# Check containers
echo "Containers:"
docker-compose ps

# Check API
echo "\nAPI Health:"
curl -s http://localhost:8081/api/health | jq '.data.status' || echo "API not responding"

# Check database
echo "\nDatabase:"
docker-compose exec postgres psql -U postgres -d dashboard -c "SELECT 1;" > /dev/null && echo "Database OK" || echo "Database ERROR"

# Check frontend
echo "\nFrontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200" && echo "Frontend OK" || echo "Frontend ERROR"
```

---

## Getting Additional Help

1. **Check the logs first** - Most issues are revealed in the logs
2. **Search existing issues** - Someone might have faced the same problem
3. **Verify configuration** - Double-check environment variables and settings
4. **Test components individually** - Isolate the problem to specific components
5. **Use debugging tools** - Enable verbose logging and debugging modes

### Useful Commands Reference

```bash
# Docker
docker-compose ps                    # Check container status
docker-compose logs -f app           # Follow application logs
docker-compose exec app bash         # Access container shell
docker system df                      # Check Docker disk usage

# Database
psql -h localhost -p 5433 -U postgres -d dashboard  # Connect to database
\dt                                   # List tables
\d users                             # Describe table structure

# Application
npm run dev                          # Start development mode
npm run build                        # Build for production
npm run lint                         # Check code quality
npm test                             # Run tests

# System
netstat -tulpn | grep :8080         # Check port usage
htop                                 # Monitor system resources
journalctl -f                        # Follow system logs
```

---

**For more help, refer to the [main documentation](../README.md) or [API documentation](./api.md).**