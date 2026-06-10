"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trophy, UserCheck, Shuffle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

const schema = z.object({
  name: z.string().min(2, "Tournament name required"),
  fairWaiting: z.boolean(),
  players: z
    .array(
      z.object({
        displayName: z.string().min(1, "Name required"),
        userId: z.string().optional(),
      })
    )
    .min(4, "Add at least 4 players"),
});
type Fields = z.infer<typeof schema>;

export default function NewTournamentPage() {
  const router = useRouter();
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  useEffect(() => {
    fetch("/api/players").then((r) => r.json()).then(setRegisteredUsers);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      fairWaiting: false,
      players: [
        { displayName: "", userId: undefined },
        { displayName: "", userId: undefined },
        { displayName: "", userId: undefined },
        { displayName: "", userId: undefined },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "players" });
  const players = watch("players");
  const fairWaiting = watch("fairWaiting");
  const numCourts = Math.floor(players.length / 4);
  const numSitting = players.length % 4;

  function linkUser(index: number, user: RegisteredUser | null) {
    if (user) {
      setValue(`players.${index}.displayName`, user.name);
      setValue(`players.${index}.userId`, user.id);
    } else {
      setValue(`players.${index}.userId`, undefined);
    }
  }

  async function onSubmit(data: Fields) {
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "mexicano" }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create tournament");
      }

      const tournament = await res.json();
      toast({ title: "Tournament created!", description: "Round 1 is ready." });
      router.push(`/tournaments/${tournament.id}`);
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black">New tournament</h1>
        <p className="text-muted-foreground mt-1">
          Set up a Mexicano padel tournament
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Tournament details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Tournament name</Label>
              <Input
                id="name"
                placeholder="e.g. Sunday Open 2025"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Shuffle className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">Mexicano format</p>
                <p className="text-xs text-muted-foreground">
                  Random pairs each round · {numCourts} court{numCourts !== 1 ? "s" : ""} · score to 21
                  {numSitting > 0 && ` · ${numSitting} player${numSitting !== 1 ? "s" : ""} sit out each round`}
                </p>
              </div>
            </div>

            {numSitting > 0 && (
              <button
                type="button"
                onClick={() => setValue("fairWaiting", !fairWaiting)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  fairWaiting
                    ? "bg-accent/10 border-accent/40"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  fairWaiting ? "bg-accent border-accent" : "border-muted-foreground"
                }`}>
                  {fairWaiting && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <p className="text-sm font-semibold">Fair waiting</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Players who sat out last round are guaranteed to play next round — no one waits more than once in a row
                  </p>
                </div>
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>
              Add at least 4 players. Every 4 players fills another court simultaneously.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, i) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <Label>Player {i + 1}</Label>
                  {players[i]?.userId && (
                    <Badge variant="success" className="ml-auto">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Registered
                    </Badge>
                  )}
                  {i >= 4 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => remove(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder={`Player ${i + 1} name`}
                    {...register(`players.${i}.displayName`)}
                  />
                  <select
                    className="flex h-10 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto sm:min-w-[140px]"
                    onChange={(e) => {
                      const user = registeredUsers.find((u) => u.id === e.target.value);
                      linkUser(i, user ?? null);
                    }}
                    value={players[i]?.userId ?? ""}
                  >
                    <option value="">Guest player</option>
                    {registeredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.players?.[i]?.displayName && (
                  <p className="text-destructive text-xs">
                    {errors.players[i]?.displayName?.message}
                  </p>
                )}
              </div>
            ))}

            {errors.players?.root && (
              <p className="text-destructive text-xs">{errors.players.root.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 w-full"
              onClick={() => append({ displayName: "", userId: undefined })}
            >
              <Plus className="w-3.5 h-3.5" />
              Add player
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          <Trophy className="w-4 h-4" />
          {isSubmitting ? "Creating..." : "Create & start Round 1"}
        </Button>
      </form>
    </div>
  );
}
