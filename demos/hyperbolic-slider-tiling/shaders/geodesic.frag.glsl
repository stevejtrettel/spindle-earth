// Geodesic shader — animated geodesic wrapping around the hyperbolic surface.
//
// Pipeline: surface UVs → Fermi (s, t) → upper half-plane → geodesic SDF
//
// A geodesic through (x₀, h) in UHP at angle α from the meridian direction
// is a semicircle with center c = x₀ + h·cot(α), radius r = h/sin(α).
// x₀ = h·sinh(s₀) offsets the anchor point away from the waist by
// Fermi distance s₀.
//
// We draw both +α and -α, and tile by the dilation z → e^{2πa} z.

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
// Geodesic SDF
// =====================================================================

float geodesicDist(vec2 z, float c, float r) {
    float dx = z.x - c;
    float raw = (dx * dx + z.y * z.y - r * r) / (2.0 * r * z.y);
    return log(raw + sqrt(raw * raw + 1.0)); // asinh(raw)
}

float wrappedDist(vec2 z, float c, float r, float logLambda) {
    float minDist = 1e6;
    for (int n = -6; n <= 6; n++) {
        float scale = exp(float(n) * logLambda);
        vec2 zn = z / scale;
        float d = abs(geodesicDist(zn, c, r));
        minDist = min(minDist, d);
    }
    return minDist;
}

void main() {
    vec2 z = uvToUHP(vMapUv);

    // Animate angle and position
    float alpha = 0.3 + 0.5 * sin(uTime * 0.4);       // angle from meridian
    float t0    = 0.8 * sin(uTime * 0.25);              // slide along waist
    float sep   = 0.3 + 0.25 * sin(uTime * 0.33);      // half-separation in s

    float h    = exp(t0);
    float cotA = cos(alpha) / sin(alpha);
    float r    = h / sin(alpha);
    float logLambda = 2.0 * PI * uA;

    // Single geodesic, offset from waist
    float x0 = h * sinh(sep);
    float c  = x0 + h * cotA;

    float d = wrappedDist(z, c, r, logLambda);

    // Anti-aliased stripe
    float lineWidth = 0.06;
    float edge = fwidth(d) * 1.5;
    float stripe = 1.0 - smoothstep(lineWidth - edge, lineWidth + edge, d);

    vec3 baseColor = vec3(0.85, 0.8, 0.75);
    vec3 lineColor = vec3(0.8, 0.15, 0.1);

    vec3 color = mix(baseColor, lineColor, stripe);

    csm_DiffuseColor = vec4(color, 1.0);
}
