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
| Backend tests (unit + API against a real Postgres via Testcontainers) and format check | `docker compose --profile test run --rm api-test` |
| Frontend tests (Vitest, pure domain functions) | `docker compose exec web-dev npm test` |
| Frontend lint / format | `docker compose exec web-dev npm run lint` · `npm run format` |
| Backend format | `docker compose exec api-dev mvn spotless:apply` |

The Docker image build runs the frontend lint, format check and tests, so a broken build never ships. The backend tests need Docker (Testcontainers), so they run through the `test` profile instead.

## Database migrations

The schema lives in `backend/src/main/resources/db/migration` (Flyway) and Hibernate only validates it (`ddl-auto: validate`).

- Add a change as a new file `V<n>__description.sql`. Never edit a migration that already ran.
- Databases created before Flyway are marked as V1 on their first start (`baseline-on-migrate`) and receive only the later migrations. That is why V2 is written to be safe when its columns already exist.
- Back up the database before deploying a release with new migrations.

## Architecture

### Backend (`backend/src/main/java/com/appgym`)

Organized by domain. Inside each domain, `api/` has the controller and its DTOs (`api/dto`, one record per file), `service/` has the rules and the entity ↔ DTO mapping, and `domain/` has the JPA entities and repositories.

| Package | Contents |
|---|---|
| `shared` | Typed configuration (`AppProperties`, the `app.*` keys), security (JWT filter and service), errors (`ApiException` subclasses and the global handler), small utilities |
| `user` | `User` and `UserPhoto` entities, the first-boot seeder |
| `auth` | Password login, invite-only sign-up, Google/Apple sign-in |
| `profile` | Profile data, photo, e-mail and password changes |
| `template` | Routine workouts (templates) and their exercises |
| `session` | Workouts being done or finished, with exercises and sets |
| `exercise` | Per-exercise history: last time, progress, estimated 1RM |

Rules of thumb:
- Dependencies go one way: `session → template`, `exercise → session`, and everything may use `user` and `shared`.
- Controllers stay thin. They receive the authenticated user id (`@AuthenticationPrincipal Long userId`) and pass it to the service, so every query is scoped to that user.
- Errors are thrown as `BadRequestException`, `NotFoundException` and so on, and always reach the client as `{"message": "..."}` in Portuguese.

### Frontend (`frontend/src`)

| Folder | Contents |
|---|---|
| `app/` | Entry point, routes, layout, the style index (`styles.css`, which imports every stylesheet in order) |
| `shared/api/` | HTTP client (token, errors, 401 → login) and one module per backend resource |
| `shared/ui/`, `shared/hooks/`, `shared/lib/` | Reusable components, hooks (`useAsync`, `useAction`…), and pure helpers (dates, numbers, training math) |
| `shared/styles/` | Design tokens, base and shared component styles |
| `features/<name>/` | One folder per screen area (`auth`, `home`, `routine`, `workout`, `history`, `progress`, `profile`), with its page(s), `components/`, `hooks/`, `lib/` and stylesheet |

Imports use the `@/` alias for `src/`. Rules worth keeping:
- Pure logic goes in a `lib/` file with a `*.test.js` next to it.
- Pages compose hooks and components and don't call `fetch` directly.
- Async actions that can fail go through `useAction`, which shows the error as a toast.

## Accounts and sign-in

The first boot on an empty database creates the user from `APP_USER_EMAIL` / `APP_USER_PASSWORD`. Later boots don't touch users, so that e-mail can be changed from Perfil.

Sign-up is invite-only. `APP_ALLOWED_EMAILS` holds the e-mails (comma separated) that may create an account with a password, Google or Apple. If it is empty, nobody new can sign up. Each account only sees its own workouts.

Google and Apple buttons appear only when their variables are set:

- **Google**: in Google Cloud Console, create an OAuth client ID of type *Web application*. Add every origin the app runs on (for example `http://localhost:5173` and the Render URL) to *Authorized JavaScript origins*, then set `GOOGLE_CLIENT_ID`.
- **Apple**: this needs a paid Apple Developer account. Create a *Services ID* with Sign in with Apple enabled, register your domain and return URL, then set `APPLE_CLIENT_ID` (the Services ID) and `APPLE_REDIRECT_URI` (that same return URL). Apple only works over HTTPS, so it can't be tested on localhost.

A Google or Apple sign-in whose verified e-mail matches an existing account is linked to that account.
