/// <reference types="@cloudflare/workers-types" />

import type { Container } from "@cloudflare/containers";

export interface TranscriptionWorkflowParams {
  transcriptionId: string;
  userId: string;
  sourceType: "file" | "youtube";
  sourceUrl?: string;
  sourceObjectKey?: string;
  originalName?: string;
}

export interface ProcessorDalil {
  type: "quran" | "hadits";
  reference: string;
  text_ar?: string;
  text_id?: string;
  confidence?: number;
}

export interface ProcessorResult {
  text: string;
  summary: string;
  durationSeconds: number;
  dalils: ProcessorDalil[];
}

export interface CloudflareEnv {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  TRANSCRIPTION_WORKFLOW: Workflow<TranscriptionWorkflowParams>;
  MEDIA_PROCESSOR: DurableObjectNamespace<Container>;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  IMAGES: unknown;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GROQ_API_KEY?: string;
  GROQ_TEXT_MODEL?: string;
  R2_BUCKET_NAME?: string;
  NEXTJS_ENV?: string;
}
