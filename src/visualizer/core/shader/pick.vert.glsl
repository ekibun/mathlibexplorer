precision highp float;

in vec3 position;
in vec4 color;
in float alpha;

uniform float scale;
uniform float pixelRatio;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec4 vColor;
out float vAlpha;

void main() {
    vColor = color;
    vAlpha = alpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_PointSize = position.z * min(scale, 20.0) * pixelRatio * 3.0;

    gl_Position = projectionMatrix * mvPosition;
}