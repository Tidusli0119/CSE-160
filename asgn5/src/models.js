import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODELS = "./assets/models/";

function normalize(object3d, targetSize) {
  const box = new THREE.Box3().setFromObject(object3d);
  const size = new THREE.Vector3();
  box.getSize(size);
  const max = Math.max(size.x, size.y, size.z) || 1;
  object3d.scale.setScalar(targetSize / max);
}

export function loadModels(scene, manager) {
  const loader = new GLTFLoader(manager);
  const mixers = [];
  const birds = [];
  let duck = null;
  let duckBaseY = 0.2;

  loader.load(MODELS + "Duck.glb", (gltf) => {
    const model = gltf.scene;
    normalize(model, 2.4);
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    duckBaseY = 0.15 - box.min.y;
    model.position.set(9, duckBaseY, 8);
    scene.add(model);
    duck = model;
  });

  const birdSpecs = [
    { file: "Parrot.glb", size: 4.5, radius: 20, height: 16, speed: 0.32 },
    { file: "Flamingo.glb", size: 4.0, radius: 26, height: 20, speed: -0.24 },
    { file: "Stork.glb", size: 4.2, radius: 16, height: 13, speed: 0.4 },
  ];

  birdSpecs.forEach((spec, i) => {
    loader.load(MODELS + spec.file, (gltf) => {
      const model = gltf.scene;
      normalize(model, spec.size);
      model.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      scene.add(model);

      if (gltf.animations && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);
      }

      birds.push({
        model,
        radius: spec.radius,
        height: spec.height,
        speed: spec.speed,
        phase: (i / birdSpecs.length) * Math.PI * 2,
      });
    });
  });

  function update(t, dt) {
    for (const m of mixers) m.update(dt);

    for (const b of birds) {
      const a = t * b.speed + b.phase;
      const x = Math.cos(a) * b.radius;
      const z = Math.sin(a) * b.radius;
      const y = b.height + Math.sin(t * 0.8 + b.phase) * 1.5;
      b.model.position.set(x, y, z);
      const tangent = new THREE.Vector3(-Math.sin(a) * b.speed, 0, Math.cos(a) * b.speed);
      b.model.lookAt(b.model.position.clone().add(tangent));
    }

    if (duck) {
      duck.position.y = duckBaseY + Math.sin(t * 1.4) * 0.08;
      duck.rotation.y = Math.sin(t * 0.3) * 0.6;
    }
  }

  return { update };
}
