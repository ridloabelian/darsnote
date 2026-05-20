import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { startTranscriptionWorkflow } from '@/lib/transcription-workflow';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, userId } = req.body as { url?: string; userId?: string };
  if (!url || !userId) {
    return res.status(400).json({ error: 'URL and userId required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const transcription = await prisma.transcription.create({
    data: {
      userId,
      title: 'Test YouTube: ' + url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60),
      sourceType: 'youtube',
      sourceUrl: url,
      status: 'queued',
    },
  });

  await startTranscriptionWorkflow({
    transcriptionId: transcription.id,
    userId,
    sourceType: 'youtube',
    sourceUrl: url,
  });

  return res.status(200).json({ success: true, transcriptionId: transcription.id });
}
