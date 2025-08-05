-- Clean Database Schema for TechOps Dashboard
-- This schema aligns perfectly with the current backend controllers
-- Date: 2025-08-01
-- Purpose: Create a production-ready database that eliminates all column mismatch errors

-- Drop existing database if it exists and create new one
DROP DATABASE IF EXISTS dashboard;
CREATE DATABASE dashboard;

-- Connect to the new database
\c dashboard;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (serves as the source for engineer data)
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

-- Project groups table
CREATE TABLE project_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (matches projectController expectations)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    group_id INTEGER REFERENCES project_groups(id) ON DELETE SET NULL,
    repository_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    assigned_engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table (matches deploymentController expectations)
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    deployment_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    deployed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    services TEXT, -- comma-separated services
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance requests table (matches maintenanceController expectations)
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold')),
    category VARCHAR(50),
    assigned_engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
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

-- Maintenance status history table
CREATE TABLE maintenance_status_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_id INTEGER REFERENCES users(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance work logs table
CREATE TABLE maintenance_work_logs (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    engineer_id INTEGER REFERENCES users(id),
    work_description TEXT NOT NULL,
    hours_spent DECIMAL(5,2),
    work_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Projects indexes
CREATE INDEX idx_projects_group_id ON projects(group_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Deployments indexes
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_deployed_by ON deployments(deployed_by);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_deployed_at ON deployments(deployed_at);

-- Maintenance requests indexes
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_assigned_engineer ON maintenance_requests(assigned_engineer_id);
CREATE INDEX idx_maintenance_requests_created_by ON maintenance_requests(created_by_id);
CREATE INDEX idx_maintenance_requests_scheduled_date ON maintenance_requests(scheduled_date);

-- Maintenance history indexes
CREATE INDEX idx_maintenance_status_history_request_id ON maintenance_status_history(request_id);
CREATE INDEX idx_maintenance_status_history_changed_by ON maintenance_status_history(changed_by_id);

-- Maintenance work logs indexes
CREATE INDEX idx_maintenance_work_logs_request_id ON maintenance_work_logs(request_id);
CREATE INDEX idx_maintenance_work_logs_engineer_id ON maintenance_work_logs(engineer_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_groups_updated_at BEFORE UPDATE ON project_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Engineers view (users with engineer or admin role)
CREATE OR REPLACE VIEW engineers_view AS
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    CONCAT(first_name, ' ', last_name) as full_name,
    role,
    is_active,
    last_login,
    created_at,
    updated_at
FROM users 
WHERE role IN ('engineer', 'admin') AND is_active = true;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@company.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa', 'Admin', 'User', 'admin');

-- Insert sample project group
INSERT INTO project_groups (name, description) VALUES
('Web Applications', 'Frontend and backend web applications');

-- Insert sample project
INSERT INTO projects (name, description, group_id, repository_url, status) VALUES
('Dashboard App', 'TechOps Dashboard Application', 1, 'https://github.com/company/dashboard', 'active');

-- Generate unique request number for maintenance request
INSERT INTO maintenance_requests (
    request_number, title, description, priority, status, category,
    assigned_engineer_id, created_by_id, client_name, client_email, 
    client_phone, client_company
) VALUES (
    'MR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'Sample Maintenance Request',
    'This is a sample maintenance request for testing',
    'Medium',
    'Pending',
    'System Maintenance',
    1,
    1,
    'Internal Request',
    'internal@company.com',
    'N/A',
    'Internal'
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Display completion message
SELECT 'Database schema created successfully!' as message;
SELECT 'All tables, indexes, triggers, and views have been created.' as status;
SELECT 'The schema is now aligned with the backend controllers.' as note;
