precision highp float;

in vec3 position;
in vec3 color;
in vec2 uv;
in float alpha;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float scale;

out vec3 vColor;
out vec2 vUv;
out float vAlpha;

void main() {
    vColor = color;
    vUv = uv;
    vAlpha = alpha;

    vec4 mvPosition = modelViewMatrix * vec4(position.xy + (vec2(uv.x, (uv.y - 0.5) * position.z + 0.5)*4.0-2.0)/scale, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}