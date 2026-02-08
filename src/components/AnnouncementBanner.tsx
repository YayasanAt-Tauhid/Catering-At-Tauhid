import { useActiveAnnouncements, type Announcement, type AnnouncementPriority } from "@/hooks/useAnnouncements";
import { AlertCircle, Bell, Info, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const priorityConfig: Record<AnnouncementPriority, {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  low: {
    icon: Info,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-muted-foreground/20",
  },
  medium: {
    icon: Bell,
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    borderClass: "border-primary/30",
  },
  high: {
    icon: AlertTriangle,
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    borderClass: "border-warning/30",
  },
  urgent: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/30",
  },
};

interface AnnouncementItemProps {
  announcement: Announcement;
  onDismiss?: (id: string) => void;
  showDismiss?: boolean;
}

function AnnouncementItem({ announcement, onDismiss, showDismiss = true }: AnnouncementItemProps) {
  const config = priorityConfig[announcement.priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all duration-200",
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", config.textClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm", config.textClass)}>
            {announcement.title}
          </h4>
          <p className="text-sm text-foreground/80 mt-1">
            {announcement.content}
          </p>
        </div>
        {showDismiss && onDismiss && (
          <button
            onClick={() => onDismiss(announcement.id)}
            className={cn(
              "p-1 rounded-lg hover:bg-foreground/10 transition-colors",
              config.textClass
            )}
            aria-label="Tutup pengumuman"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface AnnouncementBannerProps {
  className?: string;
  maxItems?: number;
  showDismiss?: boolean;
}

export function AnnouncementBanner({ 
  className, 
  maxItems = 3,
  showDismiss = true 
}: AnnouncementBannerProps) {
  const { announcements, isLoading } = useActiveAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (isLoading) return null;

  const visibleAnnouncements = announcements
    .filter((ann) => !dismissedIds.has(ann.id))
    .slice(0, maxItems);

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {visibleAnnouncements.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          onDismiss={showDismiss ? handleDismiss : undefined}
          showDismiss={showDismiss}
        />
      ))}
    </div>
  );
}
