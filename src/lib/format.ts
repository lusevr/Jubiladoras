import type { FailureVerdict, PickResult, RiskClass } from "./types";

export const pct = (x: number | null, digits = 1) =>
  x == null ? "—" : `${(x * 100).toFixed(digits)}%`;

export const signedPct = (x: number | null, digits = 1) =>
  x == null ? "—" : `${x > 0 ? "+" : ""}${(x * 100).toFixed(digits)}%`;

export const units = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(2)} u`;

export const money = (x: number, currency: string) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(x);

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    timeZone: "America/Lima",
  }).format(new Date(iso));

export const RISK_LABEL: Record<RiskClass, string> = {
  conservador: "🟢 Conservador",
  value: "🔴 Value / Arriesgado",
  sin_valor: "⚪ Sin valor",
};

export const RESULT_STYLE: Record<PickResult, string> = {
  pendiente: "bg-zinc-700 text-zinc-200",
  ganada: "bg-emerald-600/20 text-emerald-400",
  perdida: "bg-rose-600/20 text-rose-400",
  anulada: "bg-zinc-600/30 text-zinc-400",
};

export const VERDICT_LABEL: Record<FailureVerdict, string> = {
  varianza: "Varianza (el proceso fue correcto)",
  error_modelo: "Error del modelo",
  factor_externo: "Factor externo",
  mala_informacion: "Mala información",
};
