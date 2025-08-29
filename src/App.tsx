import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./lib/firebase";

import EditSessionModal from "./components/EditSessionModal";
import SessionList from "./components/SessionList";

import type { Round, Session } from "./types/session";

import "./App.css";

type SessionDraft = {
  date: string;
  trainingType: string;
  zoneGroup?: string;
  notes?: string;
  rounds: Round[]; // normalized with idx 0..n-1
};

export default function App() {
  // Signed-in user id (reactive)
  const [uid, setUid] = useState<string>("");

  // Modal state (create vs edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<Session | undefined>(undefined);

  // Track auth status
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? ""));
    return () => off();
  }, []);

  // Open modal for CREATE
  const handleCreate = () => {
    setEditInitial(undefined);
    setModalOpen(true);
  };

  // Open modal for EDIT
  const handleEdit = (session: Session) => {
    setEditInitial(session);
    setModalOpen(true);
  };

  const handleClose = () => setModalOpen(false);

  // Save handler used by modal (CREATE or UPDATE)
  const handleSave = async (draft: SessionDraft) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      alert("Please sign in first.");
      return;
    }

    try {
      if (editInitial?.id) {
        // UPDATE existing session
        await updateDoc(doc(db, "sessions", editInitial.id), {
          date: draft.date,
          trainingType: draft.trainingType,
          zoneGroup: draft.zoneGroup ?? "",
          notes: draft.notes ?? "",
          rounds: draft.rounds, // already normalized by the modal
          updatedAt: serverTimestamp(),
        });
        alert("Session updated ✅");
      } else {
        // CREATE new session
        await addDoc(collection(db, "sessions"), {
          userId: currentUid,
          createdAt: serverTimestamp(),
          date: draft.date,
          trainingType: draft.trainingType,
          zoneGroup: draft.zoneGroup ?? "",
          notes: draft.notes ?? "",
          rounds: draft.rounds,
        });
        alert("Session saved ✅");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save session.");
      throw err;
    } finally {
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-dvh max-w-3xl mx-auto px-4 py-6">
      <header className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">SmartShooter</h1>
        <span className="text-3xl" role="img" aria-label="basketball">
          🏀
        </span>
      </header>

      <section className="space-y-4">
        <p className="text-gray-700">
          Use the button below to log a new training session with multiple rounds.
        </p>

        <button
          onClick={handleCreate}
          className="px-5 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          disabled={!uid}
          title={uid ? "" : "Sign in to log a session"}
        >
          + Log New Session
        </button>

        {/* Live list of sessions for this user */}
        <SessionList uid={uid} onEdit={handleEdit} />
      </section>

      {/* Create/Edit modal */}
      <EditSessionModal
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editInitial}
        title={editInitial ? "Edit Session" : "Log New Session"}
      />
    </div>
  );
}
