/**
 * ODE trajectory integration
 *
 * Runs a stepper in a loop and collects the results.
 */

import { rk4 } from './steppers.js';

/**
 * Integrate an ODE and return the full trajectory.
 *
 * @param {Object} options
 * @param {function} options.deriv - The derivative function: (state, t) → dState
 * @param {number[]} options.initial - Initial state
 * @param {number} options.dt - Time step
 * @param {number} options.steps - Number of steps
 * @param {function} [options.stepper] - Stepper to use (default: rk4)
 * @param {function} [options.stop] - Optional early termination: return true to stop
 * @returns {{ states: number[][], times: number[] }} Full trajectory
 *
 * @example
 * // Harmonic oscillator: r'' = -r
 * const traj = integrate({
 *   deriv: ([r, rp]) => [rp, -r],
 *   initial: [0, 1],
 *   dt: 0.01,
 *   steps: 1000,
 * });
 */
export function integrate(options) {
  const { deriv, initial, dt, steps, stop } = options;
  const step = options.stepper ?? rk4;

  const states = [initial];
  const times = [0];

  let state = initial;
  let t = 0;

  for (let i = 0; i < steps; i++) {
    state = step(deriv, state, t, dt);
    t += dt;
    states.push(state);
    times.push(t);

    if (stop?.(state, t)) break;
  }

  return { states, times };
}
