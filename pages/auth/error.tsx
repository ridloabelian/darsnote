import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Terjadi kesalahan konfigurasi server.",
  AccessDenied: "Akses ditolak. Anda tidak memiliki izin untuk masuk.",
  Verification: "Tautan verifikasi sudah kedaluwarsa atau sudah digunakan.",
  OAuthSignin: "Gagal memulai proses login dengan Google.",
  OAuthCallback: "Gagal menyelesaikan proses login dengan Google.",
  OAuthCreateAccount: "Gagal membuat akun dengan Google.",
  EmailCreateAccount: "Gagal membuat akun dengan email ini.",
  Callback: "Terjadi kesalahan saat proses autentikasi.",
  Default: "Terjadi kesalahan yang tidak diketahui.",
};

export default function AuthErrorPage() {
  const router = useRouter();
  const errorCode = router.query.error as string | undefined;
  const message = errorCode
    ? ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default
    : ERROR_MESSAGES.Default;

  return (
    <>
      <Head>
        <title>Terjadi Kesalahan — DarsNote</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1A5276] flex items-center justify-center">
            <span className="text-[#D4A017] font-bold">DN</span>
          </div>
          <span className="font-bold text-[#1A5276] text-xl">DarsNote</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Autentikasi Gagal</h1>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              className="w-full bg-[#1A5276] hover:bg-[#154360]"
            >
              <Link href="/auth/masuk">Coba Masuk Lagi</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
