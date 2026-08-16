import { Bell } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type AnnouncementButtonProps = {
  variant?: "default" | "menu-item";
};

/**
 * Bell icon button with unread badge + popover announcement list
 */
const AnnouncementButton = ({ variant = "default" }: AnnouncementButtonProps) => {
  const { announcements, unreadCount, lastReadId, markAllAsRead } = useAnnouncements();

  const trigger =
    variant === "menu-item" ? (
      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted">
        <span className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </span>
        <span>最新消息</span>
      </button>
    ) : (
      <button
        className="relative flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        aria-label="最新消息"
        title="最新消息"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
        <span>消息</span>
      </button>
    );

  return (
    <Popover onOpenChange={(open) => open && unreadCount > 0 && markAllAsRead()}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        data-react-remove-scroll-allow="true"
      >
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">最新消息</h3>
        </div>
        <ScrollArea
          className="h-72 touch-pan-y overscroll-contain"
          data-react-remove-scroll-allow="true"
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {announcements.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              目前沒有消息
            </p>
          ) : (
            <div className="divide-y">
              {announcements
                .slice()
                .sort((a, b) => b.id - a.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-2">
                      {item.id > lastReadId && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.content}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AnnouncementButton;
