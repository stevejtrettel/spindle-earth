// Equirectangular texture mapping for K=+1 surfaces of revolution.
// a ≤ 1 (spindle): longitude wedge of width a, full latitude
// a > 1 (barrel):  longitude wraps a times, latitude band around equator

#define PI 3.141592653589793

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform float a;
uniform vec3 uLightDir;

varying vec3 vWorldNormal;

void main() {
    vec2 uv = vMapUv;

    // Longitude: scale by a (repeats when a > 1)
    uv.x *= a;

    // Latitude: map to the band [sMin/π, 1 - sMin/π]
    float sMin = (a <= 1.0) ? 0.0 : acos(1.0 / a) / PI;
    uv.y = sMin + uv.y * (1.0 - 2.0 * sMin);

    vec4 dayColor = texture2D(uDay, uv);
    vec4 nightColor = texture2D(uNight, uv);

    // Smooth the seam where the surface closes (vMapUv.x = 0 ≡ 1)
    // Sample the texture as if continuing past the seam (not mirrored)
    float seamDist = min(vMapUv.x, 1.0 - vMapUv.x);
    float seamMix = 0.5 * (1.0 - smoothstep(0.0, 0.05, seamDist));
    float wrapDir = 1.0 - 2.0 * step(0.5, vMapUv.x); // +1 near x=0, -1 near x=1
    vec2 uvOther = vec2((vMapUv.x + wrapDir) * a, uv.y);
    dayColor = mix(dayColor, texture2D(uDay, uvOther), seamMix);
    nightColor = mix(nightColor, texture2D(uNight, uvOther), seamMix);

    float NdotL = dot(normalize(vWorldNormal), normalize(uLightDir));
    float dayFactor = smoothstep(-0.2, 0.2, NdotL);

    csm_DiffuseColor = mix(nightColor, dayColor, dayFactor);
}
