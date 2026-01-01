// Script to create admin user
// Run: node scripts/create-admin.js

const bcrypt = require('bcryptjs')

async function createAdminHash() {
  const password = 'admin123' // Change this!
  const email = 'admin@gotjourneythailand.com'
  const name = 'Admin'

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  console.log('='.repeat(50))
  console.log('Admin User Details')
  console.log('='.repeat(50))
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Password Hash: ${hash}`)
  console.log('='.repeat(50))
  console.log('')
  console.log('Run this SQL in Supabase:')
  console.log('')
  console.log(`INSERT INTO admins (email, password_hash, name, role, is_active) VALUES`)
  console.log(`('${email}', '${hash}', '${name}', 'admin', true);`)
  console.log('')
}

createAdminHash()
