import { createClient } from "@supabase/supabase-js";
import { demoGraveyard, demoMatches, demoPicks, demoSettings } from "./demo-data";
import type { BankrollSettings, GraveyardEntry, Match, Pick } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true si la app está mostrando datos de demostración (Supabase sin configurar). */
export const isDemo = !url || !key;

const supabase = isDemo ? null : createClient(url!, key!, { auth: { persistSession: false } });

// Postgres devuelve numeric como string: lo convertimos a number.
function num<T extends Record<string, unknown>>(row: T, fields: string[]): T {
  const out: Record<string, unknown> = { ...row };
  for (const f of fields) if (out[f] != null) out[f] = Number(out[f]);
  return out as T;
}
const PICK_NUMS = ["odds", "stake_units", "estimated_prob", "implied_prob", "edge"];

export async function getSettings(): Promise<BankrollSettings> {
  if (!supabase) return demoSettings;
  const { data, error } = await supabase.from("bankroll_settings").select("*").maybeSingle();
  if (error) throw error;
  if (!data) return demoSettings;
  return num(data, ["initial_bankroll", "unit_value"]);
}

export async function getPicks(): Promise<Pick[]> {
  if (!supabase) return demoPicks;
  const { data, error } = await supabase
    .from("picks")
    .select("*, match:matches(*)")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data.map((r) => num(r, PICK_NUMS));
}

export async function getUpcomingMatches(): Promise<Match[]> {
  if (!supabase) return demoMatches.filter((m) => m.status !== "finalizado");
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["programado", "en_juego"])
    .order("kickoff_at");
  if (error) throw error;
  return data;
}

export async function getGraveyard(): Promise<GraveyardEntry[]> {
  if (!supabase) return demoGraveyard;
  const { data, error } = await supabase
    .from("graveyard_entries")
    .select("*, pick:picks(*, match:matches(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((g) => ({
    ...num(g, ["closing_odds"]),
    pick: g.pick ? num(g.pick, PICK_NUMS) : undefined,
  }));
}
