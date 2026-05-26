var ZN = 128;

function zRect(px0, py0, px1, py1) {
  return [px0 / ZN, py0 / ZN, px1 / ZN, py1 / ZN];
}

function zAll(r) {
  return [r, r, r, r, r, r];
}

var Z_HEAD = zRect(0, 0, 64, 60);
var Z_SHIRT = zRect(66, 2, 106, 20);
var Z_SKIN = zRect(66, 22, 106, 44);
var Z_PANTS = zRect(66, 46, 106, 70);
var Z_SHOE = zRect(66, 72, 106, 86);

function appendZombieBox(verts, bx, by, bz, sx, sy, sz, uvRect) {
  appendUnitCubeAtlasRects(verts, buildModelMatrix(bx, by, bz, sx, sy, sz), 7, 1, 1, 1, zAll(uvRect));
}

function oneZombie(verts, tSec, phase, cx, cz, radius, speed) {
  var a = tSec * speed + phase;
  var bx = cx + Math.cos(a) * radius;
  var bz = cz + Math.sin(a * 1.15) * radius * 0.88;
  var by = standingBaseY(bx, bz) + 0.02;
  var hx = Math.cos(a);
  var hz = Math.sin(a);

  appendZombieBox(verts, bx - 0.14, by + 0.06, bz, 0.14, 0.1, 0.16, Z_SHOE);
  appendZombieBox(verts, bx + 0.14, by + 0.06, bz, 0.14, 0.1, 0.16, Z_SHOE);
  appendZombieBox(verts, bx - 0.14, by + 0.22, bz, 0.14, 0.24, 0.14, Z_PANTS);
  appendZombieBox(verts, bx + 0.14, by + 0.22, bz, 0.14, 0.24, 0.14, Z_PANTS);
  appendZombieBox(verts, bx, by + 0.46, bz, 0.48, 0.34, 0.26, Z_SHIRT);
  appendZombieBox(verts, bx - 0.32, by + 0.46, bz, 0.11, 0.32, 0.11, Z_SHIRT);
  appendZombieBox(verts, bx + 0.32, by + 0.46, bz, 0.11, 0.32, 0.11, Z_SHIRT);
  appendZombieBox(verts, bx - 0.32, by + 0.3, bz, 0.1, 0.2, 0.1, Z_SKIN);
  appendZombieBox(verts, bx + 0.32, by + 0.3, bz, 0.1, 0.2, 0.1, Z_SKIN);
  appendZombieBox(verts, bx + hx * 0.08, by + 0.72, bz + hz * 0.08, 0.36, 0.36, 0.36, Z_HEAD);
}

function buildAnimalGeometry(tSec) {
  var verts = [];
  oneZombie(verts, tSec, 0, 16, 22, 4.0, 0.55);
  oneZombie(verts, tSec, 2.3, 26, 12, 3.2, 0.42);
  return new Float32Array(verts);
}
