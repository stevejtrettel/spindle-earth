/**
 * Pseudosphere (tractricoid)
 *
 * Constant Gaussian curvature K = -1.
 * Profile: r(s) = a sinh(s),  h'(s) = sqrt(1 - a² cosh²(s)).
 * A cusp at s = 0 that flares into a trumpet bell.
 *
 * The parameter a controls the shape (a < 1).
 * s ∈ [0, sMax] where sMax = arccosh(1/a).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';
import { quadrature } from '@/ode/quadrature.js';

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

// r(s) = a sinh(s),  h'(s) = sqrt(1 - a² cosh²(s)),  s ∈ [0, sMax]
// sMax = arccosh(1/a)  (where h' → 0, the flared edge)
// At s = 0 the surface has a cusp (r = 0).

function solveProfile(a) {
  const sMax = Math.acosh(1 / a);

  const { ts, values: hValues } = quadrature(
    s => Math.sqrt(Math.max(0, 1 - a * a * Math.cosh(s) ** 2)),
    0, sMax, 200,
  );

  // Cusp at top (h = totalHeight), flared edge at bottom (h = 0)
  const totalHeight = hValues[hValues.length - 1];
  const points = ts.map((s, i) =>
    new THREE.Vector3(a * Math.sinh(s), totalHeight - hValues[i], 0),
  );

  // Center vertically
  for (const p of points) p.y -= totalHeight / 2;

  return { points, a };
}

const initial = solveProfile(0.25);

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
  color: 0x3388aa,
  roughness: 0.6,
  metalness: 0.1,
  uSegments: 96,
  vSegments: 48,
});

scene.add(mesh);

// --- Rebuild for a given value of a ---

function setA(a) {
  const { points } = solveProfile(a);
  profileCurve.updatePoints(points);
  mesh.rebuild();
}

// --- Slider ---

const slider = document.getElementById('a-slider');
const sliderLabel = document.getElementById('slider-label');

slider.addEventListener('input', () => {
  const a = parseFloat(slider.value);
  sliderLabel.textContent = `a = ${a.toFixed(2)}`;
  setA(a);
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
