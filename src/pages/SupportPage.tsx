import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Mail,
  Clock,
  Phone,
  ArrowLeft,
  Send,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

const faqs = [
  {
    q: "Bagaimana cara memesan makanan?",
    a: "Buka halaman Menu, pilih makanan yang diinginkan, tentukan jumlah porsi dan tanggal pengiriman, lalu masukkan ke keranjang. Setelah itu, lanjutkan ke halaman Checkout untuk memilih metode pembayaran dan selesaikan pesanan Anda.",
  },
  {
    q: "Apa yang harus saya lakukan jika pembayaran gagal?",
    a: "Jika pembayaran gagal melalui Midtrans, silakan coba kembali dengan metode pembayaran lain (QRIS, transfer bank, atau e-wallet). Jika masalah berlanjut, hubungi kami melalui WhatsApp atau email agar kami dapat membantu memverifikasi status pembayaran Anda.",
  },
  {
    q: "Bagaimana cara melacak pesanan saya?",
    a: 'Kunjungi halaman Lacak Pesanan di menu utama atau akses langsung melalui /track. Masukkan nomor pesanan Anda untuk melihat status terkini, mulai dari dikonfirmasi, diproses di dapur, hingga siap dikirim.',
  },
  {
    q: "Kapan batas waktu pemesanan?",
    a: "Pemesanan harian ditutup maksimal H-1 pukul 18.00 WIB. Untuk pesanan nasi box atau acara (minimal 10 porsi), harap pesan minimal 3 hari sebelumnya.",
  },
  {
    q: "Bagaimana cara membatalkan pesanan?",
    a: "Pembatalan dapat dilakukan maksimal 12 jam sebelum jadwal pengiriman. Hubungi Admin melalui WhatsApp untuk proses pembatalan dan informasi pengembalian dana.",
  },
  {
    q: "Siapa yang bisa saya hubungi untuk masalah teknis?",
    a: "Untuk masalah teknis terkait aplikasi, silakan kirim email ke support@dapoerattauhid.com atau hubungi kami melalui WhatsApp di nomor yang tertera di bawah.",
  },
];

export default function SupportPage() {
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
            <HelpCircle className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Dukungan Pelanggan</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Kami di sini untuk membantu Anda dengan pertanyaan tentang pemesanan, pembayaran, atau masalah lainnya.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl py-10 space-y-10">
        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Pertanyaan Umum (FAQ)
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Section */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              Hubungi Kami
            </h2>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-foreground">WhatsApp Admin</p>
                    <p className="text-sm text-muted-foreground">+62 812-3456-7890</p>
                  </div>
                </a>

                <a
                  href="mailto:support@dapoerattauhid.com"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">support@dapoerattauhid.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Jam Operasional</p>
                    <p className="text-sm text-muted-foreground">Senin – Jumat, 08:00 – 17:00 WIB</p>
                    <p className="text-sm text-muted-foreground">Sabtu, 08:00 – 12:00 WIB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
              <Send className="h-6 w-6 text-primary" />
              Kirim Pesan
            </h2>
            <Card>
              <CardContent className="pt-6">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const nama = (form.elements.namedItem("nama") as HTMLInputElement).value;
                    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                    const pesan = (form.elements.namedItem("pesan") as HTMLTextAreaElement).value;
                    const waText = encodeURIComponent(`Halo Admin Dapoer At-Tauhid,\n\nNama: ${nama}\nEmail: ${email}\n\n${pesan}`);
                    window.open(`https://wa.me/6281234567890?text=${waText}`, "_blank");
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama</Label>
                    <Input id="nama" name="nama" placeholder="Nama lengkap Anda" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="email@contoh.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pesan">Pesan</Label>
                    <Textarea id="pesan" name="pesan" placeholder="Tuliskan pertanyaan atau keluhan Anda..." rows={4} required />
                  </div>
                  <Button type="submit" className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Kirim via WhatsApp
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-10">
        <div className="container mx-auto px-4 max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 Dapoer At-Tauhid. Hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Beranda</Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
