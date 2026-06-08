"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { User, Lock, Save, Link2, Link2Off } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { FacebookIcon } from "@/components/ui/facebook-icon";

export default function ProfilePage() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [hasPassword, setHasPassword] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [fbLinked, setFbLinked] = useState<boolean | null>(null);
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name ?? "");
        setBirthdate(data.birthdate ?? "");
        setHasPassword(data.hasPassword ?? true);
      });

    fetch("/api/facebook/status")
      .then((r) => r.json())
      .then((data) => setFbLinked(data.linked ?? false));
  }, []);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthdate: birthdate || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: "Profile updated" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const body: Record<string, string> = { newPassword };
      if (hasPassword) body.currentPassword = currentPassword;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast({ title: hasPassword ? "Password changed" : "Password set" });
      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  }

  async function unlinkFacebook() {
    setFbLoading(true);
    try {
      const res = await fetch("/api/facebook/unlink", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFbLinked(false);
      toast({ title: "Facebook disconnected" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setFbLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="text-muted-foreground mt-1">{session?.user?.email}</p>
      </div>

      <form onSubmit={saveInfo}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthdate">
                Date of birth{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={savingInfo} className="w-full">
              <Save className="w-4 h-4" />
              {savingInfo ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
            Facebook
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fbLinked === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : fbLinked ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link2 className="w-4 h-4 text-primary" />
                <span>Connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={fbLoading}
                onClick={unlinkFacebook}
              >
                <Link2Off className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Link your Facebook account to sign in with one click.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => signIn("facebook", { callbackUrl: "/profile" })}
              >
                <FacebookIcon className="w-4 h-4" />
                Link Facebook account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={changePassword}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {hasPassword ? "Change password" : "Set a password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasPassword && (
              <p className="text-sm text-muted-foreground">
                Set a password to be able to sign in with email too.
              </p>
            )}
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword} className="w-full">
              <Lock className="w-4 h-4" />
              {savingPassword ? "Saving…" : hasPassword ? "Change password" : "Set password"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
