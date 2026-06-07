import { cn } from "@/lib/utils";
import { Swords } from "lucide-react";

interface MatchCardProps {
  team1: string[];
  team2: string[];
  team1Score?: number | null;
  team2Score?: number | null;
  status: string;
  roundNumber: number;
}

export function MatchCard({
  team1,
  team2,
  team1Score,
  team2Score,
  status,
  roundNumber,
}: MatchCardProps) {
  const completed = status === "completed";
  const team1Won = completed && team1Score! > team2Score!;
  const team2Won = completed && team2Score! > team1Score!;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Round {roundNumber}
        </span>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            completed
              ? "bg-green-500/20 text-green-400"
              : "bg-accent/20 text-accent"
          )}
        >
          {completed ? "Completed" : "Active"}
        </span>
      </div>

      <div className="p-4 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div
          className={cn(
            "text-center p-3 rounded-lg transition-all",
            team1Won ? "bg-primary/10 border border-primary/30" : "bg-muted/20"
          )}
        >
          {team1.map((name, i) => (
            <p
              key={i}
              className={cn(
                "font-semibold text-sm",
                team1Won ? "text-primary" : "text-foreground"
              )}
            >
              {name}
            </p>
          ))}
          {completed && (
            <p className="text-3xl font-black mt-2 text-primary">
              {team1Score}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <Swords className="w-5 h-5 text-muted-foreground" />
          {completed && (
            <span className="text-xs text-muted-foreground font-bold">VS</span>
          )}
        </div>

        <div
          className={cn(
            "text-center p-3 rounded-lg transition-all",
            team2Won ? "bg-primary/10 border border-primary/30" : "bg-muted/20"
          )}
        >
          {team2.map((name, i) => (
            <p
              key={i}
              className={cn(
                "font-semibold text-sm",
                team2Won ? "text-primary" : "text-foreground"
              )}
            >
              {name}
            </p>
          ))}
          {completed && (
            <p className="text-3xl font-black mt-2 text-primary">
              {team2Score}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
