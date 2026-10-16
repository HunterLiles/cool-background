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

uniform vec3 u_bg;
uniform vec3 u_accent;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

out vec4 fragColor;

vec3 wave(vec2 p, vec2 mouse) {
  vec2 original = p;

  // Domain warping for weirdness
  p.x += 0.05 * sin(p.y * 8.0 + u_time * 0.35);
  p.y += 0.06 * cos(p.x * 7.0 - u_time * 0.28);

  float A = p.x * 12.0 - u_time;
  float B = p.y * 11.0 - u_time;
  float C = p.x * 19.0 + p.y * 7.0 + u_time * 0.4;

  // Main wave
  float height = 0.2 * (sin(A) + cos(B)) + 0.05 * sin(C);

  return vec3(original, height);
}

vec3 tangentNormal(vec3 p, vec2 mouse) {
  // Defining its partials along x and y
  float e = 0.005;

  vec3 px = wave(p.xy + vec2(e, 0.0), mouse) - p;
  vec3 py = wave(p.xy + vec2(0.0, e), mouse) - p;

  return normalize(cross(px, py));
}

vec3 color(vec3 obj, vec3 normal) {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diffuse = max(dot(normal, lightDir), 0.0);

  float light = 0.3 + 0.7 * diffuse;

  float h = smoothstep(-0.45, 0.45, obj.z);
  float strength = clamp(0.05 + 0.55 * h + 0.5 * diffuse, 0.0, 1.0);

  return mix(u_bg, u_accent, strength);
}

void main() {
  // Needs to be the same coordinate space
  vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
  vec2 mouse = (u_mouse - u_resolution * 0.5) / u_resolution.y;

  vec3 obj = wave(p, mouse);
  vec3 normal = tangentNormal(obj, mouse);

  vec3 color = color(obj, normal);
  fragColor = vec4(color, 1.0);
}
