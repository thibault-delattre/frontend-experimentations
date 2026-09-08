/**
 * Fragment shader presets.
 * Every one receives the same uniform block, declared in main.js:
 *   u_resolution, u_time, u_mouse, u_scale, u_speed, u_warp, u_detail
 * and writes to `out vec4 fragColor`.
 */

// Shared helper functions, prepended to every preset so the editable source
// stays readable.
export const PRELUDE = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_scale;
uniform float u_speed;
uniform float u_warp;
uniform float u_detail;

out vec4 fragColor;

// --- hash / value noise -----------------------------------------------------
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);              // smoothstep the interpolant
  float a = hash21(i);
  float b = hash21(i + vec2(1, 0));
  float c = hash21(i + vec2(0, 1));
  float d = hash21(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal brownian motion: octaves at doubling frequency, halving amplitude.
float fbm(vec2 p, int oct) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);      // rotate each octave to hide the grid
  for (int i = 0; i < 8; i++) {
    if (i >= oct) break;
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// Cheap, good-looking palette. Four vec3 coefficients — see iquilezles.org.
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
`;

export const PRESETS = [
  {
    name: 'domain warp',
    source: /* glsl */ `void main() {
  // Aspect-corrected, centred coordinates in roughly -1..1.
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float t = u_time * u_speed * 0.1;

  vec2 p = uv * u_scale * 0.12;

  // THE TECHNIQUE: feed fbm's own output back in as its input coordinate.
  // One level gives flow; two gives the marbled, cloudy structure below.
  vec2 q = vec2(fbm(p + vec2(0.0, t), int(u_detail)),
                fbm(p + vec2(5.2, 1.3), int(u_detail)));

  vec2 r = vec2(fbm(p + u_warp * 0.02 * q + vec2(1.7, 9.2) + 0.15 * t, int(u_detail)),
                fbm(p + u_warp * 0.02 * q + vec2(8.3, 2.8) + 0.12 * t, int(u_detail)));

  float f = fbm(p + u_warp * 0.02 * r, int(u_detail));

  vec3 col = palette(f * 1.6 + length(q) * 0.4,
                     vec3(0.35, 0.30, 0.45),
                     vec3(0.45, 0.35, 0.50),
                     vec3(1.0, 1.0, 1.0),
                     vec3(0.0, 0.20, 0.45));

  // Lift the ridges: the difference between neighbouring octaves reads as light.
  col *= 0.6 + 0.7 * smoothstep(0.2, 0.9, f);
  col += 0.12 * pow(max(0.0, 1.0 - length(uv - u_mouse * 1.2)), 3.0);

  fragColor = vec4(col, 1.0);
}`,
  },

  {
    name: 'sdf shapes',
    source: /* glsl */ `// Signed distance functions: negative inside, zero on the surface.
float sdCircle(vec2 p, float r) { return length(p) - r; }

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Smooth minimum — the reason SDF shapes can melt into each other.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float t = u_time * u_speed * 0.1;

  float d = 1e9;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = 0.65 * vec2(cos(t + fi * 1.6), sin(t * 1.3 + fi * 2.1));
    d = smin(d, sdCircle(uv - c, 0.16 + 0.05 * sin(t + fi)), u_warp * 0.002);
  }
  d = smin(d, sdBox(uv - u_mouse, vec2(0.14)), u_warp * 0.002);

  // Shade BY the distance rather than just thresholding it.
  vec3 col = vec3(0.05, 0.06, 0.09);
  col = mix(vec3(0.35, 0.75, 1.0), col, smoothstep(0.0, 0.02, d));   // fill
  col *= 1.0 - exp(-6.0 * abs(d));                                    // falloff
  col *= 0.85 + 0.15 * cos(u_scale * 3.0 * d - t * 4.0);              // contour rings
  col = mix(vec3(1.0), col, smoothstep(0.0, 0.008, abs(d)));          // crisp outline

  fragColor = vec4(col, 1.0);
}`,
  },

  {
    name: 'raymarch',
    source: /* glsl */ `// A 3D scene with no geometry: march the ray in steps of the distance field.
float map(vec3 p) {
  float t = u_time * u_speed * 0.06;
  // Space repetition: one torus, tiled infinitely by folding the coordinate.
  vec3 q = p;
  q.xz = mod(q.xz + 2.0, 4.0) - 2.0;
  vec2 c = vec2(length(q.xz) - 0.9, q.y);
  float torus = length(c) - 0.32;

  // Displace the surface with noise for a rough, organic finish.
  torus += 0.06 * sin(p.x * u_scale * 0.4 + t * 3.0)
                * sin(p.z * u_scale * 0.4)
                * sin(p.y * u_scale * 0.4);
  float ground = p.y + 1.4;
  return min(torus, ground);
}

vec3 normal(vec3 p) {
  // Central differences on the distance field give the surface normal.
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy),
                        map(p + e.yxy) - map(p - e.yxy),
                        map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float t = u_time * u_speed * 0.06;

  vec3 ro = vec3(sin(t) * 0.6 + u_mouse.x, 0.4 + u_mouse.y * 0.5, t * 2.0);
  vec3 rd = normalize(vec3(uv, 1.4));

  float d = 0.0;
  float hit = -1.0;
  // Sphere tracing: each step is safe to take because map() is a *distance*.
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * d;
    float s = map(p);
    if (s < 0.001) { hit = d; break; }
    if (d > 40.0) break;
    d += s * 0.85;   // slight understep keeps the displaced surface stable
  }

  vec3 col = vec3(0.04, 0.05, 0.09);
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    vec3 n = normal(p);
    vec3 l = normalize(vec3(0.6, 0.8, -0.4));
    float diff = max(dot(n, l), 0.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col = palette(p.z * 0.06, vec3(0.5), vec3(0.5), vec3(1.0),
                  vec3(0.0, 0.33, 0.67)) * (0.15 + diff);
    col += fres * vec3(0.4, 0.7, 1.0);
    col = mix(col, vec3(0.04, 0.05, 0.09), 1.0 - exp(-0.02 * hit * hit)); // fog
  }

  fragColor = vec4(pow(col, vec3(0.4545)), 1.0);   // gamma
}`,
  },

  {
    name: 'plasma flow',
    source: /* glsl */ `void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float t = u_time * u_speed * 0.15;

  // Iterated coordinate distortion — cheap, and it never repeats visibly.
  for (int i = 1; i < 6; i++) {
    float fi = float(i);
    p.x += (u_warp * 0.004) * sin(fi * p.y * u_scale * 0.15 + t + fi);
    p.y += (u_warp * 0.004) * cos(fi * p.x * u_scale * 0.15 + t * 1.2);
  }

  float v = fbm(p * u_scale * 0.15 + t * 0.2, int(u_detail));
  float bands = sin((p.x + p.y) * u_scale * 0.4 + v * 8.0);

  vec3 col = palette(v + bands * 0.08 + t * 0.05,
                     vec3(0.5, 0.45, 0.55),
                     vec3(0.5, 0.45, 0.45),
                     vec3(1.0, 0.9, 0.8),
                     vec3(0.30, 0.55, 0.75));

  // Vignette — nearly free, and it stops the edges looking like a screensaver.
  col *= 1.0 - 0.6 * pow(length(uv - 0.5) * 1.4, 2.5);
  fragColor = vec4(col, 1.0);
}`,
  },

  {
    name: 'voronoi cells',
    source: /* glsl */ `vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
  float t = u_time * u_speed * 0.1;

  vec2 p = uv * u_scale * 0.25;
  p += u_warp * 0.01 * vec2(fbm(p + t * 0.2, int(u_detail)), fbm(p + 4.0, int(u_detail)));

  vec2 g = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;   // nearest and second-nearest feature point
  vec2 id;

  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 pt = hash22(g + o);
    pt = 0.5 + 0.5 * sin(t + 6.2831 * pt);   // animate the sites
    float d = length(o + pt - f);
    if (d < d1) { d2 = d1; d1 = d; id = g + o; }
    else if (d < d2) { d2 = d; }
  }

  // d2 - d1 is near zero exactly on a cell border: that difference IS the edge.
  float edge = smoothstep(0.0, 0.08, d2 - d1);
  vec3 cell = palette(hash21(id) * 2.0 + t * 0.05,
                      vec3(0.45), vec3(0.45), vec3(1.0), vec3(0.0, 0.25, 0.5));

  vec3 col = cell * (0.35 + 0.65 * edge);
  col += (1.0 - edge) * vec3(0.8, 0.9, 1.0) * 0.5;   // glowing seams
  col *= 1.0 - 0.35 * d1;

  fragColor = vec4(col, 1.0);
}`,
  },
];
