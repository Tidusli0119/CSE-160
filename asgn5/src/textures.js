import * as THREE from "three";

function makeCanvas(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  return { canvas, ctx: canvas.getContext("2d") };
}

function finalize(canvas, { repeat = 1, aniso = 8 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = aniso;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function makeGrassTexture() {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#4f8f3a";
  ctx.fillRect(0, 0, 256, 256);
  const greens = ["#5aa043", "#478234", "#67ad4d", "#3f7a2e", "#74b95a"];
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = greens[(Math.random() * greens.length) | 0];
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() * 2.2 + 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalize(canvas, { repeat: 6 });
}

export function makeWoodTexture() {
  const { canvas, ctx } = makeCanvas(256);
  const grd = ctx.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, "#8a5a2b");
  grd.addColorStop(0.5, "#a06c34");
  grd.addColorStop(1, "#7d4f24");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "rgba(60,35,12,0.6)";
  ctx.lineWidth = 3;
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(70,45,18,${Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 18, 1);
  }
  return finalize(canvas, { repeat: 1 });
}

export function makeStoneTexture() {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#7c8088";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = Math.random() * 34 + 18;
    const h = Math.random() * 26 + 14;
    const g = 110 + (Math.random() * 50) | 0;
    ctx.fillStyle = `rgb(${g},${g + 4},${g + 10})`;
    ctx.strokeStyle = "rgba(40,44,50,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();
  }
  return finalize(canvas, { repeat: 3 });
}

export function makeRoofTexture() {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#9c3b2e";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 22) {
    for (let x = 0; x < 256; x += 28) {
      const off = (y / 22) % 2 ? 14 : 0;
      const c = 150 + (Math.random() * 40) | 0;
      ctx.fillStyle = `rgb(${c},${(c * 0.4) | 0},${(c * 0.32) | 0})`;
      ctx.beginPath();
      ctx.arc(x + off, y + 11, 13, Math.PI, 0, true);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,16,10,0.6)";
      ctx.stroke();
    }
  }
  return finalize(canvas, { repeat: 2 });
}

export function makeBrickTexture() {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#b5532f";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#d3d3c4";
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 64) {
      const off = (y / 32) % 2 ? 32 : 0;
      ctx.fillRect(x + off + 2, y + 2, 60, 28);
    }
  }
  return finalize(canvas, { repeat: 2 });
}
