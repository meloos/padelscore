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
