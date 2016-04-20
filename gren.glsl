precision mediump float;
uniform sampler2D buffer;

varying vec2 uv;

void main() {
    float alpha = 0.0;
    vec4 inPixel = texture2D(buffer, uv);
    float diff = length(vec3(0., 1., 0.) - inPixel.rgb);

    if (diff > 0.7){
        alpha = inPixel.a; 
    }   

    gl_FragColor = vec4(inPixel.rgb, alpha);
}