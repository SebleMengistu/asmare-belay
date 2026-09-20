'use strict'

const config = require('./config')
const { db } = require('./lib/db')
const { SCHEMA } = require('./lib/schema')
const { seedIfEmpty } = require('./lib/seed')
const { createApp } = require('./app')

async function bootstrap() {
  try {
    const parsed = new URL(config.databaseUrl)
    console.log(`[boot] db: ${parsed.host}${config.dbSsl ? ' (ssl)' : ''}`)
  } catch {
    console.log(`[boot] db: <invalid DATABASE_URL="${config.databaseUrl}">`)
  }
  await db.exec(SCHEMA)
  // Existing databases need the durable upload column added without a reset.
  await db.exec("ALTER TABLE media ADD COLUMN IF NOT EXISTS file_data BYTEA")
  const seeded = await seedIfEmpty()
  if (seeded.seeded) {
    console.log('[boot] database was empty — seeded an admin account + starter profile')
  } else {
    console.log('[boot] database ready')
  }

  const app = createApp(db)
  const server = app.listen(config.port, () => {
    console.log(`TEFERA API listening on http://localhost:${config.port} (api: /api/v1)`)
  })

  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down…`)
    server.close(async () => {
      try {
        await db.close()
      } catch {
        /* ignore */
      }
      process.exit(0)
    })
    setTimeout(() => process.exit(0), 5000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

bootstrap().catch((error) => {
  console.error('[boot] failed:', error)
  process.exit(1)
})
