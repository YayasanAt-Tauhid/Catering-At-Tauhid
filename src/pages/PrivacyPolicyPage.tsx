import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Kebijakan Privasi</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Kami menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda saat menggunakan aplikasi Dapoer At-Tauhid.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl py-10 space-y-8 print:py-4">

        <Section title="1. Data yang Kami Kumpulkan">
          <p>Saat Anda menggunakan layanan kami, kami dapat mengumpulkan data berikut:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Informasi Pribadi:</strong> Nama lengkap, alamat email, dan nomor WhatsApp yang Anda berikan saat mendaftar atau memesan.</li>
            <li><strong>Alamat Pengiriman:</strong> Alamat atau lokasi penerima untuk keperluan pengantaran makanan oleh kurir.</li>
            <li><strong>Data Pembayaran:</strong> Informasi transaksi yang diproses melalui Midtrans (kami tidak menyimpan detail kartu kredit/debit secara langsung).</li>
            <li><strong>Riwayat Pesanan:</strong> Data pesanan yang tersimpan di sistem kami (Supabase) untuk memudahkan pelacakan dan riwayat transaksi.</li>
            <li><strong>Data Teknis:</strong> Informasi perangkat, jenis browser, dan alamat IP untuk keamanan dan peningkatan layanan.</li>
          </ul>
        </Section>

        <Section title="2. Penggunaan Data">
          <p>Data yang kami kumpulkan digunakan untuk:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Memproses dan mengirimkan pesanan makanan Anda.</li>
            <li>Memproses pembayaran secara aman melalui Midtrans.</li>
            <li>Mengirimkan notifikasi terkait status pesanan melalui WhatsApp atau email.</li>
            <li>Meningkatkan kualitas layanan dan pengalaman pengguna melalui analisis internal.</li>
            <li>Memenuhi kewajiban hukum yang berlaku.</li>
          </ul>
          <p className="font-medium text-foreground">Kami tidak menjual data pribadi Anda kepada pihak ketiga.</p>
        </Section>

        <Section title="3. Berbagi Data dengan Pihak Ketiga">
          <p>Kami hanya membagikan data Anda dengan pihak ketiga dalam kondisi berikut:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Midtrans:</strong> Sebagai penyedia layanan pembayaran untuk memproses transaksi.</li>
            <li><strong>Supabase:</strong> Sebagai penyedia infrastruktur database untuk menyimpan data secara aman.</li>
            <li><strong>Kurir/Pengiriman:</strong> Alamat pengiriman diberikan kepada kurir untuk mengantarkan pesanan.</li>
            <li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh peraturan perundang-undangan yang berlaku di Indonesia.</li>
          </ul>
        </Section>

        <Section title="4. Keamanan Data">
          <p>Kami menerapkan langkah-langkah keamanan untuk melindungi data Anda:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enkripsi data dalam transmisi (HTTPS/TLS).</li>
            <li>Akses terbatas ke data hanya untuk personel yang berwenang.</li>
            <li>Row Level Security (RLS) pada database untuk memastikan pengguna hanya dapat mengakses data mereka sendiri.</li>
            <li>Audit keamanan berkala terhadap sistem kami.</li>
          </ul>
        </Section>

        <Section title="5. Hak Pengguna">
          <p>Sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) Indonesia, Anda memiliki hak untuk:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Mengakses</strong> data pribadi Anda yang kami simpan.</li>
            <li><strong>Memperbarui</strong> informasi yang tidak akurat melalui halaman Pengaturan akun.</li>
            <li><strong>Menghapus</strong> akun dan data Anda dengan menghubungi tim dukungan kami.</li>
            <li><strong>Menarik persetujuan</strong> atas penggunaan data kapan saja.</li>
          </ul>
          <p>
            Untuk menggunakan hak-hak ini, silakan hubungi kami melalui email di{" "}
            <a href="mailto:support@dapoerattauhid.com" className="text-primary hover:underline">
              support@dapoerattauhid.com
            </a>{" "}
            atau melalui halaman{" "}
            <Link to="/support" className="text-primary hover:underline">Dukungan Pelanggan</Link>.
          </p>
        </Section>

        <Section title="6. Cookie dan Penyimpanan Lokal">
          <p>
            Aplikasi kami menggunakan cookie dan penyimpanan lokal (local storage) untuk menjaga sesi login Anda,
            menyimpan preferensi pengguna, dan keranjang belanja. Data ini bersifat teknis dan tidak digunakan untuk
            pelacakan iklan pihak ketiga.
          </p>
        </Section>

        <Section title="7. Perubahan Kebijakan Privasi">
          <p>
            Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan signifikan akan
            diinformasikan melalui pengumuman di aplikasi atau notifikasi langsung. Kami menyarankan Anda untuk
            meninjau halaman ini secara berkala.
          </p>
        </Section>

        <Section title="8. Penghapusan Akun">
          <p>
            Anda dapat meminta penghapusan akun dan seluruh data pribadi Anda kapan saja. Untuk melakukannya,
            hubungi kami melalui email di{" "}
            <a href="mailto:support@dapoerattauhid.com" className="text-primary hover:underline">
              support@dapoerattauhid.com
            </a>{" "}
            atau melalui WhatsApp Admin. Proses penghapusan akan diselesaikan dalam waktu maksimal 30 hari kerja
            sesuai ketentuan yang berlaku.
          </p>
        </Section>

        <div className="border-t pt-6 text-sm text-muted-foreground">
          <p>Terakhir diperbarui: April 2024</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-10 print:hidden">
        <div className="container mx-auto px-4 max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 Dapoer At-Tauhid. Hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Beranda</Link>
            <Link to="/support" className="hover:text-foreground transition-colors">Dukungan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
