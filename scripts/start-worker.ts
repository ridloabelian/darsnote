import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars BEFORE importing worker modules (which init DB pool, etc.)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  console.log('Memulai DarsNote transcription worker...');

  // Dynamic import ensures prisma/redis are initialized after dotenv.config()
  const { createWorker } = await import('../workers/transcription.worker');
  const worker = createWorker();

  const shutdown = async (signal: string) => {
    console.log(`\nMenerima ${signal}. Menghentikan worker...`);
    await worker.close();
    console.log('Worker berhenti.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('Worker berjalan. Tekan Ctrl+C untuk berhenti.');
}

main().catch((err) => {
  console.error('Gagal menjalankan worker:', err);
  process.exit(1);
});
