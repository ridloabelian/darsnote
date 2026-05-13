import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>DarsNote — Rekam. Transkripsi. Pahami.</title>
        <meta
          name="description"
          content="Platform AI untuk transkripsi dan ringkasan kajian Islam. Ubah audio kajian menjadi teks, ringkasan, dan deteksi dalil otomatis."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A5276] flex items-center justify-center">
              <span className="text-[#D4A017] font-bold text-sm">DN</span>
            </div>
            <span className="font-bold text-[#1A5276] text-lg">DarsNote</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#1A5276] text-white text-sm font-medium rounded-lg hover:bg-[#154360] transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/masuk"
                  className="text-sm text-[#1A5276] font-medium hover:underline"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/daftar"
                  className="px-4 py-2 bg-[#1A5276] text-white text-sm font-medium rounded-lg hover:bg-[#154360] transition-colors"
                >
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-20 pb-16 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A017]/10 text-[#D4A017] text-xs font-semibold rounded-full mb-6 uppercase tracking-wide">
            Early Access Gratis — 30 Menit Transkripsi
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1A5276] leading-tight mb-6">
            Rekam. Transkripsi.{" "}
            <span className="text-[#148F77]">Pahami.</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Ubah audio dan video kajian Islam menjadi teks, ringkasan, dan
            deteksi dalil Al-Qur&apos;an & Hadits secara otomatis dengan AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/daftar"
              className="px-8 py-4 bg-[#1A5276] text-white font-semibold rounded-xl hover:bg-[#154360] transition-colors text-base shadow-lg shadow-[#1A5276]/20"
            >
              Mulai Gratis Sekarang
            </Link>
            <a
              href="#fitur"
              className="px-8 py-4 border-2 border-[#1A5276] text-[#1A5276] font-semibold rounded-xl hover:bg-[#1A5276]/5 transition-colors text-base"
            >
              Lihat Fitur
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Tidak perlu kartu kredit. Gratis 30 menit untuk semua pengguna baru.
          </p>
        </section>

        {/* Demo visual */}
        <section className="px-6 pb-20 max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#1A5276] to-[#148F77] rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-white/60 ml-2">darsnote.app</span>
            </div>
            <div className="bg-white/10 rounded-xl p-4 mb-3">
              <p className="text-xs text-white/60 mb-1">Transkripsi</p>
              <p className="text-sm leading-relaxed">
                &ldquo;...maka sesungguhnya Allah SWT berfirman dalam
                kitab-Nya yang mulia, dalam surah Al-Baqarah ayat 286:
                <em> laa yukallifullahu nafsan illaa wus&apos;ahaa</em>...&rdquo;
              </p>
            </div>
            <div className="bg-[#D4A017]/20 rounded-xl p-4 border border-[#D4A017]/30">
              <p className="text-xs text-[#D4A017] mb-1 font-semibold">
                Dalil Terdeteksi
              </p>
              <p className="text-sm font-semibold">QS. Al-Baqarah: 286</p>
              <p className="text-sm text-white/80 mt-1 text-right" dir="rtl">
                لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="fitur" className="px-6 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1A5276] text-center mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-gray-500 text-center mb-12">
              Dari audio ke pemahaman — dalam hitungan menit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-[#1A5276]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-[#1A5276]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-[#1A5276] text-lg mb-2">
                  Transkripsi Akurat
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Upload file audio/video atau paste link YouTube. AI Whisper
                  kami transkripsi dengan akurasi tinggi, termasuk istilah
                  Arab & Islam.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-[#148F77]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-[#148F77]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-[#148F77] text-lg mb-2">
                  Ringkasan Otomatis
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  AI pintar merangkum poin-poin penting kajian secara
                  terstruktur — tema, isi utama, dan kesimpulan — dalam
                  bahasa Indonesia yang mudah dipahami.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-[#D4A017]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-[#D4A017]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-[#D4A017] text-lg mb-2">
                  Deteksi Dalil
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Ayat Al-Qur&apos;an dan Hadits yang disebut dalam kajian
                  terdeteksi otomatis, lengkap dengan referensi dan teks
                  bahasa Arab.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#1A5276] mb-4">
              Siap untuk mencoba?
            </h2>
            <p className="text-gray-500 mb-8">
              Bergabung sekarang dan dapatkan 30 menit transkripsi gratis.
              Tidak perlu kartu kredit.
            </p>
            <Link
              href="/auth/daftar"
              className="inline-block px-10 py-4 bg-[#D4A017] text-white font-bold rounded-xl hover:bg-[#b8860b] transition-colors text-base shadow-lg shadow-[#D4A017]/30"
            >
              Daftar Sekarang — Gratis
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} DarsNote oleh{" "}
            <a
              href="https://saif.co.id"
              className="text-[#1A5276] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              PT SAIF Digital Holdings
            </a>
            . Semua hak dilindungi.
          </p>
        </footer>
      </div>
    </>
  );
}
