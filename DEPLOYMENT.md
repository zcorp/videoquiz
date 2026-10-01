# Demo deployment

This repository deploys only the static Video Quiz demo. The backend, MongoDB, Docker Compose full-stack setup, and production frontend are outside the deployment scope of this repository.

## Run locally with Docker

Docker is the supported way to run the demo locally. Node.js and a local `frontend/node_modules` directory are not required.

From the repository root:

```sh
docker compose -f docker-compose.demo.yml up --build
```

Open http://localhost:4174.

Stop the demo with:

```sh
docker compose -f docker-compose.demo.yml down
```

The demo uses browser `localStorage`; stopping the container does not remove quiz data stored in the browser.

## GitHub Pages deployment

The workflow `.github/workflows/demo-pages.yml` performs only these steps:

1. Checkout this repository.
2. Install the dependencies declared in `frontend/package-lock.json` on the GitHub runner.
3. Run `npm run build:demo` from `frontend/`.
4. Upload `frontend/demo-dist` as the Pages artifact.
5. Deploy that artifact with `actions/deploy-pages`.

It does not build or deploy Spring Boot, MongoDB, Docker Compose, or the full production frontend.

### First-time repository setup

1. Push the `main` branch to GitHub.
2. Open **Settings > Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Enable Actions if GitHub prompts for it.
5. Re-run the workflow if the first deployment failed with `HttpError: Not Found`.

For `zcorp/videoquiz`, the expected project Pages URL is:

```text
https://zcorp.github.io/videoquiz/
```

The workflow computes `DEMO_BASE_PATH=/videoquiz/` automatically for this project repository. HashRouter keeps client-side routes working on Pages.

## Push commands

After creating or recreating the repository:

```sh
git init
git add -A
git commit -m "deploy static demo to GitHub Pages"
git branch -M main
git remote add origin https://github.com/zcorp/videoquiz.git
git push -u origin main --force
```

Use a GitHub Personal Access Token or an authenticated SSH key for the push. GitHub does not accept account passwords over HTTPS.

## Validation

Build the same artifact as Pages without installing Node dependencies locally:

```sh
docker build -f frontend/Dockerfile.demo frontend
```

The Docker image builds the demo in a Node builder stage and serves only the generated static files with Nginx. The Pages workflow uses the GitHub runner directly and does not depend on this Docker image.
