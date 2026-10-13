async function main() {
  const canvas = document.querySelector("#background");
  const gl = canvas.getContext("webgl2", { alpha: false });

  // splitting up the glsl file into fragment and vertex
  const source = await fetch("background-shader.glsl").then((r) => r.text());

  const [vertex, fragment] = source.split("// @fragment");

  const vertexSource = vertex.replace("// @vertex", "").trim();
  const fragmentSource = fragment.trim();

  // compiling shader
  function compShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  // creating program and linking compiled shaders
  const program = gl.createProgram();

  const vertexShader = compShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.bindVertexArray(gl.createVertexArray());

  const timeLoc = gl.getUniformLocation(program, "u_time");
  const resLoc = gl.getUniformLocation(program, "u_resolution");
  const mouseLoc = gl.getUniformLocation(program, "u_mouse");

  let mouseX = -10000;
  let mouseY = -10000;

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = canvas.height - event.clientY;
  });

  function render(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;

      gl.viewport(0, 0, width, height);
    }

    gl.uniform1f(timeLoc, time * 0.001);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform2f(mouseLoc, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main(); // actually run the main function
