import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGroq(prompt: string, maxTokens: number = 1024): Promise<string> {
  // Sleep untuk menghindari rate limit pada tier gratis/rendah
  await sleep(3000);
  
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0]?.message?.content || '';
}

export interface DalilItem {
  type: 'quran' | 'hadits';
  reference: string;
  text_ar: string;
  text_id: string;
  confidence: number;
}

export async function generateSummary(transcript: string): Promise<string> {
  const trimmed = transcript.slice(0, 3000);
  return callGroq(
    'Buat ringkasan singkat dari transkripsi kajian Islam berikut dalam Bahasa Indonesia:\n\n' + trimmed
  );
}

export async function detectDalils(transcript: string): Promise<DalilItem[]> {
  const trimmed = transcript.slice(0, 2000);
  const text = await callGroq(
    `Dari teks kajian Islam ini, temukan ayat Al-Quran atau Hadits yang disebut. Kembalikan HANYA JSON array:
[{"type":"quran","reference":"Al-Baqarah: 183","text_ar":"","text_id":"...","confidence":0.9}]
Jika tidak ada, kembalikan: []

Teks: ${trimmed}`,
    1024
  );

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as DalilItem[];
  } catch {
    return [];
  }
}
