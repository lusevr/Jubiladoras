# Jubiladores

Plataforma transparente de análisis deportivo, publicación de picks y seguimiento de apuestas.
Todos los picks quedan registrados, los ganados y los perdidos. Los perdidos de interés se analizan en **El Cementerio de los Jubiladores**.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Vercel

---

## 1. Correrlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar Supabase, la app muestra **datos de demostración** (aparece un aviso amarillo arriba).

## 2. Conectar Supabase

1. Crea un proyecto gratis en https://supabase.com.
2. Ve a **SQL Editor**, pega todo el contenido de `supabase/migrations/0001_init.sql` y dale **Run**.
3. Copia `.env.example` como `.env.local` y pon tu URL y tu `anon key` (Project Settings → API).
4. Reinicia `npm run dev`.

**Hacerte admin** (solo los admin pueden crear o editar picks):
1. En Supabase → Authentication → Users → *Add user*, créate un usuario.
2. En el SQL Editor:
   ```sql
   update profiles set role = 'admin' where id = '<id-de-tu-usuario>';
   insert into bankroll_settings (initial_bankroll, unit_value, currency) values (1000, 10, 'PEN');
   ```

## 3. Subir a GitHub y desplegar en Vercel

```bash
git add . && git commit -m "Base inicial"
git remote add origin https://github.com/<tu-usuario>/jubiladores.git
git push -u origin main
```

En https://vercel.com → *Add New Project* → importa el repo → en **Environment Variables** añade las dos variables de `.env.local` → *Deploy*.

## 4. Tests

```bash
npm test
```

---

## Estructura

```
supabase/migrations/0001_init.sql   Esquema, reglas de transparencia y permisos (RLS)
src/lib/betting.ts                  Cálculos: edge, riesgo, ROI, yield, acierto, Brier, historial
src/lib/betting.test.ts             Tests de los cálculos
src/lib/data.ts                     Lectura de Supabase (o datos demo si no está configurado)
src/app/page.tsx                    Dashboard
src/app/picks/                      Historial de picks
src/app/bankroll/                   Bankroll Tracker
src/app/cementerio/                 El Cementerio de los Jubiladores
```

## Decisiones de diseño

**Clasificación de riesgo (estadística, no por cuota).** La calcula la base de datos, así que no se puede editar a mano:
- `edge = probabilidad estimada × cuota − 1`
- edge ≤ 0 → ⚪ **Sin valor** (no debería publicarse)
- edge > 0 y probabilidad ≥ 55% → 🟢 **Conservador**
- edge > 0 y probabilidad < 55% → 🔴 **Value / Arriesgado**

El umbral del 55% está en dos sitios que deben coincidir: `CONSERVATIVE_MIN_PROB` en `src/lib/betting.ts` y la columna `risk` en el SQL.

**Métricas.**
- **Yield** = ganancia ÷ unidades apostadas (picks ganados + perdidos).
- **ROI** = ganancia ÷ bankroll inicial.
- **Acierto** = ganadas ÷ (ganadas + perdidas). Las anuladas no cuentan.
- **Brier score** mide si las probabilidades estimadas están bien calibradas (0 = perfecto, 0.25 = tirar una moneda).

**Transparencia garantizada por la base de datos.**
- Un pick resuelto no se puede editar (cuota, stake, probabilidad, mercado, selección) ni borrar.
- Solo los picks perdidos pueden entrar al Cementerio.

**Cementerio.** Cada análisis obliga a elegir un veredicto: `varianza`, `error_modelo`, `factor_externo` o `mala_informacion`. Así se separa la mala suerte del mal análisis y no se “corrige” un modelo que estaba bien. Se guarda también la cuota de cierre para calcular el **CLV** (si el mercado se movió a nuestro favor).

## Pendiente

- [ ] Motor matemático (sección E de la especificación)
- [ ] Panel de admin: formularios para crear partidos, publicar picks, resolverlos y escribir análisis del Cementerio
- [ ] Login con Supabase Auth
- [ ] Conexión a una API de partidos y cuotas
