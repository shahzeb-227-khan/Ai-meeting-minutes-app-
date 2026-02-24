import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, User, Palette, CheckCircle2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, updateUser, initials } = useUser();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const handleSaveProfile = () => {
    updateUser(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleThemeToggle = (dark: boolean) => {
    updateUser({ theme: dark ? "dark" : "light" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences.
          </p>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1 gap-2">
                <User className="w-3.5 h-3.5" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1 gap-2">
                <Palette className="w-3.5 h-3.5" />
                Appearance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="px-6 pb-6 mt-4 space-y-5">
            <div className="flex flex-col items-center gap-2 mb-2">
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">
                Avatar based on your initials
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="settings-name">Display Name</Label>
              <Input
                id="settings-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Shahzeb Alam"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="settings-role">Role / Title</Label>
              <Input
                id="settings-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, role: e.target.value }))
                }
                placeholder="e.g. Product Manager"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              className="w-full gap-2"
              variant={saved ? "outline" : "default"}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="px-6 pb-6 mt-4 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  {user.theme === "dark" ? (
                    <Moon className="w-4 h-4 text-primary" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {user.theme === "dark" ? "Dark Mode" : "Light Mode"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.theme === "dark"
                      ? "Deep dark theme active"
                      : "Clean light theme active"}
                  </p>
                </div>
              </div>
              <Switch
                checked={user.theme === "dark"}
                onCheckedChange={handleThemeToggle}
              />
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/30">
              <p className="text-sm font-medium mb-1">Accent Color</p>
              <p className="text-xs text-muted-foreground mb-3">
                Pick an accent color for the interface
              </p>
              <div className="flex items-center gap-2.5">
                {[
                  { cls: "bg-indigo-500", active: true },
                  { cls: "bg-violet-500", active: false },
                  { cls: "bg-blue-500", active: false },
                  { cls: "bg-emerald-500", active: false },
                  { cls: "bg-rose-500", active: false },
                ].map((color) => (
                  <div
                    key={color.cls}
                    className={`w-7 h-7 rounded-full ${color.cls} cursor-pointer transition-all hover:scale-110 ${
                      color.active
                        ? "ring-2 ring-offset-2 ring-offset-background ring-current"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                More customization options coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
