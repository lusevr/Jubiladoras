import { Suspense } from "react";
import Link from "next/link";
import { PicksTable } from "@/components/PicksTable";
import { StatsGrid } from "@/components/StatsGrid";
import { Section, Skeleton } from "@/components/ui";
import { getPicks, getUpcomingMatches } from "@/lib/data";
import { dateTime } from "@/lib/format";

async function UpcomingMatches() {
  const matches = await getUpcomingMatches();
  if (matches.length === 0) return <p className="text-sm text-zinc-500">No hay partidos programados.</p>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {matches.map((m) => (
        <li key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-500">{m.competition} · {dateTime(m.kickoff_at)}</div>
          <div className="mt-1 font-medium">{m.home_team} vs {m.away_team}</div>
          {/* Aquí irán cuotas y probabilidades del motor matemático */}
        </li>
      ))}
    </ul>
  );
}

async function LatestPicks() {
  const picks = await getPicks();
  return <PicksTable picks={picks.slice(0, 5)} />;
}

export default function Home() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Todos los picks quedan registrados, los ganados y los perdidos.</p>
      </div>
      <Section title="Estadísticas generales">
        <Suspense fallback={<Skeleton />}><StatsGrid /></Suspense>
      </Section>
      <Section title="Próximos partidos">
        <Suspense fallback={<Skeleton />}><UpcomingMatches /></Suspense>
      </Section>
      <Section title="Últimos picks" aside={<Link href="/picks" className="text-sm text-zinc-400 hover:text-zinc-100">Ver todos →</Link>}>
        <Suspense fallback={<Skeleton />}><LatestPicks /></Suspense>
      </Section>
    </>
  );
}
