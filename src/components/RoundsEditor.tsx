import type { Round } from "../types/session";
import { accuracyPct } from "../selectors/rounds";
import type { ZoneGroup, Direction } from "../zones/presets";
import { orderedZones } from "../zones/presets";

type Props = {
  rounds: Round[];
  trainingType: string;

  // NEW
  zoneGroup: ZoneGroup;
  direction: Direction;
  onBulkAddByZones: (zones: string[]) => void;

  onAdd: () => void;
  onDelete: (idx: number) => void;
  onUpdate: (idx: number, patch: Partial<Round>) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
};

export default function RoundsEditor({
  rounds,
  trainingType,
  zoneGroup,
  direction,
  onBulkAddByZones,
  onAdd,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: Props) {
  const sorted = [...rounds].sort((a, b) => a.idx - b.idx);

  const handleTemplateAdd = () => {
    const zones = orderedZones(zoneGroup, direction);
    onBulkAddByZones(zones);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={handleTemplateAdd}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
          title="Insert five rounds with prefilled zone names"
        >
          + Add 5-zone Round
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          title="Add a single empty round"
        >
          + Add Single Round
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {sorted.map((r, i) => {
          const a = Number.isFinite(Number(r.attempts)) ? Number(r.attempts) : 0;
          const m = Math.max(0, Math.min(Number(r.made) || 0, a));
          const pct = accuracyPct(a, m);

          return (
            <fieldset key={r.idx} className="border rounded-xl p-3 shadow-sm">
              <legend className="px-1 text-sm text-gray-600">Round {i + 1}</legend>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <label className="flex flex-col gap-1 md:col-span-5">
                  <span className="text-sm font-medium text-gray-700">Zone name</span>
                  <input
                    type="text"
                    value={r.zone}
                    onChange={(e) => onUpdate(r.idx, { zone: e.target.value })}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Left Corner 3"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Attempted</span>
                  <input
                    type="number"
                    min={0}
                    value={a}
                    onChange={(e) => onUpdate(r.idx, { attempts: Number(e.target.value) })}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Made</span>
                  <input
                    type="number"
                    min={0}
                    max={a}
                    value={m}
                    onChange={(e) => onUpdate(r.idx, { made: Number(e.target.value) })}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                {/* Optional per-round type override */}
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Type (opt.)</span>
                  <select
                    value={r.type ?? trainingType}
                    onChange={(e) => onUpdate(r.idx, { type: e.target.value })}
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="spot">Spot</option>
                    <option value="catch_and_shoot">Catch &amp; Shoot</option>
                    <option value="off_dribble">Off Dribble</option>
                    <option value="run_half_court">Run Half Court</option>
                  </select>
                </label>

                <div className="flex gap-2 md:col-span-1">
                  <IconBtn onClick={() => onMoveUp(r.idx)} title="Move up">↑</IconBtn>
                  <IconBtn onClick={() => onMoveDown(r.idx)} title="Move down">↓</IconBtn>
                  <IconBtn danger onClick={() => onDelete(r.idx)} title="Delete">✕</IconBtn>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-700">
                Accuracy: <span className="font-medium">{pct.toFixed(0)}%</span>
              </p>
            </fieldset>
          );
        })}
      </div>
    </>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-3 py-2 rounded-lg border shadow-sm ${
        danger
          ? "border-red-300 text-red-600 hover:bg-red-50"
          : "border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
