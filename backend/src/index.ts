import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import { generateHTML, conceptJSON, zodConceptSchema } from './ai/main_ai'
import { z } from 'zod'

type Variables = {
  concept: z.infer<typeof zodConceptSchema>
}

const app = new Hono<{ Variables: Variables }>({
  strict: true
})

const errorMessage = "<h1>the interdimensional internet messed up. web7 is unreliable. try again :)</h1>"

// Helper functions
function b64encode(str: string) { return Buffer.from(str, 'utf8').toString('base64') }
function b64decode(str: string) { return Buffer.from(str, 'base64').toString('utf8') }

// Middleware to load concept from cookie
async function loadConcept(c: any, next: any) {
  const conceptCookie = getCookie(c, 'concept')
  if (conceptCookie) {
    try {
      c.set('concept', zodConceptSchema.parse(JSON.parse(b64decode(conceptCookie))))
    } catch (e) {
      console.error("Error parsing concept from cookie", e)
      c.set('concept', null)
    }
  } else {
    c.set('concept', null)
  }
  await next()
}

// Function to generate and render the page
async function generateConceptAndRender(c: any, seed: number, path: string = '/') {
  const index = readFileSync('../frontend/index.html', 'utf8')
  const result = await conceptJSON(seed)
  const concept = result
  setCookie(c, 'concept', b64encode(JSON.stringify(concept)))
  if (c.req.query('embed')) {
    const html = await generateHTML(concept, seed, path) ?? errorMessage
    return html ?? errorMessage
  }

  const rendered = await renderPage(c, concept, seed, path)
  return rendered
}

async function renderPage(c: any, concept: z.infer<typeof zodConceptSchema>, seed: number, path: string) {
  const index = readFileSync('../frontend/index.html', 'utf8')
  const navButtons = concept.navbar_items.map((item) => `<button class="interdimensional-navbar-button" onclick="renderPage('${item.path}')">${item.title}</button>`).join('')
  const indexWithNav = index.replace('{{NAVBUTTONS}}', navButtons).replace('{{DIMENSION}}', seed.toString())
  const content = await generateHTML(concept, seed, path)
  const indexWithNavAndContent = indexWithNav.replace('{{CONTENT}}', content ?? errorMessage)
  return indexWithNavAndContent
}

// Static file serving
app.use('/styles/*', serveStatic({ root: '../frontend' }))
app.use('/scripts/*', serveStatic({ root: '../frontend' }))

// API endpoint
app.post('/api', async (c) => {
  const body = await c.req.json()
  console.log(body)
  // TODO: push to vector db for semantic search
  return c.json({ message: 'Hello, world!' })
})

const seedFromContext = (c: any) => {
  const dimension = parseInt(c.req.query('dimension') || "aa")
  return isNaN(dimension) ? Math.floor(Math.random() * 9999) + 1 : dimension
}

app.get('/', async (c) => {
  if (c.req.query('embed') && c.get('concept')) {
    const seed = seedFromContext(c)
    const rendered = await generateHTML(c.get('concept'), seed, '/')
    return c.html(rendered ?? errorMessage)
  }
  const seed = seedFromContext(c)
  const rendered = await generateConceptAndRender(c, seed, '/')
  return c.html(rendered)
})

app.use('*', loadConcept)

app.get('*', async (c) => {
  const concept = c.get('concept')
  const path = c.req.path
  const seed = seedFromContext(c)
  console.log(seed, c.get('concept'))

  if (!concept) {
    console.log("generating concept")
    const rendered = await generateConceptAndRender(c, seed, path)
    return c.html(rendered)
  }
  if (concept && !c.req.query('embed')) {
    return c.html(await renderPage(c, concept, seed, path))
  }
  // if no concept and is embed, generate the AI html
  return c.html(await generateHTML(concept, seed, path) ?? errorMessage)
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
