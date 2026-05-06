# OneHmt Logistics

Manual-stack version of the app using:

- React + Vite frontend
- Node.js + Express backend
- PostgreSQL database
- Google popup sign-in
- Cookie-based app sessions

## Environment

The project uses a single `.env` file in the repo root.

Required values:

```env
VITE_GOOGLE_CLIENT_ID=
VITE_API_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:8080
BACKEND_PORT=3001
ADMIN_EMAIL=
JWT_SECRET=
DATABASE_URL=
```

Note: if your PostgreSQL password contains `@`, encode it as `%40` in `DATABASE_URL`.

## Run

Install dependencies:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev:full
```

Or run them separately:

```bash
npm run dev
npm run dev:server
```

## Google setup

In Google Cloud Console, add this to **Authorized JavaScript origins**:

```txt
http://localhost:8080
```

This app uses the Google popup flow from the browser and then verifies the Google account on the backend before creating a local session.
