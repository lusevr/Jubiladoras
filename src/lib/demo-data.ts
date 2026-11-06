// Datos de demostración: se usan SOLO si no hay variables de Supabase configuradas.
import { classifyRisk } from "./betting";
import type { BankrollSettings, GraveyardEntry, Match, Pick, PickResult } from "./types";

export const demoSettings: BankrollSettings = {
  initial_bankroll: 1000,
  unit_value: 10,
  currency: "PEN",
};

export const demoMatches: Match[] = [
  { id: "m1", competition: "Premier League", home_team: "Arsenal", away_team: "Brentford", kickoff_at: "2026-11-01T15:00:00Z", status: "finalizado", home_score: 2, away_score: 0 },
  { id: "m2", competition: "LaLiga", home_team: "Valencia", away_team: "Getafe", kickoff_at: "2026-11-02T20:00:00Z", status: "finalizado", home_score: 0, away_score: 1 },
  { id: "m3", competition: "Serie A", home_team: "Bologna", away_team: "Torino", kickoff_at: "2026-11-03T19:45:00Z", status: "finalizado", home_score: 1, away_score: 1 },
  { id: "m4", competition: "Liga 1", home_team: "Universitario", away_team: "Sporting Cristal", kickoff_at: "2026-11-04T01:00:00Z", status: "finalizado", home_score: 3, away_score: 1 },
  { id: "m5", competition: "Premier League", home_team: "Newcastle", away_team: "Aston Villa", kickoff_at: "2026-11-06T20:00:00Z", status: "programado", home_score: null, away_score: null },
];

function pick(
  id: string, match_id: string, market: string, selection: string,
  odds: number, stake_units: number, estimated_prob: number,
  result: PickResult, settled_at: string | null, reasoning: string,
): Pick {
  return {
    id, match_id, market, selection, odds, stake_units, estimated_prob,
    implied_prob: +(1 / odds).toFixed(4),
    edge: +(estimated_prob * odds - 1).toFixed(4),
    risk: classifyRisk(estimated_prob, odds),
    result, reasoning, settled_at,
    published_at: "2026-11-01T10:00:00Z",
    match: demoMatches.find((m) => m.id === match_id),
  };
}

export const demoPicks: Pick[] = [
  pick("p1", "m1", "1X2", "Arsenal", 1.62, 2, 0.66, "ganada", "2026-11-01T17:00:00Z", "Brentford sin sus dos centrales titulares."),
  pick("p2", "m2", "1X2", "Valencia", 2.1, 1, 0.52, "perdida", "2026-11-02T22:00:00Z", "Getafe con 3 partidos sin ganar fuera."),
  pick("p3", "m3", "Over/Under 2.5", "Over 2.5", 4.2, 0.5, 0.29, "perdida", "2026-11-03T21:45:00Z", "Ambos equipos con xG alto en las últimas 5."),
  pick("p4", "m4", "Hándicap asiático", "Universitario -1", 3.4, 0.5, 0.34, "ganada", "2026-11-04T03:00:00Z", "Cristal rota por Copa."),
  pick("p5", "m5", "BTTS", "Sí", 1.75, 1, 0.6, "pendiente", null, "Ambas defensas con bajas."),
];

export const demoGraveyard: GraveyardEntry[] = [
  {
    id: "g1", pick_id: "p3", verdict: "varianza",
    why_failed: "Se generaron 2.8 xG entre ambos pero el partido terminó 1-1.",
    red_card: false, rotated_lineup: false, odds_fair: true, closing_odds: 3.9,
    lesson: "El proceso fue correcto (la cuota bajó hasta 3.90 al cierre). Una apuesta al 29% se pierde 7 de cada 10 veces: no tocar el modelo.",
    created_at: "2026-11-04T10:00:00Z",
    pick: demoPicks.find((p) => p.id === "p3"),
  },
  {
    id: "g2", pick_id: "p2", verdict: "mala_informacion",
    why_failed: "Valencia salió con 4 suplentes por rotación de Copa; no estaba confirmado al publicar.",
    red_card: false, rotated_lineup: true, odds_fair: false, closing_odds: 2.45,
    lesson: "Esperar alineaciones oficiales en partidos cercanos a Copa antes de publicar.",
    created_at: "2026-11-03T10:00:00Z",
    pick: demoPicks.find((p) => p.id === "p2"),
  },
];
