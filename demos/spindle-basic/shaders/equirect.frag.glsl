// Equirectangular texture mapping for a K=+1 surface of revolution.
// Scales longitude by a to show the correct wedge of the earth.

uniform sampler2D uEarth;
uniform float a;

void main() {
    vec2 uv = vMapUv;
    uv.x *= a;
    csm_DiffuseColor = texture2D(uEarth, uv);
}
