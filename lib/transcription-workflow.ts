import { requireCloudflareEnv } from "./cloudflare";
import type { TranscriptionWorkflowParams } from "./cloudflare-types";

export async function startTranscriptionWorkflow(params: TranscriptionWorkflowParams) {
  const workflow = requireCloudflareEnv("TRANSCRIPTION_WORKFLOW");
  return workflow.create({
    id: params.transcriptionId,
    params,
    retention: {
      successRetention: "1 day",
      errorRetention: "7 days",
    },
  });
}
