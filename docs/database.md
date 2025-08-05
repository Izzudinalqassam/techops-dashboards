# TechOps Dashboard Database Documentation

## Overview

The TechOps Dashboard uses PostgreSQL 15 as its primary database. The database schema is designed to support project management, deployment tracking, user management, and maintenance request workflows.

## Database Configuration

### Connection Settings

```env
# Development
DB_HOST=localhost
DB_PORT=5433
DB_NAME=dashboard
DB_USER=postgres
DB_PASSWORD=postgres123
DB_SSL=false

# Production
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=dashboard_prod
DB_USER=dashboard_user
DB_PASSWORD=secure_password
DB_SSL=true
```

### Connection Pool Settings

```javascript
// Backend configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if no connection
});
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   project_groups│    │     projects    │    │   deployments   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄──┐│ id (PK)         │◄──┐│ id (PK)         │
│ name            │   └│ group_id (FK)   │   └│ project_id (FK) │
│ description     │    │ name            │    │ version         │
│ created_at      │    │ description     │    │ environment     │
│ updated_at      │    │ repository_url  │    │ status          │
└─────────────────┘    │ production_url  │    │ deployed_by (FK)│
                       │ staging_url     │    │ deployed_at     │
┌─────────────────┐    │ status          │    │ duration        │
│     users       │    │ created_at      │    │ notes           │
├─────────────────┤    │ updated_at      │    │ created_at      │
│ id (PK)         │◄──┐└─────────────────┘    │ updated_at      │
│ email           │   │                       └─────────────────┘
│ name            │   │
│ password_hash   │   │ ┌─────────────────────────────────────────┐
│ role            │   │ │        maintenance_requests             │
│ is_active       │   │ ├─────────────────────────────────────────┤
│ last_login      │   │ │ id (PK)                                 │
│ created_at      │   └─│ project_id (FK)                         │
│ updated_at      │   ┌─│ requested_by (FK)                       │
└─────────────────┘   └─│ assigned_to (FK)                        │
                         │ title                                   │
                         │ description                             │
                         │ priority                                │
                         │ status                                  │
                         │ due_date                                │
                         │ created_at                              │
                         │ updated_at                              │
                         └─────────────────────────────────────────┘
```

---

## Table Definitions

### 1. Users Table

Stores user account information and authentication data.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key, auto-incrementing
- `email`: Unique email address for login
- `name`: User's display name
- `password_hash`: bcrypt hashed password
- `role`: User role (`admin`, `engineer`, `user`)
- `is_active`: Account status flag
- `last_login`: Timestamp of last successful login
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Email must be unique
- Role must be one of: `admin`, `engineer`, `user`
- Password hash is required

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### 2. Project Groups Table

Organizes projects into logical groups.

```sql
CREATE TABLE project_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key, auto-incrementing
- `name`: Group name (e.g., "Web Applications", "Mobile Apps")
- `description`: Optional group description
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### 3. Projects Table

Stores project information and configuration.

```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES project_groups(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    repository_url VARCHAR(500),
    production_url VARCHAR(500),
    staging_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key, auto-incrementing
- `group_id`: Foreign key to project_groups table
- `name`: Project name
- `description`: Project description
- `repository_url`: Git repository URL
- `production_url`: Production environment URL
- `staging_url`: Staging environment URL
- `status`: Project status (`active`, `inactive`, `archived`)
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Status must be one of: `active`, `inactive`, `archived`

**Indexes:**
```sql
CREATE INDEX idx_projects_group_id ON projects(group_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_name ON projects(name);
```

### 4. Deployments Table

Tracks deployment history and status.

```sql
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    deployed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    deployed_at TIMESTAMP,
    duration INTEGER, -- in seconds
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key, auto-incrementing
- `project_id`: Foreign key to projects table
- `version`: Deployment version (e.g., "v2.1.0")
- `environment`: Target environment (`production`, `staging`, `development`)
- `status`: Deployment status (`pending`, `in_progress`, `success`, `failed`, `rolled_back`)
- `deployed_by`: Foreign key to users table (who deployed)
- `deployed_at`: Actual deployment timestamp
- `duration`: Deployment duration in seconds
- `notes`: Deployment notes or comments
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Environment must be one of: `production`, `staging`, `development`
- Status must be one of: `pending`, `in_progress`, `success`, `failed`, `rolled_back`

**Indexes:**
```sql
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at);
CREATE INDEX idx_deployments_deployed_by ON deployments(deployed_by);
```

### 5. Maintenance Requests Table

Manages maintenance and support requests.

```sql
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Primary key, auto-incrementing
- `project_id`: Foreign key to projects table (optional)
- `requested_by`: Foreign key to users table (who requested)
- `assigned_to`: Foreign key to users table (who is assigned)
- `title`: Request title/summary
- `description`: Detailed description
- `priority`: Request priority (`low`, `medium`, `high`, `critical`)
- `status`: Request status (`open`, `in_progress`, `completed`, `cancelled`)
- `due_date`: Optional due date
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- Priority must be one of: `low`, `medium`, `high`, `critical`
- Status must be one of: `open`, `in_progress`, `completed`, `cancelled`

**Indexes:**
```sql
CREATE INDEX idx_maintenance_project_id ON maintenance_requests(project_id);
CREATE INDEX idx_maintenance_requested_by ON maintenance_requests(requested_by);
CREATE INDEX idx_maintenance_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_due_date ON maintenance_requests(due_date);
```

### 6. Maintenance Status History Table

Tracks status changes for maintenance requests.

```sql
CREATE TABLE maintenance_status_history (
    id SERIAL PRIMARY KEY,
    maintenance_request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_maintenance_history_request_id ON maintenance_status_history(maintenance_request_id);
CREATE INDEX idx_maintenance_history_changed_by ON maintenance_status_history(changed_by);
```

### 7. Maintenance Work Logs Table

Tracks work performed on maintenance requests.

```sql
CREATE TABLE maintenance_work_logs (
    id SERIAL PRIMARY KEY,
    maintenance_request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_description TEXT NOT NULL,
    hours_spent DECIMAL(5,2),
    work_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_work_logs_request_id ON maintenance_work_logs(maintenance_request_id);
CREATE INDEX idx_work_logs_user_id ON maintenance_work_logs(user_id);
CREATE INDEX idx_work_logs_work_date ON maintenance_work_logs(work_date);
```

---

## Database Views

### Engineers View

Simplifies common queries for engineer-related data.

```sql
CREATE VIEW engineers_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.last_login,
    COUNT(DISTINCT mr.id) as assigned_requests,
    COUNT(DISTINCT d.id) as total_deployments
FROM users u
LEFT JOIN maintenance_requests mr ON u.id = mr.assigned_to
LEFT JOIN deployments d ON u.id = d.deployed_by
WHERE u.role IN ('engineer', 'admin')
GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.last_login;
```

### Project Summary View

Provides project statistics and recent activity.

```sql
CREATE VIEW project_summary_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    pg.name as group_name,
    COUNT(DISTINCT d.id) as total_deployments,
    COUNT(DISTINCT mr.id) as maintenance_requests,
    MAX(d.deployed_at) as last_deployment,
    COUNT(DISTINCT CASE WHEN d.status = 'success' THEN d.id END) as successful_deployments,
    COUNT(DISTINCT CASE WHEN mr.status = 'open' THEN mr.id END) as open_requests
FROM projects p
LEFT JOIN project_groups pg ON p.group_id = pg.id
LEFT JOIN deployments d ON p.id = d.project_id
LEFT JOIN maintenance_requests mr ON p.id = mr.project_id
GROUP BY p.id, p.name, p.description, p.status, pg.name;
```

---

## Database Triggers

### Update Timestamp Triggers

Automatically update `updated_at` columns when records are modified.

```sql
-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at 
    BEFORE UPDATE ON deployments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at 
    BEFORE UPDATE ON maintenance_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_groups_updated_at 
    BEFORE UPDATE ON project_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Maintenance Status History Trigger

Automatically log status changes for maintenance requests.

```sql
CREATE OR REPLACE FUNCTION log_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO maintenance_status_history (
            maintenance_request_id,
            old_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.assigned_to, -- Assuming the assigned person made the change
            'Status changed automatically'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER maintenance_status_change_trigger
    AFTER UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION log_maintenance_status_change();
```

---

## Sample Data

### Default Admin User

```sql
-- Password: admin123 (bcrypt hashed)
INSERT INTO users (email, name, password_hash, role) VALUES (
    'admin@company.com',
    'System Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJflHQrxG',
    'admin'
);
```

### Sample Project Group and Project

```sql
-- Project group
INSERT INTO project_groups (name, description) VALUES (
    'Web Applications',
    'Customer-facing web applications and services'
);

-- Sample project
INSERT INTO projects (group_id, name, description, repository_url, production_url, staging_url) VALUES (
    1,
    'E-commerce Platform',
    'Main e-commerce website and API',
    'https://github.com/company/ecommerce',
    'https://shop.company.com',
    'https://staging-shop.company.com'
);
```

### Sample Maintenance Request

```sql
INSERT INTO maintenance_requests (
    project_id, 
    requested_by, 
    title, 
    description, 
    priority, 
    due_date
) VALUES (
    1,
    1,
    'Database Performance Optimization',
    'Optimize slow queries in the user management module to improve page load times.',
    'high',
    CURRENT_DATE + INTERVAL '7 days'
);
```

---

## Database Maintenance

### Regular Maintenance Tasks

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE dashboard;

-- Update table statistics
ANALYZE users;
ANALYZE projects;
ANALYZE deployments;
ANALYZE maintenance_requests;
```

### Performance Monitoring

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    indexrelname,
    relname,
    idx_tup_read,
    idx_tup_fetch,
    idx_tup_read::float / GREATEST(idx_tup_fetch, 1) as ratio
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Check slow queries (requires pg_stat_statements extension)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Backup and Recovery

```bash
# Create backup
pg_dump -h localhost -p 5433 -U postgres -d dashboard > backup_$(date +%Y%m%d_%H%M%S).sql

# Create compressed backup
pg_dump -h localhost -p 5433 -U postgres -d dashboard | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
psql -h localhost -p 5433 -U postgres -d dashboard < backup_20240815_103000.sql

# Restore from compressed backup
gunzip -c backup_20240815_103000.sql.gz | psql -h localhost -p 5433 -U postgres -d dashboard
```

---

## Security Considerations

### Database Security

1. **Connection Security:**
   ```sql
   -- Enable SSL connections
   ALTER SYSTEM SET ssl = on;
   
   -- Require SSL for specific users
   ALTER USER dashboard_user SET ssl = on;
   ```

2. **User Permissions:**
   ```sql
   -- Create application user with limited permissions
   CREATE USER dashboard_app WITH PASSWORD 'secure_password';
   
   -- Grant only necessary permissions
   GRANT CONNECT ON DATABASE dashboard TO dashboard_app;
   GRANT USAGE ON SCHEMA public TO dashboard_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dashboard_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dashboard_app;
   ```

3. **Row Level Security (Optional):**
   ```sql
   -- Enable RLS for sensitive tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   
   -- Create policy for users to only see their own data
   CREATE POLICY user_policy ON users
       FOR ALL TO dashboard_app
       USING (id = current_setting('app.current_user_id')::integer);
   ```

### Data Protection

1. **Password Hashing:** Always use bcrypt with salt rounds ≥ 12
2. **Sensitive Data:** Consider encrypting sensitive fields
3. **Audit Logging:** Enable PostgreSQL audit logging for compliance
4. **Regular Updates:** Keep PostgreSQL updated with security patches

---

## Migration Scripts

### Version 1.0 to 1.1 Migration Example

```sql
-- Add new columns
ALTER TABLE projects ADD COLUMN docker_image VARCHAR(255);
ALTER TABLE projects ADD COLUMN health_check_url VARCHAR(500);

-- Create new indexes
CREATE INDEX idx_projects_docker_image ON projects(docker_image);

-- Update existing data
UPDATE projects SET docker_image = 'nginx:latest' WHERE name LIKE '%frontend%';
UPDATE projects SET docker_image = 'node:18-alpine' WHERE name LIKE '%api%';

-- Add constraints
ALTER TABLE projects ADD CONSTRAINT chk_docker_image_format 
    CHECK (docker_image ~ '^[a-z0-9._/-]+:[a-z0-9._-]+$');
```

---

## Troubleshooting

### Common Database Issues

1. **Connection Issues:**
   ```sql
   -- Check active connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check connection limits
   SHOW max_connections;
   
   -- Kill long-running queries
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE state = 'active' AND query_start < NOW() - INTERVAL '1 hour';
   ```

2. **Performance Issues:**
   ```sql
   -- Check for locks
   SELECT * FROM pg_locks WHERE NOT granted;
   
   -- Check table bloat
   SELECT schemaname, tablename, 
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Data Integrity:**
   ```sql
   -- Check foreign key violations
   SELECT conname, conrelid::regclass, confrelid::regclass
   FROM pg_constraint
   WHERE contype = 'f' AND NOT convalidated;
   
   -- Validate constraints
   ALTER TABLE deployments VALIDATE CONSTRAINT deployments_project_id_fkey;
   ```

---

**For more information, see the [main documentation](../README.md) or [troubleshooting guide](./troubleshooting.md).**