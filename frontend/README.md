# Axis Frontend

React + Vite + TypeScript frontend for the AXIS dashboard.

## Run locally

From `frontend/`:

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Required backend

Frontend expects the AXIS backend API.

- Local default in dev: `http://localhost:8000`
- Configurable via env: `VITE_API_BASE_URL`

## Environment variables

- `VITE_API_BASE_URL`
  - Optional in local dev (defaults to `http://localhost:8000`)
  - Required in production builds

Example `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - typecheck and build production assets
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
