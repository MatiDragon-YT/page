/* ============================================================
   PARTICLE LAB v10.2 — particle.js
   Registers + Events + Behaviors + Effects + Systems + Collision
   Novedades v10.2:
     - registerColor / unregisterColor (+ integración en use())
     - chains: chainTaperStart / chainTaperEnd / chainWobble / chainSegments
     - chains: render por segmento con taper interpolado + punta redondeada
     - chains: wobble viajero (onda sinusoidal a lo largo de la cadena)
   Fixes v10.1 conservados:
     - customBehaviorSystem mueve p += v*dt
     - spawnFromLayer marca m.kind='free' cuando el behavior es custom
     - motionSystem skipea customBehavior
     - onDeath antes de marcar active=0
   ============================================================ */
(function (global) {
'use strict';

/* ============================================================
   FAST TRIG
   ============================================================ */
const FAST_TRIG = {
  mode: 'auto', precision: 2, enabled: false,
  sin: null, cos: null, tan: null, atan: null,
  size: 0, invTau: 0, atanSize: 0, atanInv: 0, ramKB: 0,
};

function buildTrigTables(precision) {
  const size = 360 * precision;
  const sin = new Float32Array(size);
  const cos = new Float32Array(size);
  const tan = new Float32Array(size);
  const invTau = size / (Math.PI * 2);
  for (let i = 0; i < size; i++) {
    const a = (i / size) * Math.PI * 2;
    sin[i] = Math.sin(a); cos[i] = Math.cos(a); tan[i] = Math.tan(a);
  }
  const atanSize = size;
  const atan = new Float32Array(atanSize);
  for (let i = 0; i < atanSize; i++) atan[i] = Math.atan(i / (atanSize - 1));
  const ramKB = (sin.length + cos.length + tan.length + atan.length) * 4 / 1024;
  return { size, invTau, sin, cos, tan, atan, atanSize, atanInv: atanSize - 1, ramKB };
}

function applyTrigPrecision() {
  const t = buildTrigTables(FAST_TRIG.precision);
  Object.assign(FAST_TRIG, t);
}

function detectMobile() {
  const ua = navigator.userAgent || '';
  if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  if (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) return true;
  return false;
}

function updateTrigEnabled() {
  if (FAST_TRIG.mode === 'auto') FAST_TRIG.enabled = detectMobile();
  else if (FAST_TRIG.mode === 'on') FAST_TRIG.enabled = true;
  else FAST_TRIG.enabled = false;
}

function fastSin(x) { const n = FAST_TRIG.size; let i = ((x * FAST_TRIG.invTau) | 0) % n; if (i < 0) i += n; return FAST_TRIG.sin[i]; }
function fastCos(x) { const n = FAST_TRIG.size; let i = ((x * FAST_TRIG.invTau) | 0) % n; if (i < 0) i += n; return FAST_TRIG.cos[i]; }
function fastTan(x) { const n = FAST_TRIG.size; let i = ((x * FAST_TRIG.invTau) | 0) % n; if (i < 0) i += n; return FAST_TRIG.tan[i]; }
function fastAtan(x) {
  const neg = x < 0; const ax = neg ? -x : x; let a;
  if (ax <= 1) a = FAST_TRIG.atan[(ax * FAST_TRIG.atanInv) | 0];
  else a = Math.PI / 2 - FAST_TRIG.atan[((1 / ax) * FAST_TRIG.atanInv) | 0];
  return neg ? -a : a;
}
function fastAtan2(y, x) {
  if (x === 0) { if (y === 0) return 0; return y > 0 ? Math.PI / 2 : -Math.PI / 2; }
  const a = fastAtan(y / x);
  if (x > 0) return a;
  return y >= 0 ? a + Math.PI : a - Math.PI;
}

function fsin(x) { return FAST_TRIG.enabled ? fastSin(x) : Math.sin(x); }
function fcos(x) { return FAST_TRIG.enabled ? fastCos(x) : Math.cos(x); }
function ftan(x) { return FAST_TRIG.enabled ? fastTan(x) : Math.tan(x); }
function fatan(x) { return FAST_TRIG.enabled ? fastAtan(x) : Math.atan(x); }
function fatan2(y, x) { return FAST_TRIG.enabled ? fastAtan2(y, x) : Math.atan2(y, x); }

applyTrigPrecision();
updateTrigEnabled();

/* ============================================================
   SPATIAL HASH
   ============================================================ */
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize; this.cols = 0; this.rows = 0;
    this.buckets = []; this.touched = [];
  }
  resize(w, h) {
    const nc = Math.ceil(w / this.cellSize) + 2;
    const nr = Math.ceil(h / this.cellSize) + 2;
    if (this.cols !== nc || this.rows !== nr) {
      this.cols = nc; this.rows = nr;
      this.buckets = new Array(nc * nr);
      for (let i = 0; i < this.buckets.length; i++) this.buckets[i] = [];
      this.touched.length = 0;
    }
  }
  clear() {
    for (let i = 0; i < this.touched.length; i++) this.buckets[this.touched[i]].length = 0;
    this.touched.length = 0;
  }
  insert(id, x, y) {
    let cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize);
    if (cx < 0) cx = 0; else if (cx >= this.cols) cx = this.cols - 1;
    if (cy < 0) cy = 0; else if (cy >= this.rows) cy = this.rows - 1;
    const k = cy * this.cols + cx, b = this.buckets[k];
    if (b.length === 0) this.touched.push(k);
    b.push(id);
  }
  query(x, y, radius, out) {
    out.length = 0;
    let minX = Math.floor((x - radius) / this.cellSize);
    let maxX = Math.floor((x + radius) / this.cellSize);
    let minY = Math.floor((y - radius) / this.cellSize);
    let maxY = Math.floor((y + radius) / this.cellSize);
    if (minX < 0) minX = 0; if (maxX >= this.cols) maxX = this.cols - 1;
    if (minY < 0) minY = 0; if (maxY >= this.rows) maxY = this.rows - 1;
    for (let cy = minY; cy <= maxY; cy++) {
      const ro = cy * this.cols;
      for (let cx = minX; cx <= maxX; cx++) {
        const b = this.buckets[ro + cx];
        for (let i = 0; i < b.length; i++) out.push(b[i]);
      }
    }
    return out;
  }
}

/* ============================================================
   REGISTRIES
   ============================================================ */
const Registry = {
  presets: {},
  multiPresets: {},
  sprites: {},
  curves: {},
  events: {},
  behaviors: {},
  collision: null,
  effects: {},
  systems: {},
};

const COLORS = {
  rain:[140,200,255], snow:[220,240,255], fire:[255,140,50],
  smoke:[85,95,125],  magic:[200,120,255], spark:[255,220,100],
  ember:[255,100,40], blood:[200,30,40],   elec:[200,230,255],
  bolt:[220,235,255], leafG:[80,150,60],   leafB:[150,100,50],
  petal:[255,180,210], sand:[220,180,110], feather:[240,240,235],
  firefly:[180,255,80], bug:[50,40,30],    crystal:[200,240,255],
  toxic:[130,255,60],  gold:[255,200,60],  plasma:[180,120,255],
};
const COLOR_NAMES = Object.keys(COLORS);

/* ============================================================
   SPRITE MAKERS
   ============================================================ */
function mkRadial(rgb){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const[r,g,b]=rgb;const g2=x.createRadialGradient(32,32,0,32,32,32);g2.addColorStop(0,`rgba(${r},${g},${b},1)`);g2.addColorStop(0.3,`rgba(${r},${g},${b},0.55)`);g2.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=g2;x.fillRect(0,0,64,64);return c;}
function mkStreak(rgb){const c=document.createElement('canvas');c.width=4;c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;const g2=x.createLinearGradient(0,0,0,32);g2.addColorStop(0,`rgba(${r},${g},${b},0)`);g2.addColorStop(0.5,`rgba(${r},${g},${b},1)`);g2.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=g2;x.fillRect(0,0,4,32);return c;}
function mkSquare(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;x.fillStyle=`rgba(${r},${g},${b},1)`;x.fillRect(9,9,14,14);return c;}
function mkTriangle(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;const g2=x.createLinearGradient(0,0,32,32);g2.addColorStop(0,`rgba(${r},${g},${b},1)`);g2.addColorStop(1,`rgba(${r},${g},${b},0.4)`);x.fillStyle=g2;x.beginPath();x.moveTo(16,2);x.lineTo(30,28);x.lineTo(2,28);x.closePath();x.fill();return c;}
function mkLeaf(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;x.fillStyle=`rgba(${r},${g},${b},0.95)`;x.beginPath();x.ellipse(16,16,5,12,0,0,Math.PI*2);x.fill();return c;}
function mkDot(rgb){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');const[r,g,b]=rgb;x.fillStyle=`rgba(${r},${g},${b},1)`;x.beginPath();x.arc(8,8,5,0,Math.PI*2);x.fill();return c;}
function mkNeedle(rgb){const c=document.createElement('canvas');c.width=3;c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;const g2=x.createLinearGradient(0,0,0,32);g2.addColorStop(0,`rgba(${r},${g},${b},0)`);g2.addColorStop(0.5,`rgba(${r},${g},${b},1)`);g2.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=g2;x.fillRect(0,0,3,32);return c;}
function mkRing(rgb){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const[r,g,b]=rgb;x.strokeStyle=`rgba(${r},${g},${b},0.9)`;x.lineWidth=2.5;x.beginPath();x.arc(32,32,26,0,Math.PI*2);x.stroke();return c;}
function mkFeather(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;x.fillStyle=`rgba(${r},${g},${b},0.85)`;x.beginPath();x.ellipse(16,16,3.5,13,0.3,0,Math.PI*2);x.fill();return c;}
function mkSparkle(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;const g2=x.createRadialGradient(16,16,0,16,16,16);g2.addColorStop(0,`rgba(${r},${g},${b},1)`);g2.addColorStop(1,`rgba(${r},${g},${b},0)`);x.fillStyle=g2;x.beginPath();x.moveTo(16,0);x.lineTo(19,13);x.lineTo(32,16);x.lineTo(19,19);x.lineTo(16,32);x.lineTo(13,19);x.lineTo(0,16);x.lineTo(13,13);x.closePath();x.fill();return c;}
function mkHex(rgb){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const[r,g,b]=rgb;x.fillStyle=`rgba(${r},${g},${b},0.9)`;x.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;const px=16+Math.cos(a)*12,py=16+Math.sin(a)*12;if(i===0)x.moveTo(px,py);else x.lineTo(px,py);}x.closePath();x.fill();return c;}

const SPRITE_MAKERS = { radial: mkRadial, streak: mkStreak, square: mkSquare, triangle: mkTriangle, leaf: mkLeaf, dot: mkDot, needle: mkNeedle, ring: mkRing, feather: mkFeather, sparkle: mkSparkle, hex: mkHex };
const SPRITE_NAMES = Object.keys(SPRITE_MAKERS);

const SPRITES = {};
const SPRITES_SMALL = {};
const SPRITES_LARGE = {};

function downsizeCanvas(src, size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0, size, size); return c;
}
function upsizeCanvas(src, size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, size, size); return c;
}

for (const ck in COLORS) {
  for (const sk in SPRITE_MAKERS) {
    const key = sk + '_' + ck;
    const base = SPRITE_MAKERS[sk](COLORS[ck]);
    SPRITES[key] = base;
    SPRITES_SMALL[key] = downsizeCanvas(base, 32);
    SPRITES_LARGE[key] = upsizeCanvas(base, 128);
  }
}

function pickSprite(key, lod, size) {
  if (lod >= 2 || size <= 36) return SPRITES_SMALL[key] || SPRITES[key];
  if (size >= 80) return SPRITES_LARGE[key] || SPRITES[key];
  return SPRITES[key];
}

const USE_BITMAP = { enabled: true, ready: false };
function tryConvertToBitmap() {
  if (!USE_BITMAP.enabled || typeof createImageBitmap !== 'function') return;
  const maps = [SPRITES, SPRITES_SMALL, SPRITES_LARGE];
  Promise.all(maps.map(map => {
    const entries = Object.entries(map);
    return Promise.all(entries.map(([k, c]) => createImageBitmap(c).then(bm => { map[k] = bm; }).catch(() => {})));
  })).then(() => { USE_BITMAP.ready = true; }).catch(() => {});
}
tryConvertToBitmap();

/* ============================================================
   LAYER FACTORY — v10.2 añade taper/wobble/segments a chains
   ============================================================ */
function makeLayer() {
  return {
    enabled: true, effectType: 'particle', behavior: 'free',
    emitter: { fx: .5, fy: 1.02, fw: .08, angle: -90, spread: 42 },
    rate: 100, speed: 150,
    gravityX: 0, gravityY: 0, windX: 0, windY: 0, drag: 0,
    swirl: 0, attract: 0, turbulence: 0, wander: 0,
    bounce: 0, border: 'none',
    life: 1, size: 10, stretch: 1, rotation: 0,
    wobble: 0, flicker: 0, grow: 0, splash: 0, sticky: 0,
    sizeCurve: 'easeOut', alphaCurve: 'linear',
    colors: ['fire'], colorStart: null, colorEnd: null,
    spriteType: 'radial', blend: 'lighter',
    trail: false, trailLen: 12, trailWidth: 2, metaball: false,
    spawnOnDeath: null, spawnDepth: 0,
    curlNoise: 0, curlScale: 0.008,
    flowField: 0, flowScale: 0.02,
    depthMin: 0, depthMax: 0,
    seedVariation: 0, inheritVel: 0,
    boidCohesion: 1, boidAlignment: 1, boidSeparation: 1.5, boidRadius: 80, boidMaxSpeed: 200,
    chainLinks: 15, chainLength: 12, chainIterations: 6, chainGravity: 400, chainWidth: 2,
    chainTaperStart: 1, chainTaperEnd: 1, chainWobble: 0, chainSegments: 0,
    rigidRadius: 8, rigidMass: 1, rigidRestitution: 0.5,
    collide: false, collideRadius: 8, onCollide: null,
    boltBranches: 5, boltDepth: 6, boltDisplace: .25, boltThickness: 2.5, boltFlash: .5, boltMode: 'random', boltFork: .6,
    centellaRays: 8, centellaLength: 35,
    orbRadius: 20, orbSpeed: 40, orbLife: 4, orbArcRate: 15, orbWander: 30,
    teslaRate: 18, teslaGap: 180, teslaHeight: 200, teslaWidth: 2,
    timer: 0,
  };
}

/* ============================================================
   WORLD
   ============================================================ */
class World {
  constructor(w, h, canvas, ctx) {
    this.width = w; this.height = h; this.canvas = canvas; this.ctx = ctx;
    this.nextId = 1; this.stores = new Map();
    this.freeList = []; this.aliveList = []; this.activeCount = 0;
    this.poolSize = 0; this.time = 0;
    this.bolts = []; this.orbs = []; this.teslas = []; this.chains = [];
    this.screenFlash = 0; this.dpr = 1;
    this.boidHash = new SpatialHash(100);
    this.rigidHash = new SpatialHash(30);
    this.lod = 0; this.lodRequested = -1;
    this._queryBuf = []; this._boidBuf = []; this._rigidBuf = [];
    this.splashQueue = []; this.deathQueue = [];
    this.layers = [makeLayer(), makeLayer(), makeLayer()];
    this.config = {
      trail: 0.18, timeScale: 1, bloom: 0,
      wellCount: 0, wellStrength: 200,
    };
    this.events = { death: [], spawn: [], collision: [], boundary: [], stick: [] };
    this.debug = false;
    this.customBehaviorIds = [];
  }
  store(n) { let s = this.stores.get(n); if (!s) { s = new Map(); this.stores.set(n, s); } return s; }
  add(id, n, d) { this.store(n).set(id, d); }
  get(id, n) { return this.store(n).get(id); }
  emit(type, payload) {
    const list = this.events[type];
    if (!list) return;
    for (let i = 0; i < list.length; i++) list[i].fn(payload);
  }
}

/* ============================================================
   BOLT GENERATOR
   ============================================================ */
function genBolt(x1, y1, x2, y2, disp, depth) {
  if (depth <= 0) return [{x:x1,y:y1},{x:x2,y:y2}];
  const mx = (x1+x2)/2 + (Math.random()-0.5)*disp;
  const my = (y1+y2)/2 + (Math.random()-0.5)*disp;
  const l = genBolt(x1,y1,mx,my,disp*0.55,depth-1);
  const r = genBolt(mx,my,x2,y2,disp*0.55,depth-1);
  return l.concat(r.slice(1));
}
function genBranches(pts, count, dirX, dirY, fork) {
  const branches = [];
  if (count <= 0 || pts.length < 4) return branches;
  const baseAngle = fatan2(dirY, dirX);
  for (let i = 0; i < count; i++) {
    const idx = 1 + Math.floor(Math.random() * (pts.length - 2));
    const pt = pts[idx];
    const side = Math.random() < 0.5 ? -1 : 1;
    const angle = baseAngle + (20 + Math.random()*60) * Math.PI/180 * side;
    const fullLen = Math.hypot(pts[pts.length-1].x-pts[0].x, pts[pts.length-1].y-pts[0].y);
    const len = (40+Math.random()*120) * fork * (fullLen/400);
    const ex = pt.x + fcos(angle)*len;
    const ey = pt.y + fsin(angle)*len;
    branches.push(genBolt(pt.x,pt.y,ex,ey,len*0.35,3));
  }
  return branches;
}

/* ============================================================
   ELECTRIC EFFECTS
   ============================================================ */
function spawnBolt(world, L) {
  const W = world.width, H = world.height;
  let x1, y1, x2, y2;
  if (L.boltMode === 'random') {
    if (Math.random() < 0.75) {
      x1 = Math.random()*W; y1 = -30;
      x2 = x1 + (Math.random()-0.5)*250; y2 = H+30;
    } else {
      const side = Math.random() < 0.5;
      x1 = side ? -30 : W+30; y1 = Math.random()*H*0.4;
      x2 = W*(0.2+Math.random()*0.6); y2 = H*(0.3+Math.random()*0.7);
    }
  } else if (L.boltMode === 'vertical') {
    x1 = (L.emitter.fx + (Math.random()-0.5)*L.emitter.fw) * W; y1 = -30;
    x2 = x1 + (Math.random()-0.5)*120; y2 = H+30;
  } else if (L.boltMode === 'from-emitter') {
    x1 = L.emitter.fx * W; y1 = L.emitter.fy * H;
    const angle = -Math.PI/2 + (Math.random()-0.5)*L.emitter.spread*Math.PI/180;
    const len = 150 + Math.random()*300;
    x2 = x1 + fcos(angle)*len; y2 = y1 + fsin(angle)*len;
  } else {
    x1 = Math.random()*W; y1 = -30;
    x2 = x1 + (Math.random()-0.5)*80; y2 = H-4;
  }
  const dist = Math.hypot(x2-x1, y2-y1);
  const pts = genBolt(x1,y1,x2,y2,dist*L.boltDisplace, L.boltDepth);
  const branches = genBranches(pts, L.boltBranches, x2-x1, y2-y1, L.boltFork);
  world.bolts.push({
    pts, branches,
    colorKey: L.colors[0] || 'bolt',
    color: COLORS[L.colors[0]] || COLORS.bolt,
    width: L.boltThickness, t: L.life, max: L.life,
    seed: Math.random()*100, kind: 'bolt',
  });
  world.screenFlash = Math.min(1, Math.max(world.screenFlash, L.boltFlash));
}

function spawnCentella(world, L) {
  const W = world.width, H = world.height;
  const cx = (L.emitter.fx + (Math.random()-0.5)*L.emitter.fw) * W;
  const cy = L.emitter.fy * H;
  const colorKey = L.colors[0] || 'spark';
  const color = COLORS[colorKey] || COLORS.spark;
  world.bolts.push({pts:[{x:cx,y:cy}], colorKey, color, width:8, t:0.18, max:0.18, seed:Math.random()*100, kind:'flash'});
  const rayCount = Math.max(3, L.centellaRays | 0);
  for (let i = 0; i < rayCount; i++) {
    const angle = Math.random()*Math.PI*2;
    const len = L.centellaLength * (0.4 + Math.random()*0.8);
    const ex = cx + fcos(angle)*len;
    const ey = cy + fsin(angle)*len;
    const pts = genBolt(cx,cy,ex,ey,len*0.5,3);
    world.bolts.push({pts, colorKey, color, width: L.boltThickness*0.9, t:0.1+Math.random()*0.08, max:0.18, seed:Math.random()*100, kind:'spark-ray'});
  }
  world.screenFlash = Math.min(1, Math.max(world.screenFlash, L.boltFlash * 0.35));
}

function spawnBallLightning(world, L) {
  const W = world.width, H = world.height;
  const x = (L.emitter.fx + (Math.random()-0.5)*L.emitter.fw) * W;
  const y = L.emitter.fy * H;
  const colorKey = L.colors[0] || 'bolt';
  const color = COLORS[colorKey] || COLORS.bolt;
  const da = Math.random()*Math.PI*2;
  const speed = L.orbSpeed * Math.random();
  world.orbs.push({
    x, y, vx: fcos(da)*speed, vy: fsin(da)*speed,
    radius: L.orbRadius, color, colorKey,
    t: L.orbLife, max: L.orbLife,
    arcTimer: 0, arcRate: L.orbArcRate, wander: L.orbWander,
    wobblePhase: Math.random()*Math.PI*2, seed: Math.random()*100,
  });
}

function updateOrbs(world, dt) {
  for (let i = world.orbs.length-1; i >= 0; i--) {
    const orb = world.orbs[i];
    orb.t -= dt;
    orb.wobblePhase += dt*3.2;
    orb.x += orb.vx*dt + fsin(orb.wobblePhase)*orb.wander*dt;
    orb.y += orb.vy*dt + fcos(orb.wobblePhase*1.3)*orb.wander*dt;
    if (Math.random() < 0.03) {
      orb.vx += (Math.random()-0.5)*120; orb.vy += (Math.random()-0.5)*120;
      const sp = Math.hypot(orb.vx, orb.vy);
      if (sp > 100) { orb.vx *= 100/sp; orb.vy *= 100/sp; }
    }
    orb.arcTimer -= dt;
    if (orb.arcTimer <= 0 && orb.t > 0.2) {
      orb.arcTimer = 1/orb.arcRate;
      const a1 = Math.random()*Math.PI*2;
      const a2 = a1 + (Math.random()-0.5)*Math.PI*0.9;
      const r = orb.radius;
      const x1 = orb.x + fcos(a1)*r*0.5, y1 = orb.y + fsin(a1)*r*0.5;
      const x2 = orb.x + fcos(a2)*r*1.4, y2 = orb.y + fsin(a2)*r*1.4;
      const pts = genBolt(x1,y1,x2,y2,r*0.6,3);
      world.bolts.push({pts, colorKey: orb.colorKey, color: orb.color, width:1.2, t:0.08, max:0.08, seed:Math.random()*100, kind:'orb-arc'});
    }
    if (orb.t <= 0) {
      for (let k = 0; k < 14; k++) {
        const angle = Math.random()*Math.PI*2;
        const len = orb.radius * (1+Math.random()*2.5);
        const ex = orb.x + fcos(angle)*len, ey = orb.y + fsin(angle)*len;
        const pts = genBolt(orb.x,orb.y,ex,ey,len*0.5,3);
        world.bolts.push({pts, colorKey: orb.colorKey, color: orb.color, width:1.8, t:0.35, max:0.35, seed:Math.random()*100, kind:'spark-ray'});
      }
      world.bolts.push({pts:[{x:orb.x,y:orb.y}], colorKey: orb.colorKey, color: orb.color, width:30, t:0.3, max:0.3, seed:Math.random()*100, kind:'flash'});
      world.screenFlash = Math.min(1, world.screenFlash + 0.4);
      world.orbs.splice(i, 1);
    }
  }
}

function ensureTesla(world, L, li) {
  if (!world.teslas.find(t => t.layerIdx === li)) {
    const W = world.width, H = world.height;
    const cx = L.emitter.fx * W, cy = L.emitter.fy * H;
    world.teslas.push({
      layerIdx: li,
      x1: cx - L.teslaGap/2, y1: cy,
      x2: cx + L.teslaGap/2, y2: cy,
      topY: cy - L.teslaHeight,
      colorKey: L.colors[0] || 'bolt',
      color: COLORS[L.colors[0]] || COLORS.bolt,
      arcTimer: 0, rate: L.teslaRate, width: L.teslaWidth,
    });
  }
}

function updateTeslas(world, dt) {
  const W = world.width, H = world.height;
  for (let i = world.teslas.length-1; i >= 0; i--) {
    const T = world.teslas[i];
    const L = world.layers[T.layerIdx];
    if (!L || !L.enabled || L.effectType !== 'tesla') { world.teslas.splice(i, 1); continue; }
    const cx = L.emitter.fx * W, cy = L.emitter.fy * H;
    T.x1 = cx - L.teslaGap/2; T.y1 = cy;
    T.x2 = cx + L.teslaGap/2; T.y2 = cy;
    T.topY = cy - L.teslaHeight;
    T.rate = L.teslaRate; T.width = L.teslaWidth;
    T.colorKey = L.colors[0] || 'bolt';
    T.color = COLORS[L.colors[0]] || COLORS.bolt;
    T.arcTimer += dt;
    let guard = 0;
    while (T.arcTimer >= 1/T.rate && guard++ < 5) {
      T.arcTimer -= 1/T.rate;
      const yVar = (Math.random()-0.5)*50;
      const x1 = T.x1 + (Math.random()-0.5)*12, y1 = T.topY + yVar;
      const x2 = T.x2 + (Math.random()-0.5)*12, y2 = T.topY + yVar + (Math.random()-0.5)*30;
      const dist = Math.hypot(x2-x1, y2-y1);
      const pts = genBolt(x1,y1,x2,y2,dist*0.32,5);
      world.bolts.push({pts, colorKey: T.colorKey, color: T.color, width: T.width, t:0.08+Math.random()*0.08, max:0.16, seed:Math.random()*100, kind:'tesla-arc'});
      if (Math.random() < 0.3) {
        const side = Math.random()<0.5 ? T.x1 : T.x2;
        const sy = T.topY + (Math.random()-0.5)*40;
        const ex = side + (Math.random()-0.5)*80;
        const ey = sy - 60 - Math.random()*80;
        const dV = Math.hypot(ex-side, ey-sy);
        const ptsV = genBolt(side,sy,ex,ey,dV*0.4,4);
        world.bolts.push({pts:ptsV, colorKey: T.colorKey, color: T.color, width: T.width*0.6, t:0.06+Math.random()*0.06, max:0.12, seed:Math.random()*100, kind:'tesla-arc'});
      }
    }
  }
}

function updateBolts(world, dt) {
  const W = world.width, H = world.height, CULL = 200;
  for (let i = world.bolts.length-1; i >= 0; i--) {
    const b = world.bolts[i];
    b.t -= dt;
    if (b.t <= 0) { world.bolts.splice(i,1); continue; }
    let inside = false;
    const pts = b.pts;
    for (let j = 0; j < pts.length; j++) {
      const p = pts[j];
      if (p.x > -CULL && p.x < W+CULL && p.y > -CULL && p.y < H+CULL) { inside = true; break; }
    }
    if (!inside) b.t = Math.min(b.t, 0.1);
  }
  if (world.screenFlash > 0) { world.screenFlash -= dt*5; if (world.screenFlash < 0) world.screenFlash = 0; }
}

/* ============================================================
   PRESETS — 7 (incluye `tentacle` como demo de chain con taper)
   ============================================================ */
const PRESETS = {
  fire:      { rate: 220, speed: 130, gravityY: -80, drag: 1.2, life: 0.9, size: 10, colors: ['fire','ember'], spriteType: 'radial', emitter: { fx: 0.5, fy: 1.02, fw: 0.08, angle: -90, spread: 42 } },
  rain:      { rate: 240, speed: 620, gravityY: 150, windX: 70, life: 1.4, size: 2.2, stretch: 6, colors: ['rain'], spriteType: 'needle', border: 'wrap', emitter: { fx: 0.5, fy: -0.05, fw: 1.4, angle: 90, spread: 8 } },
  lightning: { effectType: 'bolt', rate: 2.5, life: 0.4, colors: ['bolt'], boltBranches: 5, boltDepth: 6, boltDisplace: 0.25, boltThickness: 2.5, boltFlash: 0.5, boltMode: 'random', boltFork: 0.7 },
  magic:     { rate: 90, speed: 180, drag: 0.3, swirl: 3.5, life: 1.8, size: 10, colors: ['magic','spark'], spriteType: 'radial', emitter: { fx: 0.5, fy: 0.5, fw: 0.02, angle: 0, spread: 360 } },
  sparkle:   { rate: 20, speed: 30, drag: 0.3, swirl: 0.3, flicker: 0.6, wander: 20, life: 6, size: 5, colors: ['snow','spark','magic'], spriteType: 'sparkle', emitter: { fx: 0.5, fy: 0.5, fw: 1.3, angle: 0, spread: 360 } },
  boids:     { behavior: 'boid', rate: 1, speed: 150, life: 30, size: 5, colors: ['bug'], spriteType: 'triangle', blend: 'source-over', boidCohesion: 1.2, boidAlignment: 2, boidSeparation: 1.8, boidRadius: 90, boidMaxSpeed: 180, emitter: { fx: 0.5, fy: 0.5, fw: 1.2, angle: 0, spread: 360 } },
  tentacle:  { effectType: 'chain', rate: 1, life: 20, colors: ['magic','plasma'], chainLinks: 25, chainLength: 11, chainIterations: 10, chainGravity: 350, chainWidth: 6, chainTaperStart: 1.8, chainTaperEnd: 0.1, chainWobble: 0.55, emitter: { fx: 0.5, fy: 0.25, fw: 0.4, angle: 0, spread: 0 } },
};

/* ============================================================
   MULTI-PRESETS — 6
   ============================================================ */
const MULTI_PRESETS = {
  storm:       [{ preset: 'rain' }, { preset: 'rain', rate: 100 }, { preset: 'lightning' }],
  fireworks:   [{ preset: 'fire', rate: 60 }, { preset: 'magic', rate: 20 }, { preset: 'sparkle', rate: 10 }],
  nebula:      [{ preset: 'magic' }, { preset: 'sparkle' }, { preset: 'magic', rate: 30 }],
  combat:      [{ preset: 'fire', rate: 80 }, { preset: 'lightning', rate: 3 }, { preset: 'sparkle', rate: 15 }],
  flock:       [{ preset: 'boids' }, { preset: 'sparkle', rate: 5 }, { preset: 'magic', rate: 10 }],
  celebration: [{ preset: 'fire', rate: 40 }, { preset: 'sparkle' }, { preset: 'magic', rate: 60 }],
};

/* ============================================================
   POOL
   ============================================================ */
function initPool(world, n) {
  for (let i = 0; i < n; i++) {
    const id = world.nextId++;
    world.add(id, 'pos', { x: 0, y: 0 });
    world.add(id, 'vel', { vx: 0, vy: 0 });
    world.add(id, 'life', { t: 0, max: 1 });
    world.add(id, 'render', {
      size0:0, spriteA:null, spriteB:null, spriteKey:'', spriteKeyB:'',
      stretch:1, angle:0, angularVel:0, bounces:0, alignToVel:false,
      wobbleAmp:0, wobbleFreq:3, wobblePhase:0, sinWobble:0, cosWobble:1,
      flickerAmp:0, flickerFreq:8, flickerPhase:0, sinFlicker:0, cosFlicker:1,
      grow:0, sizeCurve:'easeOut', alphaCurve:'linear', blend:'lighter',
      metaball:false, trail:null, seed:0, layerIdx:0,
      depth:0, depthScale:1, depthAlpha:1, depthSpeed:1,
    });
    world.add(id, 'phys', { gx: 0, gy: 0, drag: 0, bounce: 0, splash: 0, sticky: 0, border: 'none' });
    world.add(id, 'force', { wx: 0, wy: 0, cx: 0, cy: 0, swirl: 0, attract: 0, wanderAmp: 0, wanderFreq: 2, wanderPhase: 0, turb: 0, turbPhase: 0, curl: 0, curlScale: 0.008, flow: 0, flowScale: 0.02 });
    world.add(id, 'active', { v: 0 });
    world.add(id, 'meta', { kind: 'free', boid: null, rigid: null, spawnOnDeath: null, inheritVel: 0, customBehavior: null, depth: 0, collide: false, collideRadius: 8, onCollide: null });
    world.freeList.push(id);
  }
  world.poolSize = n;
}

/* ============================================================
   SPAWN
   ============================================================ */
function spawnFromLayer(world, L, layerIdx, override) {
  if (!L.enabled) return;
  if (L.effectType === 'chain' || L.effectType === 'bolt' || L.effectType === 'centella' || L.effectType === 'ballLightning' || L.effectType === 'tesla') return;
  override = override || {};
  const n = override.count || 1;
  const inheritVx = override.inheritVx || 0;
  const inheritVy = override.inheritVy || 0;
  const depth = override.depth || 0;
  for (let k = 0; k < n; k++) {
    if (world.freeList.length === 0) return;
    const id = world.freeList.pop();
    world.aliveList.push(id);
    const e = L.emitter;
    const x = override.x !== undefined ? override.x : (e.fx + (Math.random()-.5)*e.fw) * world.width;
    const y = override.y !== undefined ? override.y : e.fy * world.height;
    const seed = Math.random();
    const sv = L.seedVariation;
    const seedMul = 1 + (seed - .5) * sv;
    const seedMulLife = 1 + ((seed * 1.7) % 1 - .5) * sv;
    const seedMulSpeed = 1 + ((seed * 2.3) % 1 - .5) * sv;
    let depthVal = 0;
    if (L.depthMax > L.depthMin) depthVal = L.depthMin + seed * (L.depthMax - L.depthMin);
    const speed = L.speed * (.6 + Math.random()*.8) * seedMulSpeed;
    const angle = (e.angle + (Math.random()-.5)*e.spread) * Math.PI/180;
    const vx = fcos(angle)*speed + inheritVx;
    const vy = fsin(angle)*speed + inheritVy;
    let startKey, endKey;
    if (L.colorStart) { startKey = L.colorStart; endKey = L.colorEnd || L.colorStart; }
    else { const c = L.colors[(Math.random()*L.colors.length)|0]; startKey = endKey = c; }
    const alignToVel = L.spriteType === 'streak' || L.spriteType === 'needle';
    const p = world.get(id, 'pos'), v = world.get(id, 'vel'), l = world.get(id, 'life');
    const r = world.get(id, 'render'), ph = world.get(id, 'phys'), f = world.get(id, 'force'), m = world.get(id, 'meta');
    world.get(id, 'active').v = 1;
    p.x = x; p.y = y; v.vx = vx; v.vy = vy;
    l.t = L.life * (.6 + Math.random()*.8) * seedMulLife; l.max = l.t;
    r.size0 = L.size * (.6 + Math.random()*.8) * seedMul;
    r.spriteA = SPRITES[L.spriteType+'_'+startKey] || SPRITES.radial_fire;
    r.spriteB = SPRITES[L.spriteType+'_'+endKey] || r.spriteA;
    r.spriteKey = L.spriteType+'_'+startKey;
    r.spriteKeyB = L.spriteType+'_'+endKey;
    r.stretch = L.stretch;
    r.angle = alignToVel ? fatan2(vy, vx) - Math.PI/2 : Math.random()*Math.PI*2;
    r.angularVel = L.rotation * (Math.random()-.5)*2;
    r.bounces = 0; r.alignToVel = alignToVel;
    r.wobbleAmp = L.wobble; r.wobblePhase = Math.random()*Math.PI*2;
    r.sinWobble = fsin(r.wobblePhase); r.cosWobble = fcos(r.wobblePhase);
    r.flickerAmp = L.flicker; r.flickerPhase = Math.random()*Math.PI*2;
    r.sinFlicker = fsin(r.flickerPhase); r.cosFlicker = fcos(r.flickerPhase);
    r.grow = L.grow;
    r.sizeCurve = L.sizeCurve; r.alphaCurve = L.alphaCurve; r.blend = L.blend;
    r.metaball = L.metaball;
    r.seed = seed; r.layerIdx = layerIdx;
    r.depth = depthVal;
    r.depthScale = 1 - depthVal * 0.55;
    r.depthAlpha = 1 - depthVal * 0.7;
    r.depthSpeed = 1 - depthVal * 0.5;
    r.trail = L.trail ? {
      xs: new Float32Array(L.trailLen).fill(x),
      ys: new Float32Array(L.trailLen).fill(y),
      head: 0, count: L.trailLen, maxLen: L.trailLen,
      width: L.trailWidth, color: COLORS[startKey] || COLORS.fire,
    } : null;
    ph.gx = L.gravityX; ph.gy = L.gravityY;
    ph.drag = L.drag; ph.bounce = L.bounce;
    ph.splash = L.splash; ph.sticky = L.sticky; ph.border = L.border;
    f.wx = L.windX; f.wy = L.windY;
    f.cx = e.fx*world.width; f.cy = e.fy*world.height;
    f.swirl = L.swirl; f.attract = L.attract;
    f.wanderAmp = L.wander; f.wanderPhase = Math.random()*Math.PI*2;
    f.turb = L.turbulence; f.turbPhase = Math.random()*100;
    f.curl = L.curlNoise; f.curlScale = L.curlScale;
    f.flow = L.flowField; f.flowScale = L.flowScale;

    // FIX v10.1: behavior dispatch
    const isCustomBehavior = !!Registry.behaviors[L.behavior];
    if (isCustomBehavior) {
      m.kind = 'free';
      m.customBehavior = L.behavior;
      m.boid = null;
      m.rigid = null;
      world.customBehaviorIds.push(id);
    } else {
      m.kind = L.behavior || 'free';
      m.customBehavior = null;
      m.boid = L.behavior === 'boid' ? { cohesion: L.boidCohesion, alignment: L.boidAlignment, separation: L.boidSeparation, radius: L.boidRadius, maxSpeed: L.boidMaxSpeed } : null;
      m.rigid = L.behavior === 'rigid' ? { radius: L.rigidRadius, mass: L.rigidMass, restitution: L.rigidRestitution } : null;
    }

    m.spawnOnDeath = L.spawnOnDeath ? { ...L.spawnOnDeath, maxDepth: L.spawnOnDeath.maxDepth ?? 3 } : null;
    m.inheritVel = L.inheritVel;
    m.depth = depth;
    m.collide = L.collide;
    m.collideRadius = L.collideRadius;
    m.onCollide = L.onCollide;
    world.emit('spawn', { id, layerIdx, x, y });
    const b = Registry.behaviors[L.behavior];
    if (b && b.onSpawn) b.onSpawn(world, id, L);
  }
}

/* ============================================================
   CURVAS — extensibles via Registry.curves
   ============================================================ */
function curveValue(t, type) {
  if (typeof type === 'function') return type(t);
  const custom = Registry.curves[type];
  if (custom) return custom(t);
  switch (type) {
    case 'linear': return t;
    case 'easeIn': return t*t;
    case 'easeOut': return 1-(1-t)*(1-t);
    case 'pulse': return fsin(t*Math.PI);
    case 'sharp': return t > 0.4 ? 1 : t*2.5;
    case 'none': return 1;
    case 'fadeInOut': return t < 0.2 ? t*5 : t > 0.8 ? (1-t)*5 : 1;
    default: return t;
  }
}

/* ============================================================
   CHAINS — v10.2 con taper / wobble / segments
   ============================================================ */
function spawnChain(world, L) {
  const W = world.width, H = world.height;
  const px = (L.emitter.fx+(Math.random()-.5)*L.emitter.fw)*W;
  const py = L.emitter.fy*H;
  const links = [];
  for (let i = 0; i < L.chainLinks; i++) {
    links.push({ x: px+(Math.random()-.5)*4, y: py+i*L.chainLength, oldX: px, oldY: py+i*L.chainLength });
  }
  world.chains.push({
    links, linkLength: L.chainLength, iterations: L.chainIterations,
    gravity: L.chainGravity, width: L.chainWidth,
    taperStart: L.chainTaperStart ?? 1,
    taperEnd:   L.chainTaperEnd   ?? 1,
    wobble:     L.chainWobble     ?? 0,
    segments:   L.chainSegments   ?? 0,
    wobblePhase: Math.random() * Math.PI * 2,
    color: COLORS[L.colors[0]] || COLORS.bolt, colorKey: L.colors[0],
    t: L.life, max: L.life,
  });
}
function updateChains(world, dt) {
  for (let i = world.chains.length-1; i >= 0; i--) {
    const c = world.chains[i];
    c.t -= dt;
    if (c.t <= 0) { world.chains.splice(i,1); continue; }
    let inside = false;
    for (let j = 0; j < c.links.length; j++) {
      const l = c.links[j];
      if (l.x > -200 && l.x < world.width+200 && l.y > -200 && l.y < world.height+200) { inside = true; break; }
    }
    if (!inside) { world.chains.splice(i,1); continue; }
    const links = c.links;
    for (let j = 1; j < links.length; j++) {
      const l = links[j];
      const vx = (l.x-l.oldX)*.98, vy = (l.y-l.oldY)*.98;
      l.oldX = l.x; l.oldY = l.y;
      l.x += vx; l.y += vy + c.gravity*dt*dt;
    }
    for (let it = 0; it < c.iterations; it++) {
      links[0].x = links[0].oldX = (links[0].x+links[0].oldX)/2;
      links[0].y = links[0].oldY = (links[0].y+links[0].oldY)/2;
      for (let j = 0; j < links.length-1; j++) {
        const a = links[j], b = links[j+1];
        const dx = b.x-a.x, dy = b.y-a.y, d = Math.sqrt(dx*dx+dy*dy) || 1;
        const diff = (d-c.linkLength)/d;
        const mx = dx*.5*diff, my = dy*.5*diff;
        a.x += mx; a.y += my; b.x -= mx; b.y -= my;
      }
    }
    // wobble viajero
    if (c.wobble > 0) {
      const phase = world.time * 3 + (c.wobblePhase || 0);
      for (let j = 1; j < links.length; j++) {
        const l = links[j], prev = links[j-1];
        const dx = l.x - prev.x, dy = l.y - prev.y;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy/len, ny = dx/len;
        const amp = c.wobble * c.linkLength * 0.6 * Math.sin(phase + j * 0.6);
        l.x += nx * amp * 0.05;
        l.y += ny * amp * 0.05;
      }
    }
  }
}

/* ============================================================
   BOID SYSTEM
   ============================================================ */
function boidSystem(world, dt) {
  const pos = world.store('pos'), vel = world.store('vel'), meta = world.store('meta');
  const alive = world.aliveList;
  const W = world.width, H = world.height;
  const boids = world._boidBuf;
  boids.length = 0;
  for (let i = 0; i < alive.length; i++) {
    const m = meta.get(alive[i]);
    if (m && m.kind === 'boid') boids.push(alive[i]);
  }
  if (boids.length === 0) return;
  const hash = world.boidHash;
  hash.clear();
  for (let i = 0; i < boids.length; i++) {
    const p = pos.get(boids[i]);
    hash.insert(boids[i], p.x, p.y);
  }
  const neighbors = world._queryBuf;
  for (let i = 0; i < boids.length; i++) {
    const id = boids[i];
    const b = meta.get(id).boid;
    const p = pos.get(id), v = vel.get(id);
    hash.query(p.x, p.y, b.radius, neighbors);
    let cohX = 0, cohY = 0, aliX = 0, aliY = 0, sepX = 0, sepY = 0, count = 0, sepCount = 0;
    const r2 = b.radius * b.radius;
    for (let j = 0; j < neighbors.length; j++) {
      const oid = neighbors[j];
      if (oid === id) continue;
      const op = pos.get(oid), ov = vel.get(oid);
      const dx = op.x-p.x, dy = op.y-p.y;
      const d2 = dx*dx + dy*dy;
      if (d2 > r2 || d2 < 0.01) continue;
      const d = Math.sqrt(d2);
      cohX += op.x; cohY += op.y; aliX += ov.vx; aliY += ov.vy; count++;
      if (d < b.radius*.5) { sepX -= dx/d; sepY -= dy/d; sepCount++; }
    }
    if (count > 0) {
      cohX /= count; cohY /= count;
      v.vx += (cohX-p.x) * b.cohesion * .0005;
      v.vy += (cohY-p.y) * b.cohesion * .0005;
      v.vx += (aliX/count - v.vx) * b.alignment * .05;
      v.vy += (aliY/count - v.vy) * b.alignment * .05;
      if (sepCount > 0) { v.vx += sepX*b.separation*30; v.vy += sepY*b.separation*30; }
    }
    const sp = Math.hypot(v.vx, v.vy);
    if (sp > b.maxSpeed) { v.vx *= b.maxSpeed/sp; v.vy *= b.maxSpeed/sp; }
    if (sp < 30 && count > 0) { v.vx += (Math.random()-.5)*10; v.vy += (Math.random()-.5)*10; }
    p.x += v.vx * dt; p.y += v.vy * dt;
    if (p.x < -50) p.x = W+50; else if (p.x > W+50) p.x = -50;
    if (p.y < -50) p.y = H+50; else if (p.y > H+50) p.y = -50;
  }
}

/* ============================================================
   RIGID SYSTEM
   ============================================================ */
function rigidSystem(world, dt) {
  const pos = world.store('pos'), vel = world.store('vel'), phys = world.store('phys'), meta = world.store('meta');
  const alive = world.aliveList;
  const H = world.height, groundY = H - 4;
  const rigidIds = world._rigidBuf;
  rigidIds.length = 0;
  for (let i = 0; i < alive.length; i++) {
    const m = meta.get(alive[i]);
    if (m && m.kind === 'rigid') rigidIds.push(alive[i]);
  }
  if (rigidIds.length === 0) return;
  for (let i = 0; i < rigidIds.length; i++) {
    const id = rigidIds[i];
    const rb = meta.get(id).rigid;
    const p = pos.get(id), v = vel.get(id), ph = phys.get(id);
    v.vy += ph.gy*dt; v.vx += ph.gx*dt;
    v.vx *= 1 - ph.drag*dt;
    p.x += v.vx*dt; p.y += v.vy*dt;
    if (p.y + rb.radius > groundY) {
      p.y = groundY - rb.radius;
      v.vy = -v.vy * rb.restitution;
      v.vx *= .9;
    }
  }
  const hash = world.rigidHash;
  hash.clear();
  for (let i = 0; i < rigidIds.length; i++) {
    const p = pos.get(rigidIds[i]);
    hash.insert(rigidIds[i], p.x, p.y);
  }
  const neighbors = world._queryBuf;
  for (let i = 0; i < rigidIds.length; i++) {
    const idA = rigidIds[i];
    const rbA = meta.get(idA).rigid;
    const pA = pos.get(idA), vA = vel.get(idA);
    hash.query(pA.x, pA.y, rbA.radius * 2, neighbors);
    for (let j = 0; j < neighbors.length; j++) {
      const idB = neighbors[j];
      if (idB <= idA) continue;
      const rbB = meta.get(idB).rigid;
      const pB = pos.get(idB), vB = vel.get(idB);
      const dx = pB.x-pA.x, dy = pB.y-pA.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const overlap = rbA.radius + rbB.radius - dist;
      if (overlap > 0) {
        const nx = dx/dist, ny = dy/dist;
        const imA = 1/rbA.mass, imB = 1/rbB.mass, totalIm = imA+imB;
        pA.x -= nx*overlap*(imA/totalIm); pA.y -= ny*overlap*(imA/totalIm);
        pB.x += nx*overlap*(imB/totalIm); pB.y += ny*overlap*(imB/totalIm);
        const rvx = vB.vx-vA.vx, rvy = vB.vy-vA.vy;
        const vAlong = rvx*nx + rvy*ny;
        if (vAlong > 0) continue;
        const e = Math.min(rbA.restitution, rbB.restitution);
        const jImp = -(1+e)*vAlong/totalIm;
        vA.vx -= jImp*nx*imA; vA.vy -= jImp*ny*imA;
        vB.vx += jImp*nx*imB; vB.vy += jImp*ny*imB;
        world.emit('collision', { a: idA, b: idB, x: (pA.x+pB.x)*0.5, y: (pA.y+pB.y)*0.5 });
      }
    }
  }
}

/* ============================================================
   CUSTOM BEHAVIOR SYSTEM
   ============================================================ */
function customBehaviorSystem(world, dt) {
  if (world.customBehaviorIds.length === 0) return;
  const pos = world.store('pos'), vel = world.store('vel'), meta = world.store('meta'), render = world.store('render');
  const active = world.store('active');
  for (let i = world.customBehaviorIds.length - 1; i >= 0; i--) {
    const id = world.customBehaviorIds[i];
    const m = meta.get(id);
    const a = active.get(id);
    if (!a || a.v === 0) { world.customBehaviorIds.splice(i, 1); continue; }
    const b = Registry.behaviors[m.customBehavior];
    if (!b) { world.customBehaviorIds.splice(i, 1); continue; }
    const p = pos.get(id), v = vel.get(id), r = render.get(id);
    b.update(world, id, dt, { pos: p, vel: v, meta: m, render: r });

    p.x += v.vx * dt;
    p.y += v.vy * dt;

    if (p.x < -50) p.x = world.width + 50;
    else if (p.x > world.width + 50) p.x = -50;
    if (p.y < -50) p.y = world.height + 50;
    else if (p.y > world.height + 50) p.y = -50;

    if (r && r.alignToVel) {
      const sp = Math.hypot(v.vx, v.vy);
      if (sp > 1) r.angle = fatan2(v.vy, v.vx) - Math.PI/2;
    }
  }
}

/* ============================================================
   COLLISION SYSTEM
   ============================================================ */
function collisionSystem(world, dt) {
  const pos = world.store('pos'), vel = world.store('vel'), meta = world.store('meta');
  const alive = world.aliveList;
  const list = [];
  for (let i = 0; i < alive.length; i++) {
    const m = meta.get(alive[i]);
    if (m && m.collide) list.push(alive[i]);
  }
  if (list.length === 0) return;
  const hash = world.rigidHash;
  hash.clear();
  for (let i = 0; i < list.length; i++) {
    const p = pos.get(list[i]);
    hash.insert(list[i], p.x, p.y);
  }
  const neighbors = world._queryBuf;
  for (let i = 0; i < list.length; i++) {
    const idA = list[i];
    const mA = meta.get(idA);
    const pA = pos.get(idA), vA = vel.get(idA);
    hash.query(pA.x, pA.y, mA.collideRadius, neighbors);
    for (let j = 0; j < neighbors.length; j++) {
      const idB = neighbors[j];
      if (idB <= idA) continue;
      const mB = meta.get(idB);
      if (!mB || !mB.collide) continue;
      const pB = pos.get(idB);
      const dx = pB.x-pA.x, dy = pB.y-pA.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      if (d < mA.collideRadius + mB.collideRadius) {
        const cx = (pA.x + pB.x) * 0.5, cy = (pA.y + pB.y) * 0.5;
        world.emit('collision', { a: idA, b: idB, x: cx, y: cy, kind: 'particle' });
        if (mA.onCollide) {
          world.deathQueue.push({
            x: cx, y: cy, vx: vA.vx * 0.5, vy: vA.vy * 0.5,
            inheritVel: 0, preset: mA.onCollide, count: 8, depth: mA.depth || 0,
          });
        }
        if (mB.onCollide) {
          world.deathQueue.push({
            x: cx, y: cy, vx: vA.vx * 0.5, vy: vA.vy * 0.5,
            inheritVel: 0, preset: mB.onCollide, count: 8, depth: mB.depth || 0,
          });
        }
      }
    }
  }
}

/* ============================================================
   FLOW FIELD
   ============================================================ */
function regenerateFlowField(world, layerIdx, scale) {
  const COLS = 32, ROWS = 32;
  const grid = new Float32Array(COLS * ROWS * 2);
  const phase = Math.random() * 100;
  const freq = scale * 100;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const fx = x * freq + phase;
      const fy = y * freq + phase * 0.7;
      const angle = fsin(fx) + fcos(fy * 0.8) + fsin((fx + fy) * 0.5);
      const idx = (y * COLS + x) * 2;
      grid[idx] = fcos(angle);
      grid[idx + 1] = fsin(angle);
    }
  }
  if (!world.flowFields) world.flowFields = [];
  world.flowFields[layerIdx] = {
    grid, cols: COLS, rows: ROWS,
    cellW: world.width / COLS, cellH: world.height / ROWS,
    timer: 0, interval: 4.0,
  };
}
function sampleFlowField(field, x, y, out) {
  const fx = x / field.cellW, fy = y / field.cellH;
  let x0 = Math.floor(fx), y0 = Math.floor(fy);
  if (x0 < 0) x0 = 0; else if (x0 >= field.cols - 1) x0 = field.cols - 2;
  if (y0 < 0) y0 = 0; else if (y0 >= field.rows - 1) y0 = field.rows - 2;
  const tx = fx - x0, ty = fy - y0;
  const g = field.grid, C = field.cols;
  const i00 = (y0 * C + x0) * 2, i10 = i00 + 2;
  const i01 = ((y0 + 1) * C + x0) * 2, i11 = i01 + 2;
  const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty, w11 = tx * ty;
  out.x = g[i00]*w00 + g[i10]*w10 + g[i01]*w01 + g[i11]*w11;
  out.y = g[i00+1]*w00 + g[i10+1]*w10 + g[i01+1]*w01 + g[i11+1]*w11;
}
function updateFlowFields(world, dt) {
  if (!world.flowFields) return;
  const layers = world.layers;
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li];
    if (!L.enabled || L.flowField <= 0) { world.flowFields[li] = null; continue; }
    let f = world.flowFields[li];
    if (!f) { regenerateFlowField(world, li, L.flowScale); f = world.flowFields[li]; }
    f.timer += dt;
    if (f.timer >= f.interval) { f.timer = 0; regenerateFlowField(world, li, L.flowScale); }
  }
}

/* ============================================================
   SPLASH + DEATH QUEUES
   ============================================================ */
function processSplashQueue(world) {
  const q = world.splashQueue;
  for (let i = 0; i < q.length; i++) {
    const s = q[i];
    for (let j = 0; j < 4; j++) {
      if (world.freeList.length === 0) break;
      const id = world.freeList.pop();
      world.aliveList.push(id);
      const angle = -Math.PI/2 + (Math.random()-0.5)*Math.PI;
      const speed = 60 + Math.random()*100;
      const p = world.get(id, 'pos'), v = world.get(id, 'vel'), l = world.get(id, 'life');
      const r = world.get(id, 'render'), ph = world.get(id, 'phys'), f = world.get(id, 'force'), m = world.get(id, 'meta');
      world.get(id, 'active').v = 1;
      p.x = s.x + (Math.random()-0.5)*20; p.y = s.y - 2;
      v.vx = fcos(angle)*speed; v.vy = fsin(angle)*speed;
      l.t = 0.4 + Math.random()*0.3; l.max = l.t;
      r.size0 = 2 + Math.random()*3;
      r.spriteA = SPRITES['radial_' + s.colorKey] || SPRITES.radial_blood;
      r.spriteB = r.spriteA;
      r.spriteKey = 'radial_' + s.colorKey;
      r.spriteKeyB = r.spriteKey;
      r.stretch = 1; r.angle = 0; r.angularVel = 0; r.bounces = 0;
      r.alignToVel = false; r.wobbleAmp = 0; r.flickerAmp = 0; r.grow = 0;
      r.sizeCurve = 'easeOut'; r.alphaCurve = 'linear'; r.blend = 'lighter';
      r.metaball = false; r.trail = null; r.seed = Math.random(); r.layerIdx = -1;
      r.depth = 0; r.depthScale = 1; r.depthAlpha = 1; r.depthSpeed = 1;
      ph.gx = 0; ph.gy = 400; ph.drag = 0.6; ph.bounce = 0; ph.splash = 0; ph.sticky = 1; ph.border = 'none';
      f.wx = 0; f.wy = 0; f.cx = 0; f.cy = 0; f.swirl = 0; f.attract = 0;
      f.wanderAmp = 0; f.wanderPhase = 0; f.turb = 0; f.turbPhase = 0;
      f.curl = 0; f.curlScale = 0.008; f.flow = 0; f.flowScale = 0.02;
      m.kind = 'free'; m.boid = null; m.rigid = null; m.spawnOnDeath = null; m.inheritVel = 0;
      m.customBehavior = null; m.depth = 0; m.collide = false;
    }
  }
  q.length = 0;
}

const MAX_DEATH_QUEUE = 500;
function processDeathQueue(world) {
  const q = world.deathQueue;
  if (q.length > MAX_DEATH_QUEUE) q.length = MAX_DEATH_QUEUE;
  for (let i = 0; i < q.length; i++) {
    const d = q[i];
    const preset = Registry.presets[d.preset] || PRESETS[d.preset];
    if (!preset) continue;
    const tmpL = Object.assign(makeLayer(), preset);
    tmpL.emitter = { fx: d.x/world.width, fy: d.y/world.height, fw: 0, angle: 0, spread: 360 };
    tmpL.life = tmpL.life || 1;
    tmpL.timer = 1;
    tmpL.spawnOnDeath = preset.spawnOnDeath || null;
    tmpL.spawnDepth = (d.depth || 0) + 1;
    const inh = d.inheritVel || 0;
    if (tmpL.spawnOnDeath && (d.depth || 0) >= 3) tmpL.spawnOnDeath = null;
    for (let k = 0; k < d.count; k++) {
      spawnFromLayer(world, tmpL, -1, {
        inheritVx: d.vx * inh, inheritVy: d.vy * inh,
        depth: d.depth || 0,
      });
    }
  }
  q.length = 0;
}

/* ============================================================
   EMITTER
   ============================================================ */
function emitterSystem(world, dt) {
  const layers = world.layers;
  for (let li = 0; li < layers.length; li++) {
    const L = layers[li];
    if (!L.enabled) continue;
    if (L.effectType === 'tesla') { ensureTesla(world, L, li); continue; }
    if (L.effectType === 'chain') {
      L.timer += dt;
      const interval = 1 / Math.max(0.1, L.rate);
      while (L.timer >= interval) { L.timer -= interval; spawnChain(world, L); }
      continue;
    }
    const eff = Registry.effects[L.effectType];
    if (eff) {
      L.timer += dt;
      const interval = 1 / Math.max(0.1, L.rate || 1);
      let guard = 0;
      while (L.timer >= interval && guard++ < 200) {
        L.timer -= interval;
        eff.spawn(world, L);
      }
      continue;
    }
    if (L.rate <= 0) continue;
    L.timer += dt;
    const interval = 1 / L.rate;
    let count = 0;
    while (L.timer >= interval && count < 200) {
      L.timer -= interval;
      if (L.effectType === 'bolt') spawnBolt(world, L);
      else if (L.effectType === 'centella') spawnCentella(world, L);
      else if (L.effectType === 'ballLightning') spawnBallLightning(world, L);
      else spawnFromLayer(world, L, li);
      count++;
    }
  }
}

/* ============================================================
   MOTION
   ============================================================ */
function motionSystem(world, dt) {
  const pos = world.store('pos'), vel = world.store('vel');
  const phys = world.store('phys'), force = world.store('force');
  const render = world.store('render'), active = world.store('active'), meta = world.store('meta');
  const W = world.width, H = world.height, M = 30;
  const alive = world.aliveList;
  const config = world.config;
  const wells = [];
  if (config.wellCount > 0) {
    for (let w = 0; w < config.wellCount; w++) {
      const a = world.time*.3 + w*Math.PI*2/config.wellCount;
      wells.push({ x: W/2+fcos(a)*W*.3, y: H/2+fsin(a)*H*.3 });
    }
  }
  for (let i = 0; i < alive.length; i++) {
    const id = alive[i];
    const m = meta.get(id);
    if (m && (m.kind === 'boid' || m.kind === 'rigid' || m.customBehavior)) continue;
    const p = pos.get(id), v = vel.get(id);
    const g = phys.get(id), f = force.get(id), r = render.get(id);
    v.vx += g.gx*dt; v.vy += g.gy*dt;
    v.vx += f.wx*dt; v.vy += f.wy*dt;
    if (f.swirl || f.attract) {
      const dx = p.x-f.cx, dy = p.y-f.cy;
      if (f.swirl) { v.vx += -dy*f.swirl*dt; v.vy += dx*f.swirl*dt; }
      if (f.attract !== 0) {
        const dist = Math.sqrt(dx*dx+dy*dy)+60;
        v.vx += (-dx/dist)*f.attract*60*dt;
        v.vy += (-dy/dist)*f.attract*60*dt;
      }
    }
    for (let w = 0; w < wells.length; w++) {
      const dx = wells[w].x-p.x, dy = wells[w].y-p.y;
      const d = Math.sqrt(dx*dx+dy*dy)+1;
      const fo = Math.min(1, 200/d);
      v.vx += (dx/d)*config.wellStrength*fo*dt;
      v.vy += (dy/d)*config.wellStrength*fo*dt;
    }
    if (f.wanderAmp > 0) {
      const vlen = Math.sqrt(v.vx*v.vx+v.vy*v.vy) || 1;
      const wave = fsin(world.time*f.wanderFreq+f.wanderPhase)*f.wanderAmp;
      v.vx += (-v.vy/vlen)*wave*dt; v.vy += (v.vx/vlen)*wave*dt;
    }
    if (f.turb > 0) {
      const t = world.time*.8 + f.turbPhase;
      v.vx += fsin(p.y*.025+t)*fcos(p.x*.018+t*.7)*f.turb*60*dt;
      v.vy += fcos(p.x*.022+t*1.1)*fsin(p.y*.015+t*.5)*f.turb*60*dt;
    }
    if (f.curl > 0) {
      const t = world.time * 0.5 + r.seed * 10;
      const s = f.curlScale;
      const dPsiDy = -s * fsin(s * p.x + t) * fsin(s * p.y + t * 0.7);
      const dPsiDx =  s * fcos(s * p.x + t) * fcos(s * p.y + t * 0.7);
      v.vx += dPsiDy * f.curl * 400 * dt;
      v.vy += -dPsiDx * f.curl * 400 * dt;
    }
    if (f.flow > 0 && world.flowFields) {
      const layerIdx = r.layerIdx !== undefined ? r.layerIdx : -1;
      const field = layerIdx >= 0 ? world.flowFields[layerIdx] : null;
      if (field) {
        sampleFlowField(field, p.x, p.y, world._flowOut || (world._flowOut = { x: 0, y: 0 }));
        v.vx += world._flowOut.x * f.flow * 200 * dt;
        v.vy += world._flowOut.y * f.flow * 200 * dt;
      }
    }
    let d = 1 - g.drag*dt; if (d < 0) d = 0;
    v.vx *= d; v.vy *= d;
    p.x += v.vx*dt; p.y += v.vy*dt;
    if (r.trail) {
      r.trail.xs[r.trail.head] = p.x;
      r.trail.ys[r.trail.head] = p.y;
      r.trail.head = (r.trail.head + 1) % r.trail.maxLen;
      if (r.trail.count < r.trail.maxLen) r.trail.count++;
    }
    if (r.angularVel !== 0) r.angle += r.angularVel*dt;
    if (r.alignToVel) {
      const spd = Math.sqrt(v.vx*v.vx+v.vy*v.vy);
      if (spd > 1) r.angle = fatan2(v.vy,v.vx)-Math.PI/2;
    }
    if (g.border === 'bounce') {
      if (p.x < M) { p.x = M; v.vx = -v.vx*.7; }
      else if (p.x > W-M) { p.x = W-M; v.vx = -v.vx*.7; }
      if (p.y < M) { p.y = M; v.vy = -v.vy*.7; }
      else if (p.y > H-M) {
        p.y = H-M; v.vy = -Math.abs(v.vy)*.7;
        r.bounces++;
        if (r.bounces > 4 || Math.abs(v.vy) < 25) active.get(id).v = 0;
      }
    } else if (g.border === 'wrap') {
      if (p.x < -M) p.x = W+M; else if (p.x > W+M) p.x = -M;
      if (p.y < -M) p.y = H+M; else if (p.y > H+M) p.y = -M;
    } else if (g.border === 'kill') {
      if (p.x < -M || p.x > W+M || p.y < -M || p.y > H+M) { active.get(id).v = 0; continue; }
    } else {
      if (p.x < -500 || p.x > W+500 || p.y < -500 || p.y > H+500) { active.get(id).v = 0; continue; }
    }
    if (g.splash && p.y > H-4 && v.vy > 0) {
      if (world.splashQueue.length < 200) world.splashQueue.push({ x: p.x, y: H-4, colorKey: r.spriteKey.split('_')[1] });
      active.get(id).v = 0; continue;
    }
    if (g.sticky && p.y >= H-4) {
      p.y = H-4; v.vx = 0; v.vy = 0;
      g.gy = 0; g.drag = 100; g.sticky = 0;
      const life = world.get(id, 'life');
      if (life.t < 2) { life.t = 2; life.max = 2; }
      world.emit('stick', { id, x: p.x, y: p.y });
    }
    if (g.bounce > 0 && p.y > H-4 && v.vy > 0) {
      p.y = H-4; v.vy = -v.vy*g.bounce; v.vx *= .7;
      r.bounces++;
      if (r.bounces > 2 || Math.abs(v.vy) < 25) active.get(id).v = 0;
    }
  }
}

/* ============================================================
   LIFE + COMPACT
   ============================================================ */
function lifeSystem(world, dt) {
  const life = world.store('life'), active = world.store('active'), pos = world.store('pos'), vel = world.store('vel');
  const phys = world.store('phys'), meta = world.store('meta');
  const W = world.width, H = world.height, alive = world.aliveList;
  for (let i = 0; i < alive.length; i++) {
    const id = alive[i];
    const l = life.get(id);
    l.t -= dt;
    const p = pos.get(id);
    let dead = false;
    if (l.t <= 0) dead = true;
    else if (phys.get(id).border === 'none') {
      if (p.x < -400 || p.x > W+400 || p.y < -400 || p.y > H+400) dead = true;
    }
    if (dead) {
      const m = meta.get(id);
      if (m && m.customBehavior) {
        const b = Registry.behaviors[m.customBehavior];
        if (b && b.onDeath) b.onDeath(world, id);
      }
      if (m && m.spawnOnDeath && (m.depth || 0) < (m.spawnOnDeath.maxDepth ?? 3)) {
        world.deathQueue.push({
          x: p.x, y: p.y, vx: vel.get(id).vx, vy: vel.get(id).vy,
          inheritVel: m.inheritVel || 0,
          preset: m.spawnOnDeath.preset, count: m.spawnOnDeath.count,
          depth: (m.depth || 0),
        });
      }
      world.emit('death', { id, x: p.x, y: p.y, layerIdx: 0 });
      active.get(id).v = 0;
    }
  }
}

function compactSystem(world) {
  const alive = world.aliveList, active = world.store('active'), free = world.freeList;
  let n = 0;
  for (let i = 0; i < alive.length; i++) {
    const id = alive[i];
    if (active.get(id).v === 1) alive[n++] = id;
    else free.push(id);
  }
  alive.length = n;
  world.activeCount = n;
}

/* ============================================================
   RENDER
   ============================================================ */
function drawPath(ctx, pts) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

function renderScene(world, ctx, t0) {
  const pos = world.store('pos'), life = world.store('life'), render = world.store('render');
  const alive = world.aliveList;
  const W = world.width, H = world.height, lod = world.lod, CULL = 200;

  const effects = Registry.effects;
  for (const name in effects) {
    const eff = effects[name];
    if (eff.z != null && eff.z < 0 && eff.render) eff.render(world, ctx);
  }

  if (lod < 2) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < alive.length; i++) {
      const id = alive[i];
      const r = render.get(id);
      if (!r.trail || r.trail.count < 2) continue;
      const p = pos.get(id);
      if (p.x < -CULL || p.x > W+CULL || p.y < -CULL || p.y > H+CULL) continue;
      const t = life.get(id).t / life.get(id).max;
      const [cr,cg,cb] = r.trail.color;
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${t*.7})`;
      ctx.lineWidth = r.trail.width * t;
      ctx.beginPath();
      const maxL = r.trail.maxLen, start = r.trail.head;
      let first = true;
      for (let k = 0; k < r.trail.count; k++) {
        const idx = (start + k) % maxL;
        const x = r.trail.xs[idx], y = r.trail.ys[idx];
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const blends = ['lighter', 'source-over', 'screen'];
  for (let bi = 0; bi < blends.length; bi++) {
    const blend = blends[bi];
    ctx.globalCompositeOperation = blend;
    for (let i = 0; i < alive.length; i++) {
      const id = alive[i];
      const r = render.get(id);
      if (r.blend !== blend) continue;
      const p = pos.get(id), l = life.get(id);
      if (p.x < -CULL || p.x > W+CULL || p.y < -CULL || p.y > H+CULL) continue;
      const t = l.t/l.max, age = 1-t;
      let size;
      if (r.grow) size = r.size0*(.15+age*2.5);
      else size = r.size0*curveValue(t, r.sizeCurve);
      if (r.wobbleAmp > 0 && lod === 0) {
        const s = world._sinT3 * r.cosWobble + world._cosT3 * r.sinWobble;
        size *= 1 + s * r.wobbleAmp;
      }
      if (r.metaball) size *= 1.6;
      if (world._hasDepth) size *= r.depthScale;
      let alpha = curveValue(t, r.alphaCurve);
      if (r.metaball) alpha *= .35;
      if (r.flickerAmp > 0 && lod === 0) {
        const s = world._sinT8 * r.cosFlicker + world._cosT8 * r.sinFlicker;
        alpha *= 1 - r.flickerAmp*(.5+.5*s);
      }
      if (world._hasDepth) alpha *= r.depthAlpha;
      alpha = Math.max(0, Math.min(1, alpha));
      const spriteA = pickSprite(r.spriteKey, lod, r.size0);
      const spriteB = r.spriteKeyB ? pickSprite(r.spriteKeyB, lod, r.size0) : spriteA;
      const hasGradient = spriteA !== spriteB && lod < 2;
      const needsRotate = (r.angularVel !== 0 || r.alignToVel) && lod < 2;
      const w = size, h = size*r.stretch;
      if (needsRotate) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(r.angle);
        if (hasGradient) { ctx.globalAlpha = alpha*t; ctx.drawImage(spriteA, -w, -h, w*2, h*2); ctx.globalAlpha = alpha*(1-t); ctx.drawImage(spriteB, -w, -h, w*2, h*2); }
        else { ctx.globalAlpha = alpha; ctx.drawImage(spriteA, -w, -h, w*2, h*2); }
        ctx.restore();
      } else {
        if (hasGradient) { ctx.globalAlpha = alpha*t; ctx.drawImage(spriteA, p.x-w, p.y-h, w*2, h*2); ctx.globalAlpha = alpha*(1-t); ctx.drawImage(spriteB, p.x-w, p.y-h, w*2, h*2); }
        else { ctx.globalAlpha = alpha; ctx.drawImage(spriteA, p.x-w, p.y-h, w*2, h*2); }
      }
    }
  }
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'source-over';
  if (world.teslas.length > 0) {
    ctx.strokeStyle = '#3a4570'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const T of world.teslas) {
      ctx.beginPath();
      ctx.moveTo(T.x1,T.y1); ctx.lineTo(T.x1,T.topY);
      ctx.moveTo(T.x2,T.y2); ctx.lineTo(T.x2,T.topY);
      ctx.stroke();
      ctx.fillStyle = '#5a6a9a';
      ctx.beginPath(); ctx.arc(T.x1,T.topY,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(T.x2,T.topY,5,0,Math.PI*2); ctx.fill();
    }
  }

  // Chains — v10.2 con taper por segmento + wobble + segments
  if (world.chains.length > 0) {
    ctx.globalCompositeOperation = 'source-over';
    for (const c of world.chains) {
      const t = c.t/c.max;
      const [cr,cg,cb] = c.color;
      const n = c.links.length;
      const tStart = c.taperStart ?? 1;
      const tEnd = c.taperEnd ?? 1;

      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${t})`;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let j = 0; j < n-1; j++) {
        const frac0 = j / (n-1);
        const frac1 = (j+1) / (n-1);
        const w0 = c.width * (tStart + (tEnd - tStart) * frac0);
        const w1 = c.width * (tStart + (tEnd - tStart) * frac1);
        const w = (w0 + w1) * 0.5;
        ctx.lineWidth = Math.max(0.5, w);
        ctx.beginPath();
        ctx.moveTo(c.links[j].x, c.links[j].y);
        ctx.lineTo(c.links[j+1].x, c.links[j+1].y);
        ctx.stroke();
      }

      const last = c.links[n-1];
      const wEnd = c.width * tEnd;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${t})`;
      ctx.beginPath();
      ctx.arc(last.x, last.y, Math.max(0.5, wEnd * 0.5), 0, Math.PI*2);
      ctx.fill();

      if (c.segments > 0) {
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${t*.8})`;
        for (let j = 1; j < n; j += 2) {
          const frac = j / (n-1);
          const w = c.width * (tStart + (tEnd - tStart) * frac);
          ctx.beginPath();
          ctx.arc(c.links[j].x, c.links[j].y, w * 0.8, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  if (world.orbs.length > 0) {
    ctx.globalCompositeOperation = 'lighter';
    for (const o of world.orbs) {
      const t = o.t/o.max;
      const fi = Math.min(1, (1-t)*8), fo = Math.min(1, t*4);
      const inten = (.7+.3*fsin(t0*25+o.seed))*fi*fo;
      const outer = o.radius*2.5;
      ctx.globalAlpha = inten*.55;
      ctx.drawImage(SPRITES['radial_'+o.colorKey] || SPRITES.radial_bolt, o.x-outer, o.y-outer, outer*2, outer*2);
      const inner = o.radius*1.2;
      ctx.globalAlpha = inten*.9;
      ctx.drawImage(SPRITES.radial_bolt, o.x-inner, o.y-inner, inner*2, inner*2);
      ctx.globalAlpha = inten;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.radius*.35, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (world.bolts.length > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const bolt of world.bolts) {
      const t = bolt.t/bolt.max;
      const flicker = .65 + .35*fsin(t0*50+bolt.seed);
      const alpha = t*flicker;
      const [cr,cg,cb] = bolt.color;
      if (bolt.kind === 'flash') {
        const sprite = SPRITES['radial_'+bolt.colorKey] || SPRITES.radial_bolt;
        const size = bolt.width*(.5+(1-t)*1.5);
        ctx.globalAlpha = alpha*.9;
        ctx.drawImage(sprite, bolt.pts[0].x-size, bolt.pts[0].y-size, size*2, size*2);
        continue;
      }
      const wMul = (bolt.kind === 'spark-ray' || bolt.kind === 'orb-arc') ? .75 : 1;
      const bw = bolt.width*wMul;
      ctx.globalAlpha = alpha*.15; ctx.strokeStyle = `rgb(${cr},${cg},${cb})`; ctx.lineWidth = bw*5;
      ctx.beginPath(); drawPath(ctx, bolt.pts); ctx.stroke();
      ctx.globalAlpha = alpha*.75; ctx.lineWidth = bw*1.6;
      ctx.beginPath(); drawPath(ctx, bolt.pts); ctx.stroke();
      ctx.globalAlpha = alpha; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = bw*.55;
      ctx.beginPath(); drawPath(ctx, bolt.pts); ctx.stroke();
      if (bolt.branches) {
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        for (const br of bolt.branches) {
          ctx.globalAlpha = alpha*.1; ctx.lineWidth = bw*3;
          ctx.beginPath(); drawPath(ctx, br); ctx.stroke();
          ctx.globalAlpha = alpha*.55; ctx.lineWidth = bw*.8;
          ctx.beginPath(); drawPath(ctx, br); ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  for (const name in effects) {
    const eff = effects[name];
    if ((eff.z == null || eff.z >= 0) && eff.render) eff.render(world, ctx);
  }
}

/* ============================================================
   RENDER SYSTEM
   ============================================================ */
function renderSystem(world) {
  const ctx = world.ctx, sceneCtx = world.sceneCtx;
  const W = world.width, H = world.height, t0 = world.time;
  const rs = world.renderScale || 1;
  sceneCtx.setTransform(world.dpr * rs, 0, 0, world.dpr * rs, 0, 0);
  sceneCtx.globalCompositeOperation = 'source-over';
  sceneCtx.globalAlpha = 1;
  sceneCtx.clearRect(0, 0, W, H);
  renderScene(world, sceneCtx, t0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(5,6,10,${world.config.trail})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(world.sceneCanvas, 0, 0, world.sceneCanvas.width, world.sceneCanvas.height, 0, 0, W, H);
  if (world.config.bloom > .01) {
    const bc = world.bloomCtx, bcw = world.bloomCanvas.width, bch = world.bloomCanvas.height;
    bc.clearRect(0, 0, bcw, bch);
    bc.drawImage(world.sceneCanvas, 0, 0, bcw, bch);
    ctx.globalAlpha = world.config.bloom;
    ctx.drawImage(world.bloomCanvas, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (world.screenFlash > .01) {
    ctx.fillStyle = `rgba(180,200,255,${world.screenFlash*.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/* ============================================================
   API PÚBLICA
   ============================================================ */
function create(canvas, options) {
  options = options || {};
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const world = new World(w, h, canvas, ctx);
  world.layers = [makeLayer(), makeLayer(), makeLayer()];
  world.config.trail = options.trail != null ? options.trail : 0.18;
  initPool(world, options.poolSize || 2000);
  world.boidHash.resize(w, h);
  world.rigidHash.resize(w, h);

  const inst = {
    canvas, ctx, world,
    get layers() { return world.layers; },
    get config() { return world.config; },
    activeLayerIdx: 0,
    dprConfig: {
      mode: options.dprMode || 'auto',
      renderScale: 1.0,
      autoRenderScale: options.autoRenderScale !== false,
    },
    paused: false, running: false, onFrame: null,
    _rafId: 0, _lastTime: 0, _frameCount: 0,
    _ftAccum: 0, _ftCount: 0, _ftTimer: 0,
  };

  inst.resize = function() {
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    const dpr = inst.dprConfig.mode === 'auto' ? (detectMobile() ? 1 : rawDpr) : parseFloat(inst.dprConfig.mode);
    const cw = canvas.clientWidth || window.innerWidth;
    const ch = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    world.dpr = dpr; world.width = cw; world.height = ch;
    const scale = inst.dprConfig.renderScale;
    world.renderScale = scale;
    if (!world.sceneCanvas) {
      world.sceneCanvas = document.createElement('canvas');
      world.sceneCtx = world.sceneCanvas.getContext('2d');
    }
    world.sceneCanvas.width = Math.max(64, Math.floor(canvas.width * scale));
    world.sceneCanvas.height = Math.max(64, Math.floor(canvas.height * scale));
    world.sceneCtx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    if (!world.bloomCanvas) {
      world.bloomCanvas = document.createElement('canvas');
      world.bloomCtx = world.bloomCanvas.getContext('2d');
    }
    world.bloomCanvas.width = Math.max(64, Math.floor(canvas.width / 4));
    world.bloomCanvas.height = Math.max(64, Math.floor(canvas.height / 4));
    world.boidHash.resize(cw, ch);
    world.rigidHash.resize(cw, ch);
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, cw, ch);
  };

  inst.applyPreset = function(name, idx) {
    if (idx === undefined) idx = inst.activeLayerIdx;
    const p = Registry.presets[name] || PRESETS[name];
    if (!p) return;
    const L = world.layers[idx];
    const defaults = makeLayer();
    Object.assign(L, defaults);
    L.emitter = Object.assign({}, defaults.emitter);
    for (const k in p) {
      if (k === 'emitter') Object.assign(L.emitter, p.emitter);
      else L[k] = Array.isArray(p[k]) ? p[k].slice() : p[k];
    }
    L.effectType = p.effectType || 'particle';
    L.behavior = p.behavior || 'free';
    L.enabled = true;
    L.timer = 0;
  };

  inst.applyMultiPreset = function(name) {
    const m = Registry.multiPresets[name] || MULTI_PRESETS[name];
    if (!m) return;
    for (let i = 0; i < 3; i++) {
      if (i < m.length) {
        inst.applyPreset(m[i].preset, i);
        const ov = m[i];
        if (ov.colors) world.layers[i].colors = ov.colors;
        if (ov.rate !== undefined) world.layers[i].rate = ov.rate;
        if (ov.emitter) Object.assign(world.layers[i].emitter, ov.emitter);
      } else world.layers[i].enabled = false;
    }
  };

  inst.spawnAt = function(x, y, count) {
    count = count || 20;
    for (let li = 0; li < world.layers.length; li++) {
      const L = world.layers[li];
      if (!L.enabled) continue;
      const eff = Registry.effects[L.effectType];
      if (eff && eff.spawn) {
        const tmp = Object.assign({}, L);
        tmp.emitter = { fx: x / world.width, fy: y / world.height, fw: 0, angle: 0, spread: 360 };
        eff.spawn(world, tmp);
        continue;
      }
      if (L.effectType === 'bolt') {
        const tmp = Object.assign({}, L, { boltMode: 'from-emitter' });
        tmp.emitter = { fx: x / world.width, fy: y / world.height, fw: 0, angle: 0, spread: 360 };
        spawnBolt(world, tmp);
      } else if (L.effectType === 'centella') {
        const tmp = Object.assign({}, L);
        tmp.emitter = { fx: x / world.width, fy: y / world.height, fw: 0, angle: 0, spread: 360 };
        spawnCentella(world, tmp);
      } else if (L.effectType === 'ballLightning') {
        const tmp = Object.assign({}, L);
        tmp.emitter = { fx: x / world.width, fy: y / world.height, fw: 0, angle: 0, spread: 360 };
        spawnBallLightning(world, tmp);
      } else if (L.effectType === 'tesla') {
        // nada
      } else {
        const saved = { fx: L.emitter.fx, fy: L.emitter.fy, angle: L.emitter.angle, spread: L.emitter.spread };
        L.emitter.fx = x / world.width; L.emitter.fy = y / world.height;
        L.emitter.angle = Math.random() * 360 - 180; L.emitter.spread = 360;
        spawnFromLayer(world, L, li, { count });
        Object.assign(L.emitter, saved);
      }
    }
  };

  inst.update = function(dt) {
    inst._frameCount++;
    if (world.lodRequested >= 0) world.lod = world.lodRequested;
    else {
      const n = world.activeCount;
      world.lod = n > 6000 ? 2 : n > 3000 ? 1 : 0;
    }
    world._sinT3 = fsin(world.time * 3);
    world._cosT3 = fcos(world.time * 3);
    world._sinT8 = fsin(world.time * 8);
    world._cosT8 = fcos(world.time * 8);
    world._hasDepth = world.layers.some(L => L.enabled && L.depthMax > L.depthMin);

    for (const name in Registry.systems) {
      const s = Registry.systems[name];
      if (s.phase === 'before' && s.update) s.update(world, dt);
    }

    emitterSystem(world, dt);
    updateFlowFields(world, dt);

    const skipPhysics = world.lod >= 2 && (inst._frameCount & 1);
    const physicsDt = skipPhysics ? 0 : (world.lod >= 2 ? dt * 2 : dt);
    if (!skipPhysics) {
      boidSystem(world, physicsDt);
      customBehaviorSystem(world, physicsDt);
      motionSystem(world, physicsDt);
      rigidSystem(world, physicsDt);
      collisionSystem(world, physicsDt);
      updateChains(world, physicsDt);

      for (const name in Registry.systems) {
        const s = Registry.systems[name];
        if (s.phase === 'physics' && s.update) s.update(world, physicsDt);
      }
    }

    updateOrbs(world, dt);
    updateTeslas(world, dt);
    updateBolts(world, dt);
    processSplashQueue(world);
    processDeathQueue(world);
    lifeSystem(world, dt);
    compactSystem(world);

    for (const name in Registry.systems) {
      const s = Registry.systems[name];
      if (s.phase === 'after' && s.update) s.update(world, dt);
    }

    world.time += dt;

    if (inst.dprConfig.autoRenderScale) {
      inst._ftAccum += dt * 1000;
      inst._ftCount++;
      inst._ftTimer += dt;
      if (inst._ftTimer >= 1.0) {
        const avg = inst._ftAccum / inst._ftCount;
        let s = world.renderScale;
        if (avg > 17 && s > 0.5) s = Math.max(0.5, s - 0.05);
        else if (avg < 13 && s < 1.0) s = Math.min(1.0, s + 0.05);
        if (Math.abs(s - world.renderScale) > 0.001) {
          inst.dprConfig.renderScale = s;
          inst.resize();
        }
        inst._ftAccum = 0; inst._ftCount = 0; inst._ftTimer = 0;
      }
    }
  };

  inst.render = function() { renderSystem(world); };

  inst.start = function() {
    if (inst.running) return;
    inst.running = true;
    inst._lastTime = performance.now();
    const tick = (t) => {
      if (!inst.running) return;
      inst._rafId = requestAnimationFrame(tick);
      if (inst.paused) { inst._lastTime = t; return; }
      const realDt = Math.min((t - inst._lastTime) / 1000, 0.05);
      inst._lastTime = t;
      const dt = realDt * world.config.timeScale;
      inst.update(dt);
      inst.render();
      if (inst.onFrame) inst.onFrame(realDt);
    };
    inst._rafId = requestAnimationFrame(tick);
  };
  inst.stop = function() {
    inst.running = false;
    if (inst._rafId) cancelAnimationFrame(inst._rafId);
    inst._rafId = 0;
  };

  inst.setDprMode = function(mode) { inst.dprConfig.mode = mode; inst.resize(); };
  inst.setRenderScale = function(s) { inst.dprConfig.renderScale = s; inst.resize(); };
  inst.setAutoRenderScale = function(on) { inst.dprConfig.autoRenderScale = on; };
  inst.setTimeScale = function(s) { world.config.timeScale = s; };
  inst.setBloom = function(v) { world.config.bloom = v; };
  inst.setTrail = function(v) { world.config.trail = v; };
  inst.setLayerEnabled = function(idx, on) { if (world.layers[idx]) world.layers[idx].enabled = on; };
  inst.clear = function() {
    const alive = world.aliveList, active = world.store('active');
    for (let i = 0; i < alive.length; i++) active.get(alive[i]).v = 0;
    compactSystem(world);
    world.bolts.length = 0;
    world.orbs.length = 0;
    world.teslas.length = 0;
    world.chains.length = 0;
  };

  inst.on = function(type, fn) {
    if (!world.events[type]) world.events[type] = [];
    world.events[type].push({ fn });
    return () => inst.off(type, fn);
  };
  inst.off = function(type, fn) {
    const list = world.events[type];
    if (!list) return;
    for (let i = list.length - 1; i >= 0; i--) if (list[i].fn === fn) list.splice(i, 1);
  };

  document.addEventListener('visibilitychange', () => {
    inst.paused = document.hidden;
    if (!document.hidden) inst._lastTime = performance.now();
  });
  window.addEventListener('resize', () => inst.resize());
  window.addEventListener('orientationchange', () => setTimeout(() => inst.resize(), 120));

  inst.resize();
  return inst;
}

/* ============================================================
   REGISTERS
   ============================================================ */
function registerPreset(name, cfg) {
  if (typeof name !== 'string' || !name) throw new Error('registerPreset: name requerido');
  if (!cfg || typeof cfg !== 'object') throw new Error('registerPreset: cfg inválido');
  const defaults = makeLayer();
  const validated = {};
  for (const k in cfg) {
    if (k === 'emitter') validated.emitter = Object.assign({}, defaults.emitter, cfg.emitter);
    else if (k in defaults || k === 'effectType' || k === 'behavior') {
      validated[k] = Array.isArray(cfg[k]) ? cfg[k].slice() : cfg[k];
    } else {
      if (typeof console !== 'undefined') console.warn(`registerPreset "${name}": campo desconocido "${k}"`);
    }
  }
  Registry.presets[name] = validated;
  return true;
}
function unregisterPreset(name) { delete Registry.presets[name]; }

function registerMultiPreset(name, arr) {
  if (!Array.isArray(arr)) throw new Error('registerMultiPreset: se esperaba un array');
  for (const item of arr) {
    if (!item.preset) throw new Error(`registerMultiPreset "${name}": item sin preset`);
    if (!Registry.presets[item.preset] && !PRESETS[item.preset]) {
      throw new Error(`registerMultiPreset "${name}": preset "${item.preset}" no existe`);
    }
  }
  Registry.multiPresets[name] = arr;
  return true;
}
function unregisterMultiPreset(name) { delete Registry.multiPresets[name]; }

function registerSprite(name, canvasOrImage, opts) {
  opts = opts || {};
  if (!canvasOrImage) throw new Error('registerSprite: canvas/imagen requerido');
  const tint = opts.tint !== false;
  if (tint) {
    for (const ck in COLORS) {
      const c = document.createElement('canvas');
      c.width = canvasOrImage.width || 64;
      c.height = canvasOrImage.height || 64;
      const x = c.getContext('2d');
      x.drawImage(canvasOrImage, 0, 0);
      x.globalCompositeOperation = 'source-in';
      const [r,g,b] = COLORS[ck];
      x.fillStyle = `rgb(${r},${g},${b})`;
      x.fillRect(0, 0, c.width, c.height);
      const key = name + '_' + ck;
      SPRITES[key] = c;
      SPRITES_SMALL[key] = downsizeCanvas(c, 32);
      SPRITES_LARGE[key] = upsizeCanvas(c, 128);
    }
  } else {
    const key = name + '_custom';
    SPRITES[key] = canvasOrImage;
    SPRITES_SMALL[key] = downsizeCanvas(canvasOrImage, 32);
    SPRITES_LARGE[key] = upsizeCanvas(canvasOrImage, 128);
  }
  Registry.sprites[name] = { canvas: canvasOrImage, tint };
  return true;
}
function unregisterSprite(name) {
  for (const ck in COLORS) {
    delete SPRITES[name + '_' + ck];
    delete SPRITES_SMALL[name + '_' + ck];
    delete SPRITES_LARGE[name + '_' + ck];
  }
  delete SPRITES[name + '_custom'];
  delete SPRITES_SMALL[name + '_custom'];
  delete SPRITES_LARGE[name + '_custom'];
  delete Registry.sprites[name];
}

function registerCurve(name, fn) {
  if (typeof fn !== 'function') throw new Error('registerCurve: se esperaba una función');
  Registry.curves[name] = fn;
  return true;
}
function unregisterCurve(name) { delete Registry.curves[name]; }

/* v10.2: nuevo registerColor */
function registerColor(name, rgb) {
  if (typeof name !== 'string' || !name) throw new Error('registerColor: name requerido');
  if (!Array.isArray(rgb) || rgb.length !== 3) throw new Error('registerColor: rgb debe ser [r,g,b]');
  COLORS[name] = rgb;
  if (COLOR_NAMES.indexOf(name) === -1) COLOR_NAMES.push(name);
  for (const sk in SPRITE_MAKERS) {
    const key = sk + '_' + name;
    const base = SPRITE_MAKERS[sk](rgb);
    SPRITES[key] = base;
    SPRITES_SMALL[key] = downsizeCanvas(base, 32);
    SPRITES_LARGE[key] = upsizeCanvas(base, 128);
  }
  return true;
}
function unregisterColor(name) {
  if (COLORS[name]) delete COLORS[name];
  const idx = COLOR_NAMES.indexOf(name);
  if (idx !== -1) COLOR_NAMES.splice(idx, 1);
  for (const sk in SPRITE_MAKERS) {
    const key = sk + '_' + name;
    delete SPRITES[key];
    delete SPRITES_SMALL[key];
    delete SPRITES_LARGE[key];
  }
}

function registerBehavior(name, spec) {
  if (!spec || typeof spec.update !== 'function') throw new Error('registerBehavior: update requerido');
  Registry.behaviors[name] = spec;
  return true;
}
function unregisterBehavior(name) { delete Registry.behaviors[name]; }

function registerEffect(name, spec) {
  if (!spec || typeof spec.spawn !== 'function') throw new Error('registerEffect: spawn requerido');
  Registry.effects[name] = spec;
  return true;
}
function unregisterEffect(name) { delete Registry.effects[name]; }

function registerSystem(name, spec) {
  if (!spec || typeof spec.update !== 'function') throw new Error('registerSystem: update requerido');
  const phase = spec.phase || 'after';
  if (!['before', 'physics', 'after'].includes(phase)) {
    throw new Error('registerSystem: phase debe ser "before" | "physics" | "after"');
  }
  Registry.systems[name] = { ...spec, phase };
  return true;
}
function unregisterSystem(name) { delete Registry.systems[name]; }

function use(plugin) {
  if (!plugin || typeof plugin !== 'object') throw new Error('use: plugin inválido');
  const undo = [];
  try {
    if (plugin.colors) for (const k in plugin.colors) { registerColor(k, plugin.colors[k]); undo.push(() => unregisterColor(k)); }
    if (plugin.presets) for (const k in plugin.presets) { registerPreset(k, plugin.presets[k]); undo.push(() => unregisterPreset(k)); }
    if (plugin.multiPresets) for (const k in plugin.multiPresets) { registerMultiPreset(k, plugin.multiPresets[k]); undo.push(() => unregisterMultiPreset(k)); }
    if (plugin.sprites) for (const k in plugin.sprites) {
      const s = plugin.sprites[k];
      registerSprite(k, s.canvas || s, s);
      undo.push(() => unregisterSprite(k));
    }
    if (plugin.curves) for (const k in plugin.curves) { registerCurve(k, plugin.curves[k]); undo.push(() => unregisterCurve(k)); }
    if (plugin.behaviors) for (const k in plugin.behaviors) { registerBehavior(k, plugin.behaviors[k]); undo.push(() => unregisterBehavior(k)); }
    if (plugin.effects) for (const k in plugin.effects) { registerEffect(k, plugin.effects[k]); undo.push(() => unregisterEffect(k)); }
    if (plugin.systems) for (const k in plugin.systems) { registerSystem(k, plugin.systems[k]); undo.push(() => unregisterSystem(k)); }
  } catch (e) {
    for (let i = undo.length - 1; i >= 0; i--) undo[i]();
    throw e;
  }
  return () => { for (let i = undo.length - 1; i >= 0; i--) undo[i](); };
}

/* ============================================================
   EXPORT
   ============================================================ */
const ParticleLab = {
  create,
  FAST_TRIG, COLORS, COLOR_NAMES, SPRITE_NAMES, SPRITES,
  PRESETS, MULTI_PRESETS,
  makeLayer, curveValue,
  Registry,
  registerPreset, unregisterPreset,
  registerMultiPreset, unregisterMultiPreset,
  registerSprite, unregisterSprite,
  registerCurve, unregisterCurve,
  registerColor, unregisterColor,   // v10.2
  registerBehavior, unregisterBehavior,
  registerEffect, unregisterEffect,
  registerSystem, unregisterSystem,
  use,
  applyTrigPrecision, updateTrigEnabled, detectMobile,
  USE_BITMAP,
  fsin, fcos, ftan, fatan, fatan2,
  spawnBolt, spawnCentella, spawnBallLightning,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ParticleLab;
else (typeof window !== 'undefined' ? window : globalThis).ParticleLab = ParticleLab;

})(typeof window !== 'undefined' ? window : this);