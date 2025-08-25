// SmartShooter — Session & Round types

export type ZoneId =
  | "top_key"
  | "left_wing"
  | "right_wing"
  | "corner_left"
  | "corner_right"
  | "left_elbow"
  | "right_elbow"
  | "paint";

// One round/series within a session
export type Round = {
  idx: number;           // order within the session
  zone: ZoneId | string; // allow custom strings for flexibility
  attempts: number;
  made: number;
  type?: string;         // optional per-round override of session trainingType
  durationSec?: number;
  notes?: string;
};

// Legacy flat schema support (compat only)
export type LegacyZoneStat = { attempts: number; made: number };

// A full training session
export type Session = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD" (Firestore can still store Timestamp if you prefer later)
  trainingType: "spot" | "catch_and_shoot" | "off_dribble" | "run_half_court" | string;
  notes?: string;
  rounds: Round[]; // new canonical source of truth
  zones?: Record<string, LegacyZoneStat>; // legacy, read-only in UI
};
