"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Trophy, Clock, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Tournament {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: number;
  completedAt?: number | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const active = tournaments.filter((t) => t.status === "active");
  const completed = tournaments.filter((t) => t.status === "completed");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">
            Hello, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Your tournament overview</p>
        </div>
        <Button asChild>
          <Link href="/tournaments/new">
            <Plus className="w-4 h-4" />
            New tournament
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: tournaments.length,
            icon: <Trophy className="w-5 h-5 text-primary" />,
          },
          {
            label: "Active",
            value: active.length,
            icon: <Clock className="w-5 h-5 text-accent" />,
          },
          {
            label: "Completed",
            value: completed.length,
            icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading tournaments…
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 text-muted/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No tournaments yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first Mexicano tournament to get started.
          </p>
          <Button asChild>
            <Link href="/tournaments/new">
              <Plus className="w-4 h-4" />
              Create tournament
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Your tournaments</h2>
          <div className="grid gap-3">
            {tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card className="hover:border-primary/40 transition-all cursor-pointer group">
                  <CardContent className="py-4 px-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{t.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={t.type === "mexicano" ? "default" : "secondary"}>
                        {t.type}
                      </Badge>
                      <Badge variant={t.status === "active" ? "accent" : "success"}>
                        {t.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
