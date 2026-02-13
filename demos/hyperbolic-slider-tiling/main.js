/**
 * Hyperbolic surface of revolution — Fermi coordinate grid tiling
 *
 * Constant Gaussian curvature K = -1.
 * Profile: r(s) = a cosh(s),  h'(s) = sqrt(1 - a² sinh²(s)).
 *
 * The surface metric ds² + a²cosh²(s) dθ² becomes ds² + cosh²(s) dσ²
 * (with σ = aθ), which is the Fermi coordinate metric on H² relative
 * to the waist geodesic.
 *
 * Fermi coords:  x = s,  y = aθ     →   z = x + iy = s + i·a·θ
 *
 * The shader draws the grid lines of this Fermi coordinate system.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';
import { quadrature } from '@/ode/quadrature.js';
import { Slider } from '@/ui/Slider.js';

import fermiGridFrag from './shaders/fermi-grid.frag.glsl?raw';

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

  return { points: [...bottomHalf, ...topHalf], sMax };
}

const initialA = 0.5;
const initial = solveProfile(initialA);

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

// --- Shader uniforms ---

const uniforms = {
  uA:    { value: initialA },
  uSMax: { value: initial.sMax },
};

const mesh = new SurfaceMesh(surface, {
  color: 0xcc6633,
  roughness: 0.6,
  metalness: 0.1,
  uSegments: 96,
  vSegments: 48,
  fragmentShader: fermiGridFrag,
  uniforms,
});

scene.add(mesh);

// --- Rebuild for a given waist radius a ---

function setA(a) {
  const { points, sMax } = solveProfile(a);
  profileCurve.updatePoints(points);
  uniforms.uA.value = a;
  uniforms.uSMax.value = sMax;
  mesh.rebuild();
}

// --- Slider ---

new Slider({
  label: 'a', min: 0.1, max: 2, step: 0.01, value: initialA,
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
