export type PickResult = "pendiente" | "ganada" | "perdida" | "anulada";
export type RiskClass = "conservador" | "value" | "sin_valor";
export type MatchStatus = "programado" | "en_juego" | "finalizado" | "suspendido";
export type FailureVerdict =
  | "varianza"
  | "error_modelo"
  | "factor_externo"
  | "mala_informacion";

export interface Match {
  id: string;
  competition: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
}

export interface Pick {
  id: string;
  match_id: string;
  market: string;
  selection: string;
  odds: number;
  stake_units: number;
  estimated_prob: number;
  implied_prob: number;
  edge: number;
  risk: RiskClass;
  result: PickResult;
  reasoning: string | null;
  published_at: string;
  settled_at: string | null;
  match?: Match;
}

export interface GraveyardEntry {
  id: string;
  pick_id: string;
  verdict: FailureVerdict;
  why_failed: string;
  red_card: boolean;
  rotated_lineup: boolean;
  odds_fair: boolean | null;
  closing_odds: number | null;
  lesson: string;
  created_at: string;
  pick?: Pick;
}

export interface BankrollSettings {
  initial_bankroll: number;
  unit_value: number;
  currency: string;
}
