# Technical Setup

## Verified Technology Stack
* **Status:** Initialized.
* **Findings:** Next.js App Router (TypeScript), TailwindCSS, Prisma ORM 5.x (PostgreSQL), and Vitest have been successfully initialized.

## Prerequisites
- Node.js 18+
- npm (or yarn/pnpm)
- PostgreSQL (for local database)

## Installation Commands
```bash
npm install
npx prisma generate
```

## Local Development Steps
1. Clone the repository and run `npm install`.
2. Configure `.env` with a valid PostgreSQL `DATABASE_URL`.
3. Run `npx prisma db push` or `npx prisma migrate dev` to initialize the database schema.
4. Start the development server using `npm run dev`.

## Environment Variables
Create a `.env` file in the root directory (use `.env.example` as a template).

*Required Variables:*
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/finova_db?schema=public"
```

## Database Setup (Supabase PostgreSQL + Prisma ORM)
1. **Supabase Local Initialization:**
   ```bash
   npx supabase init
   ```
2. **Supabase Migration Generation:**
   ```bash
   npx supabase migration new <migration_name>
   ```
   Migration files are saved in `supabase/migrations/` and contain full SQL DDL with Row Level Security (RLS) policies.
3. **Prisma Client Generation:**
   ```bash
   npx prisma generate
   ```
4. **Environment Configuration:**
   Configure `DATABASE_URL` (transaction pooler) and `DIRECT_URL` (direct connection) in `.env` (using `.env.example`).


## Troubleshooting
- **Prisma Client Issues:** If you encounter type errors, ensure you run `npx prisma generate` after any schema changes.
- **Dependency Conflicts:** If using npm v7+, use `--legacy-peer-deps` if conflicts arise between Vite and Next.js `@types/node`.

## Build and Deployment Commands
```bash
npm run build
npm run start
```

## Dependency Installation and Update Procedure
- Use the package manager (e.g., `npm install <package>`) to add dependencies.
- Ensure dependencies are audited regularly (e.g., `npm audit`).

## Verified DevOps Tooling & CLI Status
* **Git:** Installed (`git version 2.55.0.windows.5`)
* **GitHub CLI:** Installed (`gh version 2.98.0`) — Authenticated via keyring (`Sirijoy2008`)
* **Cloudflare Wrangler:** Installed locally in project (`v4.149.0` via `npx wrangler`)
* **Supabase CLI:** Accessible via package runner (`v2.120.0` via `npx supabase`); global alias `supabase` requires Scoop
* **Node.js:** Installed (`v26.7.0`)
* **npm:** Installed (`11.19.0`)

