import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-20250514';

export interface DalilItem {
  type: 'quran' | 'hadits';
  reference: string;
  text_ar: string;
  text_id: string;
  confidence: number;
}

export async function generateSummary(transcript: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content:
          'Buat ringkasan singkat dan padat dari transkripsi kajian Islam berikut dalam Bahasa Indonesia. ' +
          'Fokus pada topik utama, poin-poin penting, dan kesimpulan yang disampaikan:\n\n' +
          transcript,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Claude response type');
  return block.text;
}

export async function detectDalils(transcript: string): Promise<DalilItem[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Dari transkripsi kajian Islam berikut, identifikasi semua dalil (ayat Al-Quran dan Hadits) yang disebutkan atau dikutip.

Kembalikan HANYA JSON array (tanpa teks tambahan) dengan format:
[
  {
    "type": "quran",
    "reference": "Al-Baqarah: 183",
    "text_ar": "يَا أَيُّهَا الَّذِينَ آمَنُوا...",
    "text_id": "Wahai orang-orang yang beriman...",
    "confidence": 0.95
  }
]

Aturan:
- "type": "quran" atau "hadits" saja
- "reference": nama surat/nomor ayat, atau rawi hadits
- "text_ar": teks Arab (boleh kosong string jika tidak ada)
- "text_id": terjemahan Indonesia
- "confidence": 0.0–1.0

Jika tidak ada dalil, kembalikan: []

Transkripsi:
${transcript}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') return [];

  try {
    const match = block.text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as DalilItem[];
  } catch {
    return [];
  }
}
