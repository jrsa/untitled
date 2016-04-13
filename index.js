var shell = require("gl-now")()
var createFBO = require("gl-fbo") // render to texture
var glShader = require("gl-shader")
var glslify = require("glslify")
var ndarray = require("ndarray")
var fill = require("ndarray-fill")
var fillScreen = require("a-big-triangle")// bb
 
 
var state, updateShader, drawShader, current = 0
 
shell.on("gl-init", function() {
  var gl = shell.gl
 
  gl.disable(gl.DEPTH_TEST)
 
  var passthru_vs = glslify("./passthru.vs.glsl")

  updateShader = glShader(gl, passthru_vs, glslify("./update.fs.glsl"))
  drawShader = glShader(gl, passthru_vs, glslify("./draw.fs.glsl"))
 
  var size = 512;

  state = [ createFBO(gl, [size, size]), createFBO(gl, [size, size]) ]
 
  var initial_conditions = ndarray(new Uint8Array(size*size*4), [size, size, 4])
  fill(initial_conditions, function(x,y,c) {
    if(c === 3) {
      return 255
    }
    return Math.random() > 0.9 ? 255 : 0
  })
  state[0].color[0].setPixels(initial_conditions)
 
  drawShader.attributes.position.location = updateShader.attributes.position.location = 0
})
 
shell.on("tick", function() {
  var gl = shell.gl
  var prevState = state[current]
  var curState = state[current ^= 1]
 
  curState.bind()
 
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

module.exports = { updateShader }