/**
 * Spindle Earth (basic)
 *
 * A surface of revolution with constant Gaussian curvature K = +1.
 * Profile: r(s) = a sin(s),  h'(s) = sqrt(1 - a² cos²(s)).
 * Fixed a ∈ [0, 1] (spindle only), so s ∈ [0, π].
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';
import { quadrature } from '@/ode/quadrature.js';

import equirectFrag from './shaders/equirect.frag.glsl?raw';
import earthTextureUrl from '@assets/textures/earth-large.jpg';
import galaxyTextureUrl from '@assets/textures/galaxy-med.jpg';


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

const galaxyTexture = new THREE.TextureLoader().load(galaxyTextureUrl);
galaxyTexture.mapping = THREE.EquirectangularReflectionMapping;
galaxyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = galaxyTexture;
scene.backgroundIntensity = 0.25;

// --- Config ---

const a = 0.5;

// --- Profile curve ---

// r(s) = a sin(s),  h'(s) = sqrt(1 - a² cos²(s)),  s ∈ [0, π]
const { ts, values: hValues } = quadrature(
  s => Math.sqrt(1 - a * a * Math.cos(s) ** 2),
  0, Math.PI, 400,
);

const totalHeight = hValues[hValues.length - 1];
const points = ts.map((s, i) =>
  new THREE.Vector3(a * Math.sin(s), hValues[i] - totalHeight / 2, 0),
);

const profileCurve = new NumericalCurve({
  points,
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

const mesh = new SurfaceMesh(surface, {
  roughness: 0.8,
  metalness: 0.0,
  uSegments: 96,
  vSegments: 48,
  fragmentShader: equirectFrag,
  uniforms: {
    uEarth: { value: earthTexture },
    a: { value: a },
  },
});

scene.add(mesh);


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
