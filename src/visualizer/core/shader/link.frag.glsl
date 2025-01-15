precision highp float;

#define PI 3.1415926538

in vec2 vUv;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

uniform bool picking;

void main() {
    if(picking) discard;
    vec2 df = vec2(dFdx(vUv.x), abs(dFdy(vUv.y)));
    float k = PI/2.0*sin(vUv.x*PI)*df.x/df.y;
    float fy = 0.5-cos(vUv.x*PI)/2.0;
    float dy = abs((vUv.y-(fy * (1.0-4.0*df.y) + 2.0*df.y))/df.y);
    float dl = dy/sqrt(1.0+k*k);
    float alpha = clamp(2.0 - dl*3.0, 0.0, 1.0);
    if (dl > 1.0) discard;
    fragColor = vec4(vColor*vAlpha*alpha*0.5, 1.0); // 设置片段颜色
}