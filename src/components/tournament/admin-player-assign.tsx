"use client";

import { useEffect, useState } from "react";
import { UserCog, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface TournamentPlayer {
  id: string;
  userId?: string | null;
  displayName: string;
}

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

interface Props {
  players: TournamentPlayer[];
  onSaved: () => void;
}

interface RowEdit {
  tpId: string;
  displayName: string;
  userId: string;
  saving: boolean;
}

export function AdminPlayerAssign({ players, onSaved }: Props) {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [editing, setEditing] = useState<RowEdit | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setRegisteredUsers(d));
  }, []);

  function startEdit(p: TournamentPlayer) {
    setEditing({
      tpId: p.id,
      displayName: p.displayName,
      userId: p.userId ?? "",
      saving: false,
    });
  }

  async function save() {
    if (!editing) return;
    setEditing((e) => e && { ...e, saving: true });

    const res = await fetch(`/api/admin/tournament-players/${editing.tpId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: editing.userId || null,
        displayName: editing.displayName,
      }),
    });

    if (res.ok) {
      toast({ title: "Player updated" });
      setEditing(null);
      onSaved();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.error, variant: "destructive" });
      setEditing((e) => e && { ...e, saving: false });
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <UserCog className="w-4 h-4 text-primary" />
          Manage players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {p.userId
                    ? registeredUsers.find((u) => u.id === p.userId)?.email ?? "Registered"
                    : "Guest (unassigned)"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 gap-1 text-xs"
                onClick={() => editing?.tpId === p.id ? setEditing(null) : startEdit(p)}
              >
                {editing?.tpId === p.id ? <X className="w-3 h-3" /> : "Edit"}
              </Button>
            </div>

            {editing?.tpId === p.id && (
              <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editing.displayName}
                    onChange={(e) => setEditing((s) => s && { ...s, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Linked account</Label>
                  <select
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={editing.userId}
                    onChange={(e) => setEditing((s) => s && { ...s, userId: e.target.value })}
                  >
                    <option value="">— Guest (no account) —</option>
                    {registeredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 h-9 text-xs"
                  onClick={save}
                  disabled={editing.saving || !editing.displayName.trim()}
                >
                  <Save className="w-3 h-3" />
                  {editing.saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
