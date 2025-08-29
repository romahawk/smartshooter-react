import type { Round } from "../types/session";

type Props = {
  templateZones: string[]; // 5 labels in display order
  rounds: Round[];
  onChange: (zone: string, patch: Partial<Round>) => void;
};

/**
 * Displays a 5-column grid:
 *  ┌──────────────┬──────────────┬ ... (zone headers)
 *  │ Attempted    │ Attempted    │
 *  │ Made         │ Made         │
 */
export default function ZoneGridEntry({ templateZones, rounds, onChange }: Props) {
  // helper to find values for a given zone label
  const byZone = (zone: string) => rounds.find((r) => r.zone === zone);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-blue-700 mb-3">Round 1</h4>

      {/* Column headers */}
      <div className="grid grid-cols-5 gap-3 mb-2">
        {templateZones.map((z) => (
          <div key={z} className="text-xs font-medium text-gray-600 text-center">
            {z}
          </div>
        ))}
      </div>

      {/* Attempted row */}
      <div className="grid grid-cols-5 gap-3 mb-2">
        {templateZones.map((z) => {
          const r = byZone(z);
          return (
            <input
              key={z}
              type="number"
              min={0}
              value={safeNum(r?.attempts)}
              onChange={(e) => onChange(z, { attempts: toNum(e.target.value) })}
              placeholder="Attempted"
              className="w-full border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        })}
      </div>

      {/* Made row */}
      <div className="grid grid-cols-5 gap-3">
        {templateZones.map((z) => {
          const r = byZone(z);
          const attempts = safeNum(r?.attempts);
          return (
            <input
              key={z}
              type="number"
              min={0}
              max={attempts}
              value={safeNum(r?.made)}
              onChange={(e) => onChange(z, { made: clamp(toNum(e.target.value), 0, attempts) })}
              placeholder="Made"
              className="w-full border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        })}
      </div>
    </div>
  );
}

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function safeNum(n: any) {
  return Number.isFinite(Number(n)) ? Number(n) : 0;
}
