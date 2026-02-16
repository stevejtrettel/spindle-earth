/**
 * Spindle Earth
 *
 * A surface of revolution with constant Gaussian curvature K = +1.
 * Profile: r(s) = a sin(s),  h'(s) = sqrt(1 - a² cos²(s)).
 *
 * The parameter a (= sin α, where α is the cone half-angle) controls the shape.
 *   Here we choose a specific value of a to get adjusted for a custom Earth texture for the eastern hemisphere.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SurfaceMesh } from '@/surfaces/SurfaceMesh.js';
import { NumericalCurve } from '@/curves/NumericalCurve.js';
import { quadrature } from '@/ode/quadrature.js';
import { Slider } from '@/ui/Slider.js';

import wedgeEquirectVert from './shaders/wedge-equirect.vert.glsl?raw';
import wedgeEquirectFrag from './shaders/wedge-equirect.frag.glsl?raw';
import earthTextureUrl from '@assets/textures/eastern-hemi/eastern-hemi.jpg';
import earthNightUrl from '@assets/textures/eastern-hemi/eastern-hemi-night.jpg';
import galaxyTextureUrl from '@assets/textures/galaxy-med.jpg';

// --- Scene setup ---

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

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

const lightDistance = 20; //far enough to approximate directional light at the scale of the spindle
const lightAngle = -30 * Math.PI / 180; // Mid-February lighting. Adjust as desired to show different parts of the Earth in daylight vs. night. 0 is March equinox, -90 is December solstice, +90 is June solstice.

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(lightDistance*Math.cos(lightAngle),0, lightDistance*Math.sin(lightAngle));
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// --- Background ---

const galaxyTexture = new THREE.TextureLoader().load(galaxyTextureUrl);
galaxyTexture.mapping = THREE.EquirectangularReflectionMapping;
galaxyTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = galaxyTexture;
scene.backgroundIntensity = 0.1;

// --- Profile curve ---

// r(s) = a sin(s),  h(s) = ∫ sqrt(1 - a² cos²(s)) ds
// a < 1 (spindle/sphere): s ∈ [0, π]         (tip to tip)

function solveProfile(a) {
  const sMin = a <= 1 ? 0 : Math.acos(1 / a);
  const sMax = Math.PI - sMin;

  const { ts, values: hValues } = quadrature(
    s => Math.sqrt(Math.max(0, 1 - a * a * Math.cos(s) ** 2)),
    sMin, sMax, 400,
  );

  const totalHeight = hValues[hValues.length - 1];
  const points = ts.map((s, i) =>
    new THREE.Vector3(Math.max(0, a * Math.sin(s)), hValues[i] - totalHeight / 2, 0),
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
earthTexture.wrapS = THREE.RepeatWrapping;
earthTexture.needsUpdate = true;

const nightTexture = new THREE.TextureLoader().load(earthNightUrl);
nightTexture.colorSpace = THREE.SRGBColorSpace;
nightTexture.wrapS = THREE.RepeatWrapping;
nightTexture.needsUpdate = true;

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
    uNight: { value: nightTexture },
    a: { value: initial.a },
    uLightDir: { value: lightDir },
  },
});

scene.add(mesh);

// Specific value of a to get adjusted for a custom Earth texture for the eastern hemisphere.
const imgWidth = 4679; // pixels
const imgHeight = 4096; // pixels

const a = imgWidth / (2*imgHeight);

// --- Animate ---

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  mesh.rotation.x = 23.44 * Math.PI / 180;  // axial tilt
  mesh.rotation.y = time * 0.1;  // spin around tilted axis
  controls.update();
  renderer.render(scene, camera);
}

animate();
