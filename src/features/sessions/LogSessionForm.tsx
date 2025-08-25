import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionSchema, type SessionSchema } from "./schema";
import { createSession } from "./apis";

const today = () => new Date().toISOString().slice(0, 10);

export default function LogSessionForm() {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, reset } =
    useForm<SessionSchema>({
      resolver: zodResolver(sessionSchema),
      defaultValues: {
        date: today(),
        trainingType: "catch_and_shoot",
        zoneGroup: "3pt",
        rounds: [{ name: "Left Corner 3", attempted: 10, made: 6 }],
        notes: "",
      },
    });

  const attempted = watch("rounds.0.attempted");
  const made = watch("rounds.0.made");

  const onSubmit = async (data: SessionSchema) => {
    try {
      setSaving(true);
      await createSession({
        ...data,
        rounds: [{
          ...data.rounds[0],
          attempted: Number(data.rounds[0].attempted),
          made: Number(data.rounds[0].made),
        }],
      });
      alert("✅ Session saved");
      reset({ ...data, rounds: [{ ...data.rounds[0], attempted: 0, made: 0 }] });
    } catch (e) {
      console.error(e);
      alert("❌ Failed to save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl w-full p-6 space-y-4">
      <h2 className="text-xl font-semibold">Log Session</h2>

      <label className="block">
        <span className="block text-sm">Date</span>
        <input type="date" className="mt-1 border rounded px-3 py-2 w-full" {...register("date")} />
        {errors.date && <p className="text-red-600 text-sm">{errors.date.message}</p>}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm">Training Type</span>
          <select className="mt-1 border rounded px-3 py-2 w-full" {...register("trainingType")}>
            <option value="spot">Spot</option>
            <option value="catch_and_shoot">Catch & Shoot</option>
            <option value="off_dribble">Off Dribble</option>
          </select>
        </label>

        <label className="block">
          <span className="block text-sm">Zone Group</span>
          <select className="mt-1 border rounded px-3 py-2 w-full" {...register("zoneGroup")}>
            <option value="3pt">3PT</option>
            <option value="midrange">Midrange</option>
          </select>
        </label>
      </div>

      <fieldset className="border rounded p-4 space-y-2">
        <legend className="px-1 text-sm font-medium">Round 1</legend>
        <label className="block">
          <span className="block text-sm">Zone name</span>
          <input className="mt-1 border rounded px-3 py-2 w-full" {...register("rounds.0.name")} />
          {errors.rounds?.[0]?.name && (
            <p className="text-red-600 text-sm">{errors.rounds[0].name.message}</p>
          )}
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm">Attempted</span>
            <input type="number" min={0} className="mt-1 border rounded px-3 py-2 w-full"
              {...register("rounds.0.attempted", { valueAsNumber: true })} />
          </label>
          <label className="block">
            <span className="block text-sm">Made</span>
            <input type="number" min={0} className="mt-1 border rounded px-3 py-2 w-full"
              {...register("rounds.0.made", { valueAsNumber: true })} />
          </label>
        </div>
        {errors.rounds?.[0]?.made && (
          <p className="text-red-600 text-sm">{errors.rounds[0].made.message}</p>
        )}

        <p className="text-sm text-gray-600">
          Accuracy: {Number(attempted) ? Math.round((Number(made) / Number(attempted)) * 100) : 0}%
        </p>
      </fieldset>

      <label className="block">
        <span className="block text-sm">Notes (optional)</span>
        <textarea rows={3} className="mt-1 border rounded px-3 py-2 w-full" {...register("notes")} />
      </label>

      <button disabled={saving} className="px-5 py-2 rounded bg-black text-white disabled:opacity-50">
        {saving ? "Saving…" : "Save Session"}
      </button>
    </form>
  );
}
