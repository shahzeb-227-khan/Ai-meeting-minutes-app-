import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Users,
  Settings,
  Search,
  Sparkles,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function handleLogout() {
    try {
      await logout();
      setLocation("/signin");
      toast({ title: "Signed out", description: "See you next time!" });
    } catch {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Meetings", href: "/meetings", icon: Video },
    { label: "Action Items", href: "/actions", icon: CheckSquare },
    { label: "Team", href: "/team", icon: Users },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <span>MeetWise AI</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const active =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 px-2 w-full rounded-lg hover:bg-secondary py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label={`Account menu for ${user?.name ?? "user"}`}
            >
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarImage src={user?.avatar ?? undefined} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-sm font-medium leading-none truncate">{user?.name ?? "—"}</span>
                <span className="text-xs text-muted-foreground mt-1 truncate">{user?.role ?? ""}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuItem onClick={() => { setLocation("/settings"); setMobileOpen(false); }}>
              <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex-col hidden md:flex shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 glass flex items-center justify-between px-4 md:px-6 z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg md:hidden shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>

            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                placeholder="Search meetings, tasks..."
                className="pl-9 bg-secondary/50 border-transparent focus-visible:bg-background h-9 rounded-full text-sm"
                aria-label="Search"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full focus:ring-2 focus:ring-violet-500"
              onClick={() => setLocation("/settings")}
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8" id="main-content" tabIndex={-1}>
          <div className="max-w-6xl mx-auto animate-slide-up-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
