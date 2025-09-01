import type { Round } from "../types/session";
import type { ZoneGroup, Direction } from "../zones/presets";
import { orderedZones } from "../zones/presets";

export type AugRound = Round & { bucket: number };

type Props = {
  zoneGroup: ZoneGroup;
  directions: Direction[]; // per-round
  rounds: AugRound[];
  roundsCount: number;
  onChange: (roundNo: number, zone: string, patch: Partial<Round>) => void;
  onDirectionChange: (roundNo: number, dir: Direction) => void;
};

export default function ZoneGridRounds({
  zoneGroup,
  directions,
  rounds,
  roundsCount,
  onChange,
  onDirectionChange,
}: Props) {
  const cell = (roundNo: number, zone: string) =>
    rounds.find((r) => (r as any).bucket === roundNo && r.zone === zone) as AugRound | undefined;

  return (
    <div className="ss-rounds-stack">
      {Array.from({ length: roundsCount }).map((_, rNo) => {
        const dir = directions[rNo] ?? "ltr";
        const labels = orderedZones(zoneGroup, dir);

        return (
          <section key={rNo}>
            {/* Title + per-round direction */}
            <div className="flex items-center gap-2 mb-2">
              <h4 className="ss-roundTitle mb-0">Round {rNo + 1}</h4>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDirectionChange(rNo, "ltr")}
                  className={`ss-chip ${dir === "ltr" ? "ss-chip--active" : ""}`}
                  title="Left → Right"
                >
                  L → R
                </button>
                <button
                  type="button"
                  onClick={() => onDirectionChange(rNo, "rtl")}
                  className={`ss-chip ${dir === "rtl" ? "ss-chip--active" : ""}`}
                  title="Right ← Left"
                >
                  R ← L
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div className="ss-grid5 ss-gap">
              {labels.map((z) => (
                <div key={z} className="ss-zoneTitle">
                  {z}
                </div>
              ))}
            </div>

            {/* Attempt row */}
            <div className="ss-grid5 ss-gap ss-row">
              {labels.map((z) => {
                const r = cell(rNo, z);
                return (
                  <input
                    key={`${rNo}-${z}-att`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={num(r?.attempts)}
                    onChange={(e) => onChange(rNo, z, { attempts: toNum(e.target.value) })}
                    placeholder="attempted"
                    aria-label={`Round ${rNo + 1} ${z} attempts`}
                    className="ss-field ss-center-sm"
                  />
                );
              })}
            </div>

            {/* Made row */}
            <div className="ss-grid5 ss-gap">
              {labels.map((z) => {
                const r = cell(rNo, z);
                const attempts = num(r?.attempts);
                return (
                  <input
                    key={`${rNo}-${z}-made`}
                    type="number"
                    min={0}
                    max={attempts}
                    inputMode="numeric"
                    value={num(r?.made)}
                    onChange={(e) => onChange(rNo, z, { made: clamp(toNum(e.target.value), 0, attempts) })}
                    placeholder="made"
                    aria-label={`Round ${rNo + 1} ${z} made`}
                    className="ss-field ss-center-sm"
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* utils */
function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function num(n: any) {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}
