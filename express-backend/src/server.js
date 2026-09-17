'use strict'

const config = require('./config')
const { getDb } = require('./lib/db')
const { runImportIfNeeded } = require('./lib/import')
const { createApp } = require('./app')

function bootstrap() {
  const db = getDb()

  const result = runImportIfNeeded(db)
  if (result.imported) {
    console.log(`[import] legacy data imported (${result.files} media files copied)`)
  } else if (result.seeded) {
    console.log('[import] no legacy database found — seeded a fresh admin account')
  }

  const app = createApp(db)
  const server = app.listen(config.port, () => {
    console.log(`TEFERA API listening on http://localhost:${config.port} (api: /api/v1)`)
  })

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down…`)
    server.close(() => {
      try {
        db.close()
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

bootstrap()
