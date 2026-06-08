# PawIt VetCare Hospital Portal

Next.js staff portal for veterinary clinics and hospitals. This app mirrors the Docran operational UI style while adapting workflows for pets, pet parents, veterinarians, diagnostics, billing, and queue management.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Axios
- socket.io-client
- DOMPurify
- Sentry-ready

## Local Development

```sh
npm install
npm run dev
```

Set `NEXT_PUBLIC_PAWIT_API_BASE_URL` to the Go API origin, for example `http://localhost:8080`.

For the backend local PostgreSQL seed, use:

```sh
NEXT_PUBLIC_PAWIT_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_PAWIT_TENANT_ID=11111111-1111-1111-1111-111111111111
NEXT_PUBLIC_PAWIT_USER_ID=33333333-3333-3333-3333-333333333333
NEXT_PUBLIC_PAWIT_ROLE=ClinicAdmin
```

For the in-memory Go demo store, use:

```sh
NEXT_PUBLIC_PAWIT_API_BASE_URL=http://localhost:8080 \
NEXT_PUBLIC_PAWIT_TENANT_ID=tenant_demo_clinic \
NEXT_PUBLIC_PAWIT_USER_ID=user_demo_admin \
NEXT_PUBLIC_PAWIT_ROLE=ClinicAdmin \
npm run dev
```

The hospital portal is available at `/hospital/appointments` and includes read pages for appointments, calendar, queue, pet records, prescriptions, clinical notes, labs, billing, analytics, feedback, doctors, staff, and audit logs.

Typed API helpers live in `lib/pawit-api.ts` with the local billing contract types in `lib/pawit-api-types.ts`.

## PostgreSQL Migrations

Liquibase changelogs live in `db/liquibase/changelog`. The root changelog is `db/liquibase/changelog/db.changelog-root.yaml`.

The project includes a Docker-based runner, so a local Java/Liquibase install is not required:

```sh
npm run db:validate
npm run db:status
npm run db:update
```

Configure the target database with:

```sh
LIQUIBASE_COMMAND_URL=jdbc:postgresql://localhost:5432/pawit_vetcare
LIQUIBASE_COMMAND_USERNAME=pawit
LIQUIBASE_COMMAND_PASSWORD=pawit
```

When running the Docker-based script against a Postgres server on the host from Docker Desktop, use:

```sh
LIQUIBASE_COMMAND_URL=jdbc:postgresql://host.docker.internal:5432/pawit_vetcare
```

Rollback the most recent change set with:

```sh
npm run db:rollback -- 1
```
