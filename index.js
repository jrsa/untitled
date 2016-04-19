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
   vid

shell.on("gl-init", function() {

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var myAudio = document.querySelector('audio');
  var source = audioCtx.createMediaElementSource(myAudio);

  // Create a gain node
  var gainNode = audioCtx.createGain();
  var distortion = audioCtx.createWaveShaper();
  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  var gl = shell.gl

  gl.disable(gl.DEPTH_TEST)

  var passthru_vs = glslify("./passthru.vs.glsl")
  passThruProg = glShader(gl, passthru_vs, glslify("./draw.fs.glsl"))
  sharpProg = glShader(gl, passthru_vs, glslify("./sharp.glsl"))
  blurProg = glShader(gl, passthru_vs, glslify("./blur.glsl"))

  var size = [shell.width, shell.height];

  blurFbo = createFBO(gl, size)
  sharpFbo = createFBO(gl, size)

  var initial_conditions = ndarray(new Uint8Array(shell.width * shell.height * 4), [shell.width, shell.height, 4])
  fill(initial_conditions, function(x, y, c) {
    if (c === 3) {
      return 255
    }
    return Math.random() > 0.9 ? 255 : 0
  })
  sharpFbo.color[0].setPixels(initial_conditions)

  vid = document.getElementById("poopy")
  v_tex = createTexture(gl, [vid.videoWidth, vid.videoHeight])
  vid.loop = true
  //vid.play()
  global.vid = vid

  global.gl = shell.gl
})

shell.on("gl-render", function(t) {

  var gl = shell.gl

  blurFbo.bind()
  blurProg.bind()
  blurProg.uniforms.buffer = sharpFbo.color[0].bind()
  blurProg.uniforms.dims = sharpFbo.shape
  blurProg.uniforms.width = 1.0
  blurProg.uniforms.amp = 16.0
  blurProg.uniforms.scaleCoef = 0.02
  fillScreen(gl)

  if (vid.readyState === vid.HAVE_ENOUGH_DATA || 1) {
    v_tex.bind()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, vid);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  }

  sharpFbo.bind()
  sharpProg.bind()

  if (shell.frameCount % 25 === 0) {
    sharpProg.uniforms.buffer = v_tex

  } else {
    sharpProg.uniforms.buffer = blurFbo.color[0].bind()
  }

  sharpProg.uniforms.dims = blurFbo.shape
  sharpProg.uniforms.width = 1.0
  sharpProg.uniforms.amp = 10.0
  fillScreen(gl)

  // draw to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  passThruProg.bind()
  passThruProg.uniforms.buffer = blurFbo.color[0].bind()
  fillScreen(gl)
})