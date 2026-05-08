import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2, AlertCircle, FileAudio, Youtube, Clock, Calendar } from 'lucide-react';

interface TranscriptionRow {
  id: string;
  title: string;
  sourceType: 'file' | 'youtube';
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  durationSeconds: number | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Antrian', className: 'bg-gray-100 text-gray-600' },
  queued: { label: 'Antrian', className: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Memproses', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Selesai', className: 'bg-green-100 text-green-700' },
  failed: { label: 'Gagal', className: 'bg-red-100 text-red-700' },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function RiwayatPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TranscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/transcriptions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
        else setError(data.error || 'Gagal memuat riwayat');
      })
      .catch(() => setError('Koneksi bermasalah'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>Riwayat Transkripsi — DarsNote</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Riwayat Transkripsi</h1>
            <p className="text-sm text-gray-500 mt-1">Semua transkripsi yang pernah kamu buat</p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Memuat...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FileAudio size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-500">Belum ada transkripsi</p>
              <p className="text-sm mt-1">
                Mulai dengan{' '}
                <button
                  onClick={() => router.push('/dashboard/transkripsi-baru')}
                  className="text-[#1A5276] hover:underline"
                >
                  membuat transkripsi baru
                </button>
              </p>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header — hidden on mobile */}
              <div className="hidden md:grid grid-cols-[1fr_120px_110px_90px_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span>Judul</span>
                <span>Sumber</span>
                <span>Status</span>
                <span>Durasi</span>
                <span>Tanggal</span>
              </div>

              {rows.map((row, idx) => {
                const badge = STATUS_BADGE[row.status] ?? STATUS_BADGE.pending;
                return (
                  <button
                    key={row.id}
                    onClick={() => router.push(`/dashboard/transkripsi/${row.id}`)}
                    className={`w-full text-left flex flex-col md:grid md:grid-cols-[1fr_120px_110px_90px_100px] gap-2 md:gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                      idx !== rows.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    {/* Title */}
                    <span className="font-medium text-gray-900 text-sm truncate pr-2">
                      {row.title}
                    </span>

                    {/* Source */}
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      {row.sourceType === 'youtube' ? (
                        <>
                          <Youtube size={13} className="text-red-500 flex-shrink-0" />
                          YouTube
                        </>
                      ) : (
                        <>
                          <FileAudio size={13} className="text-[#1A5276] flex-shrink-0" />
                          File Upload
                        </>
                      )}
                    </span>

                    {/* Status badge */}
                    <span>
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </span>

                    {/* Duration */}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} className="flex-shrink-0" />
                      {row.durationSeconds ? formatDuration(row.durationSeconds) : '—'}
                    </span>

                    {/* Date */}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} className="flex-shrink-0" />
                      {formatDate(row.createdAt)}
                    </span>
                  </button>
                );
              })}
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
