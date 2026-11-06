import { pickProfitUnits } from "@/lib/betting";
import { dateTime, pct, RESULT_STYLE, RISK_LABEL, signedPct, units } from "@/lib/format";
import type { Pick } from "@/lib/types";

export function PicksTable({ picks }: { picks: Pick[] }) {
  if (picks.length === 0) {
    return <p className="text-sm text-zinc-500">Todavía no hay picks publicados.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Partido</th>
            <th className="px-3 py-2">Mercado · Selección</th>
            <th className="px-3 py-2 text-right">Cuota</th>
            <th className="px-3 py-2 text-right">Prob. est.</th>
            <th className="px-3 py-2 text-right">Prob. impl.</th>
            <th className="px-3 py-2 text-right">Edge</th>
            <th className="px-3 py-2 text-right">Stake</th>
            <th className="px-3 py-2">Riesgo</th>
            <th className="px-3 py-2">Resultado</th>
            <th className="px-3 py-2 text-right">G/P</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {picks.map((p) => {
            const profit = pickProfitUnits(p);
            return (
              <tr key={p.id} className="hover:bg-zinc-900/50">
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {p.match ? `${p.match.home_team} vs ${p.match.away_team}` : "—"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {p.match ? `${p.match.competition} · ${dateTime(p.match.kickoff_at)}` : ""}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div>{p.selection}</div>
                  <div className="text-xs text-zinc-500">{p.market}</div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.odds.toFixed(2)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pct(p.estimated_prob)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-500">{pct(p.implied_prob)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${p.edge > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {signedPct(p.edge)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.stake_units} u</td>
                <td className="px-3 py-2 whitespace-nowrap">{RISK_LABEL[p.risk]}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${RESULT_STYLE[p.result]}`}>
                    {p.result}
                  </span>
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${profit > 0 ? "text-emerald-400" : profit < 0 ? "text-rose-400" : "text-zinc-500"}`}>
                  {p.result === "pendiente" ? "—" : units(profit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
