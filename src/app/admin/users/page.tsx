"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Shield, Trash2, User, Pencil, X, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  totalPoints: number | null;
  tournamentsPlayed: number | null;
  tournamentsWon: number | null;
}

interface EditState {
  userId: string;
  name: string;
  birthdate: string;
  generatedPassword: string | null;
  saving: boolean;
  generatingPw: boolean;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAdmin(id: string, current: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !current }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isAdmin: !current } : u)
      );
      toast({ title: `Admin ${!current ? "granted" : "revoked"}` });
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (edit?.userId === id) setEdit(null);
      toast({ title: "User deleted" });
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
  }

  function startEdit(u: AdminUser) {
    setEdit({ userId: u.id, name: u.name, birthdate: "", generatedPassword: null, saving: false, generatingPw: false });
  }

  async function saveEdit() {
    if (!edit) return;
    setEdit((e) => e && { ...e, saving: true });
    const res = await fetch(`/api/admin/users/${edit.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: edit.name, birthdate: edit.birthdate || null }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === edit.userId ? { ...u, name: edit.name } : u));
      toast({ title: "User updated" });
      setEdit((e) => e && { ...e, saving: false });
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.error, variant: "destructive" });
      setEdit((e) => e && { ...e, saving: false });
    }
  }

  async function generatePw() {
    if (!edit) return;
    setEdit((e) => e && { ...e, generatingPw: true, generatedPassword: null });
    const res = await fetch(`/api/admin/users/${edit.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatePassword: true }),
    });
    const d = await res.json();
    if (res.ok) {
      setEdit((e) => e && { ...e, generatingPw: false, generatedPassword: d.generatedPassword });
      toast({ title: "New password generated" });
    } else {
      toast({ title: "Error", description: d.error, variant: "destructive" });
      setEdit((e) => e && { ...e, generatingPw: false });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">All Users</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} registered account{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-12 text-center">Loading…</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card
              key={u.id}
              className={u.isAdmin ? "border-primary/30 bg-primary/5" : "border-border"}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {u.isAdmin
                      ? <ShieldCheck className="w-5 h-5 text-primary" />
                      : <User className="w-5 h-5 text-muted-foreground" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{u.name}</p>
                      {u.isAdmin && <Badge variant="default">Admin</Badge>}
                      {u.id === session?.user?.id && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email} · Joined {formatDate(u.createdAt)}</p>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                    <div>
                      <p className="text-xs text-muted-foreground">Points</p>
                      <p className="font-bold text-primary">{u.totalPoints ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tourneys</p>
                      <p className="font-bold">{u.tournamentsPlayed ?? 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => edit?.userId === u.id ? setEdit(null) : startEdit(u)}
                      title="Edit user"
                    >
                      {edit?.userId === u.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdmin(u.id, u.isAdmin)}
                      disabled={u.id === session?.user?.id}
                      className="gap-1.5 text-xs"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{u.isAdmin ? "Revoke admin" : "Make admin"}</span>
                      <span className="sm:hidden">{u.isAdmin ? "Revoke" : "Admin"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteUser(u.id, u.name)}
                      disabled={u.id === session?.user?.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {edit?.userId === u.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input
                          value={edit.name}
                          onChange={(e) => setEdit((s) => s && { ...s, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Date of birth <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                          type="date"
                          value={edit.birthdate}
                          onChange={(e) => setEdit((s) => s && { ...s, birthdate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={edit.saving} className="gap-1.5">
                        <Save className="w-3.5 h-3.5" />
                        {edit.saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generatePw}
                        disabled={edit.generatingPw}
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {edit.generatingPw ? "Generating…" : "Generate new password"}
                      </Button>
                    </div>

                    {edit.generatedPassword && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground shrink-0">New password:</p>
                        <code className="font-mono font-bold text-primary tracking-wider">
                          {edit.generatedPassword}
                        </code>
                        <p className="text-xs text-muted-foreground ml-auto">Share this once — it won't be shown again</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
