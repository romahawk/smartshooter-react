import { describe, it, expect } from "vitest";
import { accuracyPct, getRounds, aggregateTotals, aggregateByZone } from "./rounds";
import type { Session } from "../types/session";

describe("accuracyPct", () => {
  it("returns 0 when attempts is 0", () => {
    expect(accuracyPct(0, 0)).toBe(0);
  });
  it("clamps to 100 and 0", () => {
    expect(accuracyPct(10, 15)).toBe(100); // made cannot exceed attempts logically
    expect(accuracyPct(10, -5)).toBe(0);
  });
  it("computes correct percentage", () => {
    expect(accuracyPct(20, 13)).toBeCloseTo(65);
  });
});

describe("getRounds", () => {
  it("returns sorted rounds by idx", () => {
    const s: Session = {
      id: "1",
      userId: "u",
      date: "2025-08-24",
      trainingType: "catch_and_shoot",
      rounds: [
        { idx: 2, zone: "right_wing", attempts: 10, made: 7 },
        { idx: 0, zone: "top_key", attempts: 5, made: 3 },
      ],
    };
    const r = getRounds(s);
    expect(r.map((x) => x.idx)).toEqual([0, 2]);
  });

  it("maps legacy zones{} to synthetic rounds", () => {
    const s: Session = {
      id: "2",
      userId: "u",
      date: "2025-08-24",
      trainingType: "spot",
      rounds: [],
      zones: {
        top_key: { attempts: 10, made: 6 },
        right_wing: { attempts: 8, made: 5 },
      },
    };
    const r = getRounds(s);
    expect(r.length).toBe(2);
    expect(r[0]).toHaveProperty("zone");
    expect(r.reduce((a, x) => a + x.attempts, 0)).toBe(18);
    expect(r.reduce((a, x) => a + x.made, 0)).toBe(11);
  });
});

describe("aggregateTotals", () => {
  it("sums attempts/made and normalizes made<=attempts", () => {
    const s: Session = {
      id: "3",
      userId: "u",
      date: "2025-08-24",
      trainingType: "spot",
      rounds: [
        { idx: 0, zone: "A", attempts: 10, made: 9 },
        { idx: 1, zone: "B", attempts: 5, made: 8 }, // will be capped to 5
        { idx: 2, zone: "C", attempts: -3, made: -1 }, // negatives -> 0
      ],
    };
    const t = aggregateTotals(s.rounds);
    expect(t.attempts).toBe(15);
    expect(t.made).toBe(14);
    expect(t.pct).toBeCloseTo((14 / 15) * 100);
  });
});

describe("aggregateByZone", () => {
  it("groups by zone and computes pct", () => {
    const rounds = [
      { idx: 0, zone: "right_wing", attempts: 10, made: 6 },
      { idx: 1, zone: "top_key", attempts: 5, made: 4 },
      { idx: 2, zone: "right_wing", attempts: 8, made: 5 },
    ];
    const m = aggregateByZone(rounds as any);
    expect(m.right_wing.attempts).toBe(18);
    expect(m.right_wing.made).toBe(11);
    expect(m.right_wing.pct).toBeCloseTo((11 / 18) * 100);
    expect(m.right_wing.roundsCount).toBe(2);
    expect(m.top_key.roundsCount).toBe(1);
  });
});
