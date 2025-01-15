import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
const app = new Hono()

app.get('/', (c) => {
  // Static Render of ../frontend index with the templates
  const index = readFileSync('../frontend/index.html', 'utf8')
  
  return c.html(index)
})

app.use('*.css', serveStatic({ root: '../frontend' }))
app.use('*.js', serveStatic({ root: '../frontend' }))

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
