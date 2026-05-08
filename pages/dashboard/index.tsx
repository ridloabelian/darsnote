import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuotaCard from "@/components/ui/QuotaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, BookOpen, Mic } from "lucide-react";

interface Transcription {
  id: string;
  title: string;
  sourceType: string;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
}

interface Props {
  userName: string;
  quotaMinutes: number;
  usedMinutes: number;
  totalTranscriptions: number;
  totalDalils: number;
  recentTranscriptions: Transcription[];
}

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  done: { label: "Selesai", variant: "default" },
  processing: { label: "Diproses", variant: "secondary" },
  pending: { label: "Menunggu", variant: "outline" },
  error: { label: "Gagal", variant: "destructive" },
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage({
  userName,
  quotaMinutes,
  usedMinutes,
  totalTranscriptions,
  totalDalils,
  recentTranscriptions,
}: Props) {
  const greeting = getGreeting();

  return (
    <>
      <Head>
        <title>Dashboard — DarsNote</title>
      </Head>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A5276]">
            {greeting}, {userName.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Berikut ringkasan aktivitas DarsNote Anda.
          </p>
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuotaCard usedMinutes={usedMinutes} totalMinutes={quotaMinutes} />

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-500 text-sm font-medium">Total Transkripsi</p>
              <div className="w-10 h-10 bg-[#148F77]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#148F77]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1A5276]">{totalTranscriptions}</p>
            <p className="text-gray-400 text-xs mt-0.5">kajian ditranskrip</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-gray-500 text-sm font-medium">Total Dalil</p>
              <div className="w-10 h-10 bg-[#D4A017]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#D4A017]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1A5276]">{totalDalils}</p>
            <p className="text-gray-400 text-xs mt-0.5">dalil terdeteksi</p>
          </div>
        </div>

        {/* CTA Transkripsi Baru */}
        <div className="bg-gradient-to-r from-[#1A5276]/5 to-[#148F77]/5 border border-[#1A5276]/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#1A5276] rounded-xl flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-[#1A5276]">Mulai Transkripsi Baru</p>
            <p className="text-gray-500 text-sm">
              Upload file audio/video atau paste link YouTube kajian.
            </p>
          </div>
          <Button
            asChild
            className="bg-[#1A5276] hover:bg-[#154360] gap-2 flex-shrink-0"
          >
            <Link href="/dashboard/transkripsi-baru">
              <PlusCircle size={16} />
              Mulai Sekarang
            </Link>
          </Button>
        </div>

        {/* Riwayat terakhir */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1A5276]">Transkripsi Terakhir</h2>
            {totalTranscriptions > 0 && (
              <Link
                href="/dashboard/riwayat"
                className="text-sm text-[#148F77] hover:underline font-medium"
              >
                Lihat semua
              </Link>
            )}
          </div>

          {recentTranscriptions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Belum ada transkripsi</p>
              <p className="text-gray-400 text-sm mt-1">
                Mulai transkripsi pertama Anda dengan klik tombol di atas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTranscriptions.map((t) => {
                const status = STATUS_LABEL[t.status] ?? STATUS_LABEL.pending;
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/transkripsi/${t.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-[#1A5276]/8 rounded-lg flex items-center justify-center flex-shrink-0">
                      {t.sourceType === "youtube" ? (
                        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6a3 3 0 00-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/>
                        </svg>
                      ) : (
                        <Mic className="w-4 h-4 text-[#1A5276]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                        {t.durationSeconds ? ` · ${formatDuration(t.durationSeconds)}` : ""}
                      </p>
                    </div>
                    <Badge variant={status.variant} className="flex-shrink-0 text-xs">
                      {status.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Assalamu'alaikum";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/auth/masuk", permanent: false } };
  }

  const userId = session.user.id;

  const [user, totalTranscriptions, totalDalils, recentTranscriptions] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, quotaMinutes: true } }),
      prisma.transcription.count({ where: { userId } }),
      prisma.dalil.count({ where: { transcription: { userId } } }),
      prisma.transcription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          sourceType: true,
          status: true,
          durationSeconds: true,
          createdAt: true,
        },
      }),
    ]);

  const usedSeconds = await prisma.transcription.aggregate({
    where: { userId, status: "done" },
    _sum: { durationSeconds: true },
  });

  const usedMinutes = Math.ceil((usedSeconds._sum.durationSeconds ?? 0) / 60);

  return {
    props: {
      userName: user?.name ?? "Pengguna",
      quotaMinutes: user?.quotaMinutes ?? 30,
      usedMinutes,
      totalTranscriptions,
      totalDalils,
      recentTranscriptions: recentTranscriptions.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
    },
  };
};
