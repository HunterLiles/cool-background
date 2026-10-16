function hexToVec3(hex) {
  hex = hex.replace("#", "");

  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
}

async function main() {
  const canvas = document.querySelector("#background");
  const gl = canvas.getContext("webgl2", { alpha: true });

  // splitting up the glsl file into fragment and vertex
  const response = await fetch(canvas.dataset.shader);
  if (!response.ok) throw new Error("Shader HTTP ${response.status}");
  const source = await response.text();

  const [vertex, fragment] = source.split("// @fragment");

  const vertexSource = vertex.replace("// @vertex", "").trim();
  const fragmentSource = fragment.trim();

  // compiling shader
  function compShader(type, source) {
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

  const vertexShader = compShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compShader(gl.FRAGMENT_SHADER, fragmentSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  const timeLoc = gl.getUniformLocation(program, "u_time");
  const resLoc = gl.getUniformLocation(program, "u_resolution");
  const mouseLoc = gl.getUniformLocation(program, "u_mouse");
  const lowLoc = gl.getUniformLocation(program, "u_bg");
  const highLoc = gl.getUniformLocation(program, "u_accent");

  function updateShaderColors() {
    const style = getComputedStyle(document.documentElement);

    const low = style.getPropertyValue("--bg-color").trim();
    const high = style.getPropertyValue("--accent").trim();

    gl.uniform3fv(lowLoc, hexToVec3(low));
    gl.uniform3fv(highLoc, hexToVec3(high));
  }
  updateShaderColors();

  let mouseX = -10000;
  let mouseY = -10000;

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = canvas.height - event.clientY;
  });
  document.addEventListener("pointerleave", () => {
    mouseX = -10000;
    mouseY = -10000;
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

main().catch((error) => {
  console.error(error);
  document.querySelector("#background").hidden = true;
  document.querySelector("#shader-error").hidden = false;
});
