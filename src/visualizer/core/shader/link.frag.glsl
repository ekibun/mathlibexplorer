precision highp float;

in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor*vAlpha*0.6, 1.0);
}