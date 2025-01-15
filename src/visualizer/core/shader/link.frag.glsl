precision highp float;

in vec3 vColor;
out vec4 fragColor;

uniform bool picking;
uniform float alpha;

void main() {
    if(picking) discard;
    fragColor = vec4(vColor*alpha*0.5, 1.0); // 设置片段颜色
}