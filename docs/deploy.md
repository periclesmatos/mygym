# Branches, CI and deploy

## Branches

| Branch | Role | Gets code from | Merge method |
|---|---|---|---|
| `develop` | Integration, default branch | `feat/*`, `fix/*`, `chore/*`… | Squash (merge commit for back-merges) |
| `production` | What runs on the VM | `develop` (release) or `hotfix/*` | Merge commit |

Both branches only change through a pull request with the `ci` and `pr-rules` checks green. Force push and deletion are blocked.

```
feat/x ──squash──▶ develop ──release PR (merge commit)──▶ production ──▶ deploy
hotfix/x (from production) ──▶ production, then production ──▶ develop
```

- **Day to day**: branch from `develop`, open a PR to `develop`. The PR title becomes the squashed commit, so it must look like `type(scope): subject` (`feat(workout): adiciona descanso`).
- **Release**: open a PR from `develop` to `production` (title like `chore(release): ...`) and merge it with a merge commit. Squashing would make the two branches diverge and the next release would show conflicts that aren't real.
- **Hotfix**: branch `hotfix/x` from `production`, PR to `production`. After the deploy, open a PR from `production` to `develop` and merge it with a merge commit so `develop` gets the fix.

## Pipelines (`.github/workflows`)

| Workflow | When | What |
|---|---|---|
| `ci.yml` | PR to `develop`/`production`, push to `develop`, called by `deploy.yml` | `backend`: `mvn verify` (unit, architecture, integration with Testcontainers, Spotless). `frontend`: lint, format check, tests, build. `docker`: builds the image (PRs to `production` or when the Dockerfile/deploy files change). `ci`: the gate job required by branch protection. |
| `pr-rules.yml` | PR to `develop`/`production` | Title in `type(scope): subject` form. PRs to `production` must come from `develop` or `hotfix/*`. |
| `deploy.yml` | Push to `production`, or manually | Runs the full CI, pushes the image to `ghcr.io/periclesmatos/mygym` (`sha-<commit>` and `production`), deploys it on the VM over SSH and tags the commit `deploy-YYYYMMDD-HHMM`. |

Jobs whose files didn't change are skipped, and the `ci` gate counts a skipped job as passed.

Dependabot opens grouped weekly PRs to `develop` for Maven, npm, GitHub Actions and Docker images.

## The VM

`/opt/appgym` holds:

- `compose.prod.yml`, `Caddyfile`, `deploy.sh`, `backup.sh`: copied by every deploy, don't edit them on the VM.
- `.env`: the app secrets, created by hand from [`deploy/env.example`](../deploy/env.example). It never goes through GitHub.
- `.image_tag`: the image currently running.
- `backups/`: `pre-deploy-*.sql.gz` (last 10) and `daily-*.sql.gz` (last 7, cron at 03:00).

Caddy listens on ports 80 and 443 and proxies to the app. The app is published only on `127.0.0.1:8080` (for the deploy health check) and Postgres has no published port.

## Domain and HTTPS

The app is served at https://boratreinar.periclesm.dev. `.dev` domains only open over HTTPS in browsers.

- **DNS**: an `A` record `boratreinar` in Cloudflare pointing to the VM's static IP, set to *DNS only*.
- **Certificate**: Caddy gets and renews it by itself and keeps it in the `caddy_data` volume.
- **Forwarded headers**: `SERVER_FORWARD_HEADERS_STRATEGY=native` in the compose file is required. Without it Spring answers 403 to the site's own POST, PUT and DELETE requests.
- **Changing the domain**: create the DNS record, edit `deploy/Caddyfile`, update `VM_PUBLIC_HOST` and release.
- **Certificate problems**: `docker compose -f compose.prod.yml logs --tail 100 caddy` in `/opt/appgym`.

### First setup

1. In GCP, reserve the external IP as static and allow HTTP and HTTPS on the VM (Firewall → `http-server` and `https-server` tags, or a rule for tcp:80 and tcp:443). Port 22 must stay open because GitHub runners have no fixed IP. Only key login is accepted.
2. Copy `deploy/setup-vm.sh` to the VM and run it with the deploy public key:
   `sudo bash setup-vm.sh "$(cat appgym-deploy.pub)"`
   It installs Docker, creates the `deploy` user, `/opt/appgym`, 2 GB of swap and the daily backup.
   If OS Login is enabled on the VM or project, keys in `authorized_keys` may be ignored; check `ssh -i appgym-deploy deploy@<ip>` before the first deploy.
3. Create `/opt/appgym/.env` from `deploy/env.example` (owner `deploy`, `chmod 600`).
4. In GitHub, the `production` environment needs:
   - secrets `VM_HOST` (IP), `VM_USER` (`deploy`), `VM_SSH_KEY` (private key), `VM_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <ip>`)
   - variable `VM_PUBLIC_HOST` (the domain, shown as the environment link). `VM_HOST` stays the IP.

## Operations

- **Deploy**: merge the release PR into `production`. Follow it in Actions → Deploy.
- **Failed deploy**: `deploy.sh` waits up to 3 minutes for `/api/health` on the app itself, so a green deploy does not prove the certificate works: open the site after changing the proxy or the domain. If it doesn't answer, it brings back the previous image and the workflow fails with the app logs.
- **Rollback by hand**: Actions → Deploy → Run workflow, with `image_tag` set to an earlier `sha-<commit>` (see the job summaries or the GHCR package page). This skips CI and the image build.
- **Migrations**: Flyway runs them on boot and they only go forward. Rolling back the image does **not** undo the schema; for that, restore the `pre-deploy` backup taken right before the bad deploy:

  ```sh
  cd /opt/appgym
  docker compose -f compose.prod.yml stop app
  gunzip -c backups/pre-deploy-<timestamp>.sql.gz > /tmp/restore.sql
  docker compose -f compose.prod.yml exec -T db psql -U appgym -d postgres -c 'DROP DATABASE appgym' -c 'CREATE DATABASE appgym OWNER appgym'
  docker compose -f compose.prod.yml exec -T db psql -U appgym -d appgym < /tmp/restore.sql
  ```

  Then deploy the image that matches that schema (manual run with `image_tag`).
- **Logs**: `docker compose -f compose.prod.yml logs -f --tail 200 app` in `/opt/appgym`.

## Known limits

- The database and its backups live on the VM disk. Losing the VM loses both; copying `backups/` to a Cloud Storage bucket is the next step.
