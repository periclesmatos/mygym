# Architecture

The app is a **modular monolith**: one deployable (a Spring Boot jar that also serves the React build), split into modules with explicit boundaries. Each module follows **Clean Architecture** inside. The boundaries are checked by tests, so they hold as the code grows, and each module can be moved to its own service later without untangling it first.

## Modules

```
                 ┌──────────┐
                 │ identity │  accounts, sign-in, profile
                 └──────────┘
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌──────────┐
│ catalog │ ◄─── │ routine │ ◄─── │ workout │ ◄─── │ progress │
└─────────┘      └─────────┘      └─────────┘      └──────────┘
 exercises,       workouts A/B/C   sessions,        last time,
 muscle groups    in rotation      sets, timer      1RM, history
                       ▲                                 │
                       └─────────────────────────────────┘

           shared: errors, JWT security, config, SPA routes (used by all)
```

| Module | Owns (tables) | Public API (what other modules may use) |
|---|---|---|
| `identity` | `app_user`, `user_photo` | none: it implements `shared.security.UserLookup` |
| `catalog` | `exercise_catalog` | `MuscleGroups` |
| `routine` | `template`, `template_exercise` | `RoutineApi`, `TemplatePlan` |
| `workout` | `workout_session`, `session_exercise`, `workout_set` | `WorkoutApi`, `CompletedExercise` |
| `progress` | none (reads through `WorkoutApi` and `RoutineApi`) | none |
| `shared` | none | everything (open module) |

Rules:

- A module only touches another through the types in that module's **root package** (`com.appgym.routine.RoutineApi`, never `com.appgym.routine.domain.Template`).
- Each module declares who it depends on in its `package-info.java` (`allowedDependencies`). No cycles.
- Other modules reference users and templates by **id** (`userId`, `templateId`), never by JPA relation. The foreign keys stay in the database.
- `shared` depends on no business module. When it needs something from one, it declares a port (an interface) that the module implements, like `UserLookup`.

Enforced by `ModularityTest` (Spring Modulith `verify()`), which also writes PlantUML diagrams of the modules to `backend/target/spring-modulith-docs`.

## Layers inside a backend module

```
com.appgym.routine
├── RoutineApi.java, TemplatePlan.java   public API of the module
├── domain/            entities, business rules, repository ports (interfaces)
├── application/       use cases (services), commands in, views out
│   └── dto/
├── infrastructure/    adapters out: Spring Data repositories, external services, config
└── web/               adapters in: REST controllers
```

```
web ──► application ──► domain ◄── infrastructure
```

- **domain**: plain Java plus JPA annotations on entities (the one pragmatic exception). Rules live on the entities when they can: `SessionExercise.planned(...)`, `addNextSet()`, `Session.removeSet(...)`, `CatalogExercise.custom(...)`, `Template.ROUTINE_ORDER`. Repositories are interfaces here (ports), with intention-revealing methods.
- **application**: one service per aggregate (`TemplateService`, `SessionService`…) with one method per use case, transactional. Input is a `...Command` record (validated with Bean Validation), output is a `...View` record. It never sees HTTP or Spring Data.
- **infrastructure**: `Jpa...Repository` interfaces extend Spring Data's `Repository` *and* the domain port, so Spring generates the implementation. `@Query` and derived queries live here. Also `@ConfigurationProperties` and adapters such as the Google/Apple token verifier.
- **web**: thin controllers. They take the user id from the token (`@AuthenticationPrincipal Long userId`), call one service method, and return its view. Web-only shapes go in `web/dto`.

Enforced by `LayeringTest` (ArchUnit, which ships with Spring Modulith).

Errors are thrown as `BadRequestException`, `NotFoundException` and the like (`shared.error`) and always reach the client as `{"message": "..."}` in Portuguese.

## Frontend

The frontend mirrors the same ideas with plain folders and one test.

```
src/
├── app/                 entry point, routes, layout, style index
├── shared/
│   ├── api/             HTTP client + one file per backend module (identity, catalog, routine, workout, progress)
│   ├── ui/ hooks/ lib/  reusable components, hooks and pure helpers
│   └── styles/
└── features/<name>/
    ├── index.js         public API of the feature
    ├── pages/           route screens
    ├── components/      pieces of the screens
    ├── hooks/           state and orchestration (the application layer)
    ├── domain/          pure rules, each with a *.test.js next to it
    ├── services/        browser adapters (storage, canvas, external SDKs)
    └── <name>.css
```

Features: `auth`, `catalog`, `history`, `home`, `profile`, `progress`, `routine`, `workout`.

Rules:

- A feature uses another only through its `index.js`, and only if it is listed in `ALLOWED` in `src/architecture.test.js` (`home → routine, catalog`; `routine → catalog`; `workout → routine`; `profile → auth`).
- Inside a feature, files import each other by full path, never through their own `index.js`.
- `shared/` never imports a feature.
- `domain/` is pure: no React, no API calls, no UI.
- Pages compose hooks and components; they don't call `fetch`. Async actions that can fail go through `useAction`, which shows the error as a toast.

Enforced by `src/architecture.test.js` (runs with `npm test`) and an ESLint rule against deep imports.

## Adding something

- **A use case in an existing module**: a method on the module's service, a `...Command`/`...View` in `application/dto` if needed, an endpoint in the controller. A new query is a method on the domain port, with its implementation (`@Query` or a derived name) on the `Jpa...Repository`.
- **A new backend module**: a top-level package with `package-info.java` (`@ApplicationModule` with `allowedDependencies`), the four layers, and, if others need it, a small interface at the module root. Its tables come in a new Flyway migration.
- **A new screen**: a folder under `features/`, registered in `ALLOWED`, with an `index.js` that exports the page, and a route in `app/App.jsx`. Its stylesheet goes into `app/styles.css`.

## Moving a module to its own service

The boundaries are already in the shape a service needs:

1. The module's public interface (`RoutineApi`, `WorkoutApi`) becomes an HTTP client in the callers, with the same records as payloads.
2. Its tables move to their own database or schema. Nothing else joins them, since other modules only keep ids.
3. Authentication already works per request from the JWT. The new service needs the same `JWT_SECRET` and the `shared.security` classes.
4. `progress` reads through `WorkoutApi` and `RoutineApi` only, so it is the easiest one to extract first.
