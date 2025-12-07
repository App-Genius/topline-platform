import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'

import { authMiddleware } from './middleware/auth.js'
import { errorHandler } from './middleware/error-handler.js'

// Routes
import auth from './routes/auth.js'
import organizations from './routes/organizations.js'
import users from './routes/users.js'
import roles from './routes/roles.js'
import behaviors from './routes/behaviors.js'
import behaviorLogs from './routes/behavior-logs.js'
import dailyEntries from './routes/daily-entries.js'
import questionnaire from './routes/questionnaire.js'

// Types
import type { Env } from './types.js'

const app = new OpenAPIHono<Env>()

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
app.use('*', errorHandler)

// Public routes (no auth required)
app.route('/auth', auth)
app.route('/questionnaire', questionnaire)

// Protected routes (require auth)
app.use('/api/*', authMiddleware)
app.route('/api/organizations', organizations)
app.route('/api/users', users)
app.route('/api/roles', roles)
app.route('/api/behaviors', behaviors)
app.route('/api/behavior-logs', behaviorLogs)
app.route('/api/daily-entries', dailyEntries)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Topline API',
    version: '1.0.0',
    description:
      'API for Topline - Transform staff behaviors into measurable business outcomes using the 4DX framework.',
  },
  servers: [
    { url: 'http://localhost:8787', description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Organizations', description: 'Organization management' },
    { name: 'Users', description: 'User management' },
    { name: 'Roles', description: 'Role management' },
    { name: 'Behaviors', description: 'Behavior definitions (Lead Measures)' },
    { name: 'Behavior Logs', description: 'Log staff behaviors' },
    { name: 'Daily Entries', description: 'Daily revenue and KPIs (Lag Measures)' },
    { name: 'Questionnaire', description: 'Pre-qualification questionnaire' },
  ],
})

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

// Start server
const port = parseInt(process.env.PORT || '8787')

console.log(`
🚀 Topline API starting...

   📖 Swagger UI: http://localhost:${port}/docs
   📋 OpenAPI Spec: http://localhost:${port}/openapi.json
   ❤️  Health Check: http://localhost:${port}/health
`)

serve({
  fetch: app.fetch,
  port,
})

export default app
export type AppType = typeof app
