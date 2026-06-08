import * as THREE from "three";

const ZENITH = "#79a6ff";
const MID = "#9cc0ff";
const HORIZON = "#c6dcff";
const BOTTOM = "#a7c3f0";

function faceCanvas(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  draw(ctx, size);
  return c;
}

export function loadSkybox(scene) {
  const S = 256;

  const side = () =>
    faceCanvas(S, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, S);
      g.addColorStop(0.0, ZENITH);
      g.addColorStop(0.5, MID);
      g.addColorStop(0.82, HORIZON);
      g.addColorStop(1.0, HORIZON);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    });

  const top = faceCanvas(S, (ctx) => {
    ctx.fillStyle = ZENITH;
    ctx.fillRect(0, 0, S, S);
  });

  const bottom = faceCanvas(S, (ctx) => {
    ctx.fillStyle = BOTTOM;
    ctx.fillRect(0, 0, S, S);
  });

  const cube = new THREE.CubeTexture([side(), side(), top, bottom, side(), side()]);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.magFilter = THREE.NearestFilter;
  cube.minFilter = THREE.LinearFilter;
  cube.generateMipmaps = false;
  cube.needsUpdate = true;

  scene.background = cube;
  return cube;
}

function pixelSprite(drawCells) {
  const N = 16;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, N, N);
  drawCells(ctx, N);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Sprite(mat);
}

export function createCelestials(scene) {
  const sun = pixelSprite((ctx, N) => {
    ctx.fillStyle = "#ffe24a";
    ctx.fillRect(1, 1, N - 2, N - 2);
    ctx.fillStyle = "#fff3a6";
    ctx.fillRect(3, 3, N - 6, N - 6);
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(5, 5, N - 10, N - 10);
  });
  sun.scale.setScalar(48);
  scene.add(sun);

  const moon = pixelSprite((ctx, N) => {
    ctx.fillStyle = "#eef2ff";
    ctx.fillRect(1, 1, N - 2, N - 2);
    ctx.fillStyle = "#c5cce6";
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(9, 6, 3, 3);
    ctx.fillRect(6, 10, 2, 2);
  });
  moon.scale.setScalar(40);
  scene.add(moon);

  const DIST = 320;
  const dir = new THREE.Vector3();

  function update(sunLight) {
    dir.copy(sunLight.position).normalize();
    sun.position.copy(dir).multiplyScalar(DIST);
    sun.visible = dir.y > -0.05;

    moon.position.copy(dir).multiplyScalar(-DIST);
    moon.visible = dir.y < 0.05;
  }

  return { sun, moon, update };
}
