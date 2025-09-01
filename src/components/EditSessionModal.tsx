import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { Round, Session } from "../types/session";
import { getRounds, aggregateTotals } from "../selectors/rounds";

import type { ZoneGroup, Direction } from "../zones/presets";
import { orderedZones } from "../zones/presets";

import ZoneGridRounds, { type AugRound } from "./ZoneGridRounds";

/* ------------------------- Types ------------------------- */

type SessionDraft = {
  date: string;
  trainingType: string;
  zoneGroup?: string;
  notes?: string;
  rounds: Round[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (draft: SessionDraft) => Promise<void> | void;
  initial?: Session | SessionDraft;
  title?: string;
};

/* ------------------------- Component ------------------------- */

export default function EditSessionModal({
  open,
  onClose,
  onSave,
  initial,
  title = "Log New Session",
}: Props) {
  if (!open) return null;
  return createPortal(
    <ModalContent onClose={onClose} onSave={onSave} initial={initial} title={title} />,
    document.body
  );
}

function ModalContent({
  onClose,
  onSave,
  initial,
  title,
}: {
  onClose: () => void;
  onSave: (draft: SessionDraft) => Promise<void> | void;
  initial?: Session | SessionDraft;
  title: string;
}) {
  /* ---------- top-level form state ---------- */
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [trainingType, setTrainingType] = useState<string>("spot");
  const [zoneGroup, setZoneGroup] = useState<ZoneGroup>("3PT");
  const [notes, setNotes] = useState<string>("");

  const [roundsCount, setRoundsCount] = useState<number>(1);
  const [directions, setDirections] = useState<Direction[]>(["ltr"]); // per-round
  const [rounds, setRounds] = useState<AugRound[]>([]); // internal grid with bucket

  /* ---------- hydrate from initial ---------- */
  useEffect(() => {
    if (!initial) {
      // brand-new
      setDate(new Date().toISOString().slice(0, 10));
      setTrainingType("spot");
      setZoneGroup("3PT");
      setNotes("");
      setRoundsCount(1);
      setDirections(["ltr"]);
      setRounds(buildTemplate(1, "spot", "3PT", "ltr"));
      return;
    }

    // editing existing
    const initRounds = "rounds" in initial ? getRounds(initial as Session) : [];
    const zg = (("zoneGroup" in initial && (initial as any).zoneGroup) || "3PT") as ZoneGroup;
    const tt = ("trainingType" in initial && (initial as any).trainingType) || "spot";

    setDate(("date" in initial && (initial as any).date) || new Date().toISOString().slice(0, 10));
    setTrainingType(tt);
    setZoneGroup(zg);
    setNotes(("notes" in initial && (initial as any).notes) || "");

    const guessed = Math.max(1, Math.ceil((initRounds?.length || 0) / 5));
    setRoundsCount(guessed);
    setDirections(Array.from({ length: guessed }, () => "ltr"));

    // bucketize but use ltr labels for membership
    const zones = orderedZones(zg, "ltr");
    const bucketed: AugRound[] = initRounds.map((r, i) => ({
      ...r,
      idx: i,
      bucket: Math.floor(i / zones.length),
    }));
    setRounds(ensureGrid(bucketed, guessed, zones, tt));
  }, [initial]);

  /* ---------- overlay key/scroll handling ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* ---------- keep grid/directions in sync ---------- */
  useEffect(() => {
    // sync directions length with roundsCount
    setDirections((prev) => {
      const next = prev.slice(0, roundsCount);
      while (next.length < roundsCount) next.push("ltr");
      return next;
    });

    // keep grid membership the same size
    setRounds((prev) =>
      ensureGrid(prev, roundsCount, orderedZones(zoneGroup, "ltr"), trainingType)
    );
  }, [zoneGroup, roundsCount, trainingType]);

  /* ---------- flatten honoring per-round direction ---------- */
  const flatRounds = useMemo<Round[]>(() => {
    const out: Round[] = [];
    let idx = 0;
    for (let bucket = 0; bucket < roundsCount; bucket++) {
      const dir = directions[bucket] ?? "ltr";
      const labels = orderedZones(zoneGroup, dir);
      for (const z of labels) {
        const r = rounds.find((x) => (x as any).bucket === bucket && x.zone === z);
        if (!r) continue;
        out.push({
          idx: idx++,
          zone: r.zone,
          attempts: strongNum(r.attempts),
          made: strongNum(r.made),
          type: r.type,
        });
      }
    }
    return out;
  }, [rounds, roundsCount, directions, zoneGroup]);

  /* ---------- totals ---------- */
  const totals = useMemo(() => {
    return aggregateTotals(
      getRounds({
        id: "preview",
        userId: "preview",
        date,
        trainingType,
        notes,
        rounds: flatRounds,
      } as Session)
    );
  }, [flatRounds, date, trainingType, notes]);

  /* ---------- grid edits (with autofill from first cell) ---------- */
  const handleGridChange = (roundNo: number, zone: string, patch: Partial<Round>) => {
    const attemptsProvided =
      typeof patch.attempts === "number" && !Number.isNaN(patch.attempts);

    const dir = directions[roundNo] ?? "ltr";
    const labels = orderedZones(zoneGroup, dir);
    const firstZone = labels[0];

    setRounds((prev) =>
      prev.map((r) => {
        const sameRound = (r as any).bucket === roundNo;

        // 1) Always apply the direct change
        if (sameRound && r.zone === zone) {
          return sanitizeStrong({ ...r, ...patch }) as AugRound;
        }

        // 2) If first zone's attempts changed, auto-fill other zones in that round
        //    but only those that are still zero (don't clobber user edits)
        if (
          attemptsProvided &&
          zone === firstZone &&
          sameRound &&
          labels.includes(r.zone) &&
          strongNum(r.attempts) === 0
        ) {
          return sanitizeStrong({ ...r, attempts: patch.attempts }) as AugRound;
        }

        return r;
      })
    );
  };

  /* ---------- per-round direction change ---------- */
  const handleDirectionChange = (roundNo: number, dir: Direction) => {
    setDirections((prev) => {
      const next = prev.slice();
      next[roundNo] = dir;
      return next;
    });
  };

  /* ---------- save ---------- */
  const handleSave = async () => {
    if (flatRounds.length === 0) return alert("Please add at least one round.");
    for (const r of flatRounds) {
      if (!r.zone || r.zone.trim() === "") return alert("Each round must have a zone name.");
      if (r.made > r.attempts) return alert("Made cannot exceed Attempted.");
    }

    await onSave({ date, trainingType, zoneGroup, notes, rounds: flatRounds });
    onClose();
  };

  /* ======================== RENDER ======================== */
  return (
    <div className="ss-modal fixed inset-0 z-[1000]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ss-backdrop fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-start justify-center p-4 sm:p-6 overflow-y-auto" onClick={onClose}>
        <div className="ss-panel relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b bg-white/95 backdrop-blur">
            <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
            <button className="ml-auto h-8 w-8 grid place-items-center rounded-full border hover:bg-gray-50" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-5 space-y-6">
            {/* Form header controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="ss-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Training Type</span>
                <select
                  value={trainingType}
                  onChange={(e) => setTrainingType(e.target.value)}
                  className="ss-input"
                >
                  <option value="spot">Spot Shooting</option>
                  <option value="catch_and_shoot">Catch &amp; Shoot</option>
                  <option value="off_dribble">Off the Dribble</option>
                  <option value="run_half_court">Run Half Court</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Rounds</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={roundsCount}
                  onChange={(e) => setRoundsCount(Math.max(1, Number(e.target.value || 1)))}
                  className="ss-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Zone Type</span>
                <select
                  value={zoneGroup}
                  onChange={(e) => setZoneGroup(e.target.value as ZoneGroup)}
                  className="ss-input"
                >
                  <option value="3PT">3pt</option>
                  <option value="MID">Midrange</option>
                  <option value="PAINT">Paint</option>
                </select>
              </label>
            </div>

            {/* Multi-round zone grid (now with per-round direction) */}
            <ZoneGridRounds
              zoneGroup={zoneGroup}
              directions={directions}
              rounds={rounds}
              roundsCount={roundsCount}
              onChange={handleGridChange}
              onDirectionChange={handleDirectionChange}
            />

            {/* Notes */}
            <div>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ss-input min-h-[100px]"
                  placeholder="Any observations to remember..."
                />
              </label>
            </div>

            {/* Totals */}
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="font-medium">Session Totals</div>
              <div>
                Attempts: {totals.attempts} &nbsp;|&nbsp; Made: {totals.made} &nbsp;|&nbsp; Accuracy:{" "}
                {totals.pct.toFixed(1)}%
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-end">
              <button className="ss-cta" onClick={handleSave}>
                🏀&nbsp; Submit Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Helpers ------------------------- */

function strongNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Ensure attempts/made are numbers and clamped; keep the rest intact. */
function sanitizeStrong<T extends { attempts?: number; made?: number }>(
  r: T
): Omit<T, "attempts" | "made"> & { attempts: number; made: number } {
  const attempts = Math.max(0, Number(r.attempts ?? 0));
  const made = Math.max(0, Math.min(Number(r.made ?? 0), attempts));
  return { ...(r as any), attempts, made };
}

/** Keep an AugRound grid for the given roundsCount+zones membership. */
function ensureGrid(
  prev: AugRound[],
  roundsCount: number,
  zones: string[], // membership only (order not important here)
  trainingType: string
): AugRound[] {
  let out: AugRound[] = prev
    .filter((r) => (r as any).bucket < roundsCount && zones.includes(r.zone))
    .map((r) => ({ ...r, type: r.type ?? trainingType }));

  for (let bucket = 0; bucket < roundsCount; bucket++) {
    for (const zone of zones) {
      if (!out.some((r) => (r as any).bucket === bucket && r.zone === zone)) {
        out.push({
          idx: 0,
          bucket,
          zone,
          attempts: 0,
          made: 0,
          type: trainingType,
        } as AugRound);
      }
    }
  }
  return out;
}

function buildTemplate(
  count: number,
  trainingType: string,
  group: ZoneGroup,
  dir: Direction
): AugRound[] {
  const zones = orderedZones(group, dir);
  const out: AugRound[] = [];
  for (let bucket = 0; bucket < count; bucket++) {
    for (const zone of zones) {
      out.push({
        idx: 0,
        bucket,
        zone,
        attempts: 0,
        made: 0,
        type: trainingType,
      } as AugRound);
    }
  }
  return out;
}
