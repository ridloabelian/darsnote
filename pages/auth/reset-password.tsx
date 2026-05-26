import { useState } from "react";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordResponse = {
  message?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!token) {
      setLoading(false);
      setError("Token reset password tidak ditemukan.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as ResetPasswordResponse;

      if (!res.ok) {
        setError(data.message || "Gagal memperbarui password.");
        return;
      }

      setSuccess(data.message || "Password berhasil diperbarui.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password — DarsNote</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1A5276] flex items-center justify-center">
            <span className="text-[#D4A017] font-bold">DN</span>
          </div>
          <span className="font-bold text-[#1A5276] text-xl">DarsNote</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-[#1A5276] mb-1">Buat password baru</h1>
          <p className="text-gray-500 text-sm mb-6">
            Password baru minimal 8 karakter.
          </p>

          {!token && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">
              Link reset password tidak lengkap. Minta link baru dari halaman lupa password.
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-100">
                {success}
              </div>
              <Button
                asChild
                className="w-full bg-[#1A5276] hover:bg-[#154360] h-11"
              >
                <Link href="/auth/masuk">Masuk Sekarang</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A5276] hover:bg-[#154360] h-11"
                disabled={loading || !token}
              >
                {loading ? "Memproses..." : "Simpan Password Baru"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Butuh link baru?{" "}
            <Link
              href="/auth/lupa-password"
              className="text-[#148F77] font-medium hover:underline"
            >
              Minta ulang
            </Link>
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} PT SAIF Digital Holdings
        </p>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  if (session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
