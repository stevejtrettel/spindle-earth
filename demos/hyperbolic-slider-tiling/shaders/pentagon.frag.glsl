// Right-angled pentagon tiling of the hyperbolic plane.
//
// Pipeline: surface UVs → Fermi (s, t) → upper half-plane → pentagon tiling
//
// The pentagon is built from two side-length parameters (A, B) satisfying
// sinh(A)·sinh(B) > 1.  Five geodesic mirrors bound the fundamental domain;
// we iteratively reflect into it and color by parity.

uniform float uA;
uniform float uSMax;
uniform float uTime;

// PI is provided by Three.js

// =====================================================================
// Coordinate mapping
// =====================================================================

vec2 uvToFermi(vec2 uv) {
    float s = (2.0 * uv.y - 1.0) * uSMax;
    float t = uA * (uv.x - 0.5) * 2.0 * PI;
    return vec2(s, t);
}

vec2 fermiToUHP(vec2 st) {
    float s = st.x;
    float t = st.y;
    float ex = exp(s);
    float emx = exp(-s);
    float cosh_s = (ex + emx) * 0.5;
    float sinh_s = (ex - emx) * 0.5;
    return vec2(
        exp(t) * sinh_s / cosh_s,
        exp(t) / cosh_s
    );
}

vec2 uvToUHP(vec2 uv) {
    return fermiToUHP(uvToFermi(uv));
}

// =====================================================================
// Geodesics and half-spaces in UHP
// =====================================================================

const float INF = 1e10;

struct Geodesic { float p; float q; };   // endpoints on the real axis
struct HalfSpace { Geodesic bdy; float side; };
struct Pentagon { HalfSpace a; HalfSpace b; HalfSpace c; HalfSpace d; HalfSpace e; };

bool isLine(Geodesic g) {
    return abs(g.p) > 1e9 || abs(g.q) > 1e9;
}

// Return the finite endpoint of a vertical geodesic.
float lineEndpt(Geodesic g) {
    return (abs(g.p) > 1e9) ? g.q : g.p;
}

vec2 reflectIn(vec2 z, Geodesic g) {
    if (isLine(g)) {
        float e = lineEndpt(g);
        z.x = 2.0 * e - z.x;
    } else {
        float center = (g.p + g.q) * 0.5;
        float radius = abs(g.p - g.q) * 0.5;
        z.x -= center;
        z /= radius;
        z /= dot(z, z);
        z *= radius;
        z.x += center;
    }
    return z;
}

bool inside(vec2 z, HalfSpace hs) {
    if (isLine(hs.bdy)) {
        float e = lineEndpt(hs.bdy);
        return (z.x - e) * hs.side > 0.0;
    }
    float center = (hs.bdy.p + hs.bdy.q) * 0.5;
    float radius = abs(hs.bdy.p - hs.bdy.q) * 0.5;
    vec2 rel = z - vec2(center, 0.0);
    return (dot(rel, rel) - radius * radius) * hs.side > 0.0;
}

vec2 reflectIn(vec2 z, HalfSpace hs, inout float parity) {
    if (!inside(z, hs)) {
        z = reflectIn(z, hs.bdy);
        parity *= -1.0;
    }
    return z;
}

// =====================================================================
// Pentagon operations
// =====================================================================

bool insidePentagon(vec2 z, Pentagon P) {
    return inside(z, P.a) && inside(z, P.b) && inside(z, P.c)
        && inside(z, P.d) && inside(z, P.e);
}

vec2 reflectIn(vec2 z, Pentagon P, inout float parity) {
    z = reflectIn(z, P.a, parity);
    z = reflectIn(z, P.b, parity);
    z = reflectIn(z, P.c, parity);
    z = reflectIn(z, P.d, parity);
    z = reflectIn(z, P.e, parity);
    return z;
}

vec2 moveInto(vec2 z, Pentagon P, out float parity) {
    parity = 1.0;
    for (int i = 0; i < 50; i++) {
        z = reflectIn(z, P, parity);
        if (insidePentagon(z, P)) break;
    }
    return z;
}

float geodesicDist(vec2 z, Geodesic g) {
    if (isLine(g)) {
        float e = lineEndpt(g);
        z.x -= e;
    } else {
        // Möbius (z-p)/(z-q) maps g to the y-axis
        vec2 num = z - vec2(g.p, 0.0);
        vec2 den = z - vec2(g.q, 0.0);
        float d2 = dot(den, den);
        z = vec2(dot(num, den), num.y * den.x - num.x * den.y) / d2;
    }
    return acosh(max(1.0, length(z) / abs(z.y)));
}

float pentagonEdgeDist(vec2 z, Pentagon P) {
    float d = geodesicDist(z, P.a.bdy);
    d = min(d, geodesicDist(z, P.b.bdy));
    d = min(d, geodesicDist(z, P.c.bdy));
    d = min(d, geodesicDist(z, P.d.bdy));
    d = min(d, geodesicDist(z, P.e.bdy));
    return d;
}

// =====================================================================
// Pentagon construction
// =====================================================================

Pentagon createPentagon(float A, float B) {
    // a: y-axis (vertical line at x = 0), to the right
    HalfSpace a = HalfSpace(Geodesic(0.0, INF), 1.0);
    // b: unit circle, above
    HalfSpace b = HalfSpace(Geodesic(-1.0, 1.0), 1.0);
    // c: translate of y-axis along unit circle by distance B, above
    HalfSpace c = HalfSpace(Geodesic(tanh(B * 0.5), 1.0 / tanh(B * 0.5)), 1.0);
    // e: horizontal geodesic at height exp(A), below
    HalfSpace e = HalfSpace(Geodesic(exp(A), -exp(A)), -1.0);

    // d: fifth side, determined by the constraint
    float cA = cosh(A), sA = sinh(A);
    float cB = cosh(B), sB = sinh(B);
    float cD = sA * sB;
    float sD = sqrt(cD * cD - 1.0);
    float cE = sB * cA / sD;
    float sE = cB / sD;
    float tanhE2 = sE / (1.0 + cE);
    float eA = exp(A);
    HalfSpace d = HalfSpace(Geodesic(eA * tanhE2, eA / tanhE2), 1.0);

    return Pentagon(a, b, c, d, e);
}

// =====================================================================

void main() {
    vec2 z = uvToUHP(vMapUv);

    // Regular right-angled pentagon: all sides equal
    // L = 2·arccosh(cos(π/5) / sin(π/4))
    float L = 2.0 * acosh(cos(PI / 5.0) / sin(PI / 4.0));
    Pentagon P = createPentagon(L, L);

    float parity;
    vec2 w = moveInto(z, P, parity);

    // Parity coloring
    vec3 color = (parity > 0.0) ? vec3(0.85, 0.8, 0.75) : vec3(0.35, 0.4, 0.45);

    // Edge lines
    float d = pentagonEdgeDist(w, P);
    float edge = fwidth(d) * 2.0;
    float line = 1.0 - smoothstep(0.0, edge, d);
    color = mix(color, vec3(1.0), line);

    csm_DiffuseColor = vec4(color, 1.0);
}
