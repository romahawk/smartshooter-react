import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Round, Session } from "../types/session";
import { getRounds, aggregateTotals } from "../selectors/rounds";
import type { ZoneGroup, Direction } from "../zones/presets";
import { orderedZones } from "../zones/presets";
import ZoneGridRounds, { type AugRound } from "./ZoneGridRounds";

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
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [trainingType, setTrainingType] = useState<string>("spot");
  const [zoneGroup, setZoneGroup] = useState<ZoneGroup>("3PT");
  const [direction, setDirection] = useState<Direction>("ltr");
  const [notes, setNotes] = useState<string>("");
  const [roundsCount, setRoundsCount] = useState<number>(1);
  const [rounds, setRounds] = useState<AugRound[]>([]); // internal grid with bucket

  // Hydrate from initial
  useEffect(() => {
    if (!initial) {
      setDate(new Date().toISOString().slice(0, 10));
      setTrainingType("spot");
      setZoneGroup("3PT");
      setDirection("ltr");
      setNotes("");
      setRoundsCount(1);
      setRounds(buildTemplate(1, "spot", "3PT", "ltr"));
      return;
    }

    const initRounds = "rounds" in initial ? getRounds(initial as Session) : [];
    const zGroup = (("zoneGroup" in initial && (initial as any).zoneGroup) || "3PT") as ZoneGroup;
    const tType = ("trainingType" in initial && (initial as any).trainingType) || "spot";

    setDate(("date" in initial && (initial as any).date) || new Date().toISOString().slice(0, 10));
    setTrainingType(tType);
    setZoneGroup(zGroup);
    setDirection("ltr");
    setNotes(("notes" in initial && (initial as any).notes) || "");

    const guessed = Math.max(1, Math.ceil((initRounds?.length || 0) / 5));
    setRoundsCount(guessed);

    const flatSorted = initRounds.map((r, i) => ({ ...r, idx: i }));
    const zones = orderedZones(zGroup, "ltr");
    const toBucketed = flatSorted.map<AugRound>((r, i) => ({
      ...r,
      bucket: Math.floor(i / zones.length),
    }));
    setRounds(ensureGrid(toBucketed, guessed, zones, tType));
  }, [initial]);

  // ESC + scroll lock
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

  // Keep grid shape when zoneGroup/direction/roundsCount changes
  useEffect(() => {
    setRounds((prev) =>
      ensureGrid(prev, roundsCount, orderedZones(zoneGroup, direction), trainingType)
    );
  }, [zoneGroup, direction, roundsCount, trainingType]);

  // Totals (flatten)
  const totals = useMemo(() => {
    const flat: Round[] = rounds
      .slice()
      .sort(byBucketThenZone(orderedZones(zoneGroup, direction)))
      .map((r, i) => ({ idx: i, zone: r.zone, attempts: r.attempts, made: r.made, type: r.type }));
    return aggregateTotals(
      getRounds({
        id: "preview",
        userId: "preview",
        date,
        trainingType,
        notes,
        rounds: flat,
      } as Session)
    );
  }, [rounds, zoneGroup, direction, date, trainingType, notes]);

  // Grid edit
  const handleGridChange = (roundNo: number, zone: string, patch: Partial<Round>) => {
    setRounds((prev) =>
      prev.map((r) =>
        (r as any).bucket === roundNo && r.zone === zone
          ? sanitizeSame({ ...r, ...patch })
          : r
      )
    );
  };

  // Save
  const handleSave = async () => {
    const zones = orderedZones(zoneGroup, direction);
    const flat: Round[] = rounds
      .slice()
      .sort(byBucketThenZone(zones))
      .map((r, i) =>
        sanitizeSame<Round>({
          idx: i,
          zone: r.zone,
          attempts: r.attempts,
          made: r.made,
          type: r.type,
        })
      );

    if (flat.length === 0) return alert("Please add at least one round.");
    for (const r of flat) {
      if (!r.zone || r.zone.trim() === "") return alert("Each round must have a zone name.");
      if (r.made > r.attempts) return alert("Made cannot exceed Attempted.");
    }

    await onSave({ date, trainingType, zoneGroup, notes, rounds: flat });
    onClose();
  };

  /* ======================== RENDER ======================== */
  return (
    <div
      className="ss-modal fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="ss-backdrop fixed inset-0 bg-black/50" />

      {/* Centering container */}
      <div
        className="fixed inset-0 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        {/* Panel */}
        <div
          className="ss-panel relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b bg-white/95 backdrop-blur">
            <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
            <button
              className="ml-auto h-8 w-8 grid place-items-center rounded-full border hover:bg-gray-50"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-5 space-y-6">
            {/* Form header controls */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
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

              {/* Direction toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Starting Zone</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("ltr")}
                    className={`ss-chip ${direction === "ltr" ? "ss-chip--active" : ""}`}
                    title="Left → Right"
                  >
                    L → R
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("rtl")}
                    className={`ss-chip ${direction === "rtl" ? "ss-chip--active" : ""}`}
                    title="Right → Left"
                  >
                    R ← L
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-round zone grid */}
            <ZoneGridRounds
              templateZones={orderedZones(zoneGroup, direction)}
              rounds={rounds}
              roundsCount={roundsCount}
              onChange={handleGridChange}
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

/* ---------- helpers (local) ---------- */

function byBucketThenZone(zones: string[]) {
  const idx = new Map(zones.map((z, i) => [z, i]));
  return (a: AugRound, b: AugRound) => {
    const ba = (a as any).bucket ?? 0;
    const bb = (b as any).bucket ?? 0;
    if (ba !== bb) return ba - bb;
    return (idx.get(a.zone) ?? 0) - (idx.get(b.zone) ?? 0);
  };
}

/** Preserve the same structural type (works for AugRound or Round). */
function sanitizeSame<T extends { attempts?: number; made?: number }>(r: T): T {
  const attempts = Math.max(0, Number(r.attempts || 0));
  const made = Math.max(0, Math.min(Number(r.made || 0), attempts));
  return { ...r, attempts, made };
}

function ensureGrid(
  prev: AugRound[],
  roundsCount: number,
  zones: string[],
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
