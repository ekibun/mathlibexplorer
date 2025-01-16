precision highp float;

in vec4 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    fragColor = vec4(vColor.a, 0.0, 0.0, 1.0);
}