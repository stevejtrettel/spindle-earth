# Spindle Earth

Surfaces of revolution with constant Gaussian curvature, visualized in the browser.

## The math

A surface of revolution is determined by its **profile curve** `(r(s), h(s))`, where `s` is arc length along the profile, `r` is the distance from the axis, and `h` is the height.

For constant Gaussian curvature the radial profile `r(s)` satisfies `r'' = -K r`, so we know it analytically. The height follows by quadrature: `h'(s) = sqrt(1 - r'(s)^2)`.

### K = +1 (positive curvature)

```
r(s) = a sin(s)       h'(s) = sqrt(1 - a^2 cos^2(s))
```

The parameter `a` controls the shape:

| a   | shape   | s domain                         |
|-----|---------|----------------------------------|
| < 1 | spindle | [0, pi] (tip to tip)             |
| = 1 | sphere  | [0, pi]                          |
| > 1 | barrel  | [arccos 1/a,  pi - arccos 1/a]   |

### K = -1 (negative curvature)

Two families, depending on the solution to `r'' = r`:

**Cosh type** (trumpet neck):

```
r(s) = a cosh(s)      h'(s) = sqrt(1 - a^2 sinh^2(s))
```

Symmetric about `s = 0`. Domain `|s| <= arcsinh(1/a)`.

**Sinh type** (pseudosphere / tractricoid):

```
r(s) = a sinh(s)      h'(s) = sqrt(1 - a^2 cosh^2(s))
```

Cusp at `s = 0`, flared edge at `s = arccosh(1/a)`. Requires `a < 1`.

### Numerical integration

Since `r(s)` is known in closed form, `h(s)` is computed by quadrature (trapezoidal rule) rather than by solving an ODE system. See `src/ode/quadrature.js`.

## Demos

| Demo | Curvature | Description |
|------|-----------|-------------|
| `spindle-basic`        | K = +1 | Static spindle with earth texture (a = 0.5) |
| `spindle-slider`       | K = +1 | Interactive slider for a (spindle / sphere / barrel) with earth texture |
| `hyperbolic-slider`    | K = -1 | Cosh-type trumpet with slider for waist radius a |
| `pseudosphere-slider`  | K = -1 | Sinh-type tractricoid with slider for a |

## Running it

```
npm install
npm run dev
```

Then open http://localhost:5173/. To switch between demos, change the `<script>` src in `index.html` to point at a different demo, e.g.:

```html
<script type="module" src="/demos/spindle-slider/main.js"></script>
```

## Project structure

```
src/
  ode/
    quadrature.js        # cumulative trapezoidal quadrature
  curves/
    NumericalCurve.js    # smooth interpolation of sampled curves
  surfaces/
    SurfaceMesh.js       # THREE.Mesh wrapper for parametric surfaces
    buildGeometry.js     # tessellate a parametric surface into geometry

demos/
  spindle-basic/         # static K=+1 demo
  spindle-slider/        # interactive K=+1 demo (with shaders)
  hyperbolic-slider/     # interactive K=-1 cosh demo
  pseudosphere-slider/   # interactive K=-1 sinh demo

assets/textures/
  earth-large.jpg
  earth-small.jpg
  stars-small.png
```
