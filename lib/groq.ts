import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function transcribeAudio(
  filePath: string
): Promise<{ text: string; durationSeconds: number }> {
  const response = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-large-v3-turbo',
    response_format: 'verbose_json',
  });

  // verbose_json returns duration but SDK types only declare text
  const result = response as unknown as { text: string; duration?: number };
  return {
    text: result.text,
    durationSeconds: Math.round(result.duration ?? 0),
  };
}
