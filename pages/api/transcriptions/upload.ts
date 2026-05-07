import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addTranscriptionJob } from '@/lib/queue';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

const UPLOAD_DIR = '/tmp/darsnote-uploads';
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

const ALLOWED_EXTENSIONS = new Set([
  '.mp4', '.mov', '.avi', '.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac',
]);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Format tidak didukung: ${ext}`));
    }
  },
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: multer.Multer) {
  return new Promise<void>((resolve, reject) => {
    fn.single('file')(req as any, res as any, (result: unknown) => {
      if (result instanceof Error) reject(result);
      else resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quotaMinutes: true },
  });
  if (!user || user.quotaMinutes <= 0) {
    return res.status(402).json({ error: 'Kuota transkripsi habis' });
  }

  try {
    await runMiddleware(req, res, upload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload gagal';
    return res.status(400).json({ error: msg });
  }

  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: 'File tidak ditemukan dalam request' });
  }

  const title = path.basename(file.originalname, path.extname(file.originalname));

  const transcription = await prisma.transcription.create({
    data: {
      userId: session.user.id,
      title: title || 'Tanpa judul',
      sourceType: 'file',
      status: 'queued',
    },
  });

  await addTranscriptionJob({
    transcriptionId: transcription.id,
    userId: session.user.id,
    sourceType: 'file',
    filePath: file.path,
    originalName: file.originalname,
  });

  return res.status(200).json({ transcriptionId: transcription.id });
}
