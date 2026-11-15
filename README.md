# Workout

Personal workout log. React talks to a Spring Boot API, and the API stores templates and sessions in Postgres.

## Run it locally

1. Start Postgres: `docker compose up -d`
2. Start the API from `backend`: `mvn spring-boot:run`
3. Start the UI from `frontend`: `npm install` then `npm run dev`
4. Open http://localhost:5173

The first login is `you@appgym.local` / `appgym` unless you change `APP_USER_EMAIL` and `APP_USER_PASSWORD`.

## One URL for the gym

`docker compose --profile app up --build` builds the React app into the API and serves both on http://localhost:8080.

For a hosted database, set `DATABASE_URL` to the provider URL (`postgresql://...` or a JDBC URL), plus `APP_USER_EMAIL`, `APP_USER_PASSWORD`, and a `JWT_SECRET` of at least 32 characters. `render.yaml` describes that setup on Render.
