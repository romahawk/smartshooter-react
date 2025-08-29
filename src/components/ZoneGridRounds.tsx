import type { Round } from "../types/session";

export type AugRound = Round & { bucket: number }; // round number (0-based)

type Props = {
  templateZones: string[];
  rounds: AugRound[];
  roundsCount: number;
  onChange: (roundNo: number, zone: string, patch: Partial<Round>) => void;
};

export default function ZoneGridRounds({ templateZones, rounds, roundsCount, onChange }: Props) {
  const cell = (roundNo: number, zone: string) =>
    rounds.find((r) => (r as any).bucket === roundNo && r.zone === zone) as AugRound | undefined;

  return (
    <div className="ss-rounds-stack">
      {Array.from({ length: roundsCount }).map((_, rNo) => (
        <section key={rNo}>
          {/* Title */}
          <h4 className="ss-roundTitle">Round {rNo + 1}</h4>

          {/* Column headers */}
          <div className="ss-grid5 ss-gap">
            {templateZones.map((z) => (
              <div key={z} className="ss-zoneTitle">
                {z}
              </div>
            ))}
          </div>

          {/* Attempt row */}
          <div className="ss-grid5 ss-gap ss-row">
            {templateZones.map((z) => {
              const r = cell(rNo, z);
              return (
                <input
                  key={`${rNo}-${z}-att`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={num(r?.attempts)}
                  onChange={(e) => onChange(rNo, z, { attempts: toNum(e.target.value) })}
                  placeholder="Attempt"
                  aria-label={`Round ${rNo + 1} ${z} attempts`}
                  className="ss-field ss-center-sm"
                />
              );
            })}
          </div>

          {/* Made row */}
          <div className="ss-grid5 ss-gap">
            {templateZones.map((z) => {
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
                  placeholder="Made"
                  aria-label={`Round ${rNo + 1} ${z} made`}
                  className="ss-field ss-center-sm"
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/* -------- local utils -------- */
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
