var shell = require("gl-now")()
var createFBO = require("gl-fbo") // render to texture
var glShader = require("gl-shader")
var glslify = require("glslify")
var ndarray = require("ndarray")
var fill = require("ndarray-fill")
var fillScreen = require("a-big-triangle") // bb
var createTexture = require("gl-texture2d")

var blurFbo,
    blurProg,

    sharpFbo,
    sharpProg,

    keyFbo,
    keyProg,

    passThruProg,
    v_tex,
    vid,

    effect4,
    fuckMe =4,

    params

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

params = {
  blurWidth: 1.0,
  blurAmp: 16.0,
  sharpWidth: 1.0,
  sharpAmp: 9.5,
  scaleCoef: -0.001,
  audioFuck: [null, null],
  reset: 20,
}
global.params = params

var makeAFuck = function(x, n) {
  var chan = x.getChannelData(0);
  for (var i = n - 1; i >= 0; i--) {
    chan[i] = Math
  }
}

shell.on("gl-init", function() {

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var myAudio = document.querySelector('audio');
  var source = audioCtx.createMediaElementSource(myAudio);

  effect4 = audioCtx.createWaveShaper();
  source.connect(effect4);



  effect4.curve = makeDistortionCurve(4240000);
  effect4.oversample = '4x';
  effect4.connect(audioCtx.destination);

  var gl = shell.gl

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);

  shell.clearFlags = 0

  gl.disable(gl.DEPTH_TEST)

  var passthru_vs = glslify("./passthru.vs.glsl")
  passThruProg = glShader(gl, passthru_vs, glslify("./draw.fs.glsl"))
  sharpProg = glShader(gl, passthru_vs, glslify("./sharp.glsl"))
  blurProg = glShader(gl, passthru_vs, glslify("./blur.glsl"))
  keyProg = glShader(gl, passthru_vs, glslify("./gren.glsl"))

  var size = [shell.width, shell.height];

  blurFbo = createFBO(gl, size)
  sharpFbo = createFBO(gl, size)
  keyFbo = createFBO(gl, size)

  var initial_conditions = ndarray(new Uint8Array(shell.width * shell.height * 4), [shell.width, shell.height, 4])

  sharpFbo.color[0].setPixels(initial_conditions)

  vid = document.getElementById("poopy")
  v_tex = createTexture(gl, [vid.videoWidth, vid.videoHeight])
  vid.loop = true
  //vid.play()
  global.vid = vid
  global.effect = effect4
  global.gl = shell.gl
  global.shell = shell
})

shell.on("gl-render", function(t) {

  var gl = shell.gl

  blurFbo.bind()
  blurProg.bind()
  blurProg.uniforms.buffer = sharpFbo.color[0].bind()
  blurProg.uniforms.dims = sharpFbo.shape
  blurProg.uniforms.width = params.blurWidth*(shell.mouseX%4)
  blurProg.uniforms.amp = params.blurAmp
  blurProg.uniforms.scaleCoef = params.scaleCoef
  fillScreen(gl)
  //makeAFuck(audioFuck, fuckMe++);

  if (vid.readyState === vid.HAVE_ENOUGH_DATA || 1) {
    v_tex.bind()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    keyFbo.bind()
    gl.clear(gl.COLOR_BUFFER_BIT)
    keyProg.bind()
    keyProg.uniforms.buffer = v_tex
    fillScreen(gl)
    effect.curve = makeDistortionCurve(shell.mouseX*4);

  }

  sharpFbo.bind()
  sharpProg.bind()

  if (shell.frameCount % params.reset === 0) {
    sharpProg.uniforms.buffer = keyFbo.color[0].bind()

  } else {
    sharpProg.uniforms.buffer = blurFbo.color[0].bind()
  }

  sharpProg.uniforms.dims = blurFbo.shape
  sharpProg.uniforms.width = params.sharpWidth
  sharpProg.uniforms.amp = params.sharpAmp
  fillScreen(gl)

  // draw to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  passThruProg.bind()
  passThruProg.uniforms.buffer = blurFbo.color[0].bind()
  fillScreen(gl)
  passThruProg.bind()

  passThruProg.uniforms.buffer = keyFbo.color[0].bind()
  fillScreen(gl)
})
