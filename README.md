# Weekly Business Tools

Monorepo with:

- `api` - Express API and OpenRouter proxy.
- `web` - React + Vite frontend with Ant Design and React Router.

## Setup

```bash
npm install
cp api/.env.example api/.env
npm run dev:api
npm run dev
```

Set `OPENROUTER_API_KEY` in `api/.env` before using the OpenRouter proxy.

## Backend deploy

The API is plain Node.js and does not produce a build artifact. On a VPS you can run:

```bash
npm ci
npm run build --workspace api
npm run start --workspace api
```

If you are already inside the `api` directory, use `npm run build` and `npm run start`.

## GitHub Pages

The repository deploys only the Vite frontend from `web` to GitHub Pages. The workflow is
`.github/workflows/deploy-web.yml`, and it uploads `web/dist` as the Pages artifact.

If the API is hosted separately, add a repository variable named `VITE_API_BASE_URL` in GitHub
with the backend origin, for example `https://api.example.com`. Locally, leave it unset and Vite
will keep using the `/api` proxy to `http://localhost:4000`.
