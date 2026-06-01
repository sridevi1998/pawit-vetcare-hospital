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

Typed API helpers live in `lib/pawit-api.ts` with the local billing contract types in `lib/pawit-api-types.ts`.
