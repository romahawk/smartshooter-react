// src/selectors/rounds.ts
// SmartShooter — minimal rounds[] selectors (step 1)
// Only pure helpers. No UI state. No Firestore. Safe to import anywhere.

import type { Session, Round } from "../types/session";

export type ZoneAgg = {
  attempts: number;
  made: number;
  pct: number;        // 0..100
  roundsCount: number;
};

/** Clamp a percentage value to [0, 100] */
const clampPct = (v: number) => Math.max(0, Math.min(100, v));

/** Accuracy % helper */
export const accuracyPct = (attempts: number, made: number): number => {
  if (!attempts || attempts <= 0) return 0;
  return clampPct((made / attempts) * 100);
};

/**
 * getRounds(session): returns a sorted copy of session.rounds.
 * If the session uses the legacy flat `zones{}` map, build synthetic rounds (non-mutating).
 */
export const getRounds = (session: Session): Round[] => {
  if (Array.isArray(session.rounds) && session.rounds.length > 0) {
    // ensure stable order by idx
    return [...session.rounds].sort((a, b) => a.idx - b.idx);
  }
  if (session.zones) {
    let idx = 0;
    return Object.entries(session.zones).map(([zone, stat]) => ({
      idx: idx++,
      zone,
      attempts: Math.max(0, stat?.attempts ?? 0),
      made: Math.max(0, Math.min(stat?.made ?? 0, stat?.attempts ?? 0)),
      type: session.trainingType,
    }));
  }
  return [];
};

/**
 * aggregateTotals(rounds): sum attempts/made and compute overall accuracy.
 * Normalizes negatives and caps made<=attempts per round defensively.
 */
export const aggregateTotals = (rounds: Round[]) => {
  let attempts = 0;
  let made = 0;
  const roundsCount = rounds.length;

  for (const r of rounds) {
    const a = Math.max(0, r.attempts || 0);
    const m = Math.max(0, Math.min(r.made || 0, a));
    attempts += a;
    made += m;
  }

  return {
    attempts,
    made,
    roundsCount,
    pct: accuracyPct(attempts, made),
  };
};

/**
 * aggregateByZone(rounds): per-zone totals with attempts/made/% and roundsCount.
 * Useful for heatmap adapters and zone tables.
 */
export const aggregateByZone = (rounds: Round[]) => {
  const map: Record<string, ZoneAgg> = {};

  for (const r of rounds) {
    const key = r.zone;
    if (!map[key]) {
      map[key] = { attempts: 0, made: 0, pct: 0, roundsCount: 0 };
    }
    const a = Math.max(0, r.attempts || 0);
    const m = Math.max(0, Math.min(r.made || 0, a));
    map[key].attempts += a;
    map[key].made += m;
    map[key].roundsCount += 1;
  }

  for (const key of Object.keys(map)) {
    const { attempts, made } = map[key];
    map[key].pct = accuracyPct(attempts, made);
  }

  return map;
};
