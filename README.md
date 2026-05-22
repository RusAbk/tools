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
