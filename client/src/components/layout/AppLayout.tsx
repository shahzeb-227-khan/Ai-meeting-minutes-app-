import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Video, 
  CheckSquare, 
  Users, 
  Settings,
  Bell,
  Search,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Meetings", href: "/meetings", icon: Video },
    { label: "Action Items", href: "/actions", icon: CheckSquare },
    { label: "Team", href: "/team", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Sparkles className="w-6 h-6" />
            <span>MeetWise AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
              <AvatarFallback>AW</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Alex Woods</span>
              <span className="text-xs text-muted-foreground mt-1">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search meetings, tasks, people..." 
                className="pl-9 bg-secondary/50 border-transparent focus-visible:bg-background h-9 rounded-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
            {/* Mobile menu toggle could go here */}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto animate-slide-up-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
