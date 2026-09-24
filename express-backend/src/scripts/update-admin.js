'use strict'

/**
 * One-off: repoint the admin account to the client's chosen credentials.
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node src/scripts/update-admin.js
 */

const { db } = require('../lib/db')
const bcrypt = require('bcryptjs')
const config = require('../config')

async function main() {
  const email = process.env.ADMIN_EMAIL || config.adminEmail
  const password = process.env.ADMIN_PASSWORD || config.adminPassword
  const hash = bcrypt.hashSync(password, 12)

  const user = await db.get('SELECT * FROM users WHERE email = ?', 'asmarebelay@kiot.edu.et')
    .then((row) => row || db.get('SELECT * FROM users ORDER BY id LIMIT 1'))

  if (!user) {
    console.error('No admin user found in database.')
    process.exitCode = 1
    return
  }

  await db.run('UPDATE users SET email = ?, password = ?, updated_at = ? WHERE id = ?', email, hash, new Date().toISOString(), user.id)
  console.log(`Admin user #${user.id} updated -> email: ${email} (password set)`)

  // Role bindings reference the user id, so they stay intact.
  const roles = await db.all('SELECT r.name FROM roles r JOIN model_has_roles mr ON mr.role_id = r.id WHERE mr.model_id = ?', user.id)
  console.log('Roles:', roles.map((r) => r.name).join(', ') || '(none)')
}

main()
  .catch((error) => {
    console.error('update-admin failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => db.close())
