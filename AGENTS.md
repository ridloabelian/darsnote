# Darsnote

SaaS AI Transcription Platform untuk Kajian Islam.

## Purpose

Platform transkripsi AI untuk ceramah/kajian Islam. Upload audio/video atau paste link YouTube; sistem mentranskripsikan menggunakan Groq Whisper dan menyediakan AI analysis. Live di `dars.saif.co.id`.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v3
- **Backend:** Cloudflare Workers (OpenNext), Cloudflare Workflows, Cloudflare Containers
- **Database:** Prisma + Cloudflare D1 (SQLite)
- **Auth:** NextAuth.js
- **Storage:** Cloudflare R2 (media uploads & cache)
- **AI:** Groq API (Whisper + LLM)
- **Media Processing:** yt-dlp, ffmpeg (inside Cloudflare Containers)

## Key Features

- Upload audio/video untuk transkripsi
- YouTube URL transcription
- Cloudflare Workflows untuk async transcription orchestration
- Cloudflare Containers untuk Linux media processing
- NextAuth authentication
- Multipart upload ke R2
- Export functionality

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start Next.js dev server
npm run build     # Build for production
npx wrangler dev  # Test Cloudflare Workers locally
```

## Key Conventions

- OpenNext untuk Cloudflare Workers deployment
- Prisma dengan D1 adapter untuk database
- Cloudflare Workflows untuk long-running transcription jobs
- Cloudflare Containers untuk ffmpeg/yt-dlp processing
- NextAuth untuk authentication
