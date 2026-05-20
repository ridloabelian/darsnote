import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startTranscriptionWorkflow } from '@/lib/transcription-workflow';

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{11}/;

function isValidYoutubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL YouTube wajib diisi' });
  }

  if (!isValidYoutubeUrl(url.trim())) {
    return res.status(400).json({ error: 'URL YouTube tidak valid' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quotaMinutes: true },
  });
  if (!user || user.quotaMinutes <= 0) {
    return res.status(402).json({ error: 'Kuota transkripsi habis' });
  }

  const cleanUrl = url.trim();

  const transcription = await prisma.transcription.create({
    data: {
      userId: session.user.id,
      title: 'YouTube: ' + cleanUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60),
      sourceType: 'youtube',
      sourceUrl: cleanUrl,
      status: 'queued',
    },
  });

  await startTranscriptionWorkflow({
    transcriptionId: transcription.id,
    userId: session.user.id,
    sourceType: 'youtube',
    sourceUrl: cleanUrl,
  });

  return res.status(200).json({ transcriptionId: transcription.id });
}
