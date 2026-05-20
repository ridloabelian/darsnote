import { createServer } from "node:http";
import { createWriteStream, createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import Groq from "groq-sdk";

const execFileAsync = promisify(execFile);
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "llama-3.1-8b-instant";

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function r2ObjectUrl(baseUrl, key) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/+$/, "")}/${encodedKey}`;
}

async function downloadR2Object(baseUrl, key, filePath) {
  const response = await fetch(r2ObjectUrl(baseUrl, key));
  if (!response.ok || !response.body) {
    throw new Error(`Gagal membaca file dari R2: ${response.status} ${await response.text()}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
}

async function downloadYoutubeAudio(url, outputPath) {
  await execFileAsync(
    "yt-dlp",
    [
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "5",
      "--no-playlist",
      "--output",
      outputPath,
      url,
    ],
    { timeout: 60 * 60 * 1000 }
  );
}

async function transcribeAudio(groq, filePath) {
  const response = await groq.audio.transcriptions.create({
    file: createReadStream(filePath),
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
  });

  return {
    text: response.text || "",
    durationSeconds: Math.round(response.duration || 0),
  };
}

async function callGroq(groq, prompt, maxTokens = 1024) {
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content || "";
}

async function generateSummary(groq, transcript) {
  const trimmed = transcript.slice(0, 25000);
  return callGroq(
    groq,
    `Anda adalah seorang asisten ahli penulisan notulensi kajian Islam. Tugas Anda adalah menyusun Notulensi Kajian yang sangat rapi, indah, dan terstruktur berdasarkan teks transkripsi kajian Islam yang diberikan.

Gunakan format Markdown yang estetik dengan pembagian struktur berikut:

# 📝 NOTULENSI KAJIAN

### ℹ️ IDENTITAS KAJIAN
| Informasi | Detail |
| --- | --- |
| **Pemateri** | [Nama Ustadz/Pemateri jika terdeteksi dalam teks, jika tidak isi dengan "-"] |
| **Tema Kajian** | [Judul/Tema utama berdasarkan isi pembahasan] |
| **Fokus Pembahasan** | [1 kalimat rangkuman fokus pembahasan] |

---

### 🔑 POIN-POIN UTAMA (KEY TAKEAWAYS)
- Tuliskan 3-5 poin utama yang menjadi inti pesan dari kajian ini secara singkat dan padat.

---

### 📖 PEMBAHASAN DETAIL
Gunakan sub-heading (contoh: **1. Konsep Gotong Royong**) untuk membagi pembahasan menjadi bab-bab terstruktur. 
Jelaskan narasi dan poin-poin penting di bawah setiap sub-heading secara mendalam namun mudah dipahami.
Sertakan contoh kisah sahabat, periwayatan, analogi, atau ilustrasi yang disebutkan dalam kajian secara lengkap (misal kisah paman Anas bin Malik bernama Haram yang dikirim belajar Quran bersama 70 orang Ansar ahli Quran, atau kisah Abu Hurairah yang telat shalat Isya dan konsep berbagi makanan).

---

### 💡 PELAJARAN PRAKTIS (ACTIONABLE INSIGHTS)
- Berikan daftar tindakan nyata atau aplikasi praktis yang bisa diamalkan oleh pendengar dalam kehidupan sehari-hari berdasarkan materi kajian.

Teks Transkripsi Kajian:
${trimmed}`,
    2048
  );
}

async function detectDalils(groq, transcript) {
  const trimmed = transcript.slice(0, 25000);
  const text = await callGroq(
    groq,
    `Tugas Anda adalah mendeteksi semua dalil berupa ayat Al-Quran atau Hadits yang disebutkan, dirujuk, atau diceritakan kisahnya dalam teks transkripsi kajian Islam berikut.

Untuk setiap dalil yang terdeteksi:
1. Tentukan jenisnya ("quran" atau "hadits").
2. Tuliskan referensinya secara jelas (misal: "Al-Baqarah: 183" untuk Quran, atau nama periwayat hadits seperti "HR. Bukhari (Narasi Anas bin Malik)" atau "HR. Muslim" jika terdeteksi, atau sebutkan nama sahabat utama seperti "Anas bin Malik" atau "Abu Hurairah" sebagai referensi utama).
3. Cari di memori/knowledge base Anda dan tuliskan teks asli bahasa Arab lengkap dengan harakat/tanda baca di kolom "text_ar". PASTIKAN teks Arab ini akurat, lengkap, dan benar. JANGAN biarkan kosong atau berisi "...".
4. Tuliskan terjemahan lengkap dalam Bahasa Indonesia di kolom "text_id". JANGAN biarkan kosong atau berisi "...".
5. Tentukan tingkat keyakinan (confidence) dari skala 0.0 hingga 1.0.

Kembalikan hasil analisis Anda HANYA dalam format JSON array valid seperti contoh di bawah ini (tanpa teks penjelasan lainnya):
[
  {
    "type": "quran",
    "reference": "Al-Baqarah: 183",
    "text_ar": "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِنْ قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ",
    "text_id": "Wahai orang-orang yang beriman! Diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang sebelum kamu agar kamu bertakwa.",
    "confidence": 0.95
  },
  {
    "type": "hadits",
    "reference": "HR. Muslim (Narasi Anas bin Malik)",
    "text_ar": "الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ",
    "text_id": "Orang yang menunjukkan kepada kebaikan, akan mendapatkan pahala seperti orang yang melakukannya.",
    "confidence": 0.90
  }
]

Teks Transkripsi Kajian:
${trimmed}`,
    2048
  );

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.type && item?.reference);
  } catch {
    return [];
  }
}

async function processJob(payload) {
  const apiKey = payload.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY belum dikonfigurasi untuk media container");
  }

  const groq = new Groq({ apiKey });

  const ext = extname(payload.originalName || "") || ".mp3";
  const safeBase = basename(payload.transcriptionId).replace(/[^a-zA-Z0-9_-]/g, "");
  const audioPath = join("/tmp", `${safeBase}${ext}`);

  try {
    if (payload.sourceType === "youtube") {
      if (!payload.sourceUrl) throw new Error("sourceUrl wajib ada untuk job YouTube");
      await downloadYoutubeAudio(payload.sourceUrl, audioPath);
    } else {
      if (!payload.sourceObjectKey) throw new Error("sourceObjectKey wajib ada untuk job file");
      await downloadR2Object(payload.r2BaseUrl, payload.sourceObjectKey, audioPath);
    }

    const { text, durationSeconds } = await transcribeAudio(groq, audioPath);
    const summary = await generateSummary(groq, text);
    const dalils = await detectDalils(groq, text);

    return {
      text,
      summary,
      durationSeconds,
      dalils,
    };
  } finally {
    await unlink(audioPath).catch(() => {});
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { ok: true });
    }

    if (req.method !== "POST" || req.url !== "/process") {
      return json(res, 404, { error: "Not found" });
    }

    const payload = await readJson(req);
    const result = await processJob(payload);
    return json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return json(res, 500, { error: message });
  }
});

server.listen(8080, "0.0.0.0", () => {
  console.log("DarsNote media container listening on :8080");
});
