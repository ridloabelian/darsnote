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
    include: { dalils: { orderBy: { confidence: 'desc' } } },
  });

  if (!transcription) {
    return res.status(404).json({ error: 'Transkripsi tidak ditemukan' });
  }

  if (transcription.userId !== session.user.id) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  if (transcription.status !== 'completed') {
    return res.status(400).json({ error: 'Transkripsi belum selesai' });
  }

  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('DARSNOTE — Hasil Transkripsi Kajian Islam');
  lines.push('='.repeat(60));
  lines.push(`Judul    : ${transcription.title}`);
  lines.push(`Tanggal  : ${new Date(transcription.createdAt).toLocaleString('id-ID')}`);
  if (transcription.sourceUrl) {
    lines.push(`Sumber   : ${transcription.sourceUrl}`);
  }
  if (transcription.durationSeconds) {
    const m = Math.floor(transcription.durationSeconds / 60);
    const s = transcription.durationSeconds % 60;
    lines.push(`Durasi   : ${m}m ${s}s`);
  }
  lines.push('');

  if (transcription.summaryText) {
    lines.push('='.repeat(60));
    lines.push('RINGKASAN');
    lines.push('='.repeat(60));
    lines.push(transcription.summaryText);
    lines.push('');
  }

  if (transcription.dalils.length > 0) {
    lines.push('='.repeat(60));
    lines.push('DALIL YANG DISEBUTKAN');
    lines.push('='.repeat(60));
    transcription.dalils.forEach((d, i) => {
      lines.push(`\n[${i + 1}] ${d.type.toUpperCase()} — ${d.reference}`);
      if (d.textAr) lines.push(`Arab  : ${d.textAr}`);
      if (d.textId) lines.push(`Arti  : ${d.textId}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(60));
  lines.push('TRANSKRIPSI LENGKAP');
  lines.push('='.repeat(60));
  lines.push(transcription.transcriptText || '');
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('Dihasilkan oleh DarsNote — dars.saif.co.id');
  lines.push('='.repeat(60));

  const content = lines.join('\n');
  const filename = `darsnote-${transcription.id.slice(0, 8)}.txt`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(content);
}
