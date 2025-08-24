import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./lib/firebase";

export default function App() {
  const testWrite = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("No user signed in!");
      return;
    }

    try {
      await addDoc(collection(db, "sessions"), {
        userId: uid,
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        trainingType: "catch_and_shoot",
        zoneGroup: "3pt",
        rounds: [{ name: "Left Corner", attempted: 10, made: 6 }],
        totals: { attempted: 10, made: 6, accuracy: 60 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("✅ Sample session saved to Firestore");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save session, check console");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">SmartShooter 🏀</h1>
      <button
        onClick={testWrite}
        className="px-6 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
      >
        Test Firestore Write
      </button>
    </div>
  );
}
