# PackWise Deployment Guide

This guide details how to freshly deploy **PackWise** to free cloud hosting platforms with new credentials. 

## Architectural Overview
* **Frontend:** Deployed to **Vercel** (free static web hosting, edge routing, and SPA proxying).
* **Backend API:** Deployed to **Render** or **Koyeb** (free Node.js web services).
* **Database:** Deployed to **Neon** (free serverless PostgreSQL).

---

## Step 1: Database Setup (Neon)
1. Go to [Neon.tech](https://neon.tech/) and sign up for a free account.
2. Click **Create Project**.
3. Name your project (e.g., `packwise-db`) and select a region closest to your target audience.
4. Once created, you will see a connection string labeled **Connection Details** (make sure **pooled connection** is checked/active, which appends `-pooler` to your connection string—recommended for serverless/high-load setups).
5. Copy the connection string. It will look like:
   ```env
   postgres://username:password@ep-some-pooler-id.region.aws.neon.tech/neondb?sslmode=require
   ```
6. Save this securely. This is your `DATABASE_URL`.

---

## Step 2: Backend API Setup (Render or Koyeb)
You can deploy your backend to either **Render** or **Koyeb** as a web service. 

### Option A: Deploying on Render (Recommended)
1. Sign up for a free account at [Render.com](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following configurations:
   * **Name:** `packwise-api`
   * **Root Directory:** `server`
   * **Runtime:** `Node`
   * **Build Command:** `npm run build && npx prisma migrate deploy`
   * **Start Command:** `npm start`
5. Scroll down to **Environment Variables** and add:
   * `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   * `JWT_SECRET`: *(A secure random string, e.g., generated with `openssl rand -base64 32`)*
   * `PORT`: `10000` *(Render sets this automatically, but declaring it ensures fallback stability)*
   * `CLIENT_ORIGIN`: `https://your-frontend-app.vercel.app` *(Your Vercel deployment URL, once created)*
6. Click **Deploy Web Service**.

### Option B: Deploying on Koyeb
1. Sign up for a free account at [Koyeb.com](https://www.koyeb.com/).
2. Create a new service and choose **GitHub** as the deployment method.
3. Choose your repository.
4. Set the configurations:
   * **Root Directory:** `/server`
   * **Builder:** Node.js
   * **Build Command:** `npm run build && npx prisma migrate deploy`
   * **Run Command:** `npm start`
5. Add the environment variables:
   * `DATABASE_URL`
   * `JWT_SECRET`
   * `CLIENT_ORIGIN`
6. Click **Deploy**.

---

## Step 3: Frontend Setup (Vercel)
Vercel is the premier platform for hosting Vite-based Single Page Applications.

1. Create a free account at [Vercel.com](https://vercel.com/).
2. Click **Add New** -> **Project** and import your repository.
3. In the project setup panel, configure:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `client`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. **Environment Variables (Optional):**
   * PackWise is preconfigured with a Vercel-native rewrite proxy in [client/vercel.json](file:///client/vercel.json).
   * By default, the proxy routes all frontend `/api/*` traffic to the backend server.
   * Open `client/vercel.json` and change the destination endpoint:
     ```json
     {
       "source": "/api/:path*",
       "destination": "https://YOUR-BACKEND-API.onrender.com/api/:path*"
     }
     ```
     Replace `https://YOUR-BACKEND-API.onrender.com` with your deployed Render or Koyeb URL.
   * If you prefer to bypass the Vercel rewrite proxy, add the following environment variable in Vercel's Dashboard:
     * `VITE_API_URL`: `https://YOUR-BACKEND-API.onrender.com/api`
5. Click **Deploy**.

---

## Step 4: Verification & Final Wiring
1. Once the frontend is deployed, copy its production domain (e.g. `https://packwise-travel.vercel.app`).
2. Go back to your backend service dashboard (Render or Koyeb) and update/add the environment variable:
   * `CLIENT_ORIGIN`: `https://packwise-travel.vercel.app`
3. Restart or trigger a redeploy of the backend service to apply this CORS allowance.
4. Open your Vercel frontend URL, sign up, create a journey, checklist items, and verify that everything functions beautifully!

---

## How to Explain PackWise in Software Engineering Interviews
When talking about PackWise in your interviews, emphasize these premium engineering decisions:
1. **Monorepo Architecture:** Clean separation of concerns with a shared build orchestration system.
2. **Type Safety:** TypeScript end-to-end. Framer Motion variants are strictly typed with `as const` literal assertions.
3. **Database Migration Strategy:** Decoupling schema building (`prisma generate`) and live database schema migrations (`prisma migrate deploy`) so database schema integrity is updated automatically on service startups.
4. **Resilient Session Recovery:** The client API service interceptor detects `401 Unauthorized` responses (e.g. if db resets or JWT tokens expire), cleanly wipes outdated tokens from `localStorage`, and triggers a smooth redirection rather than throwing unhandled app exceptions.
5. **Print Layout Engine:** Leveraging a lightweight CSS `@media print` style layer to convert dynamic React states into official physical boarding pass and packing documents without bloating the bundle with third-party PDF generators.
6. **Theme Cohesion:** Centralized React Context theme management backed by tailwind css styling extensions and smooth transitions.
