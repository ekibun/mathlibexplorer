precision highp float;

in vec3 position;
in vec4 color;
in float alpha;

uniform float scale;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out float vIndex;

void main() {
    vIndex = color.a;

    vec4 mvPosition = modelViewMatrix * vec4(position.xy, position.z * alpha * alpha, 1.0);

    gl_PointSize = position.z * min(scale, 20.0) * 3.0;

    gl_Position = projectionMatrix * mvPosition;
}