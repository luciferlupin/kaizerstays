# KaizerStays

KaizerStays is the Curious Kaizer hotel PMS. The application uses Next.js for the frontend and server/API routes, Prisma for data access, and PostgreSQL for persistent storage.

## Docker development server

The Docker stack runs a production-style local build so the same frontend, API routes, and database boundary can be tested together on the Mac mini.

```text
Browser on Mac
  -> http://127.0.0.1:3000
  -> KaizerStays Next.js container (frontend + API)
  -> private Docker network
  -> PostgreSQL container
  -> persistent named volume
```

Both published ports are loopback-only:

- KaizerStays: `http://127.0.0.1:3000`
- PostgreSQL: `127.0.0.1:5433`

They are not exposed to the LAN or public internet. Do not add router port-forwarding for this development stack.

### Start

The local `.env.docker` file is ignored by Git. Create it from `.env.docker.example` and replace the example PostgreSQL password before the first start.

```bash
cp .env.docker.example .env.docker
docker compose up --build -d
```

The `migrate` service waits for PostgreSQL, applies the Prisma schema with `prisma db push`, and exits. The application starts only after that succeeds.

Check the stack:

```bash
docker compose ps
curl http://127.0.0.1:3000/api/health
```

The health response should report `databaseConnected: true`.

### Stop and restart

```bash
docker compose stop
docker compose start
```

Stopping or recreating the containers does not remove PostgreSQL data because it is stored in the `kaizerstays_postgres_data` volume.

To remove containers while retaining data:

```bash
docker compose down
```

Do not add `--volumes` unless you intentionally want to delete the local development database.

### External service values

No production credentials are required for the local PostgreSQL stack. Supabase uses explicit placeholder values by default, and the optional integrations remain disabled until their values are supplied in `.env.docker`:

- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`: inbound OTA email processing.
- `KAIZER_OTA_INBOX_TOKEN`: protects OTA inbox queue access.
- `KAIZER_CHANNEL_MANAGER_BRIDGE_URL`, `KAIZER_CHANNEL_MANAGER_BRIDGE_TOKEN`: verified channel-manager bridge access.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: only when intentionally testing Supabase authentication.

Never copy production `.env` files into the image. The Docker build context explicitly excludes `.env*` files.

## Fast local coding workflow

Next.js recommends running the app directly on macOS for the fastest hot reload while keeping only PostgreSQL in Docker. Start the database service, then run the app locally with a Mac-hosted `DATABASE_URL` that uses port `5433`.

```bash
docker compose up -d postgres
npm install
npm run dev
```

For full-stack parity and verification, use the complete Docker stack described above.
