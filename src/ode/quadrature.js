/**
 * Cumulative quadrature of a scalar function f on [tMin, tMax].
 *
 * Returns { ts, values } where values[i] ≈ ∫_{tMin}^{ts[i]} f(t) dt.
 * Uses the trapezoidal rule.
 *
 * @param {function} f - Integrand: (t) → number
 * @param {number} tMin - Left endpoint
 * @param {number} tMax - Right endpoint
 * @param {number} steps - Number of subintervals
 * @returns {{ ts: number[], values: number[] }}
 */
export function quadrature(f, tMin, tMax, steps) {
  const dt = (tMax - tMin) / steps;
  const ts = new Array(steps + 1);
  const values = new Array(steps + 1);

  ts[0] = tMin;
  values[0] = 0;

  let prev = f(tMin);
  for (let i = 1; i <= steps; i++) {
    ts[i] = tMin + i * dt;
    const curr = f(ts[i]);
    values[i] = values[i - 1] + 0.5 * dt * (prev + curr);
    prev = curr;
  }

  return { ts, values };
}
