import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Download, BookOpen, AlignLeft, ScrollText, AlertCircle, Loader2 } from 'lucide-react';

interface Dalil {
  id: string;
  type: 'quran' | 'hadits';
  reference: string;
  textAr: string | null;
  textId: string | null;
  confidence: number;
}

interface Transcription {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  status: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  durationSeconds: number | null;
  transcriptText: string | null;
  summaryText: string | null;
  errorMessage: string | null;
  createdAt: string;
  dalils: Dalil[];
}

const STATUS_CONFIG = {
  uploading: {
    label: 'Menunggu upload selesai...',
    color: 'text-gray-700 bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  queued: {
    label: 'Menunggu di antrian...',
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    dot: 'bg-yellow-400',
  },
  processing: {
    label: 'Sedang memproses...',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    dot: 'bg-blue-400 animate-pulse',
  },
  completed: {
    label: 'Selesai',
    color: 'text-green-700 bg-green-50 border-green-200',
    dot: 'bg-green-500',
  },
  failed: {
    label: 'Gagal',
    color: 'text-red-700 bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function renderInline(text: string): React.ReactNode {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return <span className="text-gray-400">—</span>;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-3 space-y-1.5 text-gray-700 text-sm">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key: string) => {
    if (inTable && tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${key}`} className="overflow-hidden border border-gray-200 rounded-lg my-4 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#1A5276]/5">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-[#1A5276] uppercase tracking-wider border-b border-gray-200"
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-2.5 text-sm text-gray-700 font-medium"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table line
    if (line.startsWith('|')) {
      flushList(String(i));
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      const isSeparator = cells.every((c) => /^[:-]+$/.test(c) || c === '');
      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable(String(i));
    }

    // Horizontal Rule
    if (line === '---') {
      flushList(String(i));
      elements.push(<hr key={`hr-${i}`} className="my-5 border-gray-200" />);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList(String(i));
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-extrabold text-[#1A5276] mt-6 mb-4 pb-1.5 border-b border-gray-100 flex items-center gap-2">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushList(String(i));
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-gray-800 mt-5 mb-3 flex items-center gap-2">
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      flushList(String(i));
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-gray-800 mt-4 mb-2 flex items-center gap-2">
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      flushList(String(i));
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-[#1A5276] mt-3.5 mb-1.5 flex items-center gap-2">
          {renderInline(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {renderInline(line.substring(2))}
        </li>
      );
      continue;
    }

    // Paragraph
    if (line !== '') {
      flushList(String(i));
      elements.push(
        <p key={`p-${i}`} className="text-gray-700 leading-relaxed mb-3 text-sm">
          {renderInline(line)}
        </p>
      );
    } else {
      flushList(String(i));
    }
  }

  // Final flush
  flushList('final');
  flushTable('final');

  return <div className="space-y-1">{elements}</div>;
}

export default function TranskripsiDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState<Transcription | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [activeResultTab, setActiveResultTab] = useState<'transcript' | 'summary' | 'dalils'>(
    'transcript'
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const res = await fetch(`/api/transcriptions/${id}`);
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setFetchError(d.error || 'Gagal memuat data');
        return;
      }
      const d: Transcription = await res.json();
      setData(d);
      if (d.status === 'completed' || d.status === 'failed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      setFetchError('Koneksi bermasalah, mencoba ulang...');
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id, fetchStatus]);

  const isDone = data?.status === 'completed' || data?.status === 'failed';
  const statusCfg = data ? STATUS_CONFIG[data.status] : null;

  return (
    <>
      <Head>
        <title>{data?.title || 'Transkripsi'} — DarsNote</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {fetchError && !data && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle size={18} />
              <span>{fetchError}</span>
            </div>
          )}

          {!data && !fetchError && (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Memuat data...</span>
            </div>
          )}

          {data && (
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 truncate">{data.title}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span>
                    {new Date(data.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {data.durationSeconds && (
                    <span>· {formatDuration(data.durationSeconds)}</span>
                  )}
                  {data.sourceUrl && (
                    <a
                      href={data.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1A5276] hover:underline truncate max-w-[200px]"
                    >
                      Sumber
                    </a>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {!isDone || data.status === 'failed' ? (
                <div
                  className={`flex items-center gap-3 border rounded-lg p-4 mb-6 ${statusCfg?.color}`}
                >
                  {data.status === 'processing' ? (
                    <Loader2 size={18} className="animate-spin flex-shrink-0" />
                  ) : (
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusCfg?.dot}`} />
                  )}
                  <div>
                    <p className="font-medium">{statusCfg?.label}</p>
                    {data.status === 'processing' && (
                      <p className="text-xs mt-0.5 opacity-75">
                        Transkripsi + ringkasan + deteksi dalil sedang berjalan...
                      </p>
                    )}
                    {data.status === 'failed' && data.errorMessage && (
                      <p className="text-xs mt-0.5">{data.errorMessage}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Processing steps animation */}
              {data.status === 'processing' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
                  {[
                    { icon: '🎙️', label: 'Mentranskripsi audio dengan Whisper...' },
                    { icon: '📝', label: 'Membuat ringkasan dengan Groq...' },
                    { icon: '📖', label: 'Mendeteksi dalil Al-Quran & Hadits...' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-base">{step.icon}</span>
                      <span>{step.label}</span>
                      <Loader2 size={14} className="ml-auto animate-spin text-blue-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {data.status === 'completed' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex border-b border-gray-200 w-full">
                      {(
                        [
                          { key: 'transcript', label: 'Transkripsi', icon: <AlignLeft size={14} /> },
                          { key: 'summary', label: 'Ringkasan', icon: <ScrollText size={14} /> },
                          {
                            key: 'dalils',
                            label: `Dalil (${data.dalils.length})`,
                            icon: <BookOpen size={14} />,
                          },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveResultTab(tab.key)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeResultTab === tab.key
                              ? 'border-[#1A5276] text-[#1A5276]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    {activeResultTab === 'transcript' && (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                          {data.transcriptText || '—'}
                        </p>
                      </div>
                    )}

                    {activeResultTab === 'summary' && (
                      <div className="max-w-none">
                        <MarkdownRenderer content={data.summaryText || ''} />
                      </div>
                    )}

                    {activeResultTab === 'dalils' && (
                      <div>
                        {data.dalils.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">
                            Tidak ada dalil terdeteksi dalam transkripsi ini.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {data.dalils.map((dalil) => (
                              <div
                                key={dalil.id}
                                className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span
                                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${
                                        dalil.type === 'quran'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {dalil.type === 'quran' ? 'Al-Quran' : 'Hadits'}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {dalil.reference}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    {Math.round(dalil.confidence * 100)}% yakin
                                  </span>
                                </div>
                                {dalil.textAr && (
                                  <p
                                    dir="rtl"
                                    className="text-right font-arabic text-gray-900 mb-3"
                                  >
                                    {dalil.textAr}
                                  </p>
                                )}
                                {dalil.textId && (
                                  <p className="text-sm text-gray-600 italic">{dalil.textId}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <a href={`/api/transcriptions/export/${data.id}`} download>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 border-[#1A5276] text-[#1A5276] hover:bg-[#1A5276] hover:text-white"
                      >
                        <Download size={16} />
                        Export TXT
                      </Button>
                    </a>
                  </div>
                </>
              )}
            </>
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
