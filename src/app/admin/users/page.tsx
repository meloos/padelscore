"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Shield, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: number;
  totalPoints: number | null;
  tournamentsPlayed: number | null;
  tournamentsWon: number | null;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast({ title: "User deleted" });
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.error, variant: "destructive" });
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
              <CardContent className="py-4 px-5 flex items-center gap-4">
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
                  <p className="text-xs text-muted-foreground">{u.email} · Joined {formatDate(u.createdAt)}</p>
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

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAdmin(u.id, u.isAdmin)}
                    disabled={u.id === session?.user?.id}
                    className="gap-1.5 text-xs"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {u.isAdmin ? "Revoke admin" : "Make admin"}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
