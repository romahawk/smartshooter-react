import { useEffect, useState, type PropsWithChildren } from "react";
import { auth, authReady, signInAnon } from "../lib/firebase";

export function AppProviders({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authReady().then(async () => {
      if (!auth.currentUser) await signInAnon();
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="p-6">Loading…</div>;
  return <>{children}</>;
}
