# Continuous delivery

## Current deployment shape

The web app and API live in separate GitHub repositories and build separate
Docker images. The web Compose service listens on `127.0.0.1:5903`; a
Cloudflare Tunnel sends public web traffic to that local port. The API runs
with PostgreSQL on the Docker host and applies schema changes through Flyway
when it starts.

Keep the database volume and the host's `.env` file on the server. They should
not be included in images or replaced during a deploy.

## Delivery options

### Publish images after CI

After tests pass, each repository can build its image and publish it to GitHub
Container Registry (GHCR). Tag images with the commit SHA, and add a release
tag when a human-readable version is needed. This makes every successful build
available to deploy or roll back without building on the server.

### Deploy automatically

After CI and image publishing succeed, a deploy job can update the Docker host
and run `docker compose pull` followed by `docker compose up -d`. Prefer a
self-hosted GitHub Actions runner on the host. An SSH-based runner is another
option if the host is reachable and its key is stored in GitHub Actions
secrets.

The server's Compose file would refer to the GHCR images instead of building
from local source. Keep configuration and credentials in the server's `.env`
file. Deploy the API before the web image when both change, then smoke-check
the API and web endpoints. Flyway migrations run during API startup. Keep the
previous image tags available so a failed release can be rolled back by
restoring those tags in Compose.

## Choices before enabling production deploys

- Publish images only, or deploy automatically after CI?
- Deploy on every push to `main`, or require a manual release action?
- Use a self-hosted runner on the Docker host, or SSH from GitHub-hosted
  runners?
- Make GHCR images public, or keep them private and authenticate the host?

The publish-only option is a low-friction first step. Full deployment needs a
runner or SSH access, GHCR permissions, and a Compose file on the host that
references the published image tags.
