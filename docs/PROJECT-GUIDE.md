# PackWise Project Guide

## What this project is

PackWise is a travel preparation app. Users can sign in, plan journeys, create packing manifests, stamp items as packed, view weather advisories, and earn passport stamps for cleared journeys.

## Project folders

- `client/` — the React website shown to users.
- `server/` — the Express API, authentication, and database connection.
- `server/prisma/` — the PostgreSQL database schema.
- `docs/` — project notes and deployment instructions.

## Run PackWise on your computer

1. Open this project folder in VS Code.
2. Open the terminal.
3. Run `npm install` once after cloning or moving the project.
4. Run `npm run dev`.
5. Open `http://localhost:5173`.

## Live services

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

## Important security rule

`server/.env` contains private keys and database details. Never upload it to GitHub or share it in screenshots.

## Publish code changes

After testing a change, run:

```powershell
git add .
git commit -m "Describe your change"
git push origin main
```

Vercel and Render will redeploy automatically after a successful push.
