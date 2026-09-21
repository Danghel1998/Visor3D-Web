/* Visor 3D — Residencia estudiantil I.E. 16722 (PRONIED, Nuevo Belén · Imaza · Bagua)
 * Modelo paramétrico construido a partir de los planos del expediente (feb-2026):
 *   IMP-01 implantación · I-02…I-08 residencia mujeres · I-09…I-12 residencia varones ·
 *   I-13…I-15 cocina-comedor · E-01, E-03 cimentación/estructura · D-06 cuarto de máquinas.
 * Unidades: metros. Eje Y = altura (NTN 0.00). Plano del sitio: X = "u", Z = "v" (ejes del
 * conjunto, girado ~20.5° respecto al norte del plano de implantación).
 */
(function () {
'use strict';
var T = THREE;
var PI = Math.PI;

/* ====================================================================================
 * 1. Texturas procedurales (sin archivos externos)
 * ==================================================================================== */
function rng(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function ctex(w, h, draw) {
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  var t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.encoding = T.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}
function noise(g, w, h, r, n, alpha, dark) {
  for (var i = 0; i < n; i++) {
    var v = dark ? Math.floor(r() * 80) : 200 + Math.floor(r() * 55);
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (alpha * r()) + ')';
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
}

var woodTex = ctex(512, 512, function (g, w, h) {           // tablas machihembradas, 1 m
  var r = rng(7), n = 8, pw = w / n;
  for (var i = 0; i < n; i++) {
    g.fillStyle = 'hsl(28,' + (36 + r() * 10) + '%,' + (50 + r() * 12) + '%)';
    g.fillRect(i * pw, 0, pw, h);
    for (var k = 0; k < 22; k++) {
      var x = i * pw + r() * pw;
      g.strokeStyle = 'rgba(70,40,15,' + (0.05 + r() * 0.12) + ')';
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 5, h); g.stroke();
    }
    g.fillStyle = 'rgba(40,22,8,.55)'; g.fillRect(i * pw, 0, 2, h);
  }
});
var slatTex = ctex(512, 512, function (g, w, h) {           // celosía: listones con separación
  var r = rng(11), n = 12, pw = w / n;
  g.fillStyle = '#2f2114'; g.fillRect(0, 0, w, h);
  for (var i = 0; i < n; i++) {
    g.fillStyle = 'hsl(29,' + (34 + r() * 10) + '%,' + (46 + r() * 12) + '%)';
    g.fillRect(i * pw + 5, 0, pw - 6, h);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(i * pw + 5, 0, 3, h);
  }
});
var roofTex = ctex(512, 512, function (g, w, h) {           // calamina aluzinc rojo
  var n = 6, rw = w / n;
  for (var i = 0; i < n; i++) {
    var gr = g.createLinearGradient(i * rw, 0, (i + 1) * rw, 0);
    gr.addColorStop(0, '#8c2a22'); gr.addColorStop(.35, '#bd4538'); gr.addColorStop(.5, '#d05748');
    gr.addColorStop(.65, '#bd4538'); gr.addColorStop(1, '#8c2a22');
    g.fillStyle = gr; g.fillRect(i * rw, 0, rw, h);
  }
});
var roofOldTex = ctex(512, 512, function (g, w, h) {        // calamina existente (gris)
  var n = 6, rw = w / n;
  for (var i = 0; i < n; i++) {
    var gr = g.createLinearGradient(i * rw, 0, (i + 1) * rw, 0);
    gr.addColorStop(0, '#6d757b'); gr.addColorStop(.5, '#a6adb2'); gr.addColorStop(1, '#6d757b');
    g.fillStyle = gr; g.fillRect(i * rw, 0, rw, h);
  }
});
var meshTex = ctex(128, 128, function (g, w, h) {           // malla mosquitera, 0.25 m
  g.fillStyle = 'rgba(28,32,34,.42)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(110,116,120,.9)'; g.lineWidth = 1;
  for (var i = 0; i <= w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
});
var concTex = ctex(256, 256, function (g, w, h) {
  g.fillStyle = '#c9c9c3'; g.fillRect(0, 0, w, h);
  var r = rng(3); noise(g, w, h, r, 900, .35, true); noise(g, w, h, r, 500, .3, false);
});
var plasterTex = ctex(256, 256, function (g, w, h) {
  g.fillStyle = '#efe4cc'; g.fillRect(0, 0, w, h);
  var r = rng(5); noise(g, w, h, r, 700, .18, true); noise(g, w, h, r, 500, .25, false);
});
var grassTex = ctex(256, 256, function (g, w, h) {
  g.fillStyle = '#6f9a45'; g.fillRect(0, 0, w, h);
  var r = rng(9);
  for (var i = 0; i < 2600; i++) {
    g.fillStyle = 'hsla(' + (85 + r() * 30) + ',' + (35 + r() * 25) + '%,' + (30 + r() * 25) + '%,.55)';
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 2 + r() * 4);
  }
});
var earthTex = ctex(256, 256, function (g, w, h) {
  g.fillStyle = '#b8a27c'; g.fillRect(0, 0, w, h);
  var r = rng(13);
  for (var i = 0; i < 1800; i++) {
    g.fillStyle = 'rgba(' + (90 + r() * 60) + ',' + (65 + r() * 40) + ',40,' + (0.15 + r() * .25) + ')';
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
});
var courtTex = ctex(400, 640, function (g, w, h) {          // losa deportiva 20.4 x 31.4 m
  g.fillStyle = '#b8b8b2'; g.fillRect(0, 0, w, h);
  var r = rng(21); noise(g, w, h, r, 1400, .3, true);
  g.strokeStyle = 'rgba(70,70,70,.35)'; g.lineWidth = 1;
  for (var x = 0; x <= w; x += w / 5) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (var y = 0; y <= h; y += h / 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
  g.strokeRect(24, 30, w - 48, h - 60);
  g.beginPath(); g.moveTo(24, h / 2); g.lineTo(w - 24, h / 2); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2, 46, 0, 2 * PI); g.stroke();
});

/* ====================================================================================
 * 2. Materiales
 * ==================================================================================== */
var M = {};
function mk(name, params, tile) {
  var m = new T.MeshStandardMaterial(params);
  m.userData.tile = tile || 1;
  M[name] = m;
  return m;
}
mk('wood', { map: woodTex, roughness: .9 }, 1);
mk('slat', { map: slatTex, roughness: .9 }, 1);
mk('woodDark', { map: woodTex, color: 0x8b5a33, roughness: .85 }, 1);
mk('door', { map: woodTex, color: 0x74492a, roughness: .8 }, 1);
mk('conc', { map: concTex, color: 0xdcdcd6, roughness: .95 }, 2);
mk('found', { color: 0xa9a9a2, roughness: 1 });
mk('plaster', { map: plasterTex, roughness: .95 }, 2);
mk('plasterOld', { map: plasterTex, color: 0xe6dfc0, roughness: .95 }, 2);
mk('roof', { map: roofTex, roughness: .42, metalness: .35, side: T.DoubleSide }, 1);
mk('roofOld', { map: roofOldTex, roughness: .5, metalness: .3, side: T.DoubleSide }, 1);
mk('mesh', { map: meshTex, transparent: true, side: T.DoubleSide, roughness: .9, depthWrite: false }, .25);
mk('gutter', { color: 0x8d99a3, metalness: .55, roughness: .4 });
mk('steel', { color: 0x2b2f33, metalness: .6, roughness: .45 });
mk('white', { color: 0xf5f5f2, roughness: .35 });
mk('mattress', { color: 0x5f9bd6, roughness: .95 });
mk('mattress2', { color: 0xd98a6a, roughness: .95 });
mk('pillow', { color: 0xf6f6f0, roughness: 1 });
mk('brick', { color: 0xc4622c, roughness: .9 });
mk('part', { color: 0xa9c6d2, roughness: .7 });
mk('tile', { color: 0xe3ecee, roughness: .3 });
mk('glass', { color: 0x37505f, roughness: .2, metalness: .3 });
mk('sofa', { color: 0x8e6a4a, roughness: .9 });
mk('bio', { color: 0x1f2f3a, roughness: .5 });
mk('leaf', { color: 0x3f7a35, roughness: 1, flatShading: true });
mk('trunk', { color: 0x5a3f28, roughness: 1 });
var groundMat = new T.MeshStandardMaterial({ map: grassTex, roughness: 1, transparent: true, opacity: 1 });
groundMat.map.repeat.set(120, 120);
var earthMat = new T.MeshStandardMaterial({ map: earthTex, roughness: 1 });
earthMat.map.repeat.set(12, 14);
var courtMat = new T.MeshStandardMaterial({ map: courtTex, roughness: .9 });

/* ====================================================================================
 * 3. Escena, cámara, luces
 * ==================================================================================== */
var host = document.getElementById('stage');
var renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = T.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

var scene = new T.Scene();
scene.background = new T.Color(0xc9dfef);
scene.fog = new T.Fog(0xc9dfef, 260, 720);

var camera = new T.PerspectiveCamera(45, 1, 0.3, 2000);
var CENTER = new T.Vector3(22, 0, 55);
camera.position.set(CENTER.x + 78, 62, CENTER.z + 100);

var controls = new T.OrbitControls(camera, renderer.domElement);
controls.target.copy(CENTER);
controls.enableDamping = true;
controls.dampingFactor = .08;
controls.maxPolarAngle = PI / 2 - 0.015;
controls.minDistance = 3;
controls.maxDistance = 420;
controls.screenSpacePanning = true;
controls.update();

var hemi = new T.HemisphereLight(0xdcecff, 0x6d7d55, .78);
scene.add(hemi);
var sun = new T.DirectionalLight(0xfff1dc, 1.05);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
var sc = sun.shadow.camera;
sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 1; sc.far = 420;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);
sun.target.position.copy(CENTER);

// Norte verdadero según el plano de implantación (arriba del plano) expresado en ejes del sitio (u,v)
var NORTH = new T.Vector2(Math.sin(20.5 * PI / 180), -Math.cos(20.5 * PI / 180));   // (x,z)
var EAST = new T.Vector2(Math.cos(20.5 * PI / 180), Math.sin(20.5 * PI / 180));

function setHour(h) {
  var th = (h - 12) / 6 * (PI / 2);                    // -90° … +90°
  var el = (12 + 68 * Math.cos(th)) * PI / 180;        // elevación 12° … 80°
  var e = -Math.sin(th) * Math.cos(el), n = 0.25 * Math.cos(el);
  var dir = new T.Vector3(EAST.x * e + NORTH.x * n, Math.sin(el), EAST.y * e + NORTH.y * n).normalize();
  sun.position.copy(sun.target.position).addScaledVector(dir, 180);
  var low = 1 - Math.sin(el);                          // 0 mediodía … ~0.8 amanecer
  sun.intensity = 0.55 + 0.6 * Math.sin(el);
  sun.color.setRGB(1, 0.94 - 0.28 * low, 0.86 - 0.5 * low);
  var sky = new T.Color(0xc9dfef).lerp(new T.Color(0xf0c9a2), Math.min(1, low * 1.15));
  scene.background.copy(sky); scene.fog.color.copy(sky);
  hemi.intensity = 0.5 + 0.35 * Math.sin(el);
}
setHour(11);

/* ====================================================================================
 * 4. Utilidades de modelado
 * ==================================================================================== */
function scaleUV(g, w, h, d, tile) {
  var uv = g.attributes.uv;
  var dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];      // +x -x +y -y +z -z
  for (var f = 0; f < 6; f++) for (var i = 0; i < 4; i++) {
    var k = f * 4 + i;
    uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile);
  }
}
/* caja de w×h×d con la base en y0, centrada en (x,z) */
function box(parent, w, h, d, mat, x, y0, z) {
  var g = new T.BoxGeometry(w, h, d);
  if (mat.map) scaleUV(g, w, h, d, mat.userData.tile || 1);
  var m = new T.Mesh(g, mat);
  m.position.set(x, y0 + h / 2, z);
  m.castShadow = mat !== M.mesh; m.receiveShadow = true;
  parent.add(m);
  return m;
}
/* viga entre dos puntos (coordenadas locales del padre) */
var ZAXIS = new T.Vector3(0, 0, 1);
function beam(parent, mat, a, b, w, h) {
  var dir = new T.Vector3().subVectors(b, a), len = dir.length();
  var g = new T.BoxGeometry(w, h, len);
  if (mat.map) scaleUV(g, w, h, len, mat.userData.tile || 1);
  var m = new T.Mesh(g, mat);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(ZAXIS, dir.normalize());
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function V(x, y, z) { return new T.Vector3(x, y, z); }
function cyl(parent, mat, r, h, x, y0, z, seg) {
  var m = new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 16), mat);
  m.position.set(x, y0 + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
/* muro recto (eje X o Z) con vanos: ops = [{a,b,y0,y1}] en coordenadas absolutas a lo largo del muro */
function wall(parent, p, q, t, y0, y1, mat, ops) {
  ops = (ops || []).slice().sort(function (u, v) { return u.a - v.a; });
  var alongX = Math.abs(q[1] - p[1]) < 1e-6;
  var s0 = alongX ? Math.min(p[0], q[0]) : Math.min(p[1], q[1]);
  var s1 = alongX ? Math.max(p[0], q[0]) : Math.max(p[1], q[1]);
  var fixed = alongX ? p[1] : p[0];
  function seg(sa, sb, ya, yb) {
    if (sb - sa < 1e-4 || yb - ya < 1e-4) return;
    var n = Math.max(1, Math.ceil((sb - sa) / CH)), st = (sb - sa) / n;      // tramos ≤ 3 m (avance por partes)
    for (var k = 0; k < n; k++) {
      var c = sa + st * (k + .5), l = st + (n > 1 ? .02 : 0);
      if (alongX) box(parent, l, yb - ya, t, mat, c, ya, fixed);
      else box(parent, t, yb - ya, l, mat, fixed, ya, c);
    }
  }
  var cur = s0;
  ops.forEach(function (o) { seg(cur, o.a, y0, y1); seg(o.a, o.b, y0, o.y0); seg(o.a, o.b, o.y1, y1); cur = o.b; });
  seg(cur, s1, y0, y1);
}
/* franja de malla mosquitera entre dos alturas */
function band(parent, p, q, y0, y1) {
  var alongX = Math.abs(q[1] - p[1]) < 1e-6;
  var len = alongX ? Math.abs(q[0] - p[0]) : Math.abs(q[1] - p[1]);
  lineBox(parent, p[0], p[1], q[0], q[1], .04, y1 - y0, y0, M.mesh, 0);
}
/* hoja de puerta en un muro (axis 'x' = muro paralelo a X) */
function door(parent, c, fixed, axis, w, y0, h) {
  if (axis === 'x') box(parent, w - .06, h, .07, M.door, c, y0, fixed);
  else box(parent, .07, h, w - .06, M.door, fixed, y0, c);
}
/* muro poligonal (perfil en plano z-y, extruido en x) — frontones y testeros */
function polyWall(parent, mat, x, t, pts) {
  var sh = new T.Shape();
  pts.forEach(function (p, i) { if (i === 0) sh.moveTo(-p[0], p[1]); else sh.lineTo(-p[0], p[1]); });
  var g = new T.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false });
  g.translate(0, 0, -t / 2);
  var m = new T.Mesh(g, mat);
  m.rotation.y = PI / 2; m.position.x = x;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
/* faja de cimentación (cimiento corrido) entre (x0,z0)-(x1,z1) */
function strip(parent, x0, z0, x1, z1, w, depth) {
  if (CUR) CUR.strips.push([x0, z0, x1, z1, w]);
  lineBox(parent, x0, z0, x1, z1, w, depth, -depth - .03, M.found, w);
}
/* caja recta a lo largo de un eje (X o Z), troceada en tramos ≤ CH; ext = prolongación total */
var CH = 3.0;
function lineBox(parent, x0, z0, x1, z1, w, h, y0, mat, ext) {
  var alongX = Math.abs(z1 - z0) < 1e-6, len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  var a = (alongX ? Math.min(x0, x1) : Math.min(z0, z1)) - ext / 2, tot = len + ext;
  var n = Math.max(1, Math.ceil(tot / CH)), st = tot / n;
  for (var k = 0; k < n; k++) {
    var c = a + st * (k + .5), l = st + (n > 1 ? .02 : 0);
    if (alongX) box(parent, l, h, w, mat, c, y0, z0); else box(parent, w, h, l, mat, x0, y0, c);
  }
}
/* caja centrada en x, troceada en X */
function boxX(parent, w, h, d, mat, x, y0, z) {
  var n = Math.max(1, Math.ceil(w / CH)), st = w / n;
  for (var k = 0; k < n; k++) box(parent, st + (n > 1 ? .02 : 0), h, d, mat, x - w / 2 + st * (k + .5), y0, z);
}
/* panel plano inclinado (cobertura) de largo len en X y profundidad d, rotado rx alrededor de X */
function panel(parent, mat, len, th, d, cx, cy, cz, rx, rz) {
  var g = new T.BoxGeometry(len, th, d);
  if (mat.map) scaleUV(g, len, th, d, mat.userData.tile || 1);
  var m = new T.Mesh(g, mat);
  m.position.set(cx, cy, cz);
  m.rotation.x = rx || 0; m.rotation.z = rz || 0;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
/* plancha inclinada troceada en planchas de ~2.4 m (avance por partes) */
function panelSegs(parent, mat, len, th, d, cx, cy, cz, rx) {
  var n = Math.max(1, Math.ceil(len / 2.4)), st = len / n;
  for (var k = 0; k < n; k++) panel(parent, mat, st + (n > 1 ? .02 : 0), th, d, cx - len / 2 + st * (k + .5), cy, cz, rx, 0);
}
/* cobertura a dos aguas con cumbrera paralela al eje X */
function gableRoof(parent, mat, x0, x1, zc, half, yE, yR, matCap) {
  var len = x1 - x0, cx = (x0 + x1) / 2, a = Math.atan2(yR - yE, half), sl = Math.hypot(half, yR - yE);
  [1, -1].forEach(function (sd) {
    panelSegs(parent, mat, len, .04, sl, cx, (yE + yR) / 2 - .02, zc + sd * half / 2, sd * a);
    boxX(parent, len + .1, .16, .16, M.gutter, cx, yE - .16, zc + sd * (half + .02));   // canaleta
  });
  boxX(parent, len + .06, .09, .34, matCap || mat, cx, yR - .05, zc);                   // cumbrera
}
function downpipe(parent, x, z, y1) { cyl(parent, M.gutter, .045, y1 - .15, x, .15, z, 10); }

/* ====================================================================================
 * 5. Registro de capas y edificios
 * ==================================================================================== */
var LAYER_DEF = [
  ['found', 'Cimentación (cimientos corridos)', '#8f8f88'],
  ['floor', 'Pisos, veredas y sobrecimientos', '#bcbcb4'],
  ['walls', 'Muros y cerramientos', '#c99a6a'],
  ['struct', 'Columnas y vigas de madera', '#8b5a33'],
  ['roofS', 'Armadura de techo (cerchas y correas)', '#a5763f'],
  ['roof', 'Cobertura de aluzinc y canaletas', '#c2412d'],
  ['furn', 'Mobiliario y equipos', '#5f9bd6']
];
var LAYERS = {};
LAYER_DEF.forEach(function (l) { LAYERS[l[0]] = []; });
var BUILDINGS = [];
var CUR = null;                                   // edificio en construcción (registra cimientos para replanteo/zanjas)
function makeBuilding(id, name, info) {
  var root = new T.Group();
  root.name = name; root.userData.info = info;
  var o = { id: id, name: name, root: root, strips: [] };
  CUR = o;
  ['prelim', 'exc'].forEach(function (k) { var g = new T.Group(); g.name = name + ':' + k; g.visible = false; root.add(g); o[k] = g; });
  LAYER_DEF.forEach(function (l) {
    var g = new T.Group(); g.name = name + ':' + l[0];
    root.add(g); o[l[0]] = g; LAYERS[l[0]].push(g);
  });
  BUILDINGS.push(o);
  scene.add(root);
  return o;
}

/* ====================================================================================
 * 6. Mobiliario
 * ==================================================================================== */
function litera(parent, x, z, headDir, colorMat) {         // litera doble, cabecera hacia headDir (±z)
  var y = .15, g = parent;
  [[-.44, -.94], [.44, -.94], [-.44, .94], [.44, .94]].forEach(function (p) { box(g, .06, 1.78, .06, M.woodDark, x + p[0], y, z + p[1]); });
  [.36, 1.22].forEach(function (h) {
    box(g, .92, .06, 1.92, M.woodDark, x, y + h, z);
    box(g, .84, .12, 1.84, colorMat || M.mattress, x, y + h + .06, z);
    box(g, .42, .09, .30, M.pillow, x, y + h + .18, z + headDir * .68);
  });
  box(g, .92, .35, .04, M.woodDark, x, y + 1.28, z - headDir * .96);       // baranda inferior del pie
}
function sofa(parent, x, z, rot) {
  var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; parent.add(g);
  box(g, 1.7, .42, .8, M.sofa, 0, .15, 0); box(g, 1.7, .5, .18, M.sofa, 0, .57, -.31);
  box(g, .18, .25, .8, M.sofa, -.86, .42, 0); box(g, .18, .25, .8, M.sofa, .86, .42, 0);
}
function table(parent, x, z, w, d, h) {
  box(parent, w, .05, d, M.woodDark, x, .15 + h - .05, z);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(parent, .06, h - .05, .06, M.woodDark, x + s[0] * (w / 2 - .07), .15, z + s[1] * (d / 2 - .07)); });
}
function wc(parent, x, z, dirZ) {                            // inodoro con tanque (dirZ = +1 mira hacia +z)
  cyl(parent, M.white, .19, .40, x, .12, z, 14);
  box(parent, .40, .32, .18, M.white, x, .32, z - dirZ * .27);
  box(parent, .38, .06, .40, M.white, x, .52, z - dirZ * .02);
}

/* ====================================================================================
 * 7. Dormitorio (varones / mujeres) — ejes 1-8 × A-B  (I-02, I-05…I-09, I-12)
 *    Coordenadas locales: origen en el centro del bloque; +X = este del plano; +Z = sur (eje A).
 * ==================================================================================== */
var DORM = { L: 21.65, W: 5.35, yE: 3.06, yR: 4.48, half: 4.22, yTop: 3.09 };
DORM.hw = DORM.W / 2; DORM.s = (DORM.yR - DORM.yE) / DORM.half;

function dormitorio(id, name, info, opt) {
  var b = makeBuilding(id, name, info);
  var L = DORM.L, hw = DORM.hw, x0 = -L / 2, x1 = L / 2, yE = DORM.yE, yR = DORM.yR, half = DORM.half;
  var s = DORM.s, yTop = DORM.yTop, a = Math.atan(s);
  var axs = [0, 3, 6, 9, 12, 15, 18, 21.65].map(function (v) { return v - L / 2; });
  var roofUnder = function (z) { return yR - Math.abs(z) * s - .17; };

  /* cimentación */
  strip(b.found, x0, -hw, x1, -hw, .40, .60); strip(b.found, x0, hw, x1, hw, .40, .60);
  strip(b.found, x0, -hw, x0, hw, .40, .60);  strip(b.found, x1, -hw, x1, hw, .40, .60);
  [axs[1], axs[6]].forEach(function (x) { strip(b.found, x, -hw, x, -hw + 3.1, .4, .6); strip(b.found, x, hw - 3.1, x, hw, .4, .6); });
  axs.forEach(function (x) { [-hw, hw].forEach(function (z) { box(b.found, .8, .45, .8, M.found, x, -.6, z); }); });

  /* pisos */
  boxX(b.floor, L + 2.0, .10, DORM.W + 2.4, M.conc, 0, 0, 0);                       // veredas perimetrales
  boxX(b.floor, L + .30, .15, DORM.W + .30, M.conc, 0, 0, 0);                       // piso NPT +0.15
  [[x0, -hw, x1, -hw], [x0, hw, x1, hw], [x0, -hw, x0, hw], [x1, -hw, x1, hw]].forEach(function (q) {
    wall(b.floor, [q[0], q[1]], [q[2], q[3]], .15, .15, .45, M.conc, []);           // sobrecimiento
  });

  /* muros largos: celosía de madera 0.45-2.40, malla 2.40-3.09, friso */
  function longWall(z, doors) {
    var ops = doors.map(function (d) { return { a: d[0], b: d[1], y0: .45, y1: 2.40 }; });
    wall(b.walls, [x0, z], [x1, z], .10, .45, 2.40, M.slat, ops);
    doors.forEach(function (d) { door(b.walls, (d[0] + d[1]) / 2, z, 'x', d[1] - d[0], .45, 1.95); });
    band(b.walls, [x0, z], [x1, z], 2.40, yTop);
    wall(b.walls, [x0, z], [x1, z], .08, yTop, roofUnder(hw), M.wood, []);
  }
  var dS = [[x0 + .45, x0 + 1.45], [x1 - 1.55, x1 - .55]];
  longWall(hw, dS);
  longWall(-hw, opt.doorsNorth ? dS : []);
  /* testeros (ejes 1 y 8): madera + malla + frontón con ventilas */
  [x0, x1].forEach(function (x, i) {
    var sg = i ? 1 : -1;
    wall(b.walls, [x, -hw], [x, hw], .10, .45, 2.40, M.wood, []);
    band(b.walls, [x, -hw], [x, hw], 2.40, yTop);
    polyWall(b.walls, M.wood, x, .10, [[-hw, yTop], [hw, yTop], [hw, roofUnder(hw)], [0, yR - .17], [-hw, roofUnder(hw)]]);
    [-.55, .55].forEach(function (z) { box(b.walls, .05, .40, .55, M.mesh, x + sg * .06, 3.75, z); });
  });

  /* estructura de madera */
  axs.forEach(function (x) {
    [-hw, hw].forEach(function (z) { box(b.struct, .15, yTop - .15, .15, M.woodDark, x, .15, z); });
    [-1, 1].forEach(function (sd) {                                                 // tornapuntas del alero
      beam(b.struct, M.woodDark, V(x, 2.45, sd * hw), V(x, 3.10, sd * (hw + 1.15)), .07, .10);
    });
  });
  [-hw, hw].forEach(function (z) { boxX(b.struct, L + .3, .15, .12, M.woodDark, 0, yTop, z); });

  /* armadura de techo */
  axs.forEach(function (x) {
    box(b.roofS, .08, .14, DORM.W + .2, M.woodDark, x, yTop, 0);                    // tirante
    [-1, 1].forEach(function (sd) { beam(b.roofS, M.woodDark, V(x, yE - .17, sd * half), V(x, yR - .17, 0), .06, .15); });
    box(b.roofS, .08, roofUnder(0) - yTop - .14, .08, M.woodDark, x, yTop + .14, 0); // pendolón
    [-1, 1].forEach(function (sd) { beam(b.roofS, M.woodDark, V(x, yTop + .16, 0), V(x, roofUnder(1.6) - .08, sd * 1.6), .06, .10); });
  });
  [1.0, 2.1, 3.2].forEach(function (t) {
    [-1, 1].forEach(function (sd) {
      var z = sd * (half - t * Math.cos(a));
      boxX(b.roofS, L + 2.0, .06, .09, M.woodDark, 0, yR - Math.abs(z) * s - .25, z);
    });
  });
  boxX(b.roofS, L + 2.0, .10, .12, M.woodDark, 0, yR - .27, 0);

  /* cobertura */
  gableRoof(b.roof, M.roof, x0 - 1.0, x1 + 1.0, 0, half, yE, yR, M.roof);
  [-1, 1].forEach(function (sd) {                                                   // cielo raso exterior del alero
    var zc = sd * (hw + half) / 2, len = (half - hw) / Math.cos(a);
    panelSegs(b.roof, M.wood, L + 2.0, .02, len, 0, yR - Math.abs(zc) * s - .17, zc, sd * a);
  });
  [[x0 - .95, -half + .1], [x0 - .95, half - .1], [x1 + .95, -half + .1], [x1 + .95, half - .1]].forEach(function (p) { downpipe(b.roof, p[0], p[1], yE); });

  /* mobiliario: literas, sala de estar y sala de estudio */
  var bedX = [3.6, 6.0, 7.5, 9.9, 11.4, 13.8, 15.3, 17.6].map(function (v) { return v - L / 2 + .3; });
  bedX.forEach(function (x, i) {
    litera(b.furn, x, -(hw - 1.02), -1, opt.women ? M.mattress2 : M.mattress);
    litera(b.furn, x, (hw - 1.02), 1, opt.women ? M.mattress2 : M.mattress);
  });
  sofa(b.furn, x0 + 1.4, -hw + .9, 0); sofa(b.furn, x0 + 1.4, hw - .9, PI);
  table(b.furn, x0 + 1.9, 0, .8, .8, .5);
  for (var i = 0; i < 5; i++) { table(b.furn, x1 - .7, -hw + .8 + i * .82, .6, .7, .75); }
  return b;
}

/* ---- Mujeres: dormitorio + módulo SS.HH./duchas + lavandería-tendal (I-02, I-03, I-05…I-08, E-01) ---- */
function buildMujeres() {
  var b = dormitorio('mujeres', 'Residencia Mujeres', {
    title: 'Residencia Mujeres',
    rows: [
      ['Dormitorio', 'Ejes 1–8 × A–B: 21.65 × 5.35 m · cubierta 23.65 × 8.44 m a 2 aguas'],
      ['Cotas', 'NPT +0.15 · alero +3.06 · NTT (cumbrera) +4.48'],
      ['Cerramiento', 'Sobrecimiento 0.45 + celosía de madera 1.95 + malla mosquitera 0.69'],
      ['Módulo SS.HH.', '13.90 × 4.10 m (ejes 1′–5′ × C–D) · cubierta a 1 agua (~24%), +3.35 a +4.90 · muros h=3.20'],
      ['Lavandería-tendal', 'Patio con cerco de madera h=2.40'],
      ['Láminas', 'I-02 planta · I-03 techos · I-05/06 cortes · I-07 elevación · E-01 cimentación']
    ]
  }, { women: true, doorsNorth: true });

  var Xa0 = -1.975, Xa1 = 11.925, Zn = -8.925, Zs = -4.825, tw = .15;
  var yLow = 3.35, yHigh = 4.90, zLow = -10.025, zHigh = -3.425;
  var sa = (yHigh - yLow) / (zHigh - zLow);
  var roofAt = function (z) { return yLow + (z - zLow) * sa; };
  var hw = DORM.hw;

  /* cimentación del anexo (z = -0.80) */
  strip(b.found, Xa0, Zn, Xa1, Zn, .4, .8); strip(b.found, Xa0, Zs, Xa1, Zs, .4, .8);
  strip(b.found, Xa0, Zn, Xa0, Zs, .4, .8); strip(b.found, Xa1, Zn, Xa1, Zs, .4, .8);
  [.6, 4.97, 9.8].forEach(function (x) { strip(b.found, x, Zn, x, Zs, .3, .6); });
  /* pisos */
  boxX(b.floor, Xa1 - Xa0 + .3, .12, Zs - Zn + .3, M.conc, (Xa0 + Xa1) / 2, 0, (Zn + Zs) / 2);
  boxX(b.floor, Xa1 - Xa0 + 1.6, .10, Zs - -hw + .0, M.conc, (Xa0 + Xa1) / 2, 0, (Zs + -hw) / 2);   // circulación B–C
  /* muros */
  wall(b.walls, [Xa0, Zn], [Xa1, Zn], tw, 0, 3.2, M.plaster, []);
  band(b.walls, [Xa0, Zn], [Xa1, Zn], 3.2, roofAt(Zn) - .08);
  var dxs = [[-1.15, -.25], [1.95, 2.85], [5.05, 5.95], [10.45, 11.35]];
  wall(b.walls, [Xa0, Zs], [Xa1, Zs], tw, 0, 3.2, M.plaster, dxs.map(function (d) { return { a: d[0], b: d[1], y0: 0, y1: 2.30 }; }));
  dxs.forEach(function (d) { door(b.walls, (d[0] + d[1]) / 2, Zs, 'x', d[1] - d[0], .12, 2.18); });
  band(b.walls, [Xa0, Zs], [Xa1, Zs], 3.2, roofAt(Zs) - .08);
  [Xa0, Xa1].forEach(function (x) {
    polyWall(b.walls, M.plaster, x, tw, [[Zn, 0], [Zs, 0], [Zs, roofAt(Zs) - .08], [Zn, roofAt(Zn) - .08]]);
  });
  /* tabiques entre ambientes (DEP. LIMP. | DUCHAS | SS.HH. | DEPÓSITO) */
  [.6, 9.8].forEach(function (x) { wall(b.walls, [x, Zn], [x, Zs], .12, 0, 3.2, M.plaster, []); });
  wall(b.walls, [4.97, Zn], [4.97, Zs], .12, 0, 3.2, M.plaster, [{ a: -7.4, b: -6.5, y0: 0, y1: 2.2 }]);
  /* SS.HH.: 5 cubículos al norte y 4 al sur (el 5.º es el acceso) */
  var cw = (9.8 - 4.97) / 5, dep = 1.55;
  for (var i = 0; i <= 5; i++) {
    var x = 4.97 + i * cw;
    box(b.walls, .04, 1.95, dep, M.part, x, .27, Zn + dep / 2);
    if (i >= 1) box(b.walls, .04, 1.95, dep, M.part, x, .27, Zs - dep / 2);
  }
  for (var j = 0; j < 5; j++) {
    var xc = 4.97 + (j + .5) * cw;
    box(b.walls, cw - .12, 1.55, .03, M.part, xc, .27, Zn + dep);                    // puerta cubículo N
    wc(b.furn, xc, Zn + .35, 1);
    if (j >= 1) { box(b.walls, cw - .12, 1.55, .03, M.part, xc, .27, Zs - dep); wc(b.furn, xc, Zs - .35, -1); }
  }
  /* duchas: 3 casetas + cortina */
  [1.0, 2.0, 3.0, 4.0].forEach(function (x) { box(b.walls, .04, 2.0, 1.3, M.part, x, .25, Zn + .65); });
  [1.5, 2.5, 3.5].forEach(function (x) {
    box(b.walls, .9, 1.75, .02, M.mattress, x, .3, Zn + 1.3);
    cyl(b.furn, M.steel, .035, .5, x, 1.75, Zn + .12, 8);
  });
  /* lavadero exterior (fachada sur del anexo, zona de circulación) */
  box(b.furn, 5.6, .85, .55, M.conc, 3.6, .1, Zs + .5);
  box(b.furn, 5.6, .04, .60, M.tile, 3.6, .95, Zs + .5);
  for (var k = 0; k < 6; k++) cyl(b.furn, M.steel, .025, .18, 1.2 + k * .9, .99, Zs + .28, 8);

  /* cubierta del anexo: 1 agua, sube hacia el dormitorio (sur) */
  var len = 15.13, cxr = (-2.575 + 12.555) / 2, ang = Math.atan2(yHigh - yLow, zHigh - zLow);
  panelSegs(b.roof, M.roof, len, .04, Math.hypot(zHigh - zLow, yHigh - yLow), cxr, (yLow + yHigh) / 2 - .02, (zLow + zHigh) / 2, -ang);
  box(b.roof, len, .10, .16, M.gutter, cxr, yLow - .16, zLow - .02);
  downpipe(b.roof, -2.4, zLow + .1, yLow);
  downpipe(b.roof, 12.3, zLow + .1, yLow);
  [-1.975, 1.525, 5.075, 9.175, 11.925].forEach(function (x) {
    beam(b.roofS, M.woodDark, V(x, yLow - .17, zLow), V(x, yHigh - .17, zHigh), .06, .16);
  });
  for (var p = 1; p <= 5; p++) {
    var zz = zLow + p * (zHigh - zLow) / 6;
    boxX(b.roofS, len, .06, .09, M.woodDark, cxr, roofAt(zz) - .26, zz);
  }

  boxX(b.floor, Xa0 + 4.025 + .15, .10, Zs - Zn, M.conc, (Xa0 - 4.025) / 2, 0, (Zn + Zs) / 2);   // piso bajo el cobertizo
  /* lavandería-tendal con cerco de celosía h=2.40 */
  var Tx0 = -11.825, Tx1 = -4.025;
  boxX(b.floor, Tx1 - Tx0, .10, Zs - Zn, M.conc, (Tx0 + Tx1) / 2, 0, (Zn + Zs) / 2);
  [[[Tx0, Zn], [Tx1, Zn]], [[Tx0, Zs], [Tx1, Zs]], [[Tx0, Zn], [Tx0, Zs]]].forEach(function (f) {
    wall(b.floor, f[0], f[1], .15, .10, .45, M.conc, []);
    wall(b.walls, f[0], f[1], .10, .45, 2.40, M.slat, []);
    strip(b.found, f[0][0], f[0][1], f[1][0], f[1][1], .4, .4);
  });
  for (var px = Tx0; px <= Tx1 + .01; px += 2.0) { box(b.struct, .12, 2.3, .12, M.woodDark, px, .1, Zn); box(b.struct, .12, 2.3, .12, M.woodDark, px, .1, Zs); }
  [Zn + 1.0, Zn + 2.0, Zn + 3.0].forEach(function (z) { box(b.furn, Tx1 - Tx0 - .3, .012, .012, M.steel, (Tx0 + Tx1) / 2, 2.1, z); });
  /* cobertizo de enlace tendal ↔ anexo */
  var cang = Math.atan2(.56, 2.1);
  panel(b.roof, M.roof, Math.hypot(2.1, .56), .04, Zs - Zn, -3.75, 2.73, (Zn + Zs) / 2, 0, cang);
  [-4.8, -2.7].forEach(function (x) { [Zn + .1, Zs - .1].forEach(function (z) { box(b.struct, .12, (x < -4 ? 2.4 : 2.95), .12, M.woodDark, x, .1, z); }); });
  return b;
}

function buildVarones() {
  return dormitorio('varones', 'Residencia Varones', {
    title: 'Residencia Varones',
    rows: [
      ['Dormitorio', 'Ejes 1–8 × A–B: 21.65 × 5.35 m · cubierta 23.65 × 8.44 m a 2 aguas'],
      ['Cotas', 'NPT +0.15 · alero +3.06 · NTT (cumbrera) +4.48'],
      ['Cerramiento', 'Sobrecimiento 0.45 + celosía de madera 1.95 + malla mosquitera 0.69'],
      ['SS.HH.', 'En módulos independientes (ver implantación, referencial)'],
      ['Láminas', 'I-09 planta · I-10 techos · I-11 corte · I-12 elevación · E-01/E-03 cimentación']
    ]
  }, { women: false, doorsNorth: false });
}

/* ====================================================================================
 * 8. Cocina-comedor (I-13, I-14, I-15) — ejes 1-7 × A-B, 18.20 × 6.00 m, cubierta 20.55 × 8.55 m
 *    Local: +X = eje 1→7 ; +Z = sur del plano (eje B). Origen en el centro de los ejes.
 * ==================================================================================== */
function buildCocina() {
  var b = makeBuilding('cocina', 'Cocina - Comedor', {
    title: 'Cocina - Comedor',
    rows: [
      ['Planta', 'Ejes 1–7 × A–B: 18.20 × 6.00 m · cubierta 20.55 × 8.55 m a 2 aguas'],
      ['Comedor', 'Semiabierto (ejes 1–5): columnas de madera y muro bajo h=1.15 · 8 mesas'],
      ['Cocina y almacén', 'Cerrados (ejes 5–7): cocina mejorada, lavaderos y anaqueles'],
      ['Cotas', 'NPT +0.15 · alero +3.13 · NTT (cumbrera) +4.58'],
      ['Láminas', 'I-13 planta · I-14 corte A-A y elevación · I-15 cortes/elevaciones · E-01']
    ]
  });
  var LX = 18.2, hz = 3.0, yE = 3.13, yR = 4.58, half = 4.275, s = (yR - yE) / half, a = Math.atan(s);
  var axsRaw = [0, 3, 6, 9, 12, 15, 16.85, 18.2];
  var axs = axsRaw.map(function (v) { return v - LX / 2; });
  var x0 = axs[0], x1 = axs[7], xk = axs[4];                 // xk = eje 5 (inicio de cocina cerrada)
  var roofUnder = function (z) { return yR - Math.abs(z) * s - .17; };

  /* cimentación */
  strip(b.found, x0, -hz, x1, -hz, .4, .6); strip(b.found, x0, hz, x1, hz, .4, .6);
  strip(b.found, x0, -hz, x0, hz, .4, .6); strip(b.found, x1, -hz, x1, hz, .4, .6); strip(b.found, xk, -hz, xk, hz, .4, .6);
  axs.forEach(function (x) { [-hz, hz].forEach(function (z) { box(b.found, .7, .45, .7, M.found, x, -.6, z); }); });

  /* pisos */
  boxX(b.floor, LX + 2.5, .10, 2 * hz + 2.5, M.conc, 0, 0, 0);
  boxX(b.floor, LX + .3, .15, 2 * hz + .3, M.conc, 0, 0, 0);

  /* muro bajo del comedor (0.45 sobrecimiento + madera hasta 1.15) con barandas en los extremos */
  [-hz, hz].forEach(function (z) {
    wall(b.floor, [x0 + 1.3, z], [xk - .1, z], .15, .15, .45, M.conc, []);
    wall(b.walls, [x0 + 1.3, z], [xk - .1, z], .10, .45, 1.15, M.slat, []);
    [[x0, x0 + 1.3]].forEach(function (r) {
      [.75, 1.15].forEach(function (h) { box(b.walls, r[1] - r[0], .05, .06, M.woodDark, (r[0] + r[1]) / 2, h - .05, z); });
      for (var xx = r[0] + .1; xx < r[1]; xx += .2) box(b.walls, .03, .6, .03, M.woodDark, xx, .55, z);
    });
  });
  wall(b.floor, [x0, -hz], [x0, hz], .15, .15, .45, M.conc, []);
  wall(b.walls, [x0, -hz], [x0, hz], .10, .45, 1.15, M.slat, []);                  // testero oeste con muro bajo
  polyWall(b.walls, M.wood, x0, .08, [[-hz, yE + .1], [hz, yE + .1], [hz, roofUnder(hz)], [0, yR - .17], [-hz, roofUnder(hz)]]);
  [-.55, .55].forEach(function (z) { box(b.walls, .05, .40, .55, M.mesh, x0 + .06, 3.85, z); });

  /* cocina + almacén cerrados (ejes 5-7) */
  [-hz, hz].forEach(function (z) {
    var ops = (z > 0) ? [{ a: 15.3 - LX / 2, b: 16.3 - LX / 2, y0: .45, y1: 2.40 }, { a: 16.8 - LX / 2, b: 17.8 - LX / 2, y0: .45, y1: 2.40 }] : [];
    wall(b.floor, [xk, z], [x1, z], .15, .15, .45, M.conc, []);
    wall(b.walls, [xk, z], [x1, z], .10, .45, 2.40, M.slat, ops);
    ops.forEach(function (o) { door(b.walls, (o.a + o.b) / 2, z, 'x', o.b - o.a, .45, 1.95); });
    band(b.walls, [xk, z], [x1, z], 2.40, yE);
    wall(b.walls, [xk, z], [x1, z], .08, yE, roofUnder(hz), M.wood, []);
  });
  wall(b.floor, [x1, -hz], [x1, hz], .15, .15, .45, M.conc, []);
  wall(b.walls, [x1, -hz], [x1, hz], .10, .45, 2.40, M.wood, []);
  band(b.walls, [x1, -hz], [x1, hz], 2.40, yE);
  polyWall(b.walls, M.wood, x1, .10, [[-hz, yE], [hz, yE], [hz, roofUnder(hz)], [0, yR - .17], [-hz, roofUnder(hz)]]);
  [-.55, .55].forEach(function (z) { box(b.walls, .05, .40, .55, M.mesh, x1 + .06, 3.85, z); });
  /* tabique eje 5 (cerramiento hasta la cubierta) con puerta y separación cocina/almacén */
  wall(b.walls, [xk, -hz], [xk, hz], .10, .15, 2.40, M.wood, [{ a: -1.5, b: -.5, y0: .15, y1: 2.30 }]);
  polyWall(b.walls, M.wood, xk, .08, [[-hz, 2.40], [hz, 2.40], [hz, roofUnder(hz)], [0, yR - .17], [-hz, roofUnder(hz)]]);
  wall(b.walls, [xk, .85], [x1, .85], .08, .15, 2.40, M.wood, [{ a: 15.9 - LX / 2, b: 16.9 - LX / 2, y0: .15, y1: 2.30 }]);

  /* estructura de madera */
  axs.forEach(function (x) {
    [-hz, hz].forEach(function (z) { box(b.struct, .15, yE - .15, .15, M.woodDark, x, .15, z); });
    [-1, 1].forEach(function (sd) { beam(b.struct, M.woodDark, V(x, 2.55, sd * hz), V(x, 3.15, sd * (hz + 1.15)), .07, .10); });
  });
  [-hz, hz].forEach(function (z) { boxX(b.struct, LX + .3, .16, .12, M.woodDark, 0, yE, z); });

  /* armadura */
  axs.forEach(function (x) {
    box(b.roofS, .08, .14, 2 * hz + .2, M.woodDark, x, yE, 0);
    [-1, 1].forEach(function (sd) { beam(b.roofS, M.woodDark, V(x, yE - .17, sd * half), V(x, yR - .17, 0), .06, .15); });
    box(b.roofS, .08, roofUnder(0) - yE - .14, .08, M.woodDark, x, yE + .14, 0);
    [-1, 1].forEach(function (sd) { beam(b.roofS, M.woodDark, V(x, yE + .16, 0), V(x, roofUnder(1.6) - .08, sd * 1.6), .06, .10); });
  });
  [1.0, 2.1, 3.2].forEach(function (t) {
    [-1, 1].forEach(function (sd) {
      var z = sd * (half - t * Math.cos(a));
      boxX(b.roofS, LX + 2.5, .06, .09, M.woodDark, 0, yR - Math.abs(z) * s - .25, z);
    });
  });
  boxX(b.roofS, LX + 2.5, .10, .12, M.woodDark, 0, yR - .27, 0);

  /* cobertura */
  var rx0 = -1.28 - LX / 2, rx1 = LX / 2 + 1.2;
  gableRoof(b.roof, M.roof, rx0, rx1, 0, half, yE, yR, M.roof);
  [-1, 1].forEach(function (sd) {
    var zc = sd * (hz + half) / 2, len = (half - hz) / Math.cos(a);
    panelSegs(b.roof, M.wood, rx1 - rx0, .02, len, (rx0 + rx1) / 2, yR - Math.abs(zc) * s - .17, zc, sd * a);
  });
  [[rx0 + .1, -half + .1], [rx0 + .1, half - .1], [rx1 - .1, -half + .1], [rx1 - .1, half - .1]].forEach(function (p) { downpipe(b.roof, p[0], p[1], yE); });

  /* equipos y mobiliario */
  var kx = 17.15 - LX / 2, kz = -hz + .95;
  box(b.furn, 1.30, .85, .80, M.brick, kx, .15, kz);                                // cocina mejorada
  box(b.furn, 1.00, .06, .60, M.steel, kx, 1.0, kz);
  cyl(b.furn, M.steel, .08, 5.75, kx + .4, 1.0, kz - .1, 12);                       // chimenea (sobre la cumbrera)
  cyl(b.furn, M.steel, .13, .10, kx + .4, 5.55, kz - .1, 12);
  table(b.furn, 13.6 - LX / 2, -2.3, 1.5, .7, .85);                                 // mesa de trabajo
  table(b.furn, 15.6 - LX / 2, -.3 + .05, 4.3, .55, .85);
  box(b.furn, 1.8, .85, .6, M.conc, 13.2 - LX / 2, .15, -hz + .45);                 // lavadero de platos
  box(b.furn, 1.4, .85, .6, M.conc, 14.9 - LX / 2, .15, -hz + .45);                 // lavadero de ollas
  [13.2, 14.6, 16.1, 17.4].forEach(function (x) { box(b.furn, 1.14, 1.8, .40, M.woodDark, x - LX / 2, .15, hz - .3); });   // anaqueles
  for (var ix = 0; ix < 4; ix++) for (var iz = 0; iz < 2; iz++) {                   // comedor: 8 mesas con bancas
    var tx = (1.5 + ix * 3.0) - LX / 2, tz = (iz ? 1.35 : -1.35);
    table(b.furn, tx, tz, .8, 2.3, .75);
    [-.7, .7].forEach(function (dx) { box(b.furn, .3, .05, 2.3, M.woodDark, tx + dx, .15 + .40, tz); [-1, 1].forEach(function (e) { box(b.furn, .05, .40, .05, M.woodDark, tx + dx, .15, tz + e * 1.05); }); });
  }
  return b;
}

/* ====================================================================================
 * 9. Entorno: terreno, losa deportiva, pabellones existentes, SS.HH., biodigestores, árboles
 * ==================================================================================== */
var ENV = new T.Group(); ENV.name = 'entorno'; scene.add(ENV);
var TREES = new T.Group(); TREES.name = 'arboles'; scene.add(TREES);

var ground = new T.Mesh(new T.PlaneGeometry(1400, 1400), groundMat);
ground.rotation.x = -PI / 2; ground.position.y = -.02; ground.receiveShadow = true;
scene.add(ground);

function flat(mat, w, d, x, z, y, parent) {
  var m = new T.Mesh(new T.PlaneGeometry(w, d), mat);
  m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; (parent || ENV).add(m); return m;
}
flat(earthMat, 60, 74, 22, 62, .01);                                             // área de circulación (tierra natural)

var slab = new T.Mesh(new T.BoxGeometry(20.45, .12, 31.4), [courtMat, courtMat, courtMat, courtMat, courtMat, courtMat].map(function (m, i) { return i === 2 ? courtMat : M.conc; }));
slab.position.set(20.6, .0, 57.05); slab.receiveShadow = true;
slab.geometry.attributes.uv.needsUpdate = true;
slab.userData.info = { title: 'Losa deportiva (concreto)', rows: [['Dimensiones', '≈ 20.4 × 31.4 m'], ['Cota', 'NPT +0.00'], ['Lámina', 'IMP-01 propuesta de implantación']] };
ENV.add(slab);

/* pabellón existente: cuerpo + cobertura a dos aguas (largo en X local) */
function pabellon(uc, vc, len, w, alongU, title) {
  var g = new T.Group(); g.position.set(uc, 0, vc); g.rotation.y = alongU ? 0 : -PI / 2;
  box(g, len, .30, w, M.conc, 0, 0, 0);
  box(g, len - .3, 3.0, w - 2.0, M.plasterOld, 0, .30, -.35);
  box(g, len, .12, 2.0, M.conc, 0, .30, w / 2 - 1.0);                                // corredor/galería
  for (var i = 0; i < Math.floor((len - 1) / 3.6); i++) {
    var wx = -len / 2 + 2.2 + i * 3.6;
    box(g, 1.5, 1.0, .06, M.glass, wx, 1.6, (w - 2.0) / 2 - .35 + .04);
    box(g, 1.5, 1.0, .06, M.glass, wx, 1.6, -(w - 2.0) / 2 - .35 - .04);
    box(g, .18, 3.0, .18, M.woodDark, wx + 1.8, .3, w / 2 - .15);
  }
  gableRoof(g, M.roofOld, -len / 2 - .2, len / 2 + .2, 0, w / 2 + .3, 3.35, 4.55, M.roofOld);
  g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.info = { title: title, rows: [['Estado', 'Existente — referencial (no forma parte de la intervención)'], ['Dimensiones', len.toFixed(1) + ' × ' + w.toFixed(1) + ' m'], ['Lámina', 'IMP-01']] };
  ENV.add(g);
  return g;
}
pabellon(41.8, 76.0, 37.0, 6.4, false, 'Pabellón de aulas (existente) + SS.HH. H-M');
pabellon(28.0, 91.3, 34.4, 6.4, true, 'Pabellón de aulas (existente)');
pabellon(3.3, 81.8, 5.4, 5.0, true, 'Aula de reforzamiento (existente)');

/* SS.HH. referenciales (ubicación según implantación) */
function sshhBloque(uc, vc, len, w, alongU, title, rotExtra) {
  var g = new T.Group(); g.position.set(uc, 0, vc); g.rotation.y = alongU ? 0 : -PI / 2;
  box(g, len, .15, w, M.conc, 0, 0, 0);
  box(g, len - .3, 2.7, w - .3, M.plaster, 0, .15, 0);
  gableRoof(g, M.roof, -len / 2 - .2, len / 2 + .2, 0, w / 2 + .4, 2.75, 3.5, M.roof);
  g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.info = { title: title, rows: [['Estado', 'Proyectado — ubicación referencial según IMP-01'], ['Dimensiones', len.toFixed(1) + ' × ' + w.toFixed(1) + ' m (aprox.)'], ['Detalle', 'Láminas de detalle sanitario / instalaciones']] };
  ENV.add(g);
}
sshhBloque(38.0, 32.0, 4.8, 2.3, true, 'SS.HH. Residencia Mujeres');
sshhBloque(39.0, 37.1, 4.8, 2.3, true, 'SS.HH. Residencia Hombres');
sshhBloque(3.4, 29.9, 9.2, 3.0, false, 'SS.HH. Residencia Hombres');
sshhBloque(4.3, 40.7, 4.8, 3.0, false, 'SS.HH. Residencia Hombres');

/* biodigestores (3) y área proyectada para el sistema de desagüe */
var bio = new T.Group(); bio.userData.info = { title: 'Biodigestores', rows: [['Cantidad', '3 unidades (referencial)'], ['Lámina', 'IMP-01 / detalle sanitario']] };
[[-1.6, 0.1], [0, 0.3], [1.6, -.5]].forEach(function (p) {
  cyl(bio, M.bio, .62, 1.5, 38.3 + p[0], 0, 30.0 + p[1], 20);
  var dome = new T.Mesh(new T.SphereGeometry(.62, 20, 8, 0, 2 * PI, 0, PI / 2), M.bio);
  dome.position.set(38.3 + p[0], 1.5, 30.0 + p[1]); dome.castShadow = true; bio.add(dome);
  cyl(bio, M.steel, .18, .12, 38.3 + p[0], 2.0, 30.0 + p[1], 12);
});
ENV.add(bio);
(function () {
  var pts = [];
  for (var i = 0; i <= 96; i++) { var an = i / 96 * 2 * PI; pts.push(new T.Vector3(36.7 + 3.8 * Math.cos(an), .06, 19.0 + 3.8 * Math.sin(an))); }
  var ln = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0x2b2f33, dashSize: .6, gapSize: .4 }));
  ln.computeLineDistances(); ENV.add(ln);
})();

/* árboles (instanciados) evitando huellas de edificios */
(function () {
  var r = rng(42), N = 320, list = [], tries = 0;
  while (list.length < N && tries < 4000) {                                  // sin árboles cerca del conjunto
    tries++;
    var u = -70 + r() * 170, v = -40 + r() * 190;
    if (u > -22 && u < 66 && v > 2 && v < 114) continue;
    list.push([u, v, 1.5 + r() * 1.7, r()]);
  }
  var canopy = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), M.leaf, list.length);
  var trunk = new T.InstancedMesh(new T.CylinderGeometry(.2, .32, 1, 7), M.trunk, list.length);
  var dm = new T.Object3D(), col = new T.Color();
  list.forEach(function (t, i) {
    var h = 3.2 + t[2] * 1.1;
    dm.position.set(t[0], h / 2, t[1]); dm.scale.set(1, h, 1); dm.rotation.set(0, 0, 0); dm.updateMatrix(); trunk.setMatrixAt(i, dm.matrix);
    dm.position.set(t[0], h + t[2] * .55, t[1]); dm.scale.set(t[2], t[2] * .85, t[2]); dm.rotation.y = t[3] * 6; dm.updateMatrix(); canopy.setMatrixAt(i, dm.matrix);
    col.setHSL(.26 + t[3] * .07, .45 + t[3] * .15, .22 + t[3] * .12); canopy.setColorAt(i, col);
  });
  canopy.castShadow = trunk.castShadow = true; canopy.receiveShadow = true;
  TREES.add(canopy); TREES.add(trunk);
})();

/* ====================================================================================
 * 10. Ensamble del conjunto (posiciones/giros tomados de IMP-01)
 * ==================================================================================== */
var mujeres = buildMujeres(), varones = buildVarones(), cocina = buildCocina();
mujeres.root.position.set(20.8, 0, 30.4);                                  // dormitorio al norte de la losa, eje paralelo
varones.root.position.set(1.55, 0, 58.4); varones.root.rotation.y = PI / 2; // al oeste de la losa
cocina.root.position.set(40.1, 0, 48.3); cocina.root.rotation.y = -PI / 2;  // al este de la losa

/* ====================================================================================
 * 10b. Proceso constructivo — seguimiento de avance de obra
 *   Cada elemento del modelo pertenece a una etapa (PH). El avance de una etapa (0–1) hace que
 *   sus piezas aparezcan en orden a lo largo del edificio; lo pendiente puede verse como fantasma.
 * ==================================================================================== */
var PH = [   // s/e = ventana del cronograma referencial (fracción del plazo) · w = peso en el avance físico (%)
  { k: 'prelim', n: 'Trabajos preliminares y trazo', c: '#8b95a1', s: 0.00, e: 0.07, w: 2 },
  { k: 'exc',    n: 'Excavación de zanjas',          c: '#7a5a3a', s: 0.05, e: 0.17, w: 3 },
  { k: 'found',  n: 'Cimentación',                   c: '#8f8f88', s: 0.13, e: 0.31, w: 12 },
  { k: 'floor',  n: 'Sobrecimientos, pisos y veredas', c: '#b3b3aa', s: 0.27, e: 0.44, w: 11 },
  { k: 'struct', n: 'Columnas y vigas de madera',    c: '#8b5a33', s: 0.40, e: 0.58, w: 14 },
  { k: 'roofS',  n: 'Armadura de techo',             c: '#a5763f', s: 0.54, e: 0.68, w: 11 },
  { k: 'roof',   n: 'Cobertura y canaletas',         c: '#c2412d', s: 0.64, e: 0.79, w: 12 },
  { k: 'walls',  n: 'Muros y cerramientos',          c: '#c99a6a', s: 0.72, e: 0.93, w: 23 },
  { k: 'furn',   n: 'Mobiliario y acabados',         c: '#5f9bd6', s: 0.86, e: 1.00, w: 12 }
];
var PK = PH.map(function (p) { return p.k; });
var BW = { mujeres: .49, varones: .26, cocina: .25 };          // peso de cada edificio (por área techada)
var STAG = { mujeres: 0, varones: .03, cocina: .05 };           // desfase de inicio en el cronograma
var mTrench = new T.MeshStandardMaterial({ color: 0x3d2b1c, roughness: 1 });
var mLime = new T.MeshStandardMaterial({ color: 0xf3f1e4, roughness: 1 });
var ghostMat = new T.MeshBasicMaterial({ color: 0x4f8ff0, transparent: true, opacity: .13, depthWrite: false });

/* replanteo (caballetes y cordeles), trazo con cal y zanjas — a partir de los cimientos del edificio */
function makeReplanteo(b) {
  var s = b.strips;
  if (!s.length) return;
  var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  s.forEach(function (q) {
    x0 = Math.min(x0, q[0], q[2]); x1 = Math.max(x1, q[0], q[2]); z0 = Math.min(z0, q[1], q[3]); z1 = Math.max(z1, q[1], q[3]);
  });
  x0 -= 1.3; x1 += 1.3; z0 -= 1.3; z1 += 1.3;
  var g = b.prelim;
  [[x0, z0, 1, 1], [x1, z0, -1, 1], [x1, z1, -1, -1], [x0, z1, 1, -1]].forEach(function (c) {
    box(g, .06, .7, .06, M.woodDark, c[0], 0, c[1]);
    box(g, .06, .7, .06, M.woodDark, c[0] + c[2] * .9, 0, c[1]);
    box(g, .06, .7, .06, M.woodDark, c[0], 0, c[1] + c[3] * .9);
    box(g, .9, .10, .02, M.wood, c[0] + c[2] * .45, .55, c[1]);
    box(g, .02, .10, .9, M.wood, c[0], .55, c[1] + c[3] * .45);
  });
  lineBox(g, x0, z0, x1, z0, .012, .012, .6, M.white, 0); lineBox(g, x0, z1, x1, z1, .012, .012, .6, M.white, 0);
  lineBox(g, x0, z0, x0, z1, .012, .012, .6, M.white, 0); lineBox(g, x1, z0, x1, z1, .012, .012, .6, M.white, 0);
  s.forEach(function (q) {
    lineBox(g, q[0], q[1], q[2], q[3], .05, .012, .012, mLime, q[4]);                    // trazo con cal
    lineBox(b.exc, q[0], q[1], q[2], q[3], q[4] + .3, .02, 0, mTrench, q[4] + .3);        // zanja excavada
  });
}
BUILDINGS.forEach(makeReplanteo);

/* ordena las piezas de cada etapa a lo largo del edificio (eje X local) para que "crezcan" en secuencia */
function collectItems() {
  BUILDINGS.forEach(function (b) {
    b.root.updateMatrixWorld(true);
    b.items = {};
    PK.forEach(function (k) {
      var arr = [];
      b[k].traverse(function (o) {
        if (!o.isMesh) return;
        var c = new T.Box3().setFromObject(o).getCenter(new T.Vector3());
        b.root.worldToLocal(c);
        o.userData.key = c.x + .15 * c.y + .001 * c.z;
        o.userData.orig = { mat: o.material, cast: o.castShadow };
        arr.push(o);
      });
      arr.sort(function (p, q) { return p.userData.key - q.userData.key; });
      b.items[k] = arr;
    });
  });
}
collectItems();

var obra = { on: false, mode: 'crono', tau: .45, ghost: true, playing: false, speed: 1, inicio: '', plazo: 120, corte: '', notas: '', real: {} };
(function () {
  var hoy = new Date().toISOString().slice(0, 10);
  obra.inicio = obra.corte = hoy;
  BUILDINGS.forEach(function (b) { obra.real[b.id] = PH.map(function () { return 0; }); });
  try {
    var sv = JSON.parse(localStorage.getItem('visor3d_avance_v1') || 'null');
    if (sv) {
      ['inicio', 'plazo', 'corte', 'notas', 'ghost'].forEach(function (k) { if (sv[k] !== undefined) obra[k] = sv[k]; });
      if (sv.real) BUILDINGS.forEach(function (b) { if (sv.real[b.id] && sv.real[b.id].length === PH.length) obra.real[b.id] = sv.real[b.id]; });
    }
  } catch (e) { /* sin almacenamiento local */ }
})();
function saveObra() {
  try {
    localStorage.setItem('visor3d_avance_v1', JSON.stringify({ inicio: obra.inicio, plazo: obra.plazo, corte: obra.corte, notas: obra.notas, ghost: obra.ghost, real: obra.real }));
  } catch (e) { /* ignorar */ }
}

function scheduleAt(t) {                         // avance programado por edificio y etapa en el instante t (0–1)
  var P = {};
  BUILDINGS.forEach(function (b) {
    var d = STAG[b.id] || 0;
    P[b.id] = PH.map(function (p) {
      var s = d + p.s * .95, e = d + p.e * .95;
      return Math.max(0, Math.min(1, (t - s) / (e - s)));
    });
  });
  return P;
}
function pctOf(p) { var a = 0; PH.forEach(function (ph, i) { a += ph.w * p[i]; }); return a / 100; }
function totalOf(P) { var a = 0; BUILDINGS.forEach(function (b) { a += (BW[b.id] || 0) * pctOf(P[b.id]); }); return a; }

function setMeshState(m, built) {
  var o = m.userData.orig;
  if (built) { m.visible = true; m.material = o.mat; m.castShadow = o.cast; }
  else if (obra.ghost) { m.visible = true; m.material = ghostMat; m.castShadow = false; }
  else m.visible = false;
}
function applyProgress(P) {
  BUILDINGS.forEach(function (b) {
    var p = P[b.id];
    b.prelim.visible = b.exc.visible = true;
    b.found.position.y = .06;                    // cimientos concretados, visibles a nivel de terreno
    PK.forEach(function (k, i) {
      var arr = b.items[k], n = arr.length;
      arr.forEach(function (m, j) {
        var built = (j + .5) / n <= p[i] + 1e-9;
        if (k === 'prelim') m.visible = built && p[2] < .999;
        else if (k === 'exc') m.visible = built && !(p[2] > (j + 1) / n);
        else setMeshState(m, built);
      });
    });
  });
}
function restoreFinal() {
  BUILDINGS.forEach(function (b) {
    b.prelim.visible = b.exc.visible = false;
    b.found.position.y = 0;
    PK.slice(2).forEach(function (k) { b.items[k].forEach(function (m) { setMeshState(m, true); }); });
  });
}

/* ====================================================================================
 * 11. Interfaz
 * ==================================================================================== */
var $ = function (id) { return document.getElementById(id); };
var pbody = $('pbody');
function section(title, open) {
  var d = document.createElement('details'); if (open !== false) d.open = true;
  var s = document.createElement('summary'); s.textContent = title; d.appendChild(s);
  var c = document.createElement('div'); c.className = 'sec'; d.appendChild(c);
  pbody.appendChild(d); return c;
}
function check(parent, label, checked, cb, color) {
  var l = document.createElement('label'); l.className = 'chk';
  var i = document.createElement('input'); i.type = 'checkbox'; i.checked = checked;
  i.addEventListener('change', function () { cb(i.checked); });
  l.appendChild(i);
  if (color) { var sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = color; l.appendChild(sw); }
  l.appendChild(document.createTextNode(label));
  parent.appendChild(l); return i;
}
function slider(parent, label, min, max, step, val, fmt, cb) {
  var r = document.createElement('div'); r.className = 'row';
  r.innerHTML = '<span class="k">' + label + '</span>';
  var i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
  var o = document.createElement('output'); o.textContent = fmt(val);
  i.addEventListener('input', function () { o.textContent = fmt(+i.value); cb(+i.value); });
  r.appendChild(i); r.appendChild(o); parent.appendChild(r); return i;
}
function btn(parent, label, cb) {
  var b = document.createElement('button'); b.textContent = label; b.addEventListener('click', function () { cb(b); }); parent.appendChild(b); return b;
}

/* -- cámara: vuelos suaves -- */
var fly = null;
function flyTo(pos, tgt) { fly = { p: pos.clone(), t: tgt.clone() }; }
controls.addEventListener('start', function () { fly = null; });
function viewOf(name) {
  var c = CENTER.clone(), d = 118;
  var map = {
    iso: [c.x + 78, 62, c.z + 100], planta: [c.x, 150, c.z + .01],
    frente: [c.x, 26, c.z + d], fondo: [c.x, 26, c.z - d], izq: [c.x - d, 26, c.z], der: [c.x + d, 26, c.z]
  };
  var p = map[name]; flyTo(V(p[0], p[1], p[2]), c);
}
function focusOn(o) {
  var bb = new T.Box3().setFromObject(o.root), ctr = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3());
  var dist = Math.max(sz.x, sz.z) * 1.05 + 8;
  ctr.y = 1.5;
  flyTo(ctr.clone().add(V(.55, .55, .95).normalize().multiplyScalar(dist)), ctr);
}

/* -- Avance de obra: panel, línea de tiempo y registro de avance real -- */
function addDays(iso, d) { var t = new Date(iso + 'T12:00:00'); t.setDate(t.getDate() + Math.round(d)); return t; }
function fmtD(dt) { return dt.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtISO(iso) { return fmtD(new Date(iso + 'T12:00:00')); }
function tauOfDate(iso) {
  var a = new Date(obra.inicio + 'T12:00:00'), b = new Date(iso + 'T12:00:00');
  return Math.max(0, Math.min(1, ((b - a) / 86400000) / Math.max(1, obra.plazo)));
}
function currentP() { return obra.mode === 'crono' ? scheduleAt(obra.tau) : obra.real; }
function shortName(b) { return b.name.replace('Residencia ', '').replace(' - Comedor', ''); }

var sObra = section('Avance de obra');
check(sObra, 'Ver por procesos constructivos', false, function (v) { obra.on = v; refresh(); });
var mrow = document.createElement('div'); mrow.className = 'btns'; mrow.style.margin = '6px 0'; sObra.appendChild(mrow);
var bCrono = btn(mrow, 'Cronograma', function () { obra.on = true; obra.mode = 'crono'; syncObraChk(); refresh(); });
var bReal = btn(mrow, 'Avance real', function () { obra.on = true; obra.mode = 'real'; syncObraChk(); refresh(); });
check(sObra, 'Mostrar lo pendiente como fantasma', obra.ghost, function (v) { obra.ghost = v; saveObra(); refresh(); });
var rIni = document.createElement('div'); rIni.className = 'row';
rIni.innerHTML = '<span class="k">Inicio de obra</span><input type="date" id="oini">'; sObra.appendChild(rIni);
var rPlz = document.createElement('div'); rPlz.className = 'row';
rPlz.innerHTML = '<span class="k">Plazo (días)</span><input type="number" id="oplz" min="10" max="900" step="5" style="width:80px">'; sObra.appendChild(rPlz);
var oSum = document.createElement('div'); oSum.id = 'osum'; sObra.appendChild(oSum);
var bReg = btn(sObra, 'Registrar avance real…', function () { obra.on = true; obra.mode = 'real'; syncObraChk(); refresh(); openModal(); });
bReg.className = 'wide primary';
function syncObraChk() { sObra.querySelector('input[type=checkbox]').checked = obra.on; }
$('oini').value = obra.inicio; $('oplz').value = obra.plazo;
$('oini').addEventListener('change', function () { obra.inicio = this.value || obra.inicio; saveObra(); refresh(); });
$('oplz').addEventListener('change', function () { obra.plazo = Math.max(10, +this.value || 120); saveObra(); refresh(); });

var tl = $('timeline'), rb = $('realbar');
tl.innerHTML = '<div class="tl-row"><button id="tplay" class="tbtn" title="Reproducir">▶</button>' +
  '<input id="tslider" type="range" min="0" max="1000" value="' + Math.round(obra.tau * 1000) + '">' +
  '<span id="tdate"></span><select id="tspeed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></div>' +
  '<div class="chips" id="tchips"></div><div id="tnow"></div>';
PH.forEach(function (ph, i) {
  var c = document.createElement('button'); c.className = 'chip'; c.dataset.i = i;
  c.innerHTML = '<span class="sw" style="background:' + ph.c + '"></span>' + ph.n;
  c.title = 'Ir al fin de esta etapa';
  c.addEventListener('click', function () { obra.playing = false; obra.tau = Math.min(1, .05 + ph.e * .95); $('tslider').value = obra.tau * 1000; $('tplay').textContent = '▶'; refresh(); });
  $('tchips').appendChild(c);
});
$('tslider').addEventListener('input', function () { obra.playing = false; $('tplay').textContent = '▶'; obra.tau = this.value / 1000; refresh(); });
$('tplay').addEventListener('click', function () {
  if (obra.tau >= .999) obra.tau = 0;
  obra.playing = !obra.playing; this.textContent = obra.playing ? '❚❚' : '▶';
});
$('tspeed').addEventListener('change', function () { obra.speed = +this.value; });
rb.innerHTML = '<span id="rtxt"></span><button id="rreg" class="primary">Registrar avance…</button>';
$('rreg').addEventListener('click', function () { openModal(); });

function renderSummary(P) {
  var h = '';
  BUILDINGS.forEach(function (b) {
    var v = Math.round(pctOf(P[b.id]) * 100);
    h += '<div class="pb"><span>' + shortName(b) + '</span><div class="bar"><i style="width:' + v + '%"></i></div><b>' + v + '%</b></div>';
  });
  var t = Math.round(totalOf(P) * 100);
  h += '<div class="pb tot"><span>Total obra</span><div class="bar"><i style="width:' + t + '%"></i></div><b>' + t + '%</b></div>';
  oSum.innerHTML = h;
}
function updateBars(P) {
  var chips = $('tchips').children, act = [];
  PH.forEach(function (ph, i) {
    var vals = BUILDINGS.map(function (b) { return P[b.id][i]; });
    var done = vals.every(function (v) { return v >= .999; }), any = vals.some(function (v) { return v > 0; });
    chips[i].classList.toggle('done', done); chips[i].classList.toggle('act', any && !done);
    if (any && !done) act.push(ph.n + ' ' + Math.round(vals.reduce(function (a, v) { return a + v; }, 0) / vals.length * 100) + '%');
  });
  if (obra.mode === 'crono') {
    var dia = Math.round(obra.tau * obra.plazo);
    $('tdate').textContent = 'Día ' + dia + ' / ' + obra.plazo + ' · ' + fmtD(addDays(obra.inicio, dia));
    var tot = totalOf(P);
    $('tnow').innerHTML = '<b>Avance programado ' + Math.round(tot * 100) + '%</b> · ' + (tot < .001 ? 'Terreno sin intervenir' : tot > .999 ? 'Obra terminada' : 'En ejecución: ' + act.join(' · '));
  } else {
    var prog = totalOf(scheduleAt(tauOfDate(obra.corte))), real = totalOf(P);
    var d = Math.round((real - prog) * 100);
    $('rtxt').innerHTML = '<b>Avance real al ' + fmtISO(obra.corte) + '</b> — ' +
      BUILDINGS.map(function (b) { return shortName(b) + ' ' + Math.round(pctOf(P[b.id]) * 100) + '%'; }).join(' · ') +
      ' — Total <b>' + Math.round(real * 100) + '%</b> <span class="' + (d >= 0 ? 'ok' : 'bad') + '">(programado ' + Math.round(prog * 100) + '% · ' + (d >= 0 ? '+' : '') + d + ' pts)</span>';
  }
}
function refresh() {
  $('timeline').style.display = obra.on && obra.mode === 'crono' ? 'block' : 'none';
  $('realbar').style.display = obra.on && obra.mode === 'real' ? 'flex' : 'none';
  bCrono.classList.toggle('on', obra.on && obra.mode === 'crono'); bReal.classList.toggle('on', obra.on && obra.mode === 'real');
  oSum.style.display = obra.on ? 'block' : 'none';
  $('hint').style.display = obra.on ? 'none' : '';
  if (!obra.on) { restoreFinal(); return; }
  var P = currentP(); applyProgress(P); renderSummary(P); updateBars(P);
}

/* ventana de registro de avance real */
function openModal() {
  var card = $('mcard');
  var h = '<button class="x" id="mx">×</button><h3>Registrar avance real de obra</h3>' +
    '<div class="mrow"><label>Fecha de corte <input type="date" id="mcorte" value="' + obra.corte + '"></label><span id="mprog"></span></div>' +
    '<div class="mscroll"><table id="mtab"><thead><tr><th>Proceso constructivo</th><th>Peso</th>' +
    BUILDINGS.map(function (b) { return '<th>' + shortName(b) + '</th>'; }).join('') + '</tr></thead><tbody>';
  PH.forEach(function (ph, i) {
    h += '<tr><td><span class="sw" style="background:' + ph.c + '"></span> ' + ph.n + '</td><td>' + ph.w + '%</td>' +
      BUILDINGS.map(function (b) {
        var v = Math.round(obra.real[b.id][i] * 100);
        return '<td><input type="range" min="0" max="100" step="5" data-b="' + b.id + '" data-i="' + i + '" value="' + v + '"><output>' + v + '%</output></td>';
      }).join('') + '</tr>';
  });
  h += '</tbody><tfoot><tr><td>Avance físico del edificio</td><td>100%</td>' + BUILDINGS.map(function (b) { return '<td id="mt_' + b.id + '"></td>'; }).join('') +
    '</tr><tr><td colspan="2"><b>Avance total de la obra</b> <small>(peso por área techada)</small></td><td colspan="' + BUILDINGS.length + '" id="mtot"></td></tr></tfoot></table></div>' +
    '<textarea id="mnotes" placeholder="Observaciones de obra: partidas ejecutadas, incidencias, fechas de vaciado, etc."></textarea>' +
    '<div class="mbtns"><button id="mfill">Rellenar según cronograma</button><button id="mzero">Poner en 0</button>' +
    '<button id="mexp">Exportar (.json)</button><button id="mimp">Importar…</button><input type="file" id="mfile" accept=".json,application/json" style="display:none">' +
    '<span style="flex:1"></span><button id="mok" class="primary">Listo</button></div>';
  card.innerHTML = h;
  $('mnotes').value = obra.notas;
  $('modal').style.display = 'flex';
  modalTotals();
  $('mx').onclick = $('mok').onclick = function () { $('modal').style.display = 'none'; };
  $('mtab').addEventListener('input', function (e) {
    var t = e.target; if (t.type !== 'range') return;
    obra.real[t.dataset.b][+t.dataset.i] = t.value / 100; t.nextSibling.textContent = t.value + '%';
    saveObra(); modalTotals(); if (obra.on && obra.mode === 'real') refresh();
  });
  $('mcorte').addEventListener('change', function () { obra.corte = this.value || obra.corte; saveObra(); modalTotals(); refresh(); });
  $('mnotes').addEventListener('input', function () { obra.notas = this.value; saveObra(); });
  $('mfill').onclick = function () {
    var P = scheduleAt(tauOfDate(obra.corte));
    BUILDINGS.forEach(function (b) { obra.real[b.id] = P[b.id].map(function (v) { return Math.round(v * 20) / 20; }); });
    saveObra(); openModal(); refresh();
  };
  $('mzero').onclick = function () { BUILDINGS.forEach(function (b) { obra.real[b.id] = PH.map(function () { return 0; }); }); saveObra(); openModal(); refresh(); };
  $('mexp').onclick = function () {
    var out = {
      obra: 'Residencia estudiantil I.E. 16722 (Bagua)', fecha_corte: obra.corte, inicio: obra.inicio, plazo_dias: obra.plazo, notas: obra.notas,
      procesos: PH.map(function (p) { return p.n; }), real: obra.real,
      resumen: BUILDINGS.reduce(function (a, b) { a[b.id] = Math.round(pctOf(obra.real[b.id]) * 1000) / 10; return a; }, { total: Math.round(totalOf(obra.real) * 1000) / 10 })
    };
    var a = document.createElement('a'); a.download = 'avance_obra_' + obra.corte + '.json';
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    document.body.appendChild(a); a.click(); a.remove();
  };
  $('mimp').onclick = function () { $('mfile').click(); };
  $('mfile').onchange = function () {
    var f = this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        BUILDINGS.forEach(function (b) {
          if (d.real && d.real[b.id] && d.real[b.id].length === PH.length) obra.real[b.id] = d.real[b.id].map(function (v) { return Math.max(0, Math.min(1, +v || 0)); });
        });
        if (typeof d.inicio === 'string') obra.inicio = d.inicio;
        if (typeof d.fecha_corte === 'string') obra.corte = d.fecha_corte;
        if (typeof d.notas === 'string') obra.notas = d.notas;
        if (d.plazo_dias) obra.plazo = +d.plazo_dias;
        saveObra(); $('oini').value = obra.inicio; $('oplz').value = obra.plazo; openModal(); refresh();
      } catch (err) { alert('No se pudo leer el archivo de avance.'); }
    };
    r.readAsText(f);
  };
}
function modalTotals() {
  BUILDINGS.forEach(function (b) { var e = $('mt_' + b.id); if (e) e.innerHTML = '<b>' + Math.round(pctOf(obra.real[b.id]) * 100) + '%</b>'; });
  var real = totalOf(obra.real), prog = totalOf(scheduleAt(tauOfDate(obra.corte))), d = Math.round((real - prog) * 100);
  if ($('mtot')) $('mtot').innerHTML = '<b>' + Math.round(real * 100) + '%</b>';
  if ($('mprog')) $('mprog').innerHTML = 'Programado a esa fecha: <b>' + Math.round(prog * 100) + '%</b> · <span class="' + (d >= 0 ? 'ok' : 'bad') + '">' + (d >= 0 ? '+' : '') + d + ' pts</span>';
}
$('modal').addEventListener('pointerdown', function (e) { if (e.target === this) this.style.display = 'none'; });

var s1 = section('Vistas');
var g1 = document.createElement('div'); g1.className = 'btns'; s1.appendChild(g1);
[['Isométrica', 'iso'], ['Planta', 'planta'], ['Frente', 'frente'], ['Fondo', 'fondo'], ['Izquierda', 'izq'], ['Derecha', 'der']].forEach(function (v) {
  btn(g1, v[0], function () { viewOf(v[1]); });
});
var s1b = section('Ir a un edificio');
var g1b = document.createElement('div'); g1b.className = 'btns'; s1b.appendChild(g1b);
btn(g1b, 'Mujeres', function () { focusOn(mujeres); });
btn(g1b, 'Varones', function () { focusOn(varones); });
btn(g1b, 'Cocina-comedor', function () { focusOn(cocina); });
btn(g1b, 'Conjunto', function () { viewOf('iso'); });

var s2 = section('Edificios');
BUILDINGS.forEach(function (o) { check(s2, o.name, true, function (v) { o.root.visible = v; }); });
check(s2, 'Pabellones, SS.HH. y losa (entorno)', true, function (v) { ENV.visible = v; });
check(s2, 'Vegetación', true, function (v) { TREES.visible = v; });

var s3 = section('Capas de construcción');
LAYER_DEF.forEach(function (l) {
  check(s3, l[1], true, function (v) {
    LAYERS[l[0]].forEach(function (g) { g.visible = v; });
    if (l[0] === 'found') syncGround();
  }, l[2]);
});
var showFound = false;
function syncGround() {
  var foundOn = LAYERS.found[0].visible;
  groundMat.opacity = foundOn && xrayGround ? .28 : 1; groundMat.needsUpdate = true;
}
var xrayGround = false;
check(s3, 'Terreno translúcido (ver cimentación)', false, function (v) { xrayGround = v; syncGround(); });

var s4 = section('Corte y ambiente');
var clipOn = false, clipPlane = new T.Plane(new T.Vector3(0, -1, 0), 2.6);
var clipSlider = slider(s4, 'Altura', 0.2, 6, 0.05, 2.6, function (v) { return v.toFixed(2) + ' m'; }, function (v) { clipPlane.constant = v; });
var clipVOn = false, clipVPlane = new T.Plane(new T.Vector3(1, 0, 0), -28.19);   // conserva x > xc: se mira la sección desde el oeste
function applyClip() { renderer.clippingPlanes = (clipOn ? [clipPlane] : []).concat(clipVOn ? [clipVPlane] : []); }
var clipChk = check(s4, 'Corte horizontal (ver interior en planta)', false, function (v) { clipOn = v; applyClip(); });
var clipVSlider = slider(s4, 'Sección en X', 0, 60, 0.05, 28.19, function (v) { return v.toFixed(2) + ' m'; }, function (v) { clipVPlane.constant = -v; });
var clipVChk = check(s4, 'Corte vertical (sección transversal)', false, function (v) { clipVOn = v; applyClip(); });
var gCut = document.createElement('div'); gCut.className = 'btns'; s4.appendChild(gCut);
function setClip(chk, on) { chk.checked = on; chk.dispatchEvent(new Event('change')); }
function setSlider(s, v) { s.value = v; s.dispatchEvent(new Event('input')); }
/* Módulo SS.HH. mujeres: mundo x 18.83–32.73, z 21.48–25.58 (local ejes 1′–5′ × C–D + posición del dormitorio) */
btn(gCut, 'Corte SS.HH. mujeres: planta', function () {
  setSlider(clipSlider, 2.4); setClip(clipChk, true); setClip(clipVChk, false);
  flyTo(V(25.78, 22, 23.5 + .01), V(25.78, 0, 23.5));
});
btn(gCut, 'Corte SS.HH. mujeres: sección', function () {
  setSlider(clipVSlider, 28.19); setClip(clipChk, false); setClip(clipVChk, true);
  flyTo(V(15, 6.5, 17), V(28.19, 1.4, 23.5));
});
btn(gCut, 'Quitar cortes', function () { setClip(clipChk, false); setClip(clipVChk, false); });
slider(s4, 'Hora del día', 6, 18, 0.25, 11, function (v) { var h = Math.floor(v), m = Math.round((v - h) * 60); return h + ':' + (m < 10 ? '0' : '') + m; }, setHour);
check(s4, 'Sombras', true, function (v) { sun.castShadow = v; renderer.shadowMap.needsUpdate = true; scene.traverse(function (o) { if (o.material) o.material.needsUpdate = true; }); });
check(s4, 'Rotación automática', false, function (v) { controls.autoRotate = v; controls.autoRotateSpeed = 1.2; });

var s5 = section('Recorrido y captura');
var g5 = document.createElement('div'); g5.className = 'btns'; s5.appendChild(g5);
btn(g5, 'Entrar: Mujeres', function () { startWalk(20.8, 30.4, -PI / 2); });
btn(g5, 'Entrar: Varones', function () { startWalk(1.55, 58.4, 0); });
btn(g5, 'Entrar: Cocina', function () { startWalk(38.6, 48.3, PI); });
btn(g5, 'Guardar imagen', function () {
  renderer.render(scene, camera);
  var src = renderer.domElement, cv = document.createElement('canvas'), pad = obra.on ? 44 : 0;
  cv.width = src.width; cv.height = src.height + pad;
  var g = cv.getContext('2d');
  g.drawImage(src, 0, 0);
  if (obra.on) {                                            // pie con fecha y avance para informes de obra
    var P = currentP(), fecha = obra.mode === 'crono' ? fmtD(addDays(obra.inicio, Math.round(obra.tau * obra.plazo))) : fmtISO(obra.corte);
    g.fillStyle = '#1f2933'; g.fillRect(0, src.height, cv.width, pad);
    g.fillStyle = '#fff'; g.font = '600 ' + Math.round(pad * .42) + 'px Segoe UI, sans-serif'; g.textBaseline = 'middle';
    g.fillText('Residencia I.E. 16722 · ' + (obra.mode === 'crono' ? 'Cronograma' : 'Avance real') + ' al ' + fecha + ' · ' +
      BUILDINGS.map(function (b) { return shortName(b) + ' ' + Math.round(pctOf(P[b.id]) * 100) + '%'; }).join(' · ') + ' · Total ' + Math.round(totalOf(P) * 100) + '%', 14, src.height + pad / 2);
  }
  var a = document.createElement('a'); a.download = 'residencia_3d.png'; a.href = cv.toDataURL('image/png');
  document.body.appendChild(a); a.click(); a.remove();
});

/* -- ficha al hacer clic -- */
var ray = new T.Raycaster(), ptr = new T.Vector2(), downAt = null;
renderer.domElement.addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', function (e) {
  if (!downAt || walking || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) return;
  var r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  var hits = ray.intersectObjects([ENV, TREES].concat(BUILDINGS.map(function (o) { return o.root; })), true);
  for (var i = 0; i < hits.length; i++) {
    var o = hits[i].object;
    if (!o.visible) continue;
    while (o && !(o.userData && o.userData.info)) o = o.parent;
    if (o) { showInfo(o.userData.info); return; }
  }
  $('info').style.display = 'none';
});
function showInfo(inf) {
  $('ititle').textContent = inf.title;
  $('itable').innerHTML = inf.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
  $('info').style.display = 'block';
}
$('infox').addEventListener('click', function () { $('info').style.display = 'none'; });

/* -- panel plegable -- */
$('hide').addEventListener('click', function () { $('panel').classList.add('hidden'); });
$('toggle').addEventListener('click', function () { $('panel').classList.remove('hidden'); });

/* -- modo caminata -- */
var walking = false, yaw = 0, pitch = 0, keys = {}, saved = null, dragging = false, lx = 0, ly = 0;
function startWalk(x, z, y) {
  if (walking) return;
  saved = { p: camera.position.clone(), t: controls.target.clone() };
  walking = true; controls.enabled = false; fly = null;
  renderer.clippingPlanes = [];
  camera.position.set(x, 1.65, z); yaw = y; pitch = -.05;
  camera.rotation.order = 'YXZ'; camera.rotation.set(pitch, yaw, 0);
  $('walkbar').style.display = 'flex'; $('hint').style.opacity = 0;
}
function stopWalk() {
  if (!walking) return;
  walking = false; controls.enabled = true;
  camera.rotation.order = 'XYZ';
  camera.position.copy(saved.p); controls.target.copy(saved.t); controls.update();
  applyClip();
  $('walkbar').style.display = 'none';
}
$('walkexit').addEventListener('click', stopWalk);
window.addEventListener('keydown', function (e) { keys[e.code] = true; if (e.code === 'Escape') stopWalk(); });
window.addEventListener('keyup', function (e) { keys[e.code] = false; });
renderer.domElement.addEventListener('pointerdown', function (e) { if (walking) { dragging = true; lx = e.clientX; ly = e.clientY; renderer.domElement.setPointerCapture(e.pointerId); } });
renderer.domElement.addEventListener('pointermove', function (e) {
  if (!walking || !dragging) return;
  yaw -= (e.clientX - lx) * .0035; pitch = Math.max(-1.3, Math.min(1.3, pitch - (e.clientY - ly) * .0035));
  lx = e.clientX; ly = e.clientY; camera.rotation.set(pitch, yaw, 0);
});
renderer.domElement.addEventListener('pointerup', function () { dragging = false; });
function walkStep(dt) {
  var sp = (keys.ShiftLeft || keys.ShiftRight ? 5.5 : 2.6) * dt;
  var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx;
  var mx = 0, mz = 0;
  if (keys.KeyW || keys.ArrowUp) { mx += fx; mz += fz; }
  if (keys.KeyS || keys.ArrowDown) { mx -= fx; mz -= fz; }
  if (keys.KeyD || keys.ArrowRight) { mx += rx; mz += rz; }
  if (keys.KeyA || keys.ArrowLeft) { mx -= rx; mz -= rz; }
  camera.position.x += mx * sp; camera.position.z += mz * sp; camera.position.y = 1.65;
}

/* -- brújula, tamaño, bucle -- */
var needle = $('needle');
function updateCompass() {
  var f = camera.getWorldDirection(new T.Vector3()); var l = Math.hypot(f.x, f.z) || 1; var fx = f.x / l, fz = f.z / l;
  var rx = -fz, rz = fx;
  var ang = Math.atan2(NORTH.x * rx + NORTH.y * rz, NORTH.x * fx + NORTH.y * fz) * 180 / PI;
  needle.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' 30 30)');
}
function resize() {
  var w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
resize();

var last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  var dt = Math.min(.25, (now - last) / 1000); last = now;
  if (fly) {
    var k = 1 - Math.exp(-dt * 6);
    camera.position.lerp(fly.p, k); controls.target.lerp(fly.t, k);
    if (camera.position.distanceTo(fly.p) < .08 && controls.target.distanceTo(fly.t) < .08) fly = null;
  }
  if (obra.playing) {
    obra.tau = Math.min(1, obra.tau + dt * obra.speed / 45);
    $('tslider').value = obra.tau * 1000;
    if (obra.tau >= 1) { obra.playing = false; $('tplay').textContent = '▶'; }
    refresh();
  }
  if (walking) walkStep(dt); else controls.update();
  updateCompass();
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
$('loading').style.display = 'none';
setTimeout(function () { $('hint').style.opacity = 0; }, 9000);

window.__visor = { obra: obra, refresh: refresh,  scene: scene, camera: camera, controls: controls, THREE: T, buildings: BUILDINGS, flyTo: flyTo, focusOn: focusOn, viewOf: viewOf, startWalk: startWalk, renderer: renderer };
})();
