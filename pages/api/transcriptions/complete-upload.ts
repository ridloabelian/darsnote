import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCloudflareEnv } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";
import { startTranscriptionWorkflow } from "@/lib/transcription-workflow";

interface UploadedPartInput {
  partNumber: number;
  etag: string;
}

function parseUploadedParts(value: unknown): UploadedPartInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parts = value.map((part) => {
    if (
      typeof part !== "object" ||
      part === null ||
      !Number.isInteger((part as UploadedPartInput).partNumber) ||
      typeof (part as UploadedPartInput).etag !== "string"
    ) {
      return null;
    }
    return {
      partNumber: (part as UploadedPartInput).partNumber,
      etag: (part as UploadedPartInput).etag,
    };
  });

  if (parts.some((part) => !part)) return null;
  return (parts as UploadedPartInput[]).sort((a, b) => a.partNumber - b.partNumber);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }

  const { transcriptionId, uploadId, parts } = req.body as {
    transcriptionId?: string;
    uploadId?: string;
    parts?: unknown;
  };
  if (!transcriptionId || typeof transcriptionId !== "string") {
    return res.status(400).json({ error: "ID transkripsi tidak valid" });
  }

  const transcription = await prisma.transcription.findUnique({
    where: { id: transcriptionId },
  });

  if (!transcription) {
    return res.status(404).json({ error: "Transkripsi tidak ditemukan" });
  }

  if (transcription.userId !== session.user.id) {
    return res.status(403).json({ error: "Akses ditolak" });
  }

  if (!transcription.sourceObjectKey) {
    return res.status(400).json({ error: "File belum terdaftar di R2" });
  }

  const uploadedParts = parseUploadedParts(parts);
  if (!uploadId || typeof uploadId !== "string" || !uploadedParts) {
    return res.status(400).json({ error: "Data multipart upload tidak valid" });
  }

  const upload = requireCloudflareEnv("MEDIA_BUCKET").resumeMultipartUpload(
    transcription.sourceObjectKey,
    uploadId
  );
  await upload.complete(uploadedParts);

  await prisma.transcription.update({
    where: { id: transcription.id },
    data: { status: "queued" },
  });

  await startTranscriptionWorkflow({
    transcriptionId: transcription.id,
    userId: session.user.id,
    sourceType: "file",
    sourceObjectKey: transcription.sourceObjectKey,
    originalName: transcription.title,
  });

  return res.status(200).json({ transcriptionId: transcription.id });
}
