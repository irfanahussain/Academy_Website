# BrightPath Academy: React frontend

The student-facing and public website for BrightPath Academy, built with React 19, React Router, and Vite. It talks to the Django API in `../../server/schoolProject`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (requires the Django server on port 8000)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with `/api` proxied to Django |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## Structure

- `src/api.js` contains every request to the backend and token storage.
- `src/AuthContext.jsx` holds the signed-in user and auth actions.
- `src/App.jsx` defines the routes. Routes under `/dashboard` require login.
- `src/pages/` holds the public pages and `src/pages/student/` the student portal.

See the root `README.md` for the full project guide.
