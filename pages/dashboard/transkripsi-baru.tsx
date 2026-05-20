import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Link2, AlertCircle, FileAudio } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'avi', 'wav', 'mp3', 'm4a', 'flac', 'ogg', 'aac'];
const MAX_SIZE_MB = 500;
const DEFAULT_PART_SIZE_BYTES = 8 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Format tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Ukuran file maksimal ${MAX_SIZE_MB}MB`;
  }
  return '';
}

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{11}/;

export default function TranskripsiBaruPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((file: File) => {
    const err = validateFile(file);
    setFileError(err);
    if (!err) setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  function validateYoutubeUrl(url: string): string {
    if (!url.trim()) return 'URL YouTube wajib diisi';
    if (!YOUTUBE_REGEX.test(url.trim())) return 'URL YouTube tidak valid';
    return '';
  }

  async function handleFileSubmit() {
    if (!selectedFile) return setError('Pilih file terlebih dahulu');
    setLoading(true);
    setLoadingLabel('Menyiapkan upload...');
    setError('');

    try {
      const prepareRes = await fetch('/api/transcriptions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          sizeBytes: selectedFile.size,
        }),
      });
      const uploadData = (await prepareRes.json()) as {
        error?: string;
        transcriptionId: string;
        uploadId: string;
        partSizeBytes?: number;
      };
      if (!prepareRes.ok) throw new Error(uploadData.error || 'Gagal menyiapkan upload');

      const partSize = uploadData.partSizeBytes || DEFAULT_PART_SIZE_BYTES;
      const totalParts = Math.ceil(selectedFile.size / partSize);
      const uploadedParts: Array<{ partNumber: number; etag: string }> = [];

      for (let index = 0; index < totalParts; index += 1) {
        const partNumber = index + 1;
        const start = index * partSize;
        const end = Math.min(start + partSize, selectedFile.size);
        const chunk = selectedFile.slice(start, end);

        setLoadingLabel(`Mengunggah bagian ${partNumber}/${totalParts}...`);
        const partRes = await fetch(
          `/api/transcriptions/upload-part?transcriptionId=${encodeURIComponent(
            uploadData.transcriptionId
          )}&uploadId=${encodeURIComponent(uploadData.uploadId)}&partNumber=${partNumber}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: chunk,
          }
        );
        const partData = (await partRes.json()) as {
          error?: string;
          partNumber: number;
          etag: string;
        };
        if (!partRes.ok) {
          throw new Error(partData.error || `Upload bagian ${partNumber} gagal`);
        }
        uploadedParts.push({ partNumber: partData.partNumber, etag: partData.etag });
      }

      setLoadingLabel('Memulai workflow...');
      const completeRes = await fetch('/api/transcriptions/complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptionId: uploadData.transcriptionId,
          uploadId: uploadData.uploadId,
          parts: uploadedParts,
        }),
      });
      const completeData = (await completeRes.json()) as {
        error?: string;
        transcriptionId: string;
      };
      if (!completeRes.ok) throw new Error(completeData.error || 'Gagal memulai workflow');

      router.push(`/dashboard/transkripsi/${completeData.transcriptionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
      setLoadingLabel('');
    }
  }

  async function handleYoutubeSubmit() {
    const urlErr = validateYoutubeUrl(youtubeUrl);
    if (urlErr) return setYoutubeError(urlErr);

    setLoading(true);
    setLoadingLabel('Memulai workflow...');
    setError('');

    try {
      const res = await fetch('/api/transcriptions/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      const data = (await res.json()) as { error?: string; transcriptionId: string };
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan job');
      router.push(`/dashboard/transkripsi/${data.transcriptionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
      setLoadingLabel('');
    }
  }

  return (
    <>
      <Head>
        <title>Transkripsi Baru — DarsNote</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transkripsi Baru</h1>
          <p className="text-gray-500 mb-6">
            Upload file audio/video atau tempel URL YouTube untuk memulai transkripsi.
          </p>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'file'
                  ? 'border-[#1A5276] text-[#1A5276]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileAudio size={16} />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'youtube'
                  ? 'border-[#1A5276] text-[#1A5276]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Link2 size={16} />
              YouTube URL
            </button>
          </div>

          {/* Upload File Tab */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#1A5276] bg-blue-50'
                    : 'border-gray-300 hover:border-[#1A5276] hover:bg-gray-50'
                }`}
              >
                <UploadCloud
                  size={40}
                  className={`mx-auto mb-3 ${isDragging ? 'text-[#1A5276]' : 'text-gray-400'}`}
                />
                <p className="text-sm font-medium text-gray-700">
                  Seret & letakkan file di sini, atau{' '}
                  <span className="text-[#1A5276] underline">pilih file</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')} — Maks. {MAX_SIZE_MB}MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              {fileError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} /> {fileError}
                </p>
              )}

              {selectedFile && !fileError && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FileAudio size={20} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <Button
                onClick={handleFileSubmit}
                disabled={!selectedFile || !!fileError || loading}
                className="w-full bg-[#1A5276] hover:bg-[#154360] text-white"
              >
                {loading ? loadingLabel || 'Memproses...' : 'Mulai Transkripsi'}
              </Button>
            </div>
          )}

          {/* YouTube URL Tab */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  URL YouTube
                </label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (youtubeError) setYoutubeError(validateYoutubeUrl(e.target.value));
                  }}
                  className={youtubeError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
                {youtubeError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {youtubeError}
                  </p>
                )}
                {youtubeUrl && !youtubeError && YOUTUBE_REGEX.test(youtubeUrl.trim()) && (
                  <p className="text-sm text-green-600 mt-1">URL valid</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <Button
                onClick={handleYoutubeSubmit}
                disabled={loading}
                className="w-full bg-[#1A5276] hover:bg-[#154360] text-white"
              >
                {loading ? loadingLabel || 'Memproses...' : 'Mulai Transkripsi'}
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/masuk', permanent: false } };
  }
  return { props: {} };
};
