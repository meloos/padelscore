"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface AdminScoreEditProps {
  roundId: string;
  matchId: string;
  currentTeam1Score: number;
  currentTeam2Score: number;
  team1Names: string[];
  team2Names: string[];
  onSaved: () => void;
}

export function AdminScoreEdit({
  roundId,
  matchId,
  currentTeam1Score,
  currentTeam2Score,
  team1Names,
  team2Names,
  onSaved,
}: AdminScoreEditProps) {
  const [open, setOpen] = useState(false);
  const [s1, setS1] = useState(String(currentTeam1Score));
  const [s2, setS2] = useState(String(currentTeam2Score));
  const [saving, setSaving] = useState(false);

  const n1 = parseInt(s1);
  const n2 = parseInt(s2);
  const valid = !isNaN(n1) && !isNaN(n2) && n1 + n2 === 21 && n1 >= 0 && n2 >= 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Pencil className="w-3 h-3" />
        Edit score
      </button>
    );
  }

  async function save() {
    if (!valid) return;
    setSaving(true);
    const res = await fetch(`/api/admin/rounds/${roundId}/score`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team1Score: n1, team2Score: n2, matchId }),
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Score updated" });
      setOpen(false);
      onSaved();
    } else {
      const d = await res.json();
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
  }

  return (
    <div className="mt-1 space-y-2">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground truncate block">{team1Names.join(" & ")}</span>
          <Input
            type="number"
            min={0}
            max={21}
            value={s1}
            onChange={(e) => {
              setS1(e.target.value);
              const n = parseInt(e.target.value);
              if (!isNaN(n) && n >= 0 && n <= 21) setS2(String(21 - n));
            }}
            className="h-7 text-center text-sm"
          />
        </div>
        <span className="text-muted-foreground pb-1">–</span>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground truncate block text-right">{team2Names.join(" & ")}</span>
          <Input
            type="number"
            min={0}
            max={21}
            value={s2}
            onChange={(e) => {
              setS2(e.target.value);
              const n = parseInt(e.target.value);
              if (!isNaN(n) && n >= 0 && n <= 21) setS1(String(21 - n));
            }}
            className="h-7 text-center text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={save} disabled={!valid || saving}>
          <Check className="w-3 h-3" />
          Save
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setOpen(false)}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
