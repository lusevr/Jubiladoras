import type { BankrollPoint } from "@/lib/betting";

/** Gráfico de línea en SVG puro (sin librerías): se renderiza en el servidor. */
export function BankrollChart({ initial, points }: { initial: number; points: BankrollPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-zinc-500">Aún no hay picks resueltos para graficar.</p>;
  }
  const values = [initial, ...points.map((p) => p.bankroll)];
  const W = 800, H = 240, PAD = 32;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  const stroke = last >= initial ? "#34d399" : "#fb7185";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Evolución del bankroll">
        <line x1={PAD} x2={W - PAD} y1={y(initial)} y2={y(initial)} stroke="#52525b" strokeDasharray="4 4" />
        <text x={W - PAD} y={y(initial) - 6} textAnchor="end" fill="#71717a" fontSize="11">
          inicial {initial.toFixed(0)}
        </text>
        <path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={stroke} />
        ))}
        <text x={x(values.length - 1)} y={y(last) - 10} textAnchor="end" fill={stroke} fontSize="12" fontWeight="600">
          {last.toFixed(2)}
        </text>
      </svg>
    </div>
  );
}
