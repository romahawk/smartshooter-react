import { z } from "zod";

export const roundSchema = z
  .object({
    name: z.string().min(1, "Zone name is required"),
    attempted: z.number().int().min(0),
    made: z.number().int().min(0),
  })
  .superRefine((r, ctx) => {
    if (r.made > r.attempted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["made"],
        message: "Made ≤ Attempted"
      });
    }
  });

export const sessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  trainingType: z.enum(["spot", "catch_and_shoot", "off_dribble"]),
  zoneGroup: z.enum(["3pt", "midrange"]),
  rounds: z.array(roundSchema).min(1),
  notes: z.string().max(500).optional(),
});
export type SessionSchema = z.infer<typeof sessionSchema>;

export const computeTotals = (rounds: { attempted: number; made: number }[]) => {
  const attempted = rounds.reduce((a, r) => a + r.attempted, 0);
  const made = rounds.reduce((a, r) => a + r.made, 0);
  const accuracy = attempted ? Math.round((made / attempted) * 100) : 0;
  return { attempted, made, accuracy };
};
