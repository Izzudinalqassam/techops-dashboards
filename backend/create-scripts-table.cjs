const { Pool } = require('pg');

// Local database configuration (not Docker)
const localDbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'root', // Adjust if different
  database: 'dashboard',
};

const pool = new Pool(localDbConfig);

async function createScriptsTable() {
  try {
    console.log('🚀 Connecting to local PostgreSQL database...');
    console.log('📋 Config:', { ...localDbConfig, password: '***' });
    
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    
    console.log('🚀 Creating deployment_scripts table...');
    
    // Create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS deployment_scripts (
        id SERIAL PRIMARY KEY,
        deployment_id INTEGER NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        execution_order INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ deployment_scripts table created successfully!');
    
    // Create indexes
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_deployment_scripts_deployment_id ON deployment_scripts(deployment_id)',
      'CREATE INDEX IF NOT EXISTS idx_deployment_scripts_execution_order ON deployment_scripts(execution_order)'
    ];
    
    for (const indexSQL of createIndexes) {
      await pool.query(indexSQL);
    }
    console.log('✅ Indexes created successfully!');
    
    // Create trigger function if not exists
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await pool.query(triggerFunctionSQL);
    console.log('✅ Trigger function created successfully!');
    
    // Create trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_deployment_scripts_updated_at ON deployment_scripts;
      CREATE TRIGGER update_deployment_scripts_updated_at 
        BEFORE UPDATE ON deployment_scripts
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `;
    
    await pool.query(createTriggerSQL);
    console.log('✅ Trigger created successfully!');
    
    // Test the table
    const testQuery = await pool.query('SELECT COUNT(*) FROM deployment_scripts');
    console.log(`📊 deployment_scripts table is ready! Current count: ${testQuery.rows[0].count}`);
    
    // Show table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'deployment_scripts' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Scripts can now be stored and retrieved for deployments.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📋 Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
createScriptsTable();