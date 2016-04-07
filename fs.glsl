precision mediump float;

varying vec3 anormal;

void main() {
  gl_FragColor = vec4( mix( anormal, vec3(1), .5 ), 1 );
}
