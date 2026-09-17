'use strict'

/**
 * Force a clean re-import of the legacy Laravel SQLite database into the new
 * Express database (drops + recreates all tables first).
 *
 *   npm run import
 */

const config = require('../config')
const { getDb } = require('../lib/db')
const { importLegacy } = require('../lib/import')

const db = getDb()

try {
  const result = importLegacy(db, { force: true })
  const total = Object.values(result.counts).reduce((sum, n) => sum + n, 0)
  console.log(`Imported ${total} rows across ${Object.keys(result.counts).length} tables.`)
  console.log(`Copied ${result.files} media files from ${config.legacyStoragePath}.`)
  for (const [table, count] of Object.entries(result.counts)) {
    if (count > 0) console.log(`  ${table}: ${count}`)
  }
} catch (error) {
  console.error(`Import failed: ${error.message}`)
  process.exitCode = 1
} finally {
  db.close()
}
