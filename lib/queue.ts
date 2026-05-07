import { Queue } from 'bullmq';

export interface TranscriptionJobData {
  transcriptionId: string;
  userId: string;
  sourceType: 'file' | 'youtube';
  filePath?: string;
  sourceUrl?: string;
  originalName?: string;
}

function getRedisConnection() {
  const raw = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password ? decodeURIComponent(url.password) : undefined,
  };
}

export const transcriptionQueue = new Queue('transcription', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function addTranscriptionJob(data: TranscriptionJobData) {
  return transcriptionQueue.add('transcribe', data);
}
