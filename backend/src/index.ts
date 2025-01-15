import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync } from 'fs'
import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { run } from './ai/generateConcept'
const app = new Hono()

app.get('/', (c) => {
  // Static Render of ../frontend
  const index = readFileSync('../frontend/index.html', 'utf8')
  // Todo, templates
  const defaultDimension = Math.floor(Math.random() * 9999) + 1
  // apply
  const indexWithDimension = index.replace('{{DIMENSION}}', defaultDimension.toString())
  return c.html(indexWithDimension)
})

app.use('styles/*.css', serveStatic({ root: '../frontend' }))
app.use('scripts/*.js', serveStatic({ root: '../frontend' }))

app.get('*', async (c) => {
  const result = await run()
  console.log(result)
  // i PROMISE this used to be a reference to a joke ("uncle funcle") that i left as a PLACEHOLDER!!!! 
  return c.html(`<h1>family friendly content ${result.title}</h1>`)
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
