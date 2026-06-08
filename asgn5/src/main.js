import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

import {
  makeGrassTexture,
  makeWoodTexture,
  makeStoneTexture,
  makeRoofTexture,
  makeBrickTexture,
} from "./textures.js";
import { loadSkybox, createCelestials } from "./sky.js";
import { createLights } from "./lights.js";
import { buildWorld } from "./world.js";
import { loadModels } from "./models.js";
import { createFireflies } from "./fireflies.js";

const errorBox = document.getElementById("error");

function fail(msg) {
  console.error(msg);
  if (errorBox) {
    errorBox.style.display = "block";
    errorBox.textContent = "Error: " + (msg?.message || msg);
  }
}

window.addEventListener("error", (e) => fail(e.message));

function main() {
  const canvas = document.getElementById("app");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xc6dcff, 0.011);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(34, 24, 40);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 4, 0);
  controls.minDistance = 12;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();

  const manager = new THREE.LoadingManager();
  const loaderEl = document.getElementById("loader");
  manager.onLoad = () => loaderEl && loaderEl.classList.add("done");
  manager.onError = (url) => fail("Failed to load " + url);

  const tex = {
    grass: makeGrassTexture(),
    wood: makeWoodTexture(),
    stone: makeStoneTexture(),
    roof: makeRoofTexture(),
    brick: makeBrickTexture(),
  };

  loadSkybox(scene, manager);
  const celestials = createCelestials(scene);
  const lights = createLights(scene);
  const world = buildWorld(scene, tex);
  const models = loadModels(scene, manager);
  const fireflies = createFireflies(scene);

  const sky = { hour: 13, autoCycle: true, cycleSpeed: 0.6, fireflies: true };

  function applyTimeOfDay(hour) {
    const angle = ((hour - 6) / 12) * Math.PI;
    const elevation = Math.sin(angle);
    const day = THREE.MathUtils.clamp(elevation, 0, 1);
    const isNight = elevation < 0.04;

    lights.sun.position.set(Math.cos(angle) * 42, Math.max(elevation, -0.2) * 48, 18);
    lights.sun.intensity = 0.15 + day * 1.5;
    celestials.update(lights.sun);

    const warm = new THREE.Color(0xffb15a);
    const noon = new THREE.Color(0xfff4dc);
    lights.sun.color.copy(warm).lerp(noon, day);

    lights.ambient.intensity = 0.18 + day * 0.3;
    lights.hemi.intensity = 0.15 + day * 0.6;

    scene.backgroundIntensity = 0.25 + day * 0.95;
    const fogDay = new THREE.Color(0xc6dcff);
    const fogNight = new THREE.Color(0x141d33);
    scene.fog.color.copy(fogNight).lerp(fogDay, day);

    lights.spot.intensity = isNight ? 2.2 : 0.0;
    for (const l of world.lanterns) {
      if (l.on) {
        l.light.intensity = isNight ? 2.0 : 0.0;
        l.glassMat.emissiveIntensity = isNight ? 2.6 : 0.6;
      }
    }
    fireflies.setVisible(sky.fireflies && isNight);
  }

  const gui = new GUI({ title: "Skyblock Isle" });
  gui.add(sky, "hour", 0, 24, 0.1).name("Time of day").listen().onChange(applyTimeOfDay);
  gui.add(sky, "autoCycle").name("Auto day/night");
  gui.add(sky, "cycleSpeed", 0.1, 3, 0.1).name("Cycle speed");
  gui.add(sky, "fireflies").name("Fireflies").onChange(() => applyTimeOfDay(sky.hour));
  gui
    .add(
      {
        reset: () => {
          camera.position.set(34, 24, 40);
          controls.target.set(0, 4, 0);
        },
      },
      "reset"
    )
    .name("Reset camera");

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const downPos = new THREE.Vector2();
  let dragging = false;

  const toast = document.getElementById("toast");
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  canvas.addEventListener("pointerdown", (e) => {
    downPos.set(e.clientX, e.clientY);
    dragging = false;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (downPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 6) dragging = true;
  });

  canvas.addEventListener("pointerup", (e) => {
    if (dragging) return;

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const lanternMeshes = world.lanterns.map((l) => l.glass);
    const hitsL = raycaster.intersectObjects(lanternMeshes, false);
    if (hitsL.length) {
      const entry = hitsL[0].object.userData.lantern;
      entry.on = !entry.on;
      applyTimeOfDay(sky.hour);
      entry.glassMat.emissiveIntensity = entry.on ? 2.6 : 0.2;
      entry.light.intensity = entry.on ? entry.light.intensity || 2.0 : 0.0;
      showToast(entry.on ? "Lantern lit \u2728" : "Lantern out");
      return;
    }

    const hits = raycaster.intersectObjects(world.pickables, false);
    if (hits.length) {
      world.triggerHop(hits[0].object);
      showToast("Boing!");
    }
  });

  const hud = document.getElementById("hud");
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "h" && hud) {
      hud.style.opacity = hud.style.opacity === "0" ? "1" : "0";
    }
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  applyTimeOfDay(sky.hour);

  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (sky.autoCycle) {
      sky.hour = (sky.hour + dt * sky.cycleSpeed) % 24;
      applyTimeOfDay(sky.hour);
    }

    world.update(t, dt);
    models.update(t, dt);
    fireflies.update(t);
    controls.update();

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

try {
  main();
} catch (e) {
  fail(e);
}
