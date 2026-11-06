import { Suspense } from "react";
import { BankrollChart } from "@/components/BankrollChart";
import { StatsGrid } from "@/components/StatsGrid";
import { Section, Skeleton } from "@/components/ui";
import { bankrollHistory, computeStats } from "@/lib/betting";
import { getPicks, getSettings } from "@/lib/data";
import { pct, signedPct, units } from "@/lib/format";
import type { RiskClass } from "@/lib/types";

async function History() {
  const [picks, settings] = await Promise.all([getPicks(), getSettings()]);
  return <BankrollChart initial={settings.initial_bankroll} points={bankrollHistory(picks, settings)} />;
}

async function ByRisk() {
  const [picks, settings] = await Promise.all([getPicks(), getSettings()]);
  const rows: { key: RiskClass; label: string }[] = [
    { key: "conservador", label: "🟢 Conservador" },
    { key: "value", label: "🔴 Value / Arriesgado" },
    { key: "sin_valor", label: "⚪ Sin valor" },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2 text-right">Picks</th>
            <th className="px-3 py-2 text-right">Ganancia</th>
            <th className="px-3 py-2 text-right">Yield</th>
            <th className="px-3 py-2 text-right">Acierto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r) => {
            const s = computeStats(picks.filter((p) => p.risk === r.key), settings);
            return (
              <tr key={r.key}>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.totalPicks}</td>
                <td className="px-3 py-2 text-right tabular-nums">{units(s.profitUnits)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{signedPct(s.yield)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pct(s.hitRate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BankrollPage() {
  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">Bankroll</h1>
      <Section title="Resumen">
        <Suspense fallback={<Skeleton />}><StatsGrid /></Suspense>
      </Section>
      <Section title="Evolución histórica">
        <Suspense fallback={<Skeleton h="h-64" />}><History /></Suspense>
      </Section>
      <Section title="Por tipo de riesgo">
        <Suspense fallback={<Skeleton />}><ByRisk /></Suspense>
      </Section>
    </>
  );
}
