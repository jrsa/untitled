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

  blur = glShader(gl, passthru_vs, glslify("./blur.glsl"))
  sharp = glShader(gl, passthru_vs, glslify("./sharp.glsl"))
  drawShader = glShader(gl, passthru_vs, glslify("./draw.fs.glsl"))


  shaders = [{
    prog: sharp,
    params: [15.0]
  }, {
    prog: blur,
    params: [15.0]
  }]
  var size = [shell.width, shell.height];

  state = [ createFBO(gl, size), createFBO(gl, size) ]

  var initial_conditions = ndarray(new Uint8Array(shell.width*shell.height*4), [shell.width, shell.height, 4])
  fill(initial_conditions, function(x,y,c) {
    if(c === 3) {
      return 255
    }
    return Math.random() > 0.9 ? 255 : 0
  })
  state[0].color[0].setPixels(initial_conditions)
 
  vid = document.getElementById("poopy")
  v_tex = createTexture(gl, [vid.videoWidth, vid.videoHeight])
  vid.loop = true
  //vid.play()
  global.vid = vid

  drawShader.attributes.position.location = updateShader.attributes.position.location = 0
})
 

shell.on("tick", function() {
  var gl = shell.gl
  var prevState = state[current]
  var curState = state[current ^= 1]

  //Switch to state fbo
  curState.bind()

  //Run update shader
  shaders[1].prog.bind()
  shaders[1].prog.uniforms.buffer = prevState.color[0].bind()
  shaders[1].prog.uniforms.dims = prevState.shape
  shaders[1].prog.uniforms.width = 1.0
  shaders[1].prog.uniforms.amp = shaders[1].params[0]
  fillScreen(gl)
})

shell.on("gl-render", function(t) {
  var gl = shell.gl
 
  drawShader.bind()
  drawShader.uniforms.buffer = state[current].color[0].bind()
  fillScreen(gl)
})
