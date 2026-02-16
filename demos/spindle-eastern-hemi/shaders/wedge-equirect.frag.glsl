// Equirectangular texture mapping for K=+1 surfaces of revolution.
// Here we fix the value of a to get exactly the eastern hemisphere.

#define PI 3.141592653589793

uniform sampler2D uDay;
uniform sampler2D uNight;
uniform float a;
uniform vec3 uLightDir;

varying vec3 vWorldNormal;

void main() {
    vec2 uv = vMapUv;

    // Longitude: scale by a (repeats when a > 1)
    uv.x *= 1.0;

    // Latitude: map to the band [sMin/π, 1 - sMin/π]
    float sMin = 0.0;
    uv.y = sMin + uv.y * (1.0 - 2.0 * sMin);

    vec4 dayColor = texture2D(uDay, uv);
    vec4 nightColor = texture2D(uNight, uv);

    float NdotL = dot(normalize(vWorldNormal), normalize(uLightDir));
    float dayFactor = smoothstep(-0.2, 0.2, NdotL);

    csm_DiffuseColor = mix(nightColor, dayColor, dayFactor);
}
