precision highp float;

in vec4 vColor;
in float vAlpha;
out vec4 fragColor;
uniform bool picking;

void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    if(picking) {
        fragColor = vec4(vColor.a, 0.0, 0.0, 1.0);
    } else {
        float alpha = clamp(1.5 - 1.5 / 0.5 * dist, 0.0, 0.55);
        if (alpha > 0.5) alpha = clamp((alpha - 0.5) * 10.0 + 0.5, 0.0, 1.0);
        fragColor = vec4(vColor.rgb*vAlpha*alpha, 1.0);
    }
}