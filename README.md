# Marketplace API

A RESTful marketplace API built with Node.js, Express, PostgreSQL, and Prisma.

## Features
- JWT Authentication & bcrypt password hashing
- Role-based (ADMIN / USER) and ownership-based authorization
- Full CRUD for Users, Items, and Orders
- Swagger UI documentation at `/api/docs`
- Database seeding with sample data

## Resources
| Resource | Description |
|----------|-------------|
| Users    | Buyers and sellers; supports ADMIN role |
| Items    | Listings created by sellers |
| Orders   | Purchases made by buyers, with order items |

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# 3. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed the database
npm run db:seed

# 5. Start development server
npm run dev
```

API runs at: http://localhost:3000  
Swagger docs: http://localhost:3000/api/docs

## Seed Credentials

| User  | Email               | Password     | Role  |
|-------|---------------------|--------------|-------|
| Admin | admin@example.com   | Admin123!    | ADMIN |
| Alice | alice@example.com   | Password123! | USER  |
| Bob   | bob@example.com     | Password123! | USER  |

## Deployment to Render

1. Push code to GitHub
2. Create a **Web Service** on Render pointing to your repo
3. Set environment variables in Render dashboard:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `JWT_SECRET` — a strong random secret
4. Set **Build Command:**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy && node --env-file=.env prisma/seed.js
   ```
5. Set **Start Command:**
   ```
   node src/server.js
   ```
6. Add a **PostgreSQL** database via Render and copy the Internal connection string to `DATABASE_URL`

## Project Structure

```
src/
  server.js          # Entry point, Express app, Swagger
  middleware/
    auth.js          # JWT verify, requireAdmin, requireOwnerOrAdmin
  routes/
    auth.js          # POST /api/auth/signup, /login
    users.js         # GET/PUT/DELETE /api/users
    items.js         # CRUD /api/items
    orders.js        # CRUD /api/orders
  lib/
    prisma.js        # Prisma client singleton
prisma/
  schema.prisma      # DB schema (User, Item, Order, OrderItem)
  seed.js            # Sample data seeder
openapi.yaml         # OpenAPI 3.0 spec (Swagger UI source)
TESTING_PLAN.md      # Step-by-step Swagger testing plan
```

## Authorization Summary

| Endpoint              | Public | Authenticated | Owner/Admin | Admin only |
|-----------------------|--------|---------------|-------------|------------|
| GET /items            | ✅     |               |             |            |
| GET /items/:id        | ✅     |               |             |            |
| POST /items           |        | ✅            |             |            |
| PUT /items/:id        |        |               | ✅          |            |
| DELETE /items/:id     |        |               | ✅          |            |
| GET /orders           |        | ✅ (own only) |             | ✅ (all)   |
| GET /orders/:id       |        |               | ✅          |            |
| POST /orders          |        | ✅            |             |            |
| PUT /orders/:id       |        | ✅ (cancel)   |             | ✅ (any status) |
| DELETE /orders/:id    |        |               |             | ✅          |
| GET /users            |        |               |             | ✅          |
| GET /users/:id        |        |               | ✅          |            |
| PUT /users/:id        |        |               | ✅          |            |
| DELETE /users/:id     |        |               |             | ✅          |
