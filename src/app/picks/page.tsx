import { Suspense } from "react";
import { PicksTable } from "@/components/PicksTable";
import { Skeleton } from "@/components/ui";
import { CONSERVATIVE_MIN_PROB } from "@/lib/betting";
import { getPicks } from "@/lib/data";

async function AllPicks() {
  return <PicksTable picks={await getPicks()} />;
}

export default function PicksPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Historial de picks</h1>
      <p className="mt-1 mb-4 text-zinc-400">Registro completo. Un pick resuelto no se puede editar ni borrar.</p>
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
        <strong className="text-zinc-200">Cómo se clasifica el riesgo:</strong> no por la cuota, sino por la
        ventaja (<em>edge</em> = probabilidad estimada × cuota − 1) y la probabilidad.
        Sin edge positivo → ⚪ Sin valor. Con edge y probabilidad ≥ {CONSERVATIVE_MIN_PROB * 100}% → 🟢 Conservador.
        Con edge y probabilidad menor → 🔴 Value / Arriesgado (se pierde a menudo aunque esté bien analizado).
      </div>
      <Suspense fallback={<Skeleton h="h-64" />}><AllPicks /></Suspense>
    </>
  );
}
