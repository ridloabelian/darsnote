import { Worker, type Job } from 'bullmq';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { transcribeAudio } from '../lib/groq';
import { generateSummary, detectDalils } from '../lib/analysis';
import { downloadYoutubeAudio } from '../lib/ytdlp';
import type { TranscriptionJobData } from '../lib/queue';

function getRedisConnection() {
  const raw = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password ? decodeURIComponent(url.password) : undefined,
  };
}

async function processJob(job: Job<TranscriptionJobData>): Promise<void> {
  const { transcriptionId, userId, sourceType, filePath, sourceUrl } = job.data;
  let audioPath: string | null = null;
  const isYoutube = sourceType === 'youtube';

  try {
    await prisma.transcription.update({
      where: { id: transcriptionId },
      data: { status: 'processing' },
    });

    if (isYoutube) {
      if (!sourceUrl) throw new Error('sourceUrl wajib ada untuk job YouTube');
      audioPath = path.join('/tmp', `${transcriptionId}.mp3`);
      console.log(`[${transcriptionId}] Mengunduh audio YouTube...`);
      await downloadYoutubeAudio(sourceUrl, audioPath);
    } else {
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('File audio tidak ditemukan');
      }
      audioPath = filePath;
    }

    console.log(`[${transcriptionId}] Transkripsi audio...`);
    const { text, durationSeconds } = await transcribeAudio(audioPath);

    console.log(`[${transcriptionId}] Membuat ringkasan...`);
    const summary = await generateSummary(text);

    console.log(`[${transcriptionId}] Mendeteksi dalil...`);
    const dalils = await detectDalils(text);

    await prisma.transcription.update({
      where: { id: transcriptionId },
      data: {
        status: 'completed',
        transcriptText: text,
        summaryText: summary,
        durationSeconds,
      },
    });

    if (dalils.length > 0) {
      await prisma.dalil.createMany({
        data: dalils.map((d) => ({
          transcriptionId,
          type: d.type,
          reference: d.reference,
          textAr: d.text_ar,
          textId: d.text_id,
          confidence: d.confidence,
        })),
      });
    }

    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    await prisma.user.update({
      where: { id: userId },
      data: { quotaMinutes: { decrement: durationMinutes } },
    });

    console.log(
      `[${transcriptionId}] Selesai. Durasi: ${durationSeconds}s, Dalil ditemukan: ${dalils.length}`
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[${transcriptionId}] Gagal:`, msg);

    await prisma.transcription
      .update({
        where: { id: transcriptionId },
        data: { status: 'failed', errorMessage: msg },
      })
      .catch(console.error);

    throw error;
  } finally {
    if (audioPath) {
      try {
        fs.unlinkSync(audioPath);
      } catch {
        // file mungkin sudah terhapus
      }
    }
  }
}

export function createWorker() {
  const worker = new Worker<TranscriptionJobData>('transcription', processJob, {
    connection: getRedisConnection(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} selesai`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} gagal:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  return worker;
}
