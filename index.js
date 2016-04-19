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
    fuckMe,

    params


params = {
  blurWidth: 1.0,
  blurAmp: 16.0,
  sharpWidth: 1.0,
  sharpAmp: 10.,
  scaleCoef: 0.02,
  audioFuck: [null, null],
  reset: 20
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

  audioFuck = audioCtx.createBuffer(1, 10, audioCtx.sampleRate);
  effect4 = audioCtx["createConvolver"]();
  source.connect(effect4);

  // this is bunk
  // effect = audioCtx["createBiquadFilter"]();
  // effect.type = 'allpass';
  // effect.frequency.value = 1250;
  // effect.Q.value = 9000;

  // effect2 = audioCtx["createBiquadFilter"]();
  // effect2.type = 'allpass';
  // effect2.frequency.value = 2500;
  // effect2.Q.value = 9000;
  // effect.connect(effect2);
  // effect3 = audioCtx["createBiquadFilter"]();
  // effect3.type = 'allpass';
  // effect3.frequency.value = 5000;
  // effect3.Q.value = 9000;
  // effect2.connect(effect3);
  // effect4.type = 'allpass';
  // effect4.frequency.value = 10000;
  // effect4.Q.value = 9000;
  // effect3.connect(effect4);

  effect4.buffer = audioFuck;

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

  global.gl = shell.gl
  global.shell = shell
})

shell.on("gl-render", function(t) {

  var gl = shell.gl

  blurFbo.bind()
  blurProg.bind()
  blurProg.uniforms.buffer = sharpFbo.color[0].bind()
  blurProg.uniforms.dims = sharpFbo.shape
  blurProg.uniforms.width = params.blurWidth
  blurProg.uniforms.amp = params.blurAmp
  blurProg.uniforms.scaleCoef = params.scaleCoef
  fillScreen(gl)
  makeAFuck(audioFuck, fuckMe++);

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
    fuckMe = 0
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
