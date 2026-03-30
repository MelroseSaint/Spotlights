"use client";

import { useState } from "react";
import { X, Megaphone, AlertCircle, Info, Bug, Sparkles } from "lucide-react";
import { useAnnouncements } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const typeConfig = {
  announcement: { icon: Megaphone, color: "bg-amber-500", textColor: "text-amber-500" },
  update: { icon: AlertCircle, color: "bg-blue-500", textColor: "text-blue-500" },
  bug_report: { icon: Bug, color: "bg-red-500", textColor: "text-red-500" },
  whats_new: { icon: Sparkles, color: "bg-purple-500", textColor: "text-purple-500" },
};

export default function AnnouncementBanner() {
  const { announcements } = useAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter((a: any) => !dismissed.includes(a._id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-2">
      {visibleAnnouncements.slice(0, 3).map((announcement: any) => {
        const config = typeConfig[announcement.type as keyof typeof typeConfig] || typeConfig.announcement;
        const Icon = config.icon;

        return (
          <div
            key={announcement._id}
            className="relative bg-gradient-to-r from-zinc-900 to-zinc-900/80 border border-zinc-800 rounded-2xl p-4 overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color}`} />
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-xl ${config.color}/20`}>
                <Icon className={`w-5 h-5 ${config.textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white truncate">{announcement.title}</h3>
                  {announcement.isPinned && (
                    <Badge className="bg-amber-500/20 text-amber-500 text-[10px] rounded-full shrink-0">
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                  {announcement.content}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(announcement._id)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
