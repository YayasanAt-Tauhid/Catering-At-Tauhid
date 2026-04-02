import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Smartphone,
  QrCode,
  CheckCircle2,
  ScanLine,
} from "lucide-react";

export default function QrisTutorial() {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      icon: <Smartphone className="w-5 h-5 text-primary" />,
      title: "Buka Aplikasi E-Wallet / M-Banking",
      description:
        'Buka aplikasi seperti GoPay, OVO, DANA, ShopeePay, atau M-Banking (BCA, BRI, Mandiri, dll). Cari menu "Scan" atau "QRIS".',
    },
    {
      icon: <ScanLine className="w-5 h-5 text-primary" />,
      title: "Scan Kode QR",
      description:
        "Arahkan kamera HP ke kode QR yang muncul di layar setelah klik Bayar Sekarang. Pastikan kode QR terlihat jelas.",
    },
    {
      icon: <QrCode className="w-5 h-5 text-primary" />,
      title: "Periksa Detail Pembayaran",
      description:
        "Pastikan nama merchant dan jumlah pembayaran sudah sesuai dengan pesanan Anda.",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      title: "Konfirmasi & Masukkan PIN",
      description:
        "Tekan tombol Bayar/Konfirmasi, lalu masukkan PIN atau password aplikasi Anda. Pembayaran selesai!",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-primary gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Cara Bayar dengan QRIS</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-4 animate-fade-in">
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-semibold text-foreground">
            Langkah-langkah Pembayaran QRIS:
          </p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Masih bingung? Tonton video tutorial:
            </p>
            <a
              href="https://www.youtube.com/results?search_query=tutorial+bayar+qris"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Tonton Tutorial di YouTube
              </Button>
            </a>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
