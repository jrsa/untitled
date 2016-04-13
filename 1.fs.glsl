precision mediump float;

uniform sampler2D buffer;
uniform vec2 dims;
uniform float width;

varying vec2 uv;

void main() {

    mat2 sca = mat2(1.01, 0., 0., 0.99);
    vec2 offs = vec2(1./dims.x, 1./dims.y);// * sca;


    vec2 tc4 = uv.st;
    vec2 tc1 = uv.st + vec2(0.0, -offs.t * width);
    vec2 tc3 = uv.st + vec2(-offs.s * width, 0.0);
    vec2 tc5 = uv.st + vec2(offs.s * width, 0.0);
    vec2 tc7 = uv.st + vec2(0.0, offs.t * width);

    vec2 tc0 = uv.st + vec2(-offs.s * width, -offs.t * width);
    vec2 tc2 = uv.st + vec2(offs.s * width, -offs.t * width);
    vec2 tc6 = uv.st + vec2(-offs.s * width, offs.t * width);
    vec2 tc8 = uv.st + vec2(offs.s * width, offs.t * width);

    vec4 col0 = texture2D(buffer, tc0);
    vec4 col1 = texture2D(buffer, tc1);
    vec4 col2 = texture2D(buffer, tc2);
    vec4 col3 = texture2D(buffer, tc3);
    vec4 col4 = texture2D(buffer, tc4);
    vec4 col5 = texture2D(buffer, tc5);
    vec4 col6 = texture2D(buffer, tc6);
    vec4 col7 = texture2D(buffer, tc7);
    vec4 col8 = texture2D(buffer, tc8);

    //gl_FragColor = (2.0 * col0 + 1.0 * col1 + 2.0 * col2 +  
    //            1.0 * col3 + 4.0 * col4 + 1.0 * col5 +
    //            2.0 * col6 + 1.0 * col7 + 2.0 * col8) / 16.0; 

    gl_FragColor = 8.0 * col4 - (col0 + col1 + col2 + col3 + col5 + col6 + col7 + col8);
}