// @vertex
#version 300 es

void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);

  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}

// @fragment
#version 300 es
precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 u_bg;
uniform vec3 u_accent;

out vec4 fragColor;

const uint glyphs[6] = uint[6](0u,        // space
                               0x80u,     // .
                               0x20080u,  // :
                               0x23880u,  // +
                               0xAFABEAu, // #
                               0xE8F4AEu  // @
);

float wave(vec2 p, vec2 mouse) {
  float dist = length(p - mouse);

  vec2 warped = p;

  // Domain warping for weirdness
  warped.x += 0.05 * sin(p.y * 8.0 + u_time * 0.35);
  warped.y += 0.06 * cos(p.x * 7.0 - u_time * 0.28);

  // Main wave
  float height =
      0.2 * (sin(warped.x * 12.0 - u_time) + cos(warped.y * 11.0 - u_time));

  // diagonaly
  height += 0.05 * sin(warped.x * 19.0 + warped.y * 7.0 + u_time * 0.4);

  // Defining how much the mouse effects the background
  float falloff = 1.0 - smoothstep(0.0, 0.10, dist);
  height -= 0.4 * falloff;

  return height;
}

float ascii(vec2 local, int index) {
  vec2 uv = (local - 0.2) / 0.7;

  if (uv.x < 0.0 || uv.x >= 1.0 || uv.y < 0.0 || uv.y >= 1.0)
    return 0.0;

  ivec2 pixel = ivec2(floor(uv * 5.0));
  uint bit = uint(pixel.y * 5 + pixel.x);

  return float((glyphs[index] >> bit) & 1u);
}

void main() {
  vec2 cellSize = vec2(8.0, 12.0);
  vec2 cell = floor(gl_FragCoord.xy / cellSize);

  vec2 p = ((cell + 0.5) * cellSize - u_resolution * 0.5) / u_resolution.y;

  // Get mouse in the same view as the screen
  vec2 mouse = (u_mouse - u_resolution * 0.5) / u_resolution.y;

  float height = wave(p, mouse);
  float norm_height = clamp((height - 0.15) / 0.25, 0.0, 1.0);

  int index = height <= 0.15 ? 0 : min(int(norm_height * 5.0) + 1, 5);

  vec2 local = fract(gl_FragCoord.xy / cellSize);

  float ink = ascii(local, index);

  vec3 baseColor = u_bg * 3.0;
  fragColor = vec4(baseColor * ink, 1.0);
}
