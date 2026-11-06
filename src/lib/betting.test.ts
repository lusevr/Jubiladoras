import { describe, expect, it } from "vitest";
import { bankrollHistory, classifyRisk, computeStats, edge, pickProfitUnits } from "./betting";
import type { Pick } from "./types";

function mk(over: Partial<Pick>): Pick {
  const odds = over.odds ?? 2;
  const prob = over.estimated_prob ?? 0.55;
  return {
    id: Math.random().toString(36),
    match_id: "m",
    market: "1X2",
    selection: "Local",
    odds,
    stake_units: 1,
    estimated_prob: prob,
    implied_prob: 1 / odds,
    edge: prob * odds - 1,
    risk: classifyRisk(prob, odds),
    result: "pendiente",
    reasoning: null,
    published_at: "2026-11-01T00:00:00Z",
    settled_at: null,
    ...over,
  };
}

describe("edge y clasificación", () => {
  it("cuota baja sin valor NO es conservadora", () => {
    // cuota 1.30 → implícita 76.9%; si estimamos 70%, no hay value
    expect(edge(0.7, 1.3)).toBeCloseTo(-0.09);
    expect(classifyRisk(0.7, 1.3)).toBe("sin_valor");
  });
  it("probabilidad alta con value → conservador", () => {
    expect(classifyRisk(0.6, 1.8)).toBe("conservador");
  });
  it("probabilidad baja con value → value/arriesgado", () => {
    expect(classifyRisk(0.3, 4)).toBe("value");
  });
});

describe("ganancias", () => {
  it("ganada, perdida, anulada, pendiente", () => {
    expect(pickProfitUnits({ result: "ganada", odds: 2.5, stake_units: 2 })).toBe(3);
    expect(pickProfitUnits({ result: "perdida", odds: 2.5, stake_units: 2 })).toBe(-2);
    expect(pickProfitUnits({ result: "anulada", odds: 2.5, stake_units: 2 })).toBe(0);
    expect(pickProfitUnits({ result: "pendiente", odds: 2.5, stake_units: 2 })).toBe(0);
  });
});

describe("computeStats", () => {
  const settings = { initial_bankroll: 1000, unit_value: 10 };
  const picks = [
    mk({ result: "ganada", odds: 2, stake_units: 2, settled_at: "2026-11-02" }), // +2u
    mk({ result: "perdida", odds: 3, stake_units: 1, settled_at: "2026-11-03" }), // -1u
    mk({ result: "anulada", odds: 1.9, stake_units: 1, settled_at: "2026-11-04" }), // 0
    mk({ result: "pendiente", odds: 2.2, stake_units: 1 }),
  ];
  const s = computeStats(picks, settings);

  it("conteos", () => {
    expect([s.won, s.lost, s.voided, s.pending]).toEqual([1, 1, 1, 1]);
  });
  it("yield = ganancia / apostado (sin anuladas)", () => {
    expect(s.unitsStaked).toBe(3);
    expect(s.profitUnits).toBe(1);
    expect(s.yield).toBeCloseTo(1 / 3);
  });
  it("ROI = ganancia / bankroll inicial", () => {
    expect(s.profitMoney).toBe(10);
    expect(s.roi).toBeCloseTo(0.01);
    expect(s.currentBankroll).toBe(1010);
  });
  it("acierto ignora anuladas", () => {
    expect(s.hitRate).toBe(0.5);
  });
  it("historial ordenado y acumulado", () => {
    const h = bankrollHistory(picks, settings);
    expect(h.map((x) => x.bankroll)).toEqual([1020, 1010, 1010]);
  });
  it("sin picks resueltos → yield y acierto null", () => {
    const e = computeStats([], settings);
    expect(e.yield).toBeNull();
    expect(e.hitRate).toBeNull();
    expect(e.roi).toBe(0);
  });
});
