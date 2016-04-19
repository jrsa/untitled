precision mediump float;

uniform sampler2D buffer, vid;
uniform vec2 dims;
uniform float width;
uniform float amp;
uniform float scaleCoef;

varying vec2 uv;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

void main() {

    float s = rgb2hsv(texture2D(buffer, uv.st).rgb).s;

    mat2 sca = mat2(1. + (scaleCoef * s), 0., 0., 1. + (scaleCoef * s));
    vec2 offs = vec2(1. / dims.x, 1. / dims.y);

    vec2 src = uv.st * sca;

    vec2 tc4 = src;
    vec2 tc1 = src + vec2(0.0, -offs.t * width);
    vec2 tc3 = src + vec2(-offs.s * width, 0.0);
    vec2 tc5 = src + vec2(offs.s * width, 0.0);
    vec2 tc7 = src + vec2(0.0, offs.t * width);

    vec2 tc0 = src + vec2(-offs.s * width, -offs.t * width);
    vec2 tc2 = src + vec2(offs.s * width, -offs.t * width);
    vec2 tc6 = src + vec2(-offs.s * width, offs.t * width);
    vec2 tc8 = src + vec2(offs.s * width, offs.t * width);

    vec4 col0 = texture2D(buffer, tc0);
    vec4 col1 = texture2D(buffer, tc1);
    vec4 col2 = texture2D(buffer, tc2);
    vec4 col3 = texture2D(buffer, tc3);
    vec4 col4 = texture2D(buffer, tc4);
    vec4 col5 = texture2D(buffer, tc5);
    vec4 col6 = texture2D(buffer, tc6);
    vec4 col7 = texture2D(buffer, tc7);
    vec4 col8 = texture2D(buffer, tc8);

    gl_FragColor = (2.0 * col0 + 1.0 * col1 + 2.0 * col2 + 1.0 * col3 + 4.0 * col4 + 1.0 * col5 + 2.0 * col6 + 1.0 * col7 + 2.0 * col8) / amp;

}