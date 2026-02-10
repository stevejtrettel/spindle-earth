/**
 * Spindle Earth
 *
 * A surface of revolution with constant Gaussian curvature K = +1.
 * Profile ODE:  r'' = -r,  y' = sqrt(1 - r'²).
 * The cone angle α controls the shape:
 *   α = π/2  →  round sphere  (full earth texture)
 *   α < π/2  →  spindle       (wedge of earth, opening 2π sin α)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { integrate } from '@/ode/integrate.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';

import wedgeEquirectVert from './shaders/wedge-equirect.vert.glsl?raw';
import wedgeEquirectFrag from './shaders/wedge-equirect.frag.glsl?raw';
import earthTextureUrl from '@assets/textures/earth-equirect-nasa.jpg';
import galaxyTextureUrl from '@assets/textures/galaxy.png';

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
light.position.set(5, Math.tan(20 * Math.PI / 180) * 5, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// --- Background ---

const galaxyTexture = new THREE.TextureLoader().load(galaxyTextureUrl);
galaxyTexture.mapping = THREE.EquirectangularReflectionMapping;
galaxyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = galaxyTexture;
scene.backgroundIntensity = 0.25;

// --- Profile curve (solved numerically) ---

// K = +1 profile ODE:  state = [r, r', y]
const deriv = ([r, rp]) => [rp, -r, Math.sqrt(Math.max(0, 1 - rp * rp))];

function solveProfile(a) {
  const { states } = integrate({
    deriv,
    initial: [0, a, 0],
    dt: Math.PI / 400,
    steps: 400,
  });
  const totalHeight = states[states.length - 1][2];
  const points = states.map(
    ([r, , y]) => new THREE.Vector3(Math.max(0, r), y - totalHeight / 2, 0),
  );
  return { points, a };
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

const earthTexture = new THREE.TextureLoader().load(earthTextureUrl);
earthTexture.colorSpace = THREE.SRGBColorSpace;

const lightDir = light.position.clone().normalize();

const mesh = new SurfaceMesh(surface, {
  roughness: 0.8,
  metalness: 0.0,
  uSegments: 96,
  vSegments: 48,
  vertexShader: wedgeEquirectVert,
  fragmentShader: wedgeEquirectFrag,
  uniforms: {
    uDay: { value: earthTexture },
    uNight: { value: galaxyTexture },
    a: { value: initial.a },
    uLightDir: { value: lightDir },
  },
});

scene.add(mesh);

// --- Rebuild for a given cone angle α ---

function setA(a) {
  const { points } = solveProfile(a);
  profileCurve.updatePoints(points);
  mesh.uniforms.a.value = a;
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
