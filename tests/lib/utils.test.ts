import { describe, expect, it } from "vitest";
import { formatDate, generatePairings, getOrdinal } from "@/lib/utils";

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
