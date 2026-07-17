# PackWise — Ready for Departure

Premium travel preparation platform for organizing journeys, manifests, and reusable travel blueprints.

## Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **API:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL
- **Security:** JWT authentication with bcrypt password hashing

## Start locally

1. Copy `server/.env.example` to `server/.env` and provide a PostgreSQL `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Create the database tables: `npm run db:generate` then `npm run db:migrate`
4. Run the client and API: `npm run dev`

The client is served at `http://localhost:5173` and API at `http://localhost:4000`.

## Build roadmap

1. Authentication and Departure Lounge foundation
2. Journey and Manifest CRUD
3. Travel Blueprints and smart manifest generation
4. Countdown, clearance progress, search, and filters
5. Weather suggestions, exports, reminders, and deployment
