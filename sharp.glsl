precision mediump float;

uniform sampler2D shampler;
uniform vec2 dims;
uniform float width, amp;

uniform vec2 mouse;

varying vec2 uv;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 color) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(color.xxx + K.xyz) * 6.0 - K.www);
    vec3 rgb = vec3(color.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), color.y));

    return rgb;
}

void main() {
    vec2 tc = uv;

    vec4 pos = vec4(uv.s, uv.t, 0.0, 1.0);
    vec3 pixel = texture2D(shampler, tc).rgb;

    vec3 pixel_hsv = rgb2hsv(pixel);

    mat2 sca = mat2(1.+pixel_hsv.r, 0., 0., 1. + pixel_hsv.r);

    float angle = 0.05 * pixel_hsv.r;
    mat2 rot = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
    vec2 offs = vec2(1. / dims.x, 1. / dims.y);

//    float width = 1. + width;

    offs *= mat2(cos(angle), sin(width), -sin(width), cos(angle));

    tc *= sca;
//    tc *= rot;
    vec2 src = tc;
    // mat2 sca2 = mat2(1.1, 0., 0., 1.1);
    // src *= sca2;


    vec2 tc4 = src;
    vec2 tc1 = src + vec2(0.0, -offs.t * width);
    vec2 tc3 = src + vec2(-offs.s * width, 0.0);
    vec2 tc5 = src + vec2(offs.s * width, 0.0);
    vec2 tc7 = src + vec2(0.0, offs.t * width);

    // vec2 tc0 = src + vec2(-offs.s * width, -offs.t * width);
    // vec2 tc2 = src + vec2(offs.s * width, -offs.t * width);
    // vec2 tc6 = src + vec2(-offs.s * width, offs.t * width);
    // vec2 tc8 = src + vec2(offs.s * width, offs.t * width);

    // vec4 col0 = texture2D(shampler, tc0);
    vec4 col1 = texture2D(shampler, tc1);
    // vec4 col2 = texture2D(shampler, tc2);
    vec4 col3 = texture2D(shampler, tc3);
    // vec4 col4 = texture2D(shampler, tc4);
    vec4 col5 = texture2D(shampler, tc5);
    // vec4 col6 = texture2D(shampler, tc6);
    vec4 col7 = texture2D(shampler, tc7);
    // vec4 col8 = texture2D(shampler, tc8);

    // pass transformed pixel out with no convolution
//    color = vec4(pixel, 1.0);
    pixel_hsv.r+=0.0169;

    vec2 pos_factor = (pos.yx * mouse);
    // pos_factor *= mat2(2.0, 0.0, 0.0, 2.0);
    pos_factor *= rot;

    // pos_factor.x -= 1.4;
    float d = dot(vec4(pos_factor, pos.zw), vec4(pixel_hsv, 0.23));
    d *= dot(vec4(pos_factor, pos.zw), vec4(pixel_hsv*3.50, 1.0));

    // float d = pos.y + 1.39;
    d*= 1.9;
    pixel_hsv.r += (d * 0.04);
//    pixel_hsv.r -= (d * 0.4);
//    color = vec4(hsv2rgb(pixel_hsv), 1.0);
//    color = col2 + col4 + col6 + col8 + col0 * 0.1;
//    color = vec4(hsv2rgb(pixel_hsv), 1.0) * (6.3*d) - (col1 + col3 + col5 + col7);

    // float amp = 19.0;
    float amp = 18.0;
    gl_FragColor = vec4(hsv2rgb(pixel_hsv), 1.0) * (d*2.5) - ((col1 + col3 + col5 + col7) / amp);
    //color += 0.2*(-pixel_hsv.g);
}
