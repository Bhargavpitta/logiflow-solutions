# Deploy On Render

This project already contains:

- a Vite frontend in `src/`
- an Express backend in `server/`
- a `render.yaml` Blueprint for Render

You do not need to move the code into separate `frontend/` and `backend/` folders. The current monorepo layout is already deployment-ready.

## What was prepared

- Backend now supports Render's `PORT` environment variable
- Backend cookies switch to secure cross-site mode in production
- Backend CORS supports the configured deployed frontend origin
- A Render Blueprint was added in `render.yaml`
- A sample env file was added in `.env.example`

## Before you deploy

1. Push this repository to GitHub.
2. Create or verify your Google OAuth app if you use Google sign-in.
3. Make sure your local code works with:

```bash
npm install
npm run dev:full
```

## Option A: Deploy with `render.yaml` Blueprint

This is the easiest way to create backend, frontend, and database from one file.

### Step 1: Push the updated repo

Push the current code to your GitHub repository.

### Step 2: Create a Blueprint in Render

1. Log in to Render.
2. Click `New`.
3. Click `Blueprint`.
4. Connect your GitHub repository.
5. Render will detect `render.yaml`.
6. Review the three resources it will create:
   - `logiflow-frontend`
   - `logiflow-backend`
   - `logiflow-db`
7. Click `Apply`.

### Step 3: Wait for the first deploy

Render will create:

- one PostgreSQL database
- one Node web service
- one static site

Note: in `render.yaml`, the frontend static site does not use `plan: free`. Render static sites are free, but Blueprint validation can reject `plan: free` for a static service.

The first deploy may finish with the app loading but auth/API calls not fully working until you replace the placeholder URLs below.

### Step 4: Copy the real service URLs from Render

After creation, note these two URLs:

- frontend URL:
  `https://<your-frontend-name>.onrender.com`
- backend URL:
  `https://<your-backend-name>.onrender.com`

Important:
Do not keep the placeholder values from `render.yaml` such as `https://your-backend-service.onrender.com/api` or `https://your-frontend-service.onrender.com`.
Those are examples only. If they remain in Render, the frontend will call the placeholder domain and login will fail with CORS errors and `Failed to fetch`.

### Step 5: Update the frontend environment variable

Open the `logiflow-frontend` service in Render.

Set:

```env
VITE_API_URL=https://<your-backend-name>.onrender.com/api
```

Then trigger a redeploy of the frontend.

### Step 6: Update the backend environment variable

Open the `logiflow-backend` service in Render.

Set:

```env
FRONTEND_URL=https://<your-frontend-name>.onrender.com
```

If you also want local development and production allowed at the same time, you can use:

```env
FRONTEND_URL=http://localhost:8080,https://<your-frontend-name>.onrender.com
```

Then redeploy the backend.

### Step 7: Set Google OAuth values

If you use Google sign-in:

On the frontend service, set:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

In Google Cloud Console, add this Render frontend URL to `Authorized JavaScript origins`:

```txt
https://<your-frontend-name>.onrender.com
```

If you use a custom domain later, add that too.

### Step 8: Set admin email

On the backend service, set:

```env
ADMIN_EMAIL=your-admin-email@example.com
```

The first user that signs in with that email will be treated as admin.

### Step 9: Test the live app

Check these:

1. Open the frontend URL.
2. Sign up or sign in.
3. Create a logistics entry.
4. Refresh the page to confirm the session cookie persists.
5. Open the backend health route:

```txt
https://<your-backend-name>.onrender.com/api/health
```

It should return:

```json
{"ok":true}
```

## Option B: Create services manually in Render

Use this only if you do not want to use the Blueprint.

### Backend service

Create a new `Web Service` with:

- Runtime: `Node`
- Root Directory: repo root
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```env
PORT=10000
DATABASE_URL=<from Render Postgres>
JWT_SECRET=<random secret>
ADMIN_EMAIL=<your admin email>
FRONTEND_URL=https://<your-frontend-name>.onrender.com
```

### Frontend service

Create a new `Static Site` with:

- Root Directory: repo root
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Environment variables:

```env
VITE_API_URL=https://<your-backend-name>.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<your google client id>
```

Add a rewrite rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

### Database

Create a new `PostgreSQL` database and copy its internal connection string into the backend's `DATABASE_URL`.

## Important notes

- Render web services expect the server to listen on `PORT`, not just `BACKEND_PORT`.
- Because frontend and backend are on different Render domains, production cookies must be `Secure` and `SameSite=None`.
- This project now handles that automatically when `NODE_ENV=production`.
- The backend auto-creates database tables on startup using `ensureSchema()`.

## Files involved

- [render.yaml](./render.yaml)
- [.env.example](./.env.example)
- [server/config.js](./server/config.js)
- [server/auth.js](./server/auth.js)
- [server/index.js](./server/index.js)
