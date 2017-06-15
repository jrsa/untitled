var shell = require("gl-now")()
var createFBO = require("gl-fbo") // render to texture
var glShader = require("gl-shader")
var glslify = require("glslify")
var ndarray = require("ndarray")
var fill = require("ndarray-fill")
var fillScreen = require("a-big-triangle") // bb
var createTexture = require("gl-texture2d")

var blurFbo, blurProg, 
    sharpFbo, sharpProg,
    keyFbo, keyProg, 
    passThruProg, 

    v_tex, vid, effect4, params

params = {
  blurWidth: 0.6,
  blurAmp: 16.0,
  sharpWidth: 1.0,
  sharpAmp: 9.5,
  scaleCoef: -0.001,
  reset: 20,
}
global.params = params

shell.on("gl-init", function() {
  var gl = shell.gl

  // enable openGL's blending for alpha to work
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);

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
  // global.effect = effect4
  global.gl = shell.gl
  global.shell = shell
})

shell.on("gl-render", function(t) {

  var gl = shell.gl

  blurFbo.bind()
  blurProg.bind()
  blurProg.uniforms.buffer = sharpFbo.color[0].bind()
  blurProg.uniforms.dims = sharpFbo.shape
  blurProg.uniforms.width = params.blurWidth //* (shell.mouseX%4)
  blurProg.uniforms.amp = params.blurAmp
  blurProg.uniforms.scaleCoef = params.scaleCoef
  fillScreen(gl)

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
    // effect.curve = makeDistortionCurve(shell.mouseX * 4);
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

  passThruProg.uniforms.buffer = keyFbo.color[0].bind()
  fillScreen(gl)
})