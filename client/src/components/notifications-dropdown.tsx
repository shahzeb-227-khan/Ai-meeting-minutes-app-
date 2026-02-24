import { useState } from "react";
import { Bell, CheckCircle2, Clock, AlertCircle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, useMarkAllNotificationsRead, type Notification } from "@/hooks/use-notifications";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  Notification["type"],
  { icon: React.ComponentType<any>; color: string; bg: string }
> = {
  overdue: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  due_today: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  new_assignment: { icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead(notifications.map((n) => n.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold px-0.5 leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0 rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 ? (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            ) : (
              <p className="text-xs text-muted-foreground">All caught up</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-semibold text-sm">You're all caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No overdue or upcoming tasks
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 px-4 py-3.5 transition-colors",
                    !notification.read
                      ? "bg-primary/5 hover:bg-primary/8"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      config.bg
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        !notification.read ? "font-semibold" : "font-medium"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {notification.description}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-secondary/20">
            <Link href="/actions" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground h-7"
              >
                View all action items →
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
