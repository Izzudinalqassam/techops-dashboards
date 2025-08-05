const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function updateAdminPassword() {
  try {
    // Generate hash for password "admin123"
    const password = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated password hash:', hashedPassword);
    
    // Update the admin user's password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username, email',
      [hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('Admin user:', result.rows[0]);
      console.log('📧 Email: admin@company.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('❌ Admin user not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
