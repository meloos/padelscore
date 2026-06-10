"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Trophy, Pencil, Trash2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface AdminTournament {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tournaments");
    if (res.ok) setTournaments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveName(id: string, name: string) {
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setTournaments((prev) => prev.map((t) => t.id === id ? { ...t, name } : t));
      toast({ title: "Name updated" });
    }
    setEditing(null);
  }

  async function toggleStatus(id: string, current: string) {
    const status = current === "active" ? "completed" : "active";
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTournaments((prev) =>
        prev.map((t) => t.id === id ? { ...t, status } : t)
      );
      toast({ title: `Set to ${status}` });
    }
  }

  async function deleteTournament(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Tournament deleted" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">All Tournaments</h1>
        <p className="text-muted-foreground mt-1">
          {tournaments.length} total across all users
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-12 text-center">Loading…</p>
      ) : tournaments.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No tournaments yet.</p>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Card key={t.id} className="border-border">
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <Trophy className="w-5 h-5 text-primary shrink-0" />

                <div className="flex-1 min-w-0">
                  {editing?.id === t.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditing({ id: t.id, name: e.target.value })}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveName(t.id, editing.name);
                          if (e.key === "Escape") setEditing(null);
                        }}
                      />
                      <Button size="icon" className="h-9 w-9" onClick={() => saveName(t.id, editing.name)}>
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditing(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{t.name}</p>
                      <button
                        onClick={() => setEditing({ id: t.id, name: t.name })}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t.ownerName ?? "?"} · {formatDate(t.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={t.type === "mexicano" ? "default" : "secondary"} className="hidden sm:inline-flex">
                    {t.type}
                  </Badge>
                  <button onClick={() => toggleStatus(t.id, t.status)}>
                    <Badge
                      variant={t.status === "active" ? "accent" : "success"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {t.status}
                    </Badge>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href={`/tournaments/${t.id}`} target="_blank">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTournament(t.id, t.name)}
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
