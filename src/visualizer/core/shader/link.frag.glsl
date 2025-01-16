precision highp float;

in vec3 vColor;
out vec4 fragColor;
uniform float alpha;

void main() {
    fragColor = vec4(vColor*alpha*0.6, 1.0); // 设置片段颜色
}