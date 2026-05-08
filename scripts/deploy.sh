#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/darsnote"

echo "==> Masuk ke direktori aplikasi..."
cd "$APP_DIR"

echo "==> Pull kode terbaru..."
git pull origin main

echo "==> Install dependensi..."
npm install --production=false

echo "==> Jalankan migrasi database..."
npx prisma migrate deploy

echo "==> Build Next.js..."
npm run build

echo "==> Reload PM2..."
pm2 reload ecosystem.config.js --env production

echo "==> Simpan konfigurasi PM2..."
pm2 save

echo ""
echo "✓ Deploy selesai!"
pm2 status
