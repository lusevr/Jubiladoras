import type { ReactNode } from "react";

export function StatCard({ label, value, hint, tone }: {
  label: string;
  value: string;
  hint?: string;
  tone?: "pos" | "neg" | "neutral";
}) {
  const color =
    tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Skeleton({ h = "h-32" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-zinc-900`} />;
}

export const tone = (x: number | null): "pos" | "neg" | "neutral" =>
  x == null || x === 0 ? "neutral" : x > 0 ? "pos" : "neg";
