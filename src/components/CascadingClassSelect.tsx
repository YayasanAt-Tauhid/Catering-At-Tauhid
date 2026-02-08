import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Jenjang = "SD" | "SMP" | "SMA" | "MTA" | "PTK";

interface CascadingClassSelectProps {
  jenjang: Jenjang | "";
  kelas: string;
  onJenjangChange: (value: Jenjang | "") => void;
  onKelasChange: (value: string) => void;
  disabled?: boolean;
}

const JENJANG_OPTIONS: { value: Jenjang; label: string }[] = [
  { value: "SD", label: "SD (Sekolah Dasar)" },
  { value: "SMP", label: "SMP (Sekolah Menengah Pertama)" },
  { value: "SMA", label: "SMA (Sekolah Menengah Atas)" },
  { value: "MTA", label: "MTA (Madrasah Tsanawiyah Aliyah)" },
  { value: "PTK", label: "PTK (Pendidik dan Tenaga Kependidikan)" },
];

// Generate class options based on jenjang
function generateKelasOptions(jenjang: Jenjang): string[] {
  const suffixes = ["A", "B", "C", "D"];

  switch (jenjang) {
    case "SD":
      // 1A, 1B, 1C, 1D, 2A, ..., 6D
      return Array.from({ length: 6 }, (_, i) => i + 1).flatMap((grade) =>
        suffixes.map((suffix) => `${grade}${suffix}`),
      );
    case "SMP":
      // 7A, 7B, 7C, 7D, 8A, ..., 9D
      return Array.from({ length: 3 }, (_, i) => i + 7).flatMap((grade) =>
        suffixes.map((suffix) => `${grade}${suffix}`),
      );
    case "SMA":
      // 10A, 10B, 10C, 10D, 11A, ..., 12D
      return Array.from({ length: 3 }, (_, i) => i + 10).flatMap((grade) =>
        suffixes.map((suffix) => `${grade}${suffix}`),
      );
    case "MTA":
      // MTA 1, MTA 2, ..., MTA 6
      return Array.from({ length: 6 }, (_, i) => `MTA ${i + 1}`);
    case "PTK":
      // No class needed
      return [];
    default:
      return [];
  }
}

export function CascadingClassSelect({
  jenjang,
  kelas,
  onJenjangChange,
  onKelasChange,
  disabled = false,
}: CascadingClassSelectProps) {
  const kelasOptions = useMemo(() => {
    if (!jenjang) return [];
    return generateKelasOptions(jenjang);
  }, [jenjang]);

  const handleJenjangChange = (value: string) => {
    const newJenjang = value as Jenjang;
    onJenjangChange(newJenjang);
    // Reset kelas when jenjang changes, unless PTK
    if (newJenjang === "PTK") {
      onKelasChange("PTK");
    } else {
      onKelasChange("");
    }
  };

  const showKelasSelect = jenjang && jenjang !== "PTK";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Jenjang Pendidikan</Label>
        <Select
          value={jenjang}
          onValueChange={handleJenjangChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenjang pendidikan" />
          </SelectTrigger>
          <SelectContent>
            {JENJANG_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showKelasSelect && (
        <div className="space-y-2">
          <Label>{jenjang === "MTA" ? "Tingkat" : "Kelas"}</Label>
          <Select
            value={kelas}
            onValueChange={onKelasChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`Pilih ${jenjang === "MTA" ? "tingkat" : "kelas"}`}
              />
            </SelectTrigger>
            <SelectContent>
              {kelasOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {jenjang === "PTK" && (
        <p className="text-sm text-muted-foreground">
          PTK tidak memerlukan pemilihan kelas
        </p>
      )}
    </div>
  );
}

// Helper to get full class string for storage
export function getFullClassString(
  jenjang: Jenjang | "",
  kelas: string,
): string {
  if (!jenjang) return "";
  if (jenjang === "PTK") return "PTK";
  if (!kelas) return "";
  return `${jenjang} - ${kelas}`;
}

// Helper to parse stored class string back to jenjang and kelas
export function parseClassString(classString: string): {
  jenjang: Jenjang | "";
  kelas: string;
} {
  if (!classString) return { jenjang: "", kelas: "" };
  if (classString === "PTK") return { jenjang: "PTK", kelas: "PTK" };

  // Try to match pattern like "SD - 1A" or "MTA - MTA 1"
  const match = classString.match(/^(SD|SMP|SMA|MTA|PTK)\s*-\s*(.+)$/);
  if (match) {
    return { jenjang: match[1] as Jenjang, kelas: match[2] };
  }

  // Fallback: try to detect jenjang from class number
  const numMatch = classString.match(/^(\d+)[A-D]?$/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1 && num <= 6) return { jenjang: "SD", kelas: classString };
    if (num >= 7 && num <= 9) return { jenjang: "SMP", kelas: classString };
    if (num >= 10 && num <= 12) return { jenjang: "SMA", kelas: classString };
  }

  if (classString.startsWith("MTA"))
    return { jenjang: "MTA", kelas: classString };

  return { jenjang: "", kelas: classString };
}
