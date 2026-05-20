import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import path from "path";
import { authOptions } from "@/lib/auth";
import { requireCloudflareEnv } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";

const MAX_SIZE_BYTES = 500 * 1024 * 1024;
const PART_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".wav",
  ".mp3",
  ".m4a",
  ".flac",
  ".ogg",
  ".aac",
]);

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }

  const { filename, contentType, sizeBytes } = req.body as {
    filename?: string;
    contentType?: string;
    sizeBytes?: number;
  };

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Nama file wajib diisi" });
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return res.status(400).json({ error: `Format tidak didukung: ${ext}` });
  }

  const fileSize = Number(sizeBytes);
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_SIZE_BYTES) {
    return res.status(400).json({ error: "Ukuran file tidak valid atau melebihi 500MB" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { quotaMinutes: true },
  });
  if (!user || user.quotaMinutes <= 0) {
    return res.status(402).json({ error: "Kuota transkripsi habis" });
  }

  const title = path.basename(filename, ext) || "Tanpa judul";
  const transcription = await prisma.transcription.create({
    data: {
      userId: session.user.id,
      title,
      sourceType: "file",
      status: "uploading",
      sourceSizeBytes: Math.round(fileSize),
      sourceContentType: contentType || "application/octet-stream",
    },
  });

  const safeFilename = sanitizeFilename(filename);
  const objectKey = `uploads/${session.user.id}/${transcription.id}/${safeFilename}`;

  await prisma.transcription.update({
    where: { id: transcription.id },
    data: { sourceObjectKey: objectKey },
  });

  const upload = await requireCloudflareEnv("MEDIA_BUCKET").createMultipartUpload(objectKey, {
    httpMetadata: {
      contentType: contentType || "application/octet-stream",
    },
  });

  return res.status(200).json({
    transcriptionId: transcription.id,
    objectKey,
    uploadId: upload.uploadId,
    partSizeBytes: PART_SIZE_BYTES,
  });
}
