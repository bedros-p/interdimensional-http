import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { run } from './ai/main_ai'
const app = new Hono()

app.get('/', async (c) => {
  // Static Render of ../frontend
  const index = readFileSync('../frontend/index.html', 'utf8')
  const defaultDimension = Math.floor(Math.random() * 9999) + 1
  const seed = parseInt(c.req.query('dimension')!) ?? defaultDimension
  const result = run(seed)

  const indexWithDimension = index.replace('{{DIMENSION}}', defaultDimension.toString())

  const concept = await result
  
  const navButtons = concept.navbar_items.map((item) => `<button class="navbar-button">${item}</button>`).join('')
  const indexWithNav = indexWithDimension.replace('{{NAVBUTTONS}}', navButtons)

  return c.html(indexWithNav)
})

app.use('styles/*.css', serveStatic({ root: '../frontend' }))
app.use('scripts/*.js', serveStatic({ root: '../frontend' }))

app.get('*', async (c) => {
  return c.html(`<h1>------</h1>`)
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
