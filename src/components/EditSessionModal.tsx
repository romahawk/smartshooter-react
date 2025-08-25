// src/components/EditSessionModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Round, Session } from "../types/session";
import { getRounds, aggregateTotals } from "../selectors/rounds";
import RoundsEditor from "./RoundsEditor";

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
  title = "Edit Session",
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
  const [trainingType, setTrainingType] = useState<string>("catch_and_shoot");
  const [zoneGroup, setZoneGroup] = useState<string>("3PT");
  const [notes, setNotes] = useState<string>("");
  const [rounds, setRounds] = useState<Round[]>([
    { idx: 0, zone: "", attempts: 0, made: 0, type: "catch_and_shoot" },
  ]);

  // hydrate
  useEffect(() => {
    if (!initial) {
      setDate(new Date().toISOString().slice(0, 10));
      setTrainingType("catch_and_shoot");
      setZoneGroup("3PT");
      setNotes("");
      setRounds([{ idx: 0, zone: "", attempts: 0, made: 0, type: "catch_and_shoot" }]);
      return;
    }
    const initRounds =
      "rounds" in initial
        ? getRounds(initial as Session)
        : [{ idx: 0, zone: "", attempts: 0, made: 0, type: "catch_and_shoot" }];

    setDate(("date" in initial && (initial as any).date) || new Date().toISOString().slice(0, 10));
    setTrainingType(("trainingType" in initial && (initial as any).trainingType) || "catch_and_shoot");
    setZoneGroup(("zoneGroup" in initial && (initial as any).zoneGroup) || "3PT");
    setNotes(("notes" in initial && (initial as any).notes) || "");
    setRounds(initRounds.map((r, i) => ({ ...r, idx: i })));
  }, [initial]);

  // esc + scroll lock
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

  const totals = useMemo(
    () =>
      aggregateTotals(
        getRounds({
          id: "preview",
          userId: "preview",
          date,
          trainingType,
          rounds,
          notes,
        } as Session)
      ),
    [date, trainingType, rounds, notes]
  );

  // round handlers
  const addRound = () =>
    setRounds((prev) => {
      const nextIdx = prev.length > 0 ? Math.max(...prev.map((r) => r.idx)) + 1 : 0;
      return [...prev, { idx: nextIdx, zone: "", attempts: 0, made: 0, type: trainingType }];
    });

  const deleteRound = (idx: number) => setRounds((prev) => prev.filter((r) => r.idx !== idx));

  const updateRound = (idx: number, patch: Partial<Round>) =>
    setRounds((prev) =>
      prev.map((r) => {
        if (r.idx !== idx) return r;
        const attempts = patch.attempts ?? r.attempts ?? 0;
        const madeRaw = patch.made ?? r.made ?? 0;
        const made = Math.max(0, Math.min(madeRaw, attempts));
        return { ...r, ...patch, attempts, made };
      })
    );

  const moveRoundUp = (idx: number) =>
    setRounds((prev) => {
      const i = prev.findIndex((r) => r.idx === idx);
      if (i <= 0) return prev;
      const copy = [...prev];
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      return copy.map((r, k) => ({ ...r, idx: k }));
    });

  const moveRoundDown = (idx: number) =>
    setRounds((prev) => {
      const i = prev.findIndex((r) => r.idx === idx);
      if (i < 0 || i >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
      return copy.map((r, k) => ({ ...r, idx: k }));
    });

  const handleSave = async () => {
    if (rounds.length === 0) return alert("Please add at least one round.");
    for (const r of rounds) {
      if (!r.zone || r.zone.trim() === "") return alert("Each round must have a zone name.");
      if (r.attempts < 0 || r.made < 0 || r.made > r.attempts)
        return alert("Check attempts/made values (made cannot exceed attempts).");
    }
    const normalized = rounds
      .slice()
      .sort((a, b) => a.idx - b.idx)
      .map((r, i) => ({ ...r, idx: i }));
    await onSave({ date, trainingType, zoneGroup, notes, rounds: normalized });
    onClose();
  };

  // -------- Overlay (bullet-proof) --------
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(1px)",
        }}
      />

      {/* Panel */}
      <div
        className="relative z-[1001] w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        style={{
          position: "relative",
          zIndex: 1001,
          width: "95vw",
          maxWidth: "48rem",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            className="ml-auto px-2 py-1 border rounded hover:bg-gray-50"
            style={{ marginLeft: "auto" }}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Header fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Training Type</span>
            <select
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="spot">Spot Shooting</option>
              <option value="catch_and_shoot">Catch &amp; Shoot</option>
              <option value="off_dribble">Off the Dribble</option>
              <option value="run_half_court">Run Half Court</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Zone Group</span>
            <select
              value={zoneGroup}
              onChange={(e) => setZoneGroup(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="3PT">3PT</option>
              <option value="MID">Midrange</option>
              <option value="PAINT">Paint</option>
            </select>
          </label>
        </div>

        {/* Rounds Editor */}
        <RoundsEditor
          rounds={rounds}
          trainingType={trainingType}
          onAdd={addRound}
          onDelete={deleteRound}
          onUpdate={updateRound}
          onMoveUp={moveRoundUp}
          onMoveDown={moveRoundDown}
        />

        {/* Notes */}
        <div className="mt-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-2 py-2 min-h-[70px]"
              placeholder="Any observations to remember..."
            />
          </label>
        </div>

        {/* Totals */}
        <div className="mt-4 p-3 rounded border bg-gray-50">
          <div className="font-medium">Session Totals</div>
          <div>
            Attempts: {totals.attempts} &nbsp;|&nbsp; Made: {totals.made} &nbsp;|&nbsp; Accuracy:{" "}
            {totals.pct.toFixed(1)}%
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button className="px-4 py-2 rounded border hover:bg-gray-50" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
