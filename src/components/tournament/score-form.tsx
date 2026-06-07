"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

interface ScoreFormProps {
  tournamentId: string;
  roundId: string;
  team1: string[];
  team2: string[];
  onScoreSubmitted: () => void;
}

export function ScoreForm({
  tournamentId,
  roundId,
  team1,
  team2,
  onScoreSubmitted,
}: ScoreFormProps) {
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [loading, setLoading] = useState(false);

  const s1 = parseInt(score1);
  const s2 = parseInt(score2);
  const valid =
    !isNaN(s1) &&
    !isNaN(s2) &&
    s1 + s2 === 21 &&
    s1 >= 0 &&
    s2 >= 0;

  const handleScore1Change = (v: string) => {
    setScore1(v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0 && n <= 21) {
      setScore2(String(21 - n));
    }
  };

  async function submit() {
    if (!valid) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/rounds/${roundId}/score`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team1Score: s1, team2Score: s2 }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to submit score");
      }
      toast({ title: "Score saved!", description: `${s1} – ${s2}` });
      onScoreSubmitted();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {team1.join(" & ")}
          </Label>
          <Input
            type="number"
            min={0}
            max={21}
            value={score1}
            onChange={(e) => handleScore1Change(e.target.value)}
            placeholder="0"
            className="text-center text-2xl font-bold h-14"
          />
        </div>

        <div className="text-center">
          <span className="text-muted-foreground font-bold text-xl">–</span>
          <p className="text-xs text-muted-foreground mt-1">Total: 21</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground text-right block">
            {team2.join(" & ")}
          </Label>
          <Input
            type="number"
            min={0}
            max={21}
            value={score2}
            onChange={(e) => {
              setScore2(e.target.value);
              const n = parseInt(e.target.value);
              if (!isNaN(n) && n >= 0 && n <= 21) {
                setScore1(String(21 - n));
              }
            }}
            placeholder="0"
            className="text-center text-2xl font-bold h-14"
          />
        </div>
      </div>

      {score1 && score2 && !valid && (
        <p className="text-destructive text-sm text-center">
          Scores must sum to 21
        </p>
      )}

      <Button
        onClick={submit}
        disabled={!valid || loading}
        className="w-full"
        size="lg"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? "Saving..." : "Save Score"}
      </Button>
    </div>
  );
}
