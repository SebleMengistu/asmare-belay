'use strict'

const config = require('./config')
const { db } = require('./lib/db')
const { SCHEMA } = require('./lib/schema')
const { seedIfEmpty } = require('./lib/seed')
const { createApp } = require('./app')

async function bootstrap() {
  await db.exec(SCHEMA)
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
  console.error('[boot] failed:', error && error.message)
  process.exit(1)
})