// A live globe drawn from the same NASA DSCOVR/EPIC photographs as the header
// film (tools/earth-film/globe.py exports the map), with the film's projection.
// The sun sits to the right, so the side by the captions turns through night
// and its city lights (NASA Black Marble 2016) come on. Behind it are the real
// stars that sat behind the Earth from DSCOVR's view that day, around Pisces
// and the Great Square of Pegasus. It turns at the film's pace; grab it to spin
// it, and when let go it coasts back to its own turn.

const MAP = "/images/earth-map.webp";
const LIGHTS = "/images/earth-lights.webp";
const STARS = "/data/stars.json";
const START_LON = 80; // India faces us first, as in the film's first frame
const TILT = 14;
const AUTO = -10; // degrees of longitude per second: a full turn in 36 s
const SETTLE = 1.6; // seconds for a flick to ease back to the auto turn
const BREATHE = 36; // the film's slow zoom cycle, in seconds

const VERT = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D map;
uniform sampler2D night;
uniform float height;  // canvas height in device px
uniform vec3 globe;    // centre x, centre y (from the top), radius; device px
uniform float lon0;    // radians
uniform float lat0;
const float PI = 3.14159265;

void main() {
  vec3 sun = normalize(vec3(0.62, 0.30, 0.72));
  vec2 q = vec2(gl_FragCoord.x - globe.x, globe.y - (height - gl_FragCoord.y)) / globe.z;
  float rho = length(q);

  if (rho < 1.0) {
    // inverse orthographic projection onto the map
    float r = max(rho, 1e-6);
    float c = asin(r);
    float sc = sin(c);
    float cc = cos(c);
    float lat = asin(clamp(cc * sin(lat0) + q.y * sc * cos(lat0) / r, -1.0, 1.0));
    float lon = lon0 + atan(q.x * sc, r * cos(lat0) * cc - q.y * sin(lat0) * sc);
    vec2 uv = vec2((lon + PI) / (2.0 * PI), (0.5 * PI - lat) / PI);
    vec3 tex = texture2D(map, uv).rgb;

    float nz = sqrt(max(1.0 - rho * rho, 0.0));
    float ndl = dot(vec3(q, nz), sun);
    float light = smoothstep(0.0, 1.0, clamp((ndl + 0.12) / 0.55, 0.0, 1.0));
    vec3 col = tex * (0.06 + 0.94 * light) * (0.78 + 0.22 * nz);
    col += vec3(0.55, 0.72, 1.0) * pow(1.0 - nz, 3.0) * 0.55 * light;

    // city lights on the night side
    float city = smoothstep(0.06, 0.7, texture2D(night, uv).r);
    float dark = 1.0 - smoothstep(-0.2, 0.14, ndl);
    col += vec3(1.0, 0.74, 0.42) * city * dark * (0.35 + 0.65 * nz) * 1.7;
    gl_FragColor = vec4(col, 1.0);
  } else if (rho < 1.06) {
    // the thin lit edge of the atmosphere, over the stars
    float side = clamp(dot(q / rho, sun.xy) * 0.8 + 0.45, 0.0, 1.0);
    vec3 rim = vec3(0.45, 0.65, 1.0) * exp(-(rho - 1.0) * 70.0) * side * 0.9;
    gl_FragColor = vec4(rim, max(rim.b, 0.0));
  } else {
    gl_FragColor = vec4(0.0);
  }
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

// Where the globe and the star field (1920x1080, as the film saw it) sit.
// Usually that's where the film puts them, so the live globe lands on the
// poster frame: the globe at (64%, 60%) with radius 60% of the film's height,
// covered into the frame and shifted as the CSS shifts the video. On a phone
// held upright the CSS asks for the whole Earth instead (--globe: whole): it
// sits in the middle of the frame, a little low to clear the logo.
function placement(frame, video) {
  const w = frame.clientWidth;
  const h = frame.clientHeight;
  const s = Math.max(w / 1920, h / 1080);
  if (getComputedStyle(frame).getPropertyValue("--globe").trim() === "whole") {
    return {
      whole: true,
      x: w / 2,
      y: h * 0.53,
      r: Math.min(0.4 * w, 0.39 * h),
      field: { x: (w - 1920 * s) / 2, y: (h - 1080 * s) / 2, s },
    };
  }
  const style = getComputedStyle(video);
  const shift = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform).m41;
  const posX = parseFloat(style.objectPosition) / 100 || 0.5;
  const field = { x: (w - 1920 * s) * posX + shift, y: (h - 1080 * s) * 0.5, s };
  return {
    whole: false,
    x: field.x + 0.64 * 1920 * s,
    y: field.y + 0.6 * 1080 * s,
    r: 0.6 * 1080 * s,
    field,
  };
}

// Mounts the globe over the film's video in `container`. Returns a player
// ({ play, pause }), or null when WebGL isn't up to it and the video should
// play instead.
export function createGlobe(container, video, { onFail, onGrab } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "reel-globe";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl || gl.getParameter(gl.MAX_TEXTURE_SIZE) < 4096) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return null;
  }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(program, name);
  const uHeight = u("height");
  const uGlobe = u("globe");
  const uLon = u("lon0");
  gl.uniform1f(u("lat0"), (TILT * Math.PI) / 180);
  gl.uniform1i(u("map"), 0);
  gl.uniform1i(u("night"), 1);

  const sky = document.createElement("canvas");
  sky.className = "reel-stars";
  sky.setAttribute("aria-hidden", "true");
  container.append(sky, canvas);

  let ready = false;
  let failed = false;
  let running = false;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let lon = START_LON;
  let vel = AUTO;
  let dpr = 1;
  let place = placement(container, video);

  const fail = () => {
    if (failed) return;
    failed = true;
    cancelAnimationFrame(raf);
    canvas.remove();
    sky.remove();
    onFail?.();
  };
  canvas.addEventListener("webglcontextlost", fail);

  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  const texture = (unit, src) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onerror = reject;
      image.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (aniso) {
          gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        }
        resolve();
      };
      image.src = src;
    });

  let stars = [];
  Promise.all([
    texture(0, MAP),
    texture(1, LIGHTS),
    fetch(STARS).then((r) => r.json()).then((list) => (stars = list)).catch(() => {}),
  ]).then(() => {
    ready = true;
    paintStars();
    draw();
    // the globe fades in over the film's first frame, then the film steps aside
    container.classList.add("is-live");
    setTimeout(() => (video.style.visibility = "hidden"), 900);
  }, fail);

  // star colour from its B-V index: blue-white through to orange
  const tint = (bv) => (bv < 0 ? "205,222,255" : bv < 0.5 ? "240,240,255" : bv < 1 ? "255,240,214" : "255,214,170");

  function paintStars() {
    const ctx = sky.getContext("2d");
    const { field } = place;
    ctx.clearRect(0, 0, sky.width, sky.height);
    for (const [sx, sy, mag, bv] of stars) {
      const x = (field.x + sx * 1920 * field.s) * dpr;
      const y = (field.y + sy * 1080 * field.s) * dpr;
      if (x < -4 || y < -4 || x > sky.width + 4 || y > sky.height + 4) continue;
      const alpha = Math.min(1, Math.max(0.38, 10 ** (-0.4 * (mag - 3))));
      ctx.fillStyle = `rgba(${tint(bv)},${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.75, 2.3 - 0.3 * mag) * dpr, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = container.clientWidth;
    const h = container.clientHeight;
    // keep the pixel count sane on very large screens
    dpr = Math.min(dpr, Math.sqrt(5e6 / Math.max(1, w * h)));
    canvas.width = sky.width = Math.round(w * dpr);
    canvas.height = sky.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    place = placement(container, video);
    // the film's poster crops the Earth, so it can't stand in for the whole one
    if (!ready) video.style.visibility = place.whole ? "hidden" : "";
    if (ready) paintStars();
    if (ready && !running) draw();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  const radius = () => place.r * (1 + 0.0417 * (0.5 - 0.5 * Math.cos((2 * Math.PI * clock) / BREATHE)));

  function draw() {
    if (!ready || failed) return;
    gl.uniform1f(uHeight, canvas.height);
    gl.uniform3f(uGlobe, place.x * dpr, place.y * dpr, radius() * dpr);
    gl.uniform1f(uLon, (lon * Math.PI) / 180);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // grab and spin
  let drag = null;
  const onGlobe = (event) => {
    if (place.whole) return true; // the frame holds nothing else, so any touch spins it
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / container.clientWidth || 1; // the intro zoom
    const x = (event.clientX - rect.left) / scale - place.x;
    const y = (event.clientY - rect.top) / scale - place.y;
    return Math.hypot(x, y) < radius() * 1.02;
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (!ready || !onGlobe(event)) return;
    drag = { x: event.clientX, t: performance.now(), vel: 0 };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    onGrab?.();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drag) {
      canvas.style.cursor = ready && onGlobe(event) ? "grab" : "";
      return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - drag.t) / 1000;
    // the surface follows the pointer: a drag of one radius turns it a radian
    const dLon = (-(event.clientX - drag.x) / radius()) * (180 / Math.PI);
    lon += dLon;
    drag.vel = drag.vel * 0.6 + (dLon / dt) * 0.4;
    drag.x = event.clientX;
    drag.t = now;
    if (!running) draw();
  });

  const release = () => {
    if (!drag) return;
    // a flick that ended a moment ago still counts; a held pause does not
    const idle = (performance.now() - drag.t) / 1000;
    vel = Math.max(-900, Math.min(900, drag.vel * Math.exp(-idle / 0.08)));
    drag = null;
    canvas.style.cursor = "grab";
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    raf = requestAnimationFrame(frame);
    if (!ready) return; // hold on the poster frame until the map is in
    clock += dt;
    if (!drag) {
      vel += (AUTO - vel) * (1 - Math.exp(-dt / SETTLE));
      lon += vel * dt;
    }
    draw();
  };

  return {
    play() {
      if (failed || running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    pause() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
