const MAP_SIZE = 32;
const VERT_STRIDE = 9;

let worldHeights = [];
let worldMats = [];

function terrainY(x, z) {
  return (
    0.18 * Math.sin(x * 0.32) * Math.cos(z * 0.29) +
    0.08 * Math.sin(x * 0.71 + z * 0.53)
  );
}

function initWorldMaps() {
  worldHeights = [];
  worldMats = [];
  const HEIGHT_MAP_ROWS = [
    "44444444444444444444444444444444",
    "4..............................4",
    "4....33333333333333333333......4",
    "4....3..................3......4",
    "4....3..11111111111111..3......4",
    "4....3..1............1..3......4",
    "4....3..1..2222222..1..3.......4",
    "4....3..1..2.....2..1..3.......4",
    "4....3..1..2..00.2..1..3.......4",
    "4....3..1..2.....2..1..3.......4",
    "4....3..1..2222222..1..3.......4",
    "4....3..1............1..3......4",
    "4....3..11111111111111..3......4",
    "4....3..................3......4",
    "4....33333333333333333333......4",
    "4..............................4",
    "4......4444444444444444........4",
    "4......4..............4........4",
    "4......4..33333333....4........4",
    "4......4..3......3....4........4",
    "4......4..3..111..3....4.......4",
    "4......4..3..1.1..3....4.......4",
    "4......4..3..111..3....4.......4",
    "4......4..3......3....4........4",
    "4......4..33333333....4........4",
    "4......4..............4........4",
    "4......4444444444444444........4",
    "4..............................4",
    "4....22222222222222222222......4",
    "4..............................4",
    "4..............................4",
    "44444444444444444444444444444444",
  ];
  const MAT_MAP_ROWS = [
    "00000000000000000000000000000000",
    "0..............................0",
    "0....12121212121212121212......0",
    "0....1..................2......0",
    "0....1..02020202020202..2......0",
    "0....1..0..............0..2....0",
    "0....1..0..12121212..0..2......0",
    "0....1..0..1......2..0..2......0",
    "0....1..0..1..00.2..0..2.......0",
    "0....1..0..1......2..0..2......0",
    "0....1..0..12121212..0..2......0",
    "0....1..0..............0..2....0",
    "0....1..02020202020202..2......0",
    "0....1..................2......0",
    "0....12121212121212121212......0",
    "0..............................0",
    "0......0101010101010101........0",
    "0......0..............0........0",
    "0......0..12121212....0........0",
    "0......0..1......2....0........0",
    "0......0..1..020..2....0.......0",
    "0......0..1..0.0..2....0.......0",
    "0......0..1..020..2....0.......0",
    "0......0..1......2....0........0",
    "0......0..12121212....0........0",
    "0......0..............0........0",
    "0......0101010101010101........0",
    "0..............................0",
    "0....01010101010101010101......0",
    "0..............................0",
    "0..............................0",
    "00000000000000000000000000000000",
  ];
  let z, x, rowH, rowM;
  for (z = 0; z < MAP_SIZE; z++) {
    rowH = HEIGHT_MAP_ROWS[z];
    rowM = MAT_MAP_ROWS[z];
    const hr = [];
    const mr = [];
    for (x = 0; x < MAP_SIZE; x++) {
      var hc = rowH.charAt(x);
      var mc = rowM.charAt(x);
      var ch = hc >= "0" && hc <= "4" ? hc.charCodeAt(0) - 48 : 0;
      hr.push(ch);
      mr.push(mc >= "0" && mc <= "9" ? (mc.charCodeAt(0) - 48) % 3 : 0);
    }
    worldHeights.push(hr);
    worldMats.push(mr);
  }
}

function heightAt(ix, iz) {
  if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return 0;
  return worldHeights[iz][ix];
}

function matAt(ix, iz) {
  if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return 0;
  return worldMats[iz][ix];
}

function setHeight(ix, iz, h) {
  if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return;
  worldHeights[iz][ix] = Math.max(0, Math.min(4, h | 0));
}

function columnTopY(ix, iz) {
  if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return -1;
  var h = heightAt(ix, iz);
  var base = terrainY(ix + 0.5, iz + 0.5);
  return base + h;
}

function standingBaseY(ex, ez) {
  var ix = Math.floor(ex);
  var iz = Math.floor(ez);
  var mx = terrainY(ex, ez);
  var dx, dz, x, z, top;
  for (dx = -1; dx <= 1; dx++) {
    for (dz = -1; dz <= 1; dz++) {
      x = ix + dx;
      z = iz + dz;
      if (x < 0 || z < 0 || x >= MAP_SIZE || z >= MAP_SIZE) continue;
      if (Math.abs(ex - (x + 0.5)) > 0.58) continue;
      if (Math.abs(ez - (z + 0.5)) > 0.58) continue;
      top = columnTopY(x, z);
      if (top > mx) mx = top;
    }
  }
  return mx;
}

var _tmp = [0, 0, 0];

function transformPoint(m, x, y, z, out) {
  const e = m.elements;
  out[0] = e[0] * x + e[4] * y + e[8] * z + e[12];
  out[1] = e[1] * x + e[5] * y + e[9] * z + e[13];
  out[2] = e[2] * x + e[6] * y + e[10] * z + e[14];
}

const UNIT_CUBE_TRIS = [
  [0.5, -0.5, 0.5, 0.9, 0.35, 0.3, 0, 0],
  [0.5, -0.5, -0.5, 0.9, 0.35, 0.3, 1, 0],
  [0.5, 0.5, -0.5, 0.9, 0.35, 0.3, 1, 1],
  [0.5, -0.5, 0.5, 0.9, 0.35, 0.3, 0, 0],
  [0.5, 0.5, -0.5, 0.9, 0.35, 0.3, 1, 1],
  [0.5, 0.5, 0.5, 0.9, 0.35, 0.3, 0, 1],
  [-0.5, -0.5, -0.5, 0.35, 0.85, 0.35, 0, 0],
  [-0.5, -0.5, 0.5, 0.35, 0.85, 0.35, 1, 0],
  [-0.5, 0.5, 0.5, 0.35, 0.85, 0.35, 1, 1],
  [-0.5, -0.5, -0.5, 0.35, 0.85, 0.35, 0, 0],
  [-0.5, 0.5, 0.5, 0.35, 0.85, 0.35, 1, 1],
  [-0.5, 0.5, -0.5, 0.35, 0.85, 0.35, 0, 1],
  [1.0, 1.0, 1.0, 0.35, 0.4, 0.95, 0, 0],
  [-1.0, 1.0, 1.0, 0.35, 0.4, 0.95, 1, 0],
  [-1.0, -1.0, 1.0, 0.35, 0.4, 0.95, 1, 1],
  [1.0, 1.0, 1.0, 0.35, 0.4, 0.95, 0, 0],
  [-1.0, -1.0, 1.0, 0.35, 0.4, 0.95, 1, 1],
  [1.0, -1.0, 1.0, 0.35, 0.4, 0.95, 0, 1],
  [0.5, -0.5, -0.5, 0.35, 0.9, 0.9, 0, 0],
  [-0.5, -0.5, -0.5, 0.35, 0.9, 0.9, 1, 0],
  [-0.5, 0.5, -0.5, 0.35, 0.9, 0.9, 1, 1],
  [0.5, -0.5, -0.5, 0.35, 0.9, 0.9, 0, 0],
  [-0.5, 0.5, -0.5, 0.35, 0.9, 0.9, 1, 1],
  [0.5, 0.5, -0.5, 0.35, 0.9, 0.9, 0, 1],
  [0.5, 0.5, -0.5, 0.95, 0.85, 0.35, 0, 0],
  [-0.5, 0.5, -0.5, 0.95, 0.85, 0.35, 1, 0],
  [-0.5, 0.5, 0.5, 0.95, 0.85, 0.35, 1, 1],
  [0.5, 0.5, -0.5, 0.95, 0.85, 0.35, 0, 0],
  [-0.5, 0.5, 0.5, 0.95, 0.85, 0.35, 1, 1],
  [0.5, 0.5, 0.5, 0.95, 0.85, 0.35, 0, 1],
  [0.5, -0.5, -0.5, 0.85, 0.35, 0.85, 0, 0],
  [-0.5, -0.5, -0.5, 0.85, 0.35, 0.85, 1, 0],
  [-0.5, -0.5, 0.5, 0.85, 0.35, 0.85, 1, 1],
  [0.5, -0.5, -0.5, 0.85, 0.35, 0.85, 0, 0],
  [-0.5, -0.5, 0.5, 0.85, 0.35, 0.85, 1, 1],
  [0.5, -0.5, 0.5, 0.85, 0.35, 0.85, 0, 1],
].map(function (row) {
  return {
    x: row[0] * 0.5,
    y: row[1] * 0.5,
    z: row[2] * 0.5,
    col: [row[3], row[4], row[5]],
    u: row[6],
    v: row[7],
  };
});

function appendCube(out, model, texSlot, colorOverride) {
  for (let i = 0; i < UNIT_CUBE_TRIS.length; i++) {
    const v = UNIT_CUBE_TRIS[i];
    transformPoint(model, v.x, v.y, v.z, _tmp);
    const c = colorOverride || v.col;
    out.push(_tmp[0], _tmp[1], _tmp[2], c[0], c[1], c[2], v.u, v.v, texSlot);
  }
}

var _boxCornerBuf = new Float32Array(24);

function appendUnitCubeFullTextureFaces(out, model, texSlot, cr, cg, cb) {
  var lx = [-0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5];
  var ly = [-0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5];
  var lz = [-0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5];
  var i;
  var o;
  for (i = 0; i < 8; i++) {
    transformPoint(model, lx[i], ly[i], lz[i], _tmp);
    o = i * 3;
    _boxCornerBuf[o] = _tmp[0];
    _boxCornerBuf[o + 1] = _tmp[1];
    _boxCornerBuf[o + 2] = _tmp[2];
  }
  function q(a, b, c, d) {
    var ax = _boxCornerBuf[a * 3];
    var ay = _boxCornerBuf[a * 3 + 1];
    var az = _boxCornerBuf[a * 3 + 2];
    var bx = _boxCornerBuf[b * 3];
    var by = _boxCornerBuf[b * 3 + 1];
    var bz = _boxCornerBuf[b * 3 + 2];
    var cx = _boxCornerBuf[c * 3];
    var cy = _boxCornerBuf[c * 3 + 1];
    var cz = _boxCornerBuf[c * 3 + 2];
    var dx = _boxCornerBuf[d * 3];
    var dy = _boxCornerBuf[d * 3 + 1];
    var dz = _boxCornerBuf[d * 3 + 2];
    out.push(ax, ay, az, cr, cg, cb, 0, 0, texSlot);
    out.push(bx, by, bz, cr, cg, cb, 1, 0, texSlot);
    out.push(cx, cy, cz, cr, cg, cb, 1, 1, texSlot);
    out.push(ax, ay, az, cr, cg, cb, 0, 0, texSlot);
    out.push(cx, cy, cz, cr, cg, cb, 1, 1, texSlot);
    out.push(dx, dy, dz, cr, cg, cb, 0, 1, texSlot);
  }
  q(5, 1, 2, 6);
  q(0, 4, 7, 3);
  q(6, 7, 4, 5);
  q(1, 0, 3, 2);
  q(2, 3, 7, 6);
  q(1, 0, 4, 5);
}

function appendUnitCubeAtlasRects(out, model, texSlot, cr, cg, cb, faceRects) {
  var lx = [-0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5];
  var ly = [-0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5];
  var lz = [-0.5, -0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5];
  var i;
  var o;
  for (i = 0; i < 8; i++) {
    transformPoint(model, lx[i], ly[i], lz[i], _tmp);
    o = i * 3;
    _boxCornerBuf[o] = _tmp[0];
    _boxCornerBuf[o + 1] = _tmp[1];
    _boxCornerBuf[o + 2] = _tmp[2];
  }
  function qFace(a, b, c, d, ri) {
    var r = faceRects[ri];
    var u0 = r[0];
    var v0 = r[1];
    var u1 = r[2];
    var v1 = r[3];
    var ax = _boxCornerBuf[a * 3];
    var ay = _boxCornerBuf[a * 3 + 1];
    var az = _boxCornerBuf[a * 3 + 2];
    var bx = _boxCornerBuf[b * 3];
    var by = _boxCornerBuf[b * 3 + 1];
    var bz = _boxCornerBuf[b * 3 + 2];
    var cx = _boxCornerBuf[c * 3];
    var cy = _boxCornerBuf[c * 3 + 1];
    var cz = _boxCornerBuf[c * 3 + 2];
    var dx = _boxCornerBuf[d * 3];
    var dy = _boxCornerBuf[d * 3 + 1];
    var dz = _boxCornerBuf[d * 3 + 2];
    out.push(ax, ay, az, cr, cg, cb, u0, v0, texSlot);
    out.push(bx, by, bz, cr, cg, cb, u1, v0, texSlot);
    out.push(cx, cy, cz, cr, cg, cb, u1, v1, texSlot);
    out.push(ax, ay, az, cr, cg, cb, u0, v0, texSlot);
    out.push(cx, cy, cz, cr, cg, cb, u1, v1, texSlot);
    out.push(dx, dy, dz, cr, cg, cb, u0, v1, texSlot);
  }
  qFace(5, 1, 2, 6, 0);
  qFace(0, 4, 7, 3, 1);
  qFace(6, 7, 4, 5, 2);
  qFace(1, 0, 3, 2, 3);
  qFace(2, 3, 7, 6, 4);
  qFace(1, 0, 4, 5, 5);
}

function blockAtLayer(ix, iz, lay) {
  if (ix < 0 || iz < 0 || ix >= MAP_SIZE || iz >= MAP_SIZE) return false;
  return worldHeights[iz][ix] > lay;
}

function pushWallQuadWorld(arr, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, texSlot) {
  arr.push(ax, ay, az, 1, 1, 1, 0, 0, texSlot);
  arr.push(bx, by, bz, 1, 1, 1, 1, 0, texSlot);
  arr.push(cx, cy, cz, 1, 1, 1, 1, 1, texSlot);
  arr.push(ax, ay, az, 1, 1, 1, 0, 0, texSlot);
  arr.push(cx, cy, cz, 1, 1, 1, 1, 1, texSlot);
  arr.push(dx, dy, dz, 1, 1, 1, 0, 1, texSlot);
}

function appendWallSurfacesFromMap(batches) {
  for (let iz = 0; iz < MAP_SIZE; iz++) {
    for (let ix = 0; ix < MAP_SIZE; ix++) {
      const h = worldHeights[iz][ix];
      if (h <= 0) continue;
      const baseY = terrainY(ix + 0.5, iz + 0.5);
      const slot = worldMats[iz][ix] % 4;
      const arr = batches[slot];
      const x0 = ix;
      const x1 = ix + 1;
      const z0 = iz;
      const z1 = iz + 1;
      let lay;
      for (lay = 0; lay < h; lay++) {
        const y0 = baseY + lay;
        const y1 = baseY + lay + 1;
        if (!blockAtLayer(ix + 1, iz, lay)) {
          pushWallQuadWorld(arr, x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0, slot);
        }
        if (!blockAtLayer(ix - 1, iz, lay)) {
          pushWallQuadWorld(arr, x0, y0, z1, x0, y0, z0, x0, y1, z0, x0, y1, z1, slot);
        }
        if (!blockAtLayer(ix, iz + 1, lay)) {
          pushWallQuadWorld(arr, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, slot);
        }
        if (!blockAtLayer(ix, iz - 1, lay)) {
          pushWallQuadWorld(arr, x1, y0, z0, x0, y0, z0, x0, y1, z0, x1, y1, z0, slot);
        }
      }
      const yTop = baseY + h;
      pushWallQuadWorld(arr, x0, yTop, z0, x1, yTop, z0, x1, yTop, z1, x0, yTop, z1, slot);
    }
  }
}

function buildModelMatrix(tx, ty, tz, sx, sy, sz) {
  const m = new Matrix4();
  const T = new Matrix4();
  const S = new Matrix4();
  T.setTranslate(tx, ty, tz);
  S.setScale(sx, sy, sz);
  m.setIdentity();
  m.multiply(T);
  m.multiply(S);
  return m;
}

function pushTerrainVert(out, px, py, pz, u, v) {
  out.push(px, py, pz, 1, 1, 1, u, v, 4);
}

function appendTerrainCell(out, x, z, step) {
  const x1 = x + step;
  const z1 = z + step;
  const y00 = terrainY(x, z);
  const y10 = terrainY(x1, z);
  const y01 = terrainY(x, z1);
  const y11 = terrainY(x1, z1);
  pushTerrainVert(out, x, y00, z, 0, 0);
  pushTerrainVert(out, x1, y10, z, 1, 0);
  pushTerrainVert(out, x, y01, z1, 0, 1);
  pushTerrainVert(out, x1, y10, z, 1, 0);
  pushTerrainVert(out, x1, y11, z1, 1, 1);
  pushTerrainVert(out, x, y01, z1, 0, 1);
}

function buildWorldGeometry() {
  const batches = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };

  appendWallSurfacesFromMap(batches);

  const step = 1;
  for (let z = 0; z < MAP_SIZE; z += step) {
    for (let x = 0; x < MAP_SIZE; x += step) {
      appendTerrainCell(batches[4], x, z, step);
    }
  }

  const cx = MAP_SIZE / 2;
  const cy = 8;
  const cz = MAP_SIZE / 2;
  const skyScale = 380;
  const skyModel = buildModelMatrix(cx, cy, cz, skyScale, skyScale, skyScale);
  appendCube(batches[5], skyModel, 5, [0.2, 0.45, 0.95]);

  const out = { batches: {}, counts: {} };
  for (let s = 0; s <= 5; s++) {
    const arr = batches[s];
    out.batches[s] = new Float32Array(arr);
    out.counts[s] = (arr.length / VERT_STRIDE) | 0;
  }
  return out;
}
