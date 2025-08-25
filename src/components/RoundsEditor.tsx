import type { Round } from "../types/session";
import { accuracyPct } from "../selectors/rounds";

type Props = {
  rounds: Round[];
  trainingType: string;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  onUpdate: (idx: number, patch: Partial<Round>) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
};

export default function RoundsEditor({
  rounds,
  trainingType,
  onAdd,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: Props) {
  const sorted = [...rounds].sort((a, b) => a.idx - b.idx);

  return (
    <>
      <div className="space-y-3">
        {sorted.map((r, i) => {
          const a = Number.isFinite(Number(r.attempts)) ? Number(r.attempts) : 0;
          const m = Math.max(0, Math.min(Number(r.made) || 0, a));
          const pct = accuracyPct(a, m);

          return (
            <fieldset key={r.idx} className="border rounded p-3">
              <legend className="px-1 text-sm text-gray-600">Round {i + 1}</legend>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <label className="flex flex-col gap-1 md:col-span-5">
                  <span className="text-sm font-medium">Zone name</span>
                  <input
                    type="text"
                    value={r.zone}
                    onChange={(e) => onUpdate(r.idx, { zone: e.target.value })}
                    className="border rounded px-2 py-1"
                    placeholder="e.g., Left Corner 3"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium">Attempted</span>
                  <input
                    type="number"
                    min={0}
                    value={a}
                    onChange={(e) => onUpdate(r.idx, { attempts: Number(e.target.value) })}
                    className="border rounded px-2 py-1"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium">Made</span>
                  <input
                    type="number"
                    min={0}
                    max={a}
                    value={m}
                    onChange={(e) => onUpdate(r.idx, { made: Number(e.target.value) })}
                    className="border rounded px-2 py-1"
                  />
                </label>

                {/* Optional per-round type override */}
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium">Type (opt.)</span>
                  <select
                    value={r.type ?? trainingType}
                    onChange={(e) => onUpdate(r.idx, { type: e.target.value })}
                    className="border rounded px-2 py-1"
                  >
                    <option value="spot">Spot</option>
                    <option value="catch_and_shoot">Catch &amp; Shoot</option>
                    <option value="off_dribble">Off Dribble</option>
                    <option value="run_half_court">Run Half Court</option>
                  </select>
                </label>

                <div className="flex gap-2 md:col-span-1">
                  <button
                    type="button"
                    onClick={() => onMoveUp(r.idx)}
                    className="px-2 py-1 border rounded hover:bg-gray-50"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(r.idx)}
                    className="px-2 py-1 border rounded hover:bg-gray-50"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r.idx)}
                    className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                    title="Delete round"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-700">
                Accuracy: <span className="font-medium">{pct.toFixed(0)}%</span>
              </p>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 rounded border font-medium hover:bg-gray-50"
        >
          + Add Round
        </button>
      </div>
    </>
  );
}
