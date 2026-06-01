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

Typed API helpers live in `lib/pawit-api.ts` and consume the generated OpenAPI types from the sibling `pawit-vetcare-contracts` repo.
