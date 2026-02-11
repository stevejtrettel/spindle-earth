/**
 * Hyperbolic surface of revolution
 *
 * Constant Gaussian curvature K = -1.
 * Profile: r(s) = a cosh(s),  h'(s) = sqrt(1 - a² sinh²(s)).
 * A neck at s = 0 that flares into trumpet bells.
 *
 * The parameter a controls the waist radius.
 * s ∈ [-sMax, sMax] where sMax = arcsinh(1/a).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';
import { quadrature } from '@/ode/quadrature.js';
import { Slider } from '@/ui/Slider.js';

// --- Scene setup ---

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Lighting ---

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(5, Math.tan(20 * Math.PI / 180) * 5, 0); // 20° elevation
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// --- Background ---

scene.background = new THREE.Color(0x0a0a1a);

// --- Profile curve ---

// r(s) = a cosh(s),  h'(s) = sqrt(1 - a² sinh²(s)),  s ∈ [0, sMax]
// sMax = arcsinh(1/a)  (where h' → 0)
// Profile is symmetric about s = 0; integrate top half then mirror.

function solveProfile(a) {
  const sMax = Math.asinh(1 / a);

  const { ts, values: hValues } = quadrature(
    s => Math.sqrt(Math.max(0, 1 - a * a * Math.sinh(s) ** 2)),
    0, sMax, 200,
  );

  const topHalf = ts.map((s, i) =>
    new THREE.Vector3(a * Math.cosh(s), hValues[i], 0),
  );

  // Mirror (skip duplicate at s = 0)
  const bottomHalf = topHalf.slice(1).reverse().map(p =>
    new THREE.Vector3(p.x, -p.y, 0),
  );

  return { points: [...bottomHalf, ...topHalf], a };
}

const initial = solveProfile(0.5);

const profileCurve = new NumericalCurve({
  points: initial.points,
  closed: false,
  curveType: 'catmullrom',
  tension: 0.5,
});

// --- Surface of revolution ---

const surface = {
  evaluate(u, v) {
    const p = profileCurve.evaluate(v);
    return new THREE.Vector3(
      p.x * Math.cos(u),
      p.y,
      -p.x * Math.sin(u),
    );
  },
  getDomain() {
    return { uMin: 0, uMax: 2 * Math.PI, vMin: 0, vMax: 1 };
  },
};

const mesh = new SurfaceMesh(surface, {
  color: 0xcc6633,
  roughness: 0.6,
  metalness: 0.1,
  uSegments: 96,
  vSegments: 48,
});

scene.add(mesh);

// --- Rebuild for a given waist radius a ---

function setA(a) {
  const { points } = solveProfile(a);
  profileCurve.updatePoints(points);
  mesh.rebuild();
}

// --- Slider ---

new Slider({
  label: 'a', min: 0.1, max: 2, step: 0.01, value: 0.5,
  format: v => `a = ${v.toFixed(2)}  (strip width = ${(2 * Math.asinh(1 / v)).toFixed(2)})`,
  onChange: setA,
});

// --- Animate ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  mesh.rotation.y = time * 0.1;
  controls.update();
  renderer.render(scene, camera);
}

animate();
