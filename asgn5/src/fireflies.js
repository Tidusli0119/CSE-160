import * as THREE from "three";

function makeSpriteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,244,200,1)");
  g.addColorStop(0.3, "rgba(255,210,120,0.8)");
  g.addColorStop(1, "rgba(255,180,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFireflies(scene, count = 160) {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const origins = [];

  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 24;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = THREE.MathUtils.randFloat(1, 9);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    phases[i] = Math.random() * Math.PI * 2;
    origins.push({ x, y, z });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.5,
    map: makeSpriteTexture(),
    color: 0xffe6a0,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;
  scene.add(points);

  function update(t) {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const o = origins[i];
      arr[i * 3] = o.x + Math.sin(t * 0.5 + phases[i]) * 1.2;
      arr[i * 3 + 1] = o.y + Math.sin(t * 0.8 + phases[i] * 2) * 0.7;
      arr[i * 3 + 2] = o.z + Math.cos(t * 0.4 + phases[i]) * 1.2;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.6 + Math.sin(t * 2) * 0.25;
  }

  return { points, update, setVisible: (v) => (points.visible = v) };
}
