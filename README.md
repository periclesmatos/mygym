# Workout

Personal workout log. React talks to a Spring Boot API, and the API stores templates and sessions in Postgres.

## What it does

- **Rotina**: workouts (A, B, C…) that rotate in order. Finishing one makes the next one current.
- **Treino**: log each set (kg, reps, optional RIR) with last time's numbers alongside, a rest timer that survives a reload, vibration and a beep when rest ends, and the screen kept awake. Sets and exercises can be added or removed, and the whole workout can be discarded.
- **Histórico**: list and calendar, with duration, sets and volume. A workout can be repeated or deleted.
- **Perfil**: name, photo, weight, height, birth date (age and BMI), a summary of all workouts, and changing e-mail or password. Opened from the avatar on Início.
- **Evolução**: per-exercise chart (estimated 1RM, top load, reps, volume) with every record.

## Run it locally

1. Start Postgres: `docker compose --profile db up -d`
2. Start the API from `backend`: `mvn spring-boot:run`
3. Start the UI from `frontend`: `npm install` then `npm run dev`
4. Open http://localhost:5173

The first login is `you@appgym.local` / `appgym` unless you change `APP_USER_EMAIL` and `APP_USER_PASSWORD`.

## Auto-reload while developing

`docker compose --profile dev up` starts the API and the UI in containers, so Java and Node don't need to be installed. Open http://localhost:5173.

- UI: Vite updates the page as soon as a file is saved.
- API: `backend/dev.sh` recompiles when something in `backend/src` changes, and Spring DevTools restarts the API in a few seconds.
- It uses the Postgres already listening on port 5432 (override with `DEV_DATABASE_URL`). If none is running, start one with `docker compose --profile db up -d` first.
- The first start downloads Maven dependencies and runs `npm ci`, which takes a few minutes. Later starts use the cached volumes.
- After changing `pom.xml` or `package.json`, restart that service: `docker compose restart api-dev` or `docker compose restart web-dev`.

## One URL for the gym

`docker compose --profile app up --build` builds the React app into the API and serves both on http://localhost:8080.

For a hosted database, set `DATABASE_URL` to the provider URL (`postgresql://...` or a JDBC URL), plus `APP_USER_EMAIL`, `APP_USER_PASSWORD`, and a `JWT_SECRET` of at least 32 characters. `render.yaml` describes that setup on Render.

## Tests and checks

| What | Command |
|---|---|
| Backend tests (unit, API against a real Postgres via Testcontainers, module boundaries and layers) and format check | `docker compose --profile test run --rm api-test` |
| Frontend tests (Vitest: pure domain functions and the architecture rules) | `docker compose exec web-dev npm test` |
| Frontend lint / format | `docker compose exec web-dev npm run lint` · `npm run format` |
| Backend format | `docker compose exec api-dev mvn spotless:apply` |

The Docker image build runs the frontend lint, format check and tests, so a broken build never ships. The backend tests need Docker (Testcontainers), so they run through the `test` profile instead.

## Database migrations

The schema lives in `backend/src/main/resources/db/migration` (Flyway) and Hibernate only validates it (`ddl-auto: validate`).

- Add a change as a new file `V<n>__description.sql`. Never edit a migration that already ran.
- Databases created before Flyway are marked as V1 on their first start (`baseline-on-migrate`) and receive only the later migrations. That is why V2 is written to be safe when its columns already exist.
- Back up the database before deploying a release with new migrations.

## Architecture

A **modular monolith** with **Clean Architecture** inside each module, ready to split into services later. See [docs/architecture.md](docs/architecture.md) for the full picture, the rules, and how to add things.

- **Backend** (`backend/src/main/java/com/appgym`): one top-level package per module (`identity`, `catalog`, `routine`, `workout`, `progress`) plus `shared`. Inside each: `domain/` (entities, rules, repository ports), `application/` (use cases), `infrastructure/` (Spring Data, external services, config) and `web/` (controllers). Modules talk only through a small public interface at their root (`RoutineApi`, `WorkoutApi`) and keep other modules' data as ids.
- **Frontend** (`frontend/src`): `app/` (routes, layout), `shared/` (HTTP client with one file per backend module, UI kit, hooks, helpers) and `features/<name>/` with `pages/`, `components/`, `hooks/`, `domain/`, `services/` and an `index.js` as its public API.
- **Enforced by tests**: `ModularityTest` (Spring Modulith) and `LayeringTest` (ArchUnit) in the backend, `src/architecture.test.js` and an ESLint rule in the frontend.

## Accounts and sign-in

The first boot on an empty database creates the user from `APP_USER_EMAIL` / `APP_USER_PASSWORD`. Later boots don't touch users, so that e-mail can be changed from Perfil.

Sign-up is invite-only. `APP_ALLOWED_EMAILS` holds the e-mails (comma separated) that may create an account with a password, Google or Apple. If it is empty, nobody new can sign up. Each account only sees its own workouts.

Google and Apple buttons appear only when their variables are set:

- **Google**: in Google Cloud Console, create an OAuth client ID of type *Web application*. Add every origin the app runs on (for example `http://localhost:5173` and the Render URL) to *Authorized JavaScript origins*, then set `GOOGLE_CLIENT_ID`.
- **Apple**: this needs a paid Apple Developer account. Create a *Services ID* with Sign in with Apple enabled, register your domain and return URL, then set `APPLE_CLIENT_ID` (the Services ID) and `APPLE_REDIRECT_URI` (that same return URL). Apple only works over HTTPS, so it can't be tested on localhost.

A Google or Apple sign-in whose verified e-mail matches an existing account is linked to that account.
