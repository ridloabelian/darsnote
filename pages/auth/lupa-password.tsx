import { useState } from "react";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordResponse = {
  message?: string;
  resetUrl?: string;
};

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as ForgotPasswordResponse;

      if (!res.ok) {
        setError(data.message || "Gagal memproses permintaan reset password.");
        return;
      }

      setMessage(
        data.message || "Jika email terdaftar, link reset password akan dikirim."
      );
      setResetUrl(data.resetUrl || "");
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Lupa Password — DarsNote</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1A5276] flex items-center justify-center">
            <span className="text-[#D4A017] font-bold">DN</span>
          </div>
          <span className="font-bold text-[#1A5276] text-xl">DarsNote</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-[#1A5276] mb-1">Lupa password?</h1>
          <p className="text-gray-500 text-sm mb-6">
            Masukkan email akun Anda untuk menerima link reset password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-100">
                {message}
              </div>
            )}

            {resetUrl && (
              <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-lg border border-amber-100 break-words">
                Mode lokal:{" "}
                <Link href={resetUrl} className="font-medium underline">
                  buka link reset password
                </Link>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1A5276] hover:bg-[#154360] h-11"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Kirim Link Reset"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ingat password?{" "}
            <Link href="/auth/masuk" className="text-[#148F77] font-medium hover:underline">
              Masuk di sini
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
