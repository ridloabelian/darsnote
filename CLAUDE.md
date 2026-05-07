# DarsNote - dars.saif.co.id
Platform SaaS AI transkripsi kajian Islam milik PT SAIF Digital Holdings.

## Stack
- Next.js 14 (Pages Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM + PostgreSQL
- NextAuth.js (Email + Google OAuth)
- BullMQ + Redis (async transcription queue)
- Groq SDK (Whisper - transkripsi audio)
- Anthropic SDK (Claude - summarization + deteksi dalil)
- yt-dlp via child_process (ekstrak audio YouTube)
- Multer (file upload handler)

## Deployment Target
VPS IDCloudHost - Ubuntu 22.04
- PM2 untuk Next.js app
- Supervisor untuk BullMQ worker (proses terpisah)
- Nginx reverse proxy + SSL Certbot
- PostgreSQL + Redis lokal di VPS

## MVP Features (P0 - harus selesai duluan)
1. Landing page dengan CTA early access
2. Auth: Register + Login (Email & Google)
3. Dashboard: tampilkan kuota menit tersisa
4. Upload file audio/video -> queue -> transkripsi Groq Whisper
5. Paste YouTube URL -> yt-dlp -> queue -> transkripsi
6. Ringkasan otomatis via Claude API
7. Deteksi dalil (Quran & Hadits) via Claude API
8. Riwayat transkripsi (list + detail)
9. Export hasil ke TXT

## Constraints
- Bahasa UI: Indonesia
- Kuota free: 30 menit/user (hardcoded dulu, billing menyusul)
- File upload max: 500MB
- Hapus file audio dari server setelah proses selesai (privacy)
- Mobile-first responsive

## Branding
- Nama: DarsNote
- Parent brand: SAIF Digital Holdings (saif.co.id)
- Warna primer: Navy #1A5276, Gold #D4A017, Teal #148F77
- Tagline: "Rekam. Transkripsi. Pahami."
