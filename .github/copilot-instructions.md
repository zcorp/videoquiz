# Video Quiz demo repository instructions

This repository is deployment-only for the static demo under `frontend/demo/`.

- Do not build, run, or modify the Spring Boot backend, MongoDB, Docker Compose full-stack setup, or production frontend when working on the demo deployment.
- Do not run `npm install`, `npm ci`, `npm run dev`, or `npm run build` on the host. Local demo execution uses Docker:
  `docker compose -f docker-compose.demo.yml up --build`.
- The demo Docker image is defined by `frontend/Dockerfile.demo` and serves the generated static files with `frontend/nginx.demo.conf`.
- GitHub Pages uses `.github/workflows/demo-pages.yml`; it runs `npm ci` only on the GitHub runner, executes `npm run build:demo`, and publishes `frontend/demo-dist`.
- The GitHub Pages project URL is `https://zcorp.github.io/videoquiz/`; the workflow supplies `DEMO_BASE_PATH=/videoquiz/` automatically.
- Keep `frontend/node_modules/`, `frontend/demo-dist/`, `frontend/demo/demo-dist/`, `.DS_Store`, and environment files untracked.
- Preserve browser `localStorage` behavior and HashRouter routes when changing the demo.
- Validate local runtime with Docker and validate Pages with the GitHub Actions workflow.
