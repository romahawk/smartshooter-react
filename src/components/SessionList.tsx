import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import type { FirestoreError, DocumentData } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Session } from "../types/session";
import { getRounds, aggregateTotals } from "../selectors/rounds";

type Props = {
  uid: string;
  onEdit: (session: Session) => void;
};

export default function SessionList({ uid, onEdit }: Props) {
  const [rows, setRows] = useState<Session[]>([]);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    // No orderBy → no composite index needed
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Session[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            userId: String(data.userId ?? ""),
            date: String(data.date ?? ""),
            trainingType: String(data.trainingType ?? ""),
            notes: String(data.notes ?? ""),
            rounds: Array.isArray(data.rounds) ? (data.rounds as any[]) : [],
            zones: (data as any).zones ?? undefined,
          } as Session;
        });

        // Client-side sort by date DESC (YYYY-MM-DD string sorts fine)
        next.sort((a, b) => b.date.localeCompare(a.date));

        setRows(next);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  if (!uid) return <p className="mt-6 text-gray-700">Please sign in to see your sessions.</p>;
  if (loading) return <p className="mt-6 text-gray-700">Loading sessions…</p>;
  if (error) return <p className="mt-6 text-red-600">Failed to load sessions: {error.message}</p>;
  if (rows.length === 0) return <p className="mt-6 text-gray-700">No sessions yet — log your first one!</p>;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Your Sessions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th className="text-right">Attempts</Th>
              <Th className="text-right">Made</Th>
              <Th className="text-right">Accuracy</Th>
              <Th>{/* actions */}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const totals = aggregateTotals(getRounds(s));
              return (
                <tr key={s.id} className="border-t">
                  <Td>{s.date}</Td>
                  <Td className="capitalize">{s.trainingType.replaceAll("_", " ")}</Td>
                  <Td className="text-right">{totals.attempts}</Td>
                  <Td className="text-right">{totals.made}</Td>
                  <Td className="text-right">{totals.pct.toFixed(1)}%</Td>
                  <Td className="text-right">
                    <button
                      onClick={() => onEdit(s)}
                      className="px-3 py-1 rounded border hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 text-left font-medium border-b ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
