import * as THREE from "three";

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0xbfd4ff, 0.35);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xbcd9ff, 0x4a6b3a, 0.6);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.5);
  sun.position.set(28, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  scene.add(sun.target);

  const spot = new THREE.SpotLight(0xffe0a8, 0.0, 70, Math.PI / 7, 0.4, 1.2);
  spot.position.set(-18, 22, 16);
  spot.target.position.set(-14, 6, -6);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot);
  scene.add(spot.target);

  return { ambient, hemi, sun, spot };
}

export function makeLanternLight() {
  const light = new THREE.PointLight(0xffb24d, 1.6, 14, 2);
  light.castShadow = false;
  return light;
}
