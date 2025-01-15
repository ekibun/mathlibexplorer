precision highp float;

in vec3 position;
in vec3 color;
in float alpha;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float scale;

out vec3 vColor;
out float vAlpha;

void main() {
    vColor = color;
    vAlpha = alpha;

    vec4 mvPosition = modelViewMatrix * vec4(position.xy, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}