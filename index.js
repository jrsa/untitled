var shell = require("gl-now")()
var createFBO = require("gl-fbo") // render to texture
var glShader = require("gl-shader")
var glslify = require("glslify")
var ndarray = require("ndarray")
var fill = require("ndarray-fill")
var fillScreen = require("a-big-triangle")// bb
var createTexture = require("gl-texture2d") 
 
var state, updateShader, drawShader, current = 0, v_tex, vid
  
shell.on("gl-init", function() {
  var gl = shell.gl
 
  gl.disable(gl.DEPTH_TEST)
 
  var passthru_vs = glslify("./passthru.vs.glsl")

  updateShader = glShader(gl, passthru_vs, glslify("./2.fs.glsl"))
  drawShader = glShader(gl, passthru_vs, glslify("./draw.fs.glsl"))
 

  state = [ createFBO(gl, [864, 482]), createFBO(gl, [864, 482]) ]
 
  v_tex = createTexture(gl, [864, 482])

  vid = document.getElementById("poopy")
  vid.play()

  drawShader.attributes.position.location = updateShader.attributes.position.location = 0
})
 
shell.on("tick", function() {
  var gl = shell.gl
  var prevState = state[current]
  var curState = state[current ^= 1]
 
  curState.bind()

  _gl = v_tex.gl
  _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, gl.UNSIGNED_BYTE, vid)
  state[0].color[0] = v_tex
 
  updateShader.bind()
  updateShader.uniforms.buffer = prevState.color[0].bind()
  updateShader.uniforms.dims = prevState.shape
  updateShader.uniforms.width = 2.0
  updateShader.uniforms.zoom = [0.99, 0.99]
  fillScreen(gl)
})
 
shell.on("gl-render", function(t) {
  var gl = shell.gl
 
  drawShader.bind()
  drawShader.uniforms.buffer = state[current].color[0].bind()
  fillScreen(gl)
})
