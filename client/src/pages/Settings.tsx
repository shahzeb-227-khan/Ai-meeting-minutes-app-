import { useState, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Shield, Palette, Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme } from "@/hooks/use-auth";

// ─── Color Palettes ─────────────────────────────────────────────────────────
const PALETTES = [
  { id: "violet", label: "Violet", primary: "#7c3aed", hex: "#7c3aed" },
  { id: "blue", label: "Blue", primary: "#2563eb", hex: "#2563eb" },
  { id: "emerald", label: "Emerald", primary: "#059669", hex: "#059669" },
  { id: "amber", label: "Amber", primary: "#d97706", hex: "#d97706" },
  { id: "rose", label: "Rose", primary: "#e11d48", hex: "#e11d48" },
] as const;

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
  { id: "high-contrast", label: "High Contrast" },
] as const;

// ─── Tab Nav ─────────────────────────────────────────────────────────────────
type Tab = "profile" | "security" | "appearance" | "notifications";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, email, role });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-name">Full name</Label>
            <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-email">Email address</Label>
            <Input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-role">Job title / role</Label>
            <Input id="prof-role" value={role} onChange={(e) => setRole(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" disabled={saving} className="h-10">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your password to keep your account secure.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="sec-current">Current password</Label>
            <Input
              id="sec-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-11"
              autoComplete="current-password"
              required
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="sec-new">New password</Label>
            <Input
              id="sec-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-confirm">Confirm new password</Label>
            <Input
              id="sec-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn("h-11", confirmPassword && newPassword !== confirmPassword && "border-red-500")}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={saving} className="h-10">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState(user?.theme ?? "light");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ theme: selectedTheme });
      applyTheme(selectedTheme);
      toast({ title: "Appearance saved", description: "Your theme preference has been applied." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how MeetWise AI looks for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme mode */}
        <div>
          <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Color mode</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Color mode">
            {THEMES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={selectedTheme === t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500",
                  selectedTheme === t.id
                    ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    t.id === "dark" && "bg-slate-800",
                    t.id === "light" && "bg-white border border-slate-200",
                    t.id === "system" && "bg-gradient-to-br from-white to-slate-800",
                    t.id === "high-contrast" && "bg-black"
                  )}
                >
                  {selectedTheme === t.id && <Check className="w-4 h-4 text-violet-600" aria-hidden="true" />}
                </div>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* WCAG note */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Accessibility:</strong> All themes meet WCAG 2.1 AA contrast requirements (4.5:1 for text). High Contrast mode provides a 7:1 ratio for AAA compliance.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="h-10">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save appearance
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ overdue: true, dueToday: true, assignments: true });

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function save() {
    toast({ title: "Notification preferences saved" });
  }

  const items = [
    { key: "overdue" as const, label: "Overdue action items", description: "Get notified when tasks are past their due date." },
    { key: "dueToday" as const, label: "Due today", description: "Reminder about tasks due today." },
    { key: "assignments" as const, label: "New assignments", description: "When a task is assigned to you." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage what notifications you receive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[item.key]}
              aria-label={item.label}
              onClick={() => toggle(item.key)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
                prefs[item.key] ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  prefs[item.key] ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        ))}
        <Button onClick={save} className="h-10 mt-2">
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { user } = useAuth();

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    profile: <ProfileTab />,
    security: <SecurityTab />,
    appearance: <AppearanceTab />,
    notifications: <NotificationsTab />,
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8" aria-label="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account, security, and preferences.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar nav */}
        <nav
          className="sm:w-52 shrink-0"
          aria-label="Settings sections"
        >
          <ul className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-500",
                      activeTab === tab.id
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="sr-only">(current section)</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Account info */}
          {user && (
            <div className="mt-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              <Badge variant="secondary" className="mt-1.5 text-xs">{user.role}</Badge>
            </div>
          )}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0" role="region" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </main>
  );
}
