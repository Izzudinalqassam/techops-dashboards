const fs = require('fs');
const path = require('path');
const pool = require('./backend/config/database');

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '001_add_deployment_scripts_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL commands more carefully
    const lines = migrationSQL.split('\n');
    const cleanLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')) {
        cleanLines.push(trimmed);
      }
    }
    
    const sqlContent = cleanLines.join(' ');
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && cmd.length > 5); // Filter out very short commands
    
    console.log(`📝 Found ${commands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        console.log(`⚡ Executing command ${i + 1}/${commands.length}`);
        console.log(`📄 Command: ${command.substring(0, 100)}...`);
        try {
          const result = await pool.query(command);
          console.log(`✅ Command executed successfully`);
          if (result.rows && result.rows.length > 0 && result.rows[0].message) {
            console.log(`📋 Result: ${result.rows[0].message}`);
          }
        } catch (cmdError) {
          console.log(`❌ Error details: ${cmdError.message}`);
          if (cmdError.message.includes('already exists')) {
            console.log(`⚠️  Table/trigger already exists, skipping...`);
          } else {
            throw cmdError;
          }
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 deployment_scripts table is now ready to store scripts.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();