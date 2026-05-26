# DarsNote

Platform SaaS AI transkripsi kajian Islam — [dars.saif.co.id](https://dars.saif.co.id)

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Prisma + Cloudflare D1 · NextAuth.js · Cloudflare R2 · Cloudflare Workflows · Cloudflare Containers · Groq Whisper/LLM · yt-dlp

---

## Arsitektur Hosting

DarsNote sekarang ditargetkan full Cloudflare:

- **Cloudflare Workers + OpenNext** untuk Next.js SSR/API.
- **Cloudflare D1** untuk database aplikasi dan NextAuth.
- **Cloudflare R2** untuk upload media dan cache OpenNext.
- **Cloudflare Workflows** untuk orchestration job transkripsi async.
- **Cloudflare Containers** untuk proses media yang butuh Linux runtime, `yt-dlp`, `ffmpeg`, dan filesystem.

Jalur VPS lama (`PM2`, `Nginx`, `PostgreSQL`, `Redis`, `BullMQ`) sudah tidak dipakai.

---

## Development Lokal

### Prasyarat

- Node.js 20+.
- Cloudflare Wrangler login.
- Docker CLI/daemon untuk build Cloudflare Container image.
- Cloudflare Workers Paid jika ingin menjalankan Containers.

### Setup

```bash
npm install
cp .dev.vars.example .dev.vars
```

Isi `.dev.vars` dengan `NEXTAUTH_SECRET`, kredensial Google OAuth, `GROQ_API_KEY`, dan `RESEND_API_KEY` jika ingin menguji email reset password.

### Resource Cloudflare

```bash
npx wrangler d1 create darsnote
npx wrangler r2 bucket create darsnote-media
npx wrangler r2 bucket create darsnote-next-cache
npx wrangler r2 bucket cors set darsnote-media --file cloudflare/r2-cors.json --force
```

Masukkan `database_id` dari output `d1 create` ke `wrangler.jsonc`.

Apply schema D1:

```bash
npm run d1:migrate:local
npm run d1:migrate:remote
```

Set secrets production:

```bash
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

Preview lokal di runtime Workers:

```bash
npm run preview
```

Deploy:

```bash
npm run deploy
```

---

## Struktur Penting

```
pages/
  dashboard/
    index.tsx
    riwayat.tsx
    transkripsi-baru.tsx
    transkripsi/[id].tsx
  api/
    transcriptions/
      index.ts
      [id].ts
      upload.ts              # create R2 multipart upload
      upload-part.ts         # upload chunk ke R2 multipart
      complete-upload.ts     # trigger Workflow
      youtube.ts             # trigger Workflow YouTube
      export/[id].ts
cloudflare/
  web-worker.ts              # custom OpenNext Worker + Workflow + Container binding
  media-container/
    Dockerfile
    server.js                # yt-dlp + Groq processing
  r2-cors.json
prisma/
  schema.prisma              # SQLite/D1 schema
  d1-migrations/
    0001_init.sql
wrangler.jsonc               # Cloudflare bindings/resources
open-next.config.ts          # OpenNext Cloudflare config
```

---

Milik [PT SAIF Digital Holdings](https://saif.co.id) — tagline: *Rekam. Transkripsi. Pahami.*
