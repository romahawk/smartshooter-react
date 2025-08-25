import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import type { SessionSchema } from "./schema";
import { computeTotals } from "./schema";

export async function createSession(input: SessionSchema) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const totals = computeTotals(input.rounds);
  const doc = {
    userId: uid,
    ...input,
    totals,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  return addDoc(collection(db, "sessions"), doc);
}
