# Quickstart

This guide is for someone new to JavaScript who wants to poke around and change things.

## Setup

You need [Node.js](https://nodejs.org/) installed (any recent version). Then in a terminal:

```
npm install
npm run dev
```

This starts a local dev server. Open http://localhost:5173/ in your browser. When you edit a file and save, the page reloads automatically.

## Anatomy of a demo

Every demo file (e.g. `demos/spindle-slider/main.js`) follows the same structure, top to bottom:

### 1. Scene, camera, renderer

```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, ...);
camera.position.set(0, 2, 5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

This is boilerplate that creates a 3D world and puts a camera in it. The first argument to `PerspectiveCamera` is the field of view in degrees. `camera.position.set(x, y, z)` moves the camera — try changing the numbers.

### 2. Lighting

```js
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(5, Math.tan(20 * Math.PI / 180) * 5, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
```

- **DirectionalLight** is like the sun — it shines in one direction everywhere. The first argument is the color (`0xffffff` = white), the second is the intensity. `light.position` controls where it shines from.
- **AmbientLight** is uniform fill light so shadowed parts aren't completely black. The second argument (0.5) is how bright it is.

Things to try:
- Change the color: `0xff8800` for warm orange, `0x88ccff` for cool blue.
- Change the intensity (the number after the color).
- Move the light: `light.position.set(0, 10, 0)` puts it directly above.

### 3. Background

```js
scene.background = galaxyTexture;          // image background
scene.background = new THREE.Color(0x0a0a1a);  // solid color
```

Any hex color works. `0x000000` is black, `0xffffff` is white. The stars texture is loaded from `assets/textures/stars-small.png`.

### 4. Profile curve (the math)

This is the interesting part. Each demo computes a **profile curve** — a 2D curve that gets spun around the vertical axis to make the surface.

```js
const { ts, values: hValues } = quadrature(
  s => Math.sqrt(1 - a * a * Math.cos(s) ** 2),
  0, Math.PI, 400,
);
```

This says: integrate the function `sqrt(1 - a² cos²(s))` from `0` to `π` using 400 steps. The result is an array of s-values (`ts`) and the corresponding accumulated heights (`hValues`).

Then the profile points are built:

```js
const points = ts.map((s, i) =>
  new THREE.Vector3(a * Math.sin(s), hValues[i] - totalHeight / 2, 0),
);
```

Each point has `x = r(s)` (the radius) and `y = h(s)` (the height). The `- totalHeight / 2` centers the shape vertically.

### 5. Surface of revolution

```js
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
```

This spins the profile curve around the y-axis. `u` is the angle around the axis (0 to 2π), `v` walks along the profile (0 to 1). You shouldn't need to touch this.

### 6. Mesh and material

```js
const mesh = new SurfaceMesh(surface, {
  color: 0xcc6633,
  roughness: 0.6,
  metalness: 0.1,
  uSegments: 96,
  vSegments: 48,
});
```

- **color**: the surface color (only visible when there's no texture shader).
- **roughness**: 0 = mirror-smooth, 1 = matte.
- **metalness**: 0 = plastic/stone, 1 = metal.
- **uSegments / vSegments**: how finely the surface is tessellated. Higher = smoother but slower.

### 7. Animate loop

```js
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y = clock.getElapsedTime() * 0.1;
  renderer.render(scene, camera);
}
```

This runs every frame. `mesh.rotation.y` slowly spins the surface. Change `0.1` to spin faster or slower (or `0` to stop).

## Switching demos

Edit `index.html` and change the `<script>` src:

```html
<script type="module" src="/demos/spindle-slider/main.js"></script>
<script type="module" src="/demos/hyperbolic-slider/main.js"></script>
<script type="module" src="/demos/pseudosphere-slider/main.js"></script>
<script type="module" src="/demos/spindle-basic/main.js"></script>
```

Only one should be uncommented at a time.

## Three.js docs

The official docs are at https://threejs.org/docs/. The most relevant pages:

- [MeshPhysicalMaterial](https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial) — the material properties (color, roughness, metalness)
- [DirectionalLight](https://threejs.org/docs/#api/en/lights/DirectionalLight) — the sun-like light
- [PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera) — the camera
