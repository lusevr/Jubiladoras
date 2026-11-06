import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getGraveyard } from "@/lib/data";
import { dateTime, pct, RISK_LABEL, signedPct, VERDICT_LABEL } from "@/lib/format";
import type { FailureVerdict } from "@/lib/types";

const VERDICT_STYLE: Record<FailureVerdict, string> = {
  varianza: "border-sky-500/40 text-sky-300",
  error_modelo: "border-rose-500/40 text-rose-300",
  factor_externo: "border-amber-500/40 text-amber-300",
  mala_informacion: "border-violet-500/40 text-violet-300",
};

const yesNo = (v: boolean | null) => (v == null ? "No se sabe" : v ? "Sí" : "No");

async function Tombs() {
  const entries = await getGraveyard();
  if (entries.length === 0) return <p className="text-sm text-zinc-500">El cementerio está vacío… por ahora.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map((g) => {
        const p = g.pick;
        // CLV: si la cuota de cierre es menor que la que tomamos, el mercado nos dio la razón
        const clv = p && g.closing_odds ? p.odds / g.closing_odds - 1 : null;
        return (
          <article key={g.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="text-xs text-zinc-500">
              {p?.match ? `${p.match.competition} · ${dateTime(p.match.kickoff_at)}` : ""}
            </div>
            <h3 className="mt-1 text-lg font-semibold">
              🪦 {p?.match ? `${p.match.home_team} vs ${p.match.away_team}` : "Pick"}
            </h3>
            {p && (
              <div className="mt-1 text-sm text-zinc-400">
                {p.market}: <span className="text-zinc-200">{p.selection}</span> @ {p.odds.toFixed(2)} ·{" "}
                prob. {pct(p.estimated_prob)} · edge {signedPct(p.edge)} · {RISK_LABEL[p.risk]}
              </div>
            )}

            <div className={`mt-4 inline-block rounded-full border px-3 py-1 text-xs ${VERDICT_STYLE[g.verdict]}`}>
              {VERDICT_LABEL[g.verdict]}
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">¿Por qué falló?</dt>
                <dd>{g.why_failed}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><dt className="text-zinc-500">Roja</dt><dd>{yesNo(g.red_card)}</dd></div>
                <div><dt className="text-zinc-500">Suplentes</dt><dd>{yesNo(g.rotated_lineup)}</dd></div>
                <div><dt className="text-zinc-500">Cuota bien valorada</dt><dd>{yesNo(g.odds_fair)}</dd></div>
                <div>
                  <dt className="text-zinc-500">CLV</dt>
                  <dd className={clv == null ? "" : clv > 0 ? "text-emerald-400" : "text-rose-400"}>
                    {signedPct(clv)}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-zinc-500">¿Qué aprendemos?</dt>
                <dd className="italic">{g.lesson}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}

export default function CementerioPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">🪦 El Cementerio de los Jubiladores</h1>
      <p className="mt-2 mb-6 max-w-3xl text-zinc-400">
        Aquí analizamos los picks que fallaron. La primera pregunta siempre es:{" "}
        <strong className="text-zinc-200">¿fue un mal proceso o solo varianza?</strong> Una apuesta bien valorada al
        30% se pierde 7 de cada 10 veces, y eso no es un error. Si la cuota de cierre bajó (CLV positivo), el mercado
        nos dio la razón aunque el resultado no.
      </p>
      <Suspense fallback={<Skeleton h="h-64" />}><Tombs /></Suspense>
    </>
  );
}
