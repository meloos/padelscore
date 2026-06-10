import { describe, expect, it } from "vitest";
import { formatDate, generatePairings, generateMultiCourtPairings, getOrdinal } from "@/lib/utils";

describe("generatePairings", () => {
  const ids = ["A", "B", "C", "D"];

  it("returns two teams of two", () => {
    const [team1, team2] = generatePairings(ids);
    expect(team1).toHaveLength(2);
    expect(team2).toHaveLength(2);
  });

  it("uses all four player ids with no duplicates", () => {
    const [team1, team2] = generatePairings(ids);
    const all = [...team1, ...team2].sort();
    expect(all).toEqual(["A", "B", "C", "D"]);
  });

  it("always picks one of the three valid 2v2 splits", () => {
    const validSplits = [
      [["A", "B"], ["C", "D"]],
      [["A", "C"], ["B", "D"]],
      [["A", "D"], ["B", "C"]],
    ];
    for (let i = 0; i < 50; i++) {
      const result = generatePairings(ids);
      const match = validSplits.some(
        ([t1, t2]) =>
          JSON.stringify(result[0]) === JSON.stringify(t1) &&
          JSON.stringify(result[1]) === JSON.stringify(t2)
      );
      expect(match).toBe(true);
    }
  });
});

describe("generateMultiCourtPairings", () => {
  it("returns one court for 4 players with no sitting out", () => {
    const ids = ["A", "B", "C", "D"];
    const { courts, sittingOut } = generateMultiCourtPairings(ids);
    expect(courts).toHaveLength(1);
    expect(courts[0].team1).toHaveLength(2);
    expect(courts[0].team2).toHaveLength(2);
    expect(sittingOut).toHaveLength(0);
    const all = [...courts[0].team1, ...courts[0].team2].sort();
    expect(all).toEqual(["A", "B", "C", "D"]);
  });

  it("returns two courts for 8 players with no sitting out", () => {
    const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const { courts, sittingOut } = generateMultiCourtPairings(ids);
    expect(courts).toHaveLength(2);
    expect(sittingOut).toHaveLength(0);
    const all = [...courts[0].team1, ...courts[0].team2, ...courts[1].team1, ...courts[1].team2].sort();
    expect(all).toEqual(ids.slice().sort());
  });

  it("sits out the correct number of players for 6-player tournament", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    const { courts, sittingOut } = generateMultiCourtPairings(ids);
    expect(courts).toHaveLength(1);
    expect(sittingOut).toHaveLength(2);
    const playing = [...courts[0].team1, ...courts[0].team2];
    expect(new Set([...playing, ...sittingOut]).size).toBe(6);
  });

  it("fair waiting: guarantees last sitters play next round", () => {
    const ids = ["A", "B", "C", "D", "E"];
    // Run 50 times to confirm the last sitters always get included
    for (let i = 0; i < 50; i++) {
      const { courts } = generateMultiCourtPairings(ids, ["E"], true);
      const playing = [...courts[0].team1, ...courts[0].team2];
      expect(playing).toContain("E");
    }
  });

  it("throws for fewer than 4 players", () => {
    expect(() => generateMultiCourtPairings(["A", "B", "C"])).toThrow();
  });
});

describe("formatDate", () => {
  it("returns — for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats a Date object", () => {
    const d = new Date("2024-06-15T12:00:00Z");
    const result = formatDate(d);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });
});

describe("getOrdinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
  ])("getOrdinal(%i) === %s", (n, expected) => {
    expect(getOrdinal(n)).toBe(expected);
  });
});
