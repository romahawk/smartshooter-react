export type ZoneGroup = "3PT" | "MID" | "PAINT";
export type Direction = "ltr" | "rtl";

export const ZONE_PRESETS: Record<ZoneGroup, string[]> = {
  // You can rename these labels any time—data model stays the same
  "3PT": ["Left Corner", "Left Wing 3pt", "Top of Key 3pt", "Right Wing 3pt", "Right Corner"],
  "MID": ["Left Short Corner", "Left Elbow", "Free Throw", "Right Elbow", "Right Short Corner"],
  "PAINT": ["Left Block", "Left Low Paint", "Restricted Area", "Right Low Paint", "Right Block"],
};

export function orderedZones(group: ZoneGroup, dir: Direction): string[] {
  const base = ZONE_PRESETS[group] ?? ZONE_PRESETS["3PT"];
  return dir === "rtl" ? [...base].reverse() : base;
}
