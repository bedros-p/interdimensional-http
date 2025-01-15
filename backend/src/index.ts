import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { setCookie, getCookie } from 'hono/cookie'
import { generateHTML, run, zodConceptSchema } from './ai/main_ai'
import { z } from 'zod'
const app = new Hono()

function b64encode(str: string) { return Buffer.from(str, 'utf8').toString('base64')}
function b64decode(str: string) { return Buffer.from(str, 'base64').toString('utf8')}
app.get('/', async (c) => {
  // Static Render of ../frontend
  const index = readFileSync('../frontend/index.html', 'utf8')
  const defaultDimension = Math.floor(Math.random() * 9999) + 1
  const seed = parseInt(c.req.query('dimension')!) ?? defaultDimension
  const result = run(seed)

  const indexWithDimension = index.replace('{{DIMENSION}}', defaultDimension.toString())

  const concept = await result
  
  const navButtons = concept.navbar_items.map((item) => `<button class="navbar-button" onclick="renderPage('${item.path}')">${item.title}</button>`).join('')
  const indexWithNav = indexWithDimension.replace('{{NAVBUTTONS}}', navButtons)
  setCookie(c, 'concept', b64encode(JSON.stringify(concept)))
  
  const content = await generateHTML(concept, defaultDimension, '/')
  const indexWithNavAndContent = indexWithNav.replace('{{CONTENT}}', content)

  return c.html(indexWithNavAndContent)
})

app.use('styles/*.css', serveStatic({ root: '../frontend' }))
app.use('scripts/*.js', serveStatic({ root: '../frontend' }))

app.get('*', async (c) => {
  const concept = zodConceptSchema.parse(b64decode(getCookie(c, 'concept')!))

  const html = await generateHTML(concept, parseInt(c.req.query('dimension')!), c.req.path)
  const index = readFileSync('../frontend/index.html', 'utf8')

  const navButtons = concept.navbar_items.map((item) => `<button class="navbar-button" onclick="renderPage('${item.path}')">${item.title}</button>`).join('')
  const indexWithNav = index.replace('{{NAVBUTTONS}}', navButtons)
  const indexWithNavAndContent = indexWithNav.replace('{{CONTENT}}', html)
  return c.html(indexWithNavAndContent)
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
