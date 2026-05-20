import { cn } from "@/lib/utils";

interface QuotaCardProps {
  remainingMinutes: number;
  totalMinutes: number;
}

export default function QuotaCard({ remainingMinutes, totalMinutes }: QuotaCardProps) {
  const remaining = Math.max(remainingMinutes, 0);
  const usedMinutes = Math.max(totalMinutes - remaining, 0);
  const pct = Math.min((usedMinutes / totalMinutes) * 100, 100);
  const low = pct >= 80;

  return (
    <div className="bg-gradient-to-br from-[#1A5276] to-[#148F77] rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/70 text-sm font-medium">Kuota Transkripsi</p>
          <p className="text-3xl font-bold mt-0.5">{remaining} menit</p>
          <p className="text-white/60 text-xs mt-0.5">tersisa dari {totalMinutes} menit</p>
        </div>
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-white/60">
          <span>Terpakai: {usedMinutes} menit</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              low ? "bg-[#D4A017]" : "bg-white"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {low && (
          <p className="text-[#D4A017] text-xs font-medium">
            Kuota hampir habis. Upgrade untuk akses lebih banyak.
          </p>
        )}
      </div>
    </div>
  );
}
