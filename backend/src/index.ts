import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { setCookie, getCookie } from 'hono/cookie'
import { generateHTML, run, zodConceptSchema } from './ai/main_ai'
import { z } from 'zod'
const app = new Hono()

const errorMessage = "<h1>the interdimensional internet messed up. web7 is unreliable. try again :)</h1>"

async function generateConceptAndRender(c: any, seed: number) {
  const index = readFileSync('../frontend/index.html', 'utf8')
  const defaultDimension = seed
  const result = run(seed)

  const indexWithDimension = index.replace('{{DIMENSION}}', defaultDimension.toString())

  const concept = await result
  
  const navButtons = concept.navbar_items.map((item) => `<button class="interdimensional-navbar-button" onclick="renderPage('${item.path}')">${item.title}</button>`).join('')
  const indexWithNav = indexWithDimension.replace('{{NAVBUTTONS}}', navButtons)
  setCookie(c, 'concept', b64encode(JSON.stringify(concept)))
  
  const content = await generateHTML(concept, defaultDimension, '/')
  const indexWithNavAndContent = indexWithNav.replace('{{CONTENT}}', content ?? errorMessage)
  return indexWithNavAndContent
}


function b64encode(str: string) { return Buffer.from(str, 'utf8').toString('base64')}
function b64decode(str: string) { return Buffer.from(str, 'base64').toString('utf8')}
app.get('/', async (c) => {
  // Static Render of ../frontend
  const defaultDimension = Math.floor(Math.random() * 9999) + 1
  let seed = parseInt(c.req.query('dimension')!)
  if (isNaN(seed)) seed = defaultDimension
  const rendered = await generateConceptAndRender(c, seed)

  return c.html(rendered)
})

app.use('styles/*.css', serveStatic({ root: '../frontend' }))
app.use('scripts/*.js', serveStatic({ root: '../frontend' }))

app.use('*', async (c) => {
  // I hate this behemoth of a function
  // TODO: split this up & do it right
  if (c.req.path.startsWith('/api/')) {
    if (c.req.method == 'GET') {
      // TODO: semantic search magic

    } else if (c.req.method == 'POST') {
      const body = await c.req.json()
      console.log(body)
      // TODO: push to vector db for semantic search
      return c.json({
        message: 'Hello, world!'
      })
    }
  }
  if (c.req.header('x-dimension')) {
    const dimension = parseInt(c.req.header('x-dimension')!)
    const concept = zodConceptSchema.parse(JSON.parse(b64decode(getCookie(c, 'concept')!)))
    const html = await generateHTML(concept, dimension, c.req.path)
    return c.html(html ?? errorMessage)
  }
  if (!getCookie(c, 'concept')) {
    const defaultDimension = Math.floor(Math.random() * 9999) + 1
    let seed = parseInt(c.req.query('dimension')!)
    if (isNaN(seed)) seed = defaultDimension
    if (c.req.path == '/') {
      const rendered = await generateConceptAndRender(c, seed)
      return c.html(rendered)
    } 
    const rendered = await generateConceptAndRender(c, seed)
  
    return c.html(rendered)
    // return c.html(await generateConceptAndRender(c, defaultDimension))
  } else {

    const concept = zodConceptSchema.parse(JSON.parse(b64decode(getCookie(c, 'concept')!)))
    
    const html = await generateHTML(concept, parseInt(c.req.query('dimension')!), c.req.path)
    const index = readFileSync('../frontend/index.html', 'utf8')
    
    const navButtons = concept.navbar_items.map((item) => `<button class="interdimensional-navbar-button" onclick="renderPage('${item.path}')">${item.title}</button>`).join('')
    const indexWithNav = index.replace('{{NAVBUTTONS}}', navButtons)
    const indexWithNavAndContent = indexWithNav.replace('{{CONTENT}}', html ?? errorMessage)
    return c.html(indexWithNavAndContent)
  }
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
