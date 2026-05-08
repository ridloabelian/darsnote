# DarsNote

Platform SaaS AI transkripsi kajian Islam — [dars.saif.co.id](https://dars.saif.co.id)

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Prisma + PostgreSQL · NextAuth.js · BullMQ + Redis · Groq Whisper · Claude AI · yt-dlp

---

## Development (Setup Lokal)

### Prasyarat

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- `yt-dlp` tersedia di PATH (`pip install yt-dlp` atau binary dari [yt-dlp.org](https://github.com/yt-dlp/yt-dlp/releases))

### Langkah Setup

```bash
# 1. Clone repo
git clone https://github.com/saif-digital/darsnote.git
cd darsnote

# 2. Install dependensi
npm install

# 3. Salin dan isi environment variables
cp .env.example .env
# Edit .env — isi DATABASE_URL, NEXTAUTH_SECRET, GROQ_API_KEY, ANTHROPIC_API_KEY, dst.

# 4. Jalankan migrasi database
npx prisma migrate dev

# 5. Jalankan Next.js dev server
npm run dev

# 6. Di terminal terpisah, jalankan BullMQ worker
npm run worker
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Deployment ke VPS (IDCloudHost Ubuntu 22.04)

### 1. Persiapan Server (sekali saja)

```bash
# Install Node.js 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20 && nvm use 20 && nvm alias default 20

# Install PM2
npm install -g pm2

# Install PostgreSQL & Redis
sudo apt install -y postgresql redis-server

# Install yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod +x /usr/local/bin/yt-dlp

# Buat database PostgreSQL
sudo -u postgres psql -c "CREATE USER darsnote WITH PASSWORD 'GANTI_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE darsnote OWNER darsnote;"

# Clone repo ke server
sudo mkdir -p /var/www/darsnote
sudo chown $USER:$USER /var/www/darsnote
git clone https://github.com/saif-digital/darsnote.git /var/www/darsnote

# Buat file environment production
cp /var/www/darsnote/.env.example /var/www/darsnote/.env.production
# Edit .env.production dengan nilai produksi yang benar
nano /var/www/darsnote/.env.production
```

### 2. Deploy Pertama Kali

```bash
cd /var/www/darsnote
npm install --production=false
npx prisma migrate deploy
npm run build

# Jalankan dengan PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # ikuti instruksi yang muncul agar PM2 auto-start
```

### 3. Setup Nginx

```bash
# Salin konfigurasi
sudo cp nginx/darsnote.conf /etc/nginx/sites-available/darsnote
sudo ln -s /etc/nginx/sites-available/darsnote /etc/nginx/sites-enabled/

# Uji konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Install SSL via Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dars.saif.co.id
```

### 4. Deploy Update Selanjutnya

```bash
bash /var/www/darsnote/scripts/deploy.sh
```

Script ini otomatis: `git pull` → `npm install` → `prisma migrate deploy` → `npm run build` → `pm2 reload`.

---

## Menjalankan Worker

Worker BullMQ berjalan sebagai proses terpisah dari Next.js app.

**Lokal:**
```bash
npm run worker
```

**Produksi (PM2):**
Worker sudah termasuk dalam `ecosystem.config.js` sebagai `darsnote-worker` dan dijalankan bersama `pm2 start ecosystem.config.js`.

Monitor status:
```bash
pm2 status
pm2 logs darsnote-worker
```

---

## Environment Variables

Lihat [`.env.example`](.env.example) untuk daftar lengkap beserta penjelasan tiap variabel.

---

## Struktur Penting

```
pages/
  dashboard/
    index.tsx          # Dashboard utama (kuota)
    riwayat.tsx        # Riwayat transkripsi
    transkripsi-baru.tsx
    transkripsi/[id].tsx
  api/
    transcriptions/
      index.ts         # GET list transkripsi
      [id].ts          # GET detail
      upload.ts        # POST upload file audio
      youtube.ts       # POST submit URL YouTube
      export/[id].ts   # GET download TXT
workers/
  transcription.worker.ts  # BullMQ worker (Whisper + Claude)
scripts/
  deploy.sh            # Script deploy manual
ecosystem.config.js    # Konfigurasi PM2
nginx/darsnote.conf    # Konfigurasi Nginx
```

---

Milik [PT SAIF Digital Holdings](https://saif.co.id) — tagline: *Rekam. Transkripsi. Pahami.*
