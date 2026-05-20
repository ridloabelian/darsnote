# DarsNote - dars.saif.co.id

Platform SaaS AI transkripsi kajian Islam milik PT SAIF Digital Holdings.

## Stack

- Next.js 15 (Pages Router) + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Prisma ORM + Cloudflare D1
- NextAuth.js (Credentials + Google OAuth)
- Cloudflare R2 (media upload + OpenNext cache)
- Cloudflare Workflows (async transcription orchestration)
- Cloudflare Containers (yt-dlp, ffmpeg, Groq media processing)
- Groq Whisper + Groq chat completion untuk ringkasan dan deteksi dalil

## Deployment Target

Full Cloudflare:

- Workers + OpenNext untuk web app
- D1 untuk database
- R2 untuk media dan cache
- Workflows untuk job async
- Containers untuk proses yang butuh binary Linux

Tidak ada lagi PM2, Nginx, PostgreSQL, Redis, atau BullMQ.

## MVP Features

1. Landing page dengan CTA early access
2. Auth: register + login email/password dan Google
3. Dashboard: kuota menit tersisa
4. Upload file audio/video langsung ke R2
5. Paste YouTube URL -> Workflow -> Container -> yt-dlp
6. Transkripsi Groq Whisper
7. Ringkasan otomatis via Groq
8. Deteksi dalil Quran & Hadits via Groq
9. Riwayat transkripsi + detail
10. Export hasil ke TXT

## Constraints

- Bahasa UI: Indonesia
- Kuota free: 30 menit/user, disimpan sebagai sisa kuota di `User.quotaMinutes`
- File upload max: 500MB
- File media dihapus dari R2 setelah workflow selesai
- Mobile-first responsive

## Branding

- Nama: DarsNote
- Parent brand: SAIF Digital Holdings (saif.co.id)
- Warna primer: Navy #1A5276, Gold #D4A017, Teal #148F77
- Tagline: "Rekam. Transkripsi. Pahami."
