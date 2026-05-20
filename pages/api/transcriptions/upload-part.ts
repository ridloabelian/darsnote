import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCloudflareEnv } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";

const MAX_PART_SIZE_BYTES = 10 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function getString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Tidak terautentikasi" });
  }

  const transcriptionId = getString(req.query.transcriptionId);
  const uploadId = getString(req.query.uploadId);
  const partNumber = Number(getString(req.query.partNumber));

  if (!transcriptionId || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
    return res.status(400).json({ error: "Parameter upload part tidak valid" });
  }

  const transcription = await prisma.transcription.findUnique({
    where: { id: transcriptionId },
    select: {
      id: true,
      userId: true,
      status: true,
      sourceObjectKey: true,
    },
  });

  if (!transcription) {
    return res.status(404).json({ error: "Transkripsi tidak ditemukan" });
  }

  if (transcription.userId !== session.user.id) {
    return res.status(403).json({ error: "Akses ditolak" });
  }

  if (transcription.status !== "uploading" || !transcription.sourceObjectKey) {
    return res.status(400).json({ error: "Upload tidak dalam status aktif" });
  }

  const body = await readBody(req);
  if (!body.byteLength || body.byteLength > MAX_PART_SIZE_BYTES) {
    return res.status(400).json({ error: "Ukuran part tidak valid" });
  }

  const upload = requireCloudflareEnv("MEDIA_BUCKET").resumeMultipartUpload(
    transcription.sourceObjectKey,
    uploadId
  );
  const uploadedPart = await upload.uploadPart(partNumber, body);

  return res.status(200).json(uploadedPart);
}
