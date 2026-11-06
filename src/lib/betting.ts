import type { Pick, PickResult, RiskClass } from "./types";

/**
 * Umbral de probabilidad para considerar un pick "conservador".
 * Debe coincidir con la columna generada `risk` en supabase/migrations/0001_init.sql
 */
export const CONSERVATIVE_MIN_PROB = 0.55;

/** Probabilidad implícita de una cuota decimal (incluye el margen de la casa). */
export function impliedProb(odds: number): number {
  return 1 / odds;
}

/** Ventaja esperada por unidad apostada: p·cuota − 1. Positivo = hay value. */
export function edge(prob: number, odds: number): number {
  return prob * odds - 1;
}

/** Clasificación de riesgo basada en criterios estadísticos, no en la cuota. */
export function classifyRisk(prob: number, odds: number): RiskClass {
  if (edge(prob, odds) <= 0) return "sin_valor";
  return prob >= CONSERVATIVE_MIN_PROB ? "conservador" : "value";
}

/** Ganancia (en unidades) de un pick ya resuelto. Pendientes y anuladas = 0. */
export function pickProfitUnits(p: Pick | { result: PickResult; odds: number; stake_units: number }): number {
  switch (p.result) {
    case "ganada":
      return p.stake_units * (p.odds - 1);
    case "perdida":
      return -p.stake_units;
    default:
      return 0;
  }
}

export interface BankrollStats {
  totalPicks: number;
  pending: number;
  won: number;
  lost: number;
  voided: number;
  /** Unidades apostadas en picks resueltos con acción (ganadas + perdidas) */
  unitsStaked: number;
  profitUnits: number;
  profitMoney: number;
  currentBankroll: number;
  /** Ganancia / total apostado */
  yield: number | null;
  /** Ganancia / bankroll inicial */
  roi: number;
  /** Ganadas / (ganadas + perdidas). Las anuladas no cuentan. */
  hitRate: number | null;
  /** Edge medio de los picks publicados (resueltos o no) */
  avgEdge: number | null;
  /** Brier score: calibración de las probabilidades. 0 = perfecto, 0.25 = moneda al aire */
  brier: number | null;
}

export function computeStats(
  picks: Pick[],
  settings: { initial_bankroll: number; unit_value: number },
): BankrollStats {
  let won = 0,
    lost = 0,
    voided = 0,
    pending = 0,
    unitsStaked = 0,
    profitUnits = 0,
    brierSum = 0,
    edgeSum = 0;

  for (const p of picks) {
    edgeSum += p.edge;
    switch (p.result) {
      case "ganada":
        won++;
        break;
      case "perdida":
        lost++;
        break;
      case "anulada":
        voided++;
        break;
      case "pendiente":
        pending++;
        break;
    }
    if (p.result === "ganada" || p.result === "perdida") {
      unitsStaked += p.stake_units;
      profitUnits += pickProfitUnits(p);
      const outcome = p.result === "ganada" ? 1 : 0;
      brierSum += (p.estimated_prob - outcome) ** 2;
    }
  }

  const settled = won + lost;
  const profitMoney = profitUnits * settings.unit_value;

  return {
    totalPicks: picks.length,
    pending,
    won,
    lost,
    voided,
    unitsStaked,
    profitUnits,
    profitMoney,
    currentBankroll: settings.initial_bankroll + profitMoney,
    yield: unitsStaked > 0 ? profitUnits / unitsStaked : null,
    roi: profitMoney / settings.initial_bankroll,
    hitRate: settled > 0 ? won / settled : null,
    avgEdge: picks.length > 0 ? edgeSum / picks.length : null,
    brier: settled > 0 ? brierSum / settled : null,
  };
}

export interface BankrollPoint {
  date: string;
  bankroll: number;
  pickId: string;
}

/** Evolución histórica del bankroll, ordenada por fecha de resolución. */
export function bankrollHistory(
  picks: Pick[],
  settings: { initial_bankroll: number; unit_value: number },
): BankrollPoint[] {
  const settled = picks
    .filter((p) => p.result !== "pendiente" && p.settled_at)
    .sort((a, b) => a.settled_at!.localeCompare(b.settled_at!));

  let bankroll = settings.initial_bankroll;
  return settled.map((p) => {
    bankroll += pickProfitUnits(p) * settings.unit_value;
    return { date: p.settled_at!, bankroll, pickId: p.id };
  });
}
