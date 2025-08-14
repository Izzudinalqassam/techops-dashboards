-- Migration: Add deployment_scripts table
-- Date: 2025-01-15
-- Purpose: Create table to store deployment scripts and link them to deployments

-- Create deployment_scripts table
CREATE TABLE deployment_scripts (
    id SERIAL PRIMARY KEY,
    deployment_id INTEGER NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    execution_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_deployment_scripts_deployment_id ON deployment_scripts(deployment_id);
CREATE INDEX idx_deployment_scripts_execution_order ON deployment_scripts(execution_order);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_deployment_scripts_updated_at 
    BEFORE UPDATE ON deployment_scripts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE deployment_scripts IS 'Stores deployment scripts associated with each deployment';
COMMENT ON COLUMN deployment_scripts.deployment_id IS 'Foreign key reference to deployments table';
COMMENT ON COLUMN deployment_scripts.title IS 'Script title or name (e.g., "Docker deployment script")';
COMMENT ON COLUMN deployment_scripts.content IS 'Actual script content/code';
COMMENT ON COLUMN deployment_scripts.execution_order IS 'Order in which scripts should be executed (default: 1)';

-- Display completion message
SELECT 'deployment_scripts table created successfully!' as message;
SELECT 'Scripts can now be stored and retrieved for deployments.' as status;