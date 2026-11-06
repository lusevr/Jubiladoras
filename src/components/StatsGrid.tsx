import { computeStats } from "@/lib/betting";
import { getPicks, getSettings } from "@/lib/data";
import { money, pct, signedPct, units } from "@/lib/format";
import { StatCard, tone } from "./ui";

export async function StatsGrid() {
  const [picks, settings] = await Promise.all([getPicks(), getSettings()]);
  const s = computeStats(picks, settings);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Bankroll" value={money(s.currentBankroll, settings.currency)}
        hint={`Inicial ${money(settings.initial_bankroll, settings.currency)}`} tone={tone(s.profitMoney)} />
      <StatCard label="Ganancia" value={units(s.profitUnits)}
        hint={money(s.profitMoney, settings.currency)} tone={tone(s.profitUnits)} />
      <StatCard label="Yield" value={signedPct(s.yield)} hint="Ganancia ÷ total apostado" tone={tone(s.yield)} />
      <StatCard label="ROI" value={signedPct(s.roi)} hint="Ganancia ÷ bankroll inicial" tone={tone(s.roi)} />
      <StatCard label="Acierto" value={pct(s.hitRate)} hint={`${s.won}G · ${s.lost}P · ${s.voided} anuladas`} />
      <StatCard label="Unidades apostadas" value={`${s.unitsStaked.toFixed(2)} u`} hint={`${s.totalPicks} picks · ${s.pending} pendientes`} />
      <StatCard label="Edge medio" value={signedPct(s.avgEdge)} hint="Ventaja estimada al publicar" tone={tone(s.avgEdge)} />
      <StatCard label="Brier score" value={s.brier == null ? "—" : s.brier.toFixed(3)}
        hint="Calibración: menor es mejor (0.25 = azar)" />
    </div>
  );
}
