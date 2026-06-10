import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePairings(playerIds: string[]): [string[], string[]] {
  const pairings: [string[], string[]][] = [
    [[playerIds[0], playerIds[1]], [playerIds[2], playerIds[3]]],
    [[playerIds[0], playerIds[2]], [playerIds[1], playerIds[3]]],
    [[playerIds[0], playerIds[3]], [playerIds[1], playerIds[2]]],
  ];
  return pairings[Math.floor(Math.random() * 3)];
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pairGroup(group: string[]): { team1: string[]; team2: string[] } {
  const options = [
    { team1: [group[0], group[1]], team2: [group[2], group[3]] },
    { team1: [group[0], group[2]], team2: [group[1], group[3]] },
    { team1: [group[0], group[3]], team2: [group[1], group[2]] },
  ];
  return options[Math.floor(Math.random() * 3)];
}

export function generateMultiCourtPairings(
  playerIds: string[],
  lastSittingOut: string[] = [],
  fairWaiting = false
): { courts: Array<{ team1: string[]; team2: string[] }>; sittingOut: string[] } {
  const numCourts = Math.floor(playerIds.length / 4);
  if (numCourts === 0) throw new Error("Not enough players for a court");
  const numPlaying = numCourts * 4;

  let playing: string[];
  if (playerIds.length <= numPlaying) {
    playing = shuffleInPlace([...playerIds]);
  } else if (fairWaiting && lastSittingOut.length > 0) {
    const mustPlay = shuffleInPlace(playerIds.filter((id) => lastSittingOut.includes(id)));
    const others = shuffleInPlace(playerIds.filter((id) => !lastSittingOut.includes(id)));
    playing = [...mustPlay, ...others].slice(0, numPlaying);
  } else {
    playing = shuffleInPlace([...playerIds]).slice(0, numPlaying);
  }

  const sittingOut = playerIds.filter((id) => !playing.includes(id));

  const courts: Array<{ team1: string[]; team2: string[] }> = [];
  for (let i = 0; i < numCourts; i++) {
    courts.push(pairGroup(playing.slice(i * 4, (i + 1) * 4)));
  }

  return { courts, sittingOut };
}

export function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return "—";
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "number") {
    d = new Date(date * 1000);
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
