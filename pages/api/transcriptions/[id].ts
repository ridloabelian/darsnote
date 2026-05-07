import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID tidak valid' });
  }

  const transcription = await prisma.transcription.findUnique({
    where: { id },
    include: {
      dalils: {
        orderBy: { confidence: 'desc' },
      },
    },
  });

  if (!transcription) {
    return res.status(404).json({ error: 'Transkripsi tidak ditemukan' });
  }

  if (transcription.userId !== session.user.id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  return res.status(200).json(transcription);
}
