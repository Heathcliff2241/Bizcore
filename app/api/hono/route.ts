import { Hono } from 'hono'

const app = new Hono()

app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' })
})

app.get('/projects', async (c) => {
  // Example: fetch projects from DB
  // const projects = await prisma.project.findMany()
  return c.json({ projects: [] })
})

export const GET = async (request: Request) => {
  return app.fetch(request)
}

export const POST = async (request: Request) => {
  return app.fetch(request)
}