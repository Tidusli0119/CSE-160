import * as THREE from "three";
import { makeLanternLight } from "./lights.js";

export function buildWorld(scene, tex) {
  const root = new THREE.Group();
  scene.add(root);

  const pickables = [];
  const lanterns = [];
  const animated = [];

  function makePickable(mesh) {
    mesh.userData.pick = { baseY: mesh.position.y, t: -1 };
    pickables.push(mesh);
    return mesh;
  }

  const grassMat = new THREE.MeshStandardMaterial({ map: tex.grass, roughness: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ map: tex.wood, roughness: 0.85 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: tex.stone, roughness: 0.95 });
  const roofMat = new THREE.MeshStandardMaterial({ map: tex.roof, roughness: 0.8 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4a25, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d34, roughness: 1 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3f9a44, roughness: 1 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.9, flatShading: true });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 2, 64), grassMat);
  top.position.y = -1;
  top.receiveShadow = true;
  root.add(top);

  const underside = new THREE.Mesh(new THREE.ConeGeometry(26, 22, 48, 1, false), rockMat);
  underside.position.y = -13;
  underside.rotation.x = Math.PI;
  underside.receiveShadow = true;
  root.add(underside);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const chunk = new THREE.Mesh(
      new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(1.6, 3.2)),
      rockMat
    );
    chunk.position.set(Math.cos(a) * 14, THREE.MathUtils.randFloat(-20, -12), Math.sin(a) * 14);
    chunk.rotation.set(Math.random(), Math.random(), Math.random());
    chunk.castShadow = true;
    root.add(chunk);
  }

  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(6, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2f6f9e,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.85,
    })
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(9, 0.05, 8);
  pond.receiveShadow = true;
  root.add(pond);
  animated.push({
    update: (t) => {
      pond.material.opacity = 0.8 + Math.sin(t * 1.5) * 0.06;
    },
  });

  const pondRing = new THREE.Mesh(new THREE.TorusGeometry(6, 0.5, 10, 40), stoneMat);
  pondRing.rotation.x = -Math.PI / 2;
  pondRing.position.set(9, 0.15, 8);
  pondRing.castShadow = true;
  pondRing.receiveShadow = true;
  root.add(pondRing);

  function addTree(x, z, scale = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4 * scale, 0.55 * scale, 3 * scale, 10),
      trunkMat
    );
    trunk.position.y = 1.5 * scale;
    trunk.castShadow = true;
    g.add(trunk);

    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry((2.4 - i * 0.5) * scale, 2.2 * scale, 9),
        i % 2 ? leafMat2 : leafMat
      );
      cone.position.y = (3 + i * 1.5) * scale;
      cone.castShadow = true;
      g.add(cone);
    }
    g.position.set(x, 0, z);
    root.add(g);
    makePickable(g.children[1]);
    return g;
  }

  function addHouse(x, z, rot = 0, bodyMat = stoneMat) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3.2, 4), bodyMat);
    body.position.y = 1.6;
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.4, 4), roofMat);
    roof.position.y = 4.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4a2f17 })
    );
    door.position.set(0, 0.8, 2.01);
    g.add(door);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), stoneMat);
    chimney.position.set(1.1, 4.3, 0.6);
    chimney.castShadow = true;
    g.add(chimney);

    g.position.set(x, 0, z);
    g.rotation.y = rot;
    root.add(g);
    makePickable(body);
    return g;
  }

  function addRock(x, z, s = 1) {
    const geoms = [
      new THREE.IcosahedronGeometry(s),
      new THREE.DodecahedronGeometry(s),
      new THREE.OctahedronGeometry(s),
    ];
    const rock = new THREE.Mesh(geoms[(Math.random() * geoms.length) | 0], rockMat);
    rock.position.set(x, s * 0.6, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    root.add(rock);
    makePickable(rock);
    return rock;
  }

  function addBarrel(x, z) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 16), woodMat);
    barrel.position.set(x, 0.8, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    root.add(barrel);
    makePickable(barrel);
    return barrel;
  }

  function addCrate(x, z) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), woodMat);
    crate.position.set(x, 0.7, z);
    crate.rotation.y = Math.random() * Math.PI;
    crate.castShadow = true;
    crate.receiveShadow = true;
    root.add(crate);
    makePickable(crate);
    return crate;
  }

  function addMushroom(x, z, s = 1) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * s, 0.24 * s, 0.9 * s, 10),
      new THREE.MeshStandardMaterial({ color: 0xece3cf })
    );
    stem.position.y = 0.45 * s;
    stem.castShadow = true;
    g.add(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 * s, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 })
    );
    cap.position.y = 0.9 * s;
    cap.castShadow = true;
    g.add(cap);

    g.position.set(x, 0, z);
    root.add(g);
    makePickable(cap);
    return g;
  }

  function addLantern(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.6, roughness: 0.5 })
    );
    pole.position.y = 1.5;
    pole.castShadow = true;
    g.add(pole);

    const arm = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.06, 8, 16, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.6, roughness: 0.5 })
    );
    arm.position.y = 3;
    arm.rotation.x = Math.PI / 2;
    g.add(arm);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffd27d,
      emissive: 0xffb24d,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.95,
    });
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), glassMat);
    glass.position.y = 2.75;
    g.add(glass);

    const light = makeLanternLight();
    light.position.y = 2.75;
    g.add(light);

    g.position.set(x, 0, z);
    root.add(g);

    const entry = { group: g, light, glass, glassMat, on: true };
    lanterns.push(entry);
    glass.userData.lantern = entry;
    return entry;
  }

  function addFence(x, z, rot) {
    const g = new THREE.Group();
    for (const px of [-1.4, 0, 1.4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), woodMat);
      post.position.set(px, 0.6, 0);
      post.castShadow = true;
      g.add(post);
    }
    for (const ry of [0.45, 0.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.14, 0.14), woodMat);
      rail.position.set(0, ry, 0);
      rail.castShadow = true;
      g.add(rail);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    root.add(g);
    return g;
  }

  function addWindmill(x, z) {
    const g = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 8, 16), stoneMat);
    tower.position.y = 4;
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(2, 2.2, 16), roofMat);
    cap.position.y = 9;
    cap.castShadow = true;
    g.add(cap);

    const blades = new THREE.Group();
    blades.position.set(0, 8, 2.1);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x553a1d })
    );
    hub.rotation.x = Math.PI / 2;
    blades.add(hub);

    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xeae0c8 })
      );
      blade.position.y = 2.6;
      blade.castShadow = true;
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.z = (i / 4) * Math.PI * 2;
      blades.add(arm);
    }
    g.add(blades);

    g.position.set(x, 0, z);
    root.add(g);
    animated.push({ update: (t, dt) => (blades.rotation.z += dt * 0.8) });
    return g;
  }

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    flatShading: true,
  });
  const CLOUD_Y = 30;
  const CLOUD_BLOCK = 4;
  const CLOUD_SPAN = 90;
  const clouds = [];

  function makeVoxelCloud() {
    const g = new THREE.Group();
    const w = 3 + ((Math.random() * 4) | 0);
    const d = 2 + ((Math.random() * 3) | 0);
    for (let gx = 0; gx < w; gx++) {
      for (let gz = 0; gz < d; gz++) {
        const edge = gx === 0 || gx === w - 1 || gz === 0 || gz === d - 1;
        if (edge && Math.random() < 0.45) continue;
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(CLOUD_BLOCK, CLOUD_BLOCK * 0.45, CLOUD_BLOCK),
          cloudMat
        );
        block.position.set((gx - w / 2) * CLOUD_BLOCK, 0, (gz - d / 2) * CLOUD_BLOCK);
        g.add(block);
      }
    }
    return g;
  }

  for (let i = 0; i < 9; i++) {
    const cloud = makeVoxelCloud();
    cloud.position.set(
      THREE.MathUtils.randFloat(-CLOUD_SPAN, CLOUD_SPAN),
      CLOUD_Y + THREE.MathUtils.randFloat(-4, 8),
      THREE.MathUtils.randFloat(-70, 70)
    );
    cloud.userData.speed = THREE.MathUtils.randFloat(1.2, 2.4);
    root.add(cloud);
    clouds.push(cloud);
  }
  animated.push({
    update: (t, dt) => {
      for (const c of clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > CLOUD_SPAN) c.position.x = -CLOUD_SPAN;
      }
    },
  });

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.1),
    new THREE.MeshStandardMaterial({
      color: 0x8ee6ff,
      emissive: 0x2aa9d6,
      emissiveIntensity: 1.4,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    })
  );
  crystal.position.set(0, 4, -16);
  crystal.castShadow = true;
  root.add(crystal);

  const crystalBase = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 1.4, 6), stoneMat);
  crystalBase.position.set(0, 1.4, -16);
  crystalBase.castShadow = true;
  root.add(crystalBase);

  animated.push({
    update: (t, dt) => {
      crystal.rotation.y += dt * 0.9;
      crystal.position.y = 4 + Math.sin(t * 1.6) * 0.4;
      crystal.material.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.5;
    },
  });
  makePickable(crystal);

  addWindmill(-14, -6);

  addHouse(6, -12, -0.3, stoneMat);
  addHouse(14, -2, -1.1, woodMat);
  addHouse(-4, 12, 0.5, stoneMat);

  addTree(18, 8, 1.1);
  addTree(-18, 10, 0.9);
  addTree(-10, -16, 1.2);
  addTree(20, -10, 1.0);
  addTree(2, 18, 0.95);
  addTree(-20, -4, 1.05);

  addRock(12, 14, 1.3);
  addRock(-8, 6, 0.9);
  addRock(16, 2, 1.1);
  addRock(-16, 16, 1.0);

  addBarrel(4, -6);
  addBarrel(5.4, -6.6);
  addCrate(3, -7.6);
  addCrate(-2, -10);

  addMushroom(-12, 4, 1.2);
  addMushroom(-11, 5, 0.8);
  addMushroom(15, 12, 1.0);

  addLantern(0, 0);
  addLantern(8, -4);
  addLantern(-6, -2);
  addLantern(11, 6);
  addLantern(-2, 14);

  addFence(-2, 20, 0);
  addFence(2, 20, 0);
  addFence(22, 4, Math.PI / 2);
  addFence(22, 8, Math.PI / 2);

  function update(t, dt) {
    for (const a of animated) a.update(t, dt);

    for (const m of pickables) {
      const p = m.userData.pick;
      if (p.t >= 0) {
        p.t += dt;
        const k = p.t / 0.6;
        if (k >= 1) {
          m.position.y = p.baseY;
          m.rotation.y = p.baseRotY ?? m.rotation.y;
          p.t = -1;
        } else {
          m.position.y = p.baseY + Math.sin(k * Math.PI) * 1.4;
          m.rotation.y += dt * 6;
        }
      }
    }
  }

  function triggerHop(mesh) {
    const p = mesh.userData.pick;
    if (p && p.t < 0) {
      p.t = 0;
      p.baseRotY = mesh.rotation.y;
    }
  }

  return { root, pickables, lanterns, update, triggerHop };
}
