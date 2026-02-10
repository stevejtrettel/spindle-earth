/**
 * NumericalCurve
 *
 * A curve defined by an array of points with smooth interpolation.
 * Perfect for visualizing geodesics, integral curves, or any
 * numerically-computed path.
 *
 * Extends THREE.CatmullRomCurve3 to get smooth interpolation and
 * all the built-in curve utilities (arc-length, Frenet frames, etc.)
 */

import * as THREE from 'three';

export class NumericalCurve extends THREE.CatmullRomCurve3 {

  constructor(options) {
    super(
      options.points,
      options.closed ?? false,
      options.curveType ?? 'centripetal',
      options.tension ?? 0.5
    );
  }

  /** Evaluate the curve at parameter t in [0, 1] */
  evaluate(t) {
    return this.getPoint(t);
  }

  getDomain() {
    return { tMin: 0, tMax: 1 };
  }

  computeTangent(t) {
    return this.getTangent(t);
  }

  /** Replace the curve's points and rebuild the arc-length cache */
  updatePoints(points) {
    this.points = points;
    this.updateArcLengths();
  }
}
