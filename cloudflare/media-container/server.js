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
  const trimmed = transcript.slice(0, 3000);
  return callGroq(
    groq,
    `Buat ringkasan singkat dari transkripsi kajian Islam berikut dalam Bahasa Indonesia:\n\n${trimmed}`,
    1024
  );
}

async function detectDalils(groq, transcript) {
  const trimmed = transcript.slice(0, 2000);
  const text = await callGroq(
    groq,
    `Dari teks kajian Islam ini, temukan ayat Al-Quran atau Hadits yang disebut. Kembalikan HANYA JSON array:
[{"type":"quran","reference":"Al-Baqarah: 183","text_ar":"","text_id":"...","confidence":0.9}]
Jika tidak ada, kembalikan: []

Teks: ${trimmed}`,
    1024
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
