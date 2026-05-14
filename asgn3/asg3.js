var gl;
var canvas;
var camera;
var vertexBuffer;
var worldGeo;
var animalVerts;
var animalCount;
var textures = [];
var keysDown = {};
var lastMouseX = 0;
var lastMouseY = 0;
var mouseDragging = false;
var pointerLocked = false;
var worldNeedsRebuild = true;
var diamondCollected = [false, false, false, false, false];
var diamondPositions = [
  [5, 0, 27],
  [27, 0, 6],
  [20, 0, 28],
  [10, 0, 12],
  [26, 0, 22],
];

var locUView;
var locUProj;
var locUModel;
var locTexWeight;
var locBaseColor;

var VERTEX_SHADER =
  "" +
  "attribute vec3 a_Position;\n" +
  "attribute vec3 a_Color;\n" +
  "attribute vec2 a_UV;\n" +
  "attribute float a_TexSlot;\n" +
  "varying vec3 v_Color;\n" +
  "varying vec2 v_UV;\n" +
  "varying float v_TexSlot;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_viewMatrix;\n" +
  "uniform mat4 u_projectionMatrix;\n" +
  "void main() {\n" +
  "  v_Color = a_Color;\n" +
  "  v_UV = a_UV;\n" +
  "  v_TexSlot = a_TexSlot;\n" +
  "  gl_Position = u_projectionMatrix * u_viewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);\n" +
  "}\n";

var FRAGMENT_SHADER =
  "" +
  "precision mediump float;\n" +
  "varying vec3 v_Color;\n" +
  "varying vec2 v_UV;\n" +
  "varying float v_TexSlot;\n" +
  "uniform sampler2D u_Sampler0;\n" +
  "uniform sampler2D u_Sampler1;\n" +
  "uniform sampler2D u_Sampler2;\n" +
  "uniform sampler2D u_Sampler3;\n" +
  "uniform sampler2D u_Sampler4;\n" +
  "uniform sampler2D u_Sampler5;\n" +
  "uniform sampler2D u_Sampler6;\n" +
  "uniform sampler2D u_Sampler7;\n" +
  "uniform float u_texColorWeight;\n" +
  "uniform vec3 u_baseColor;\n" +
  "void main() {\n" +
  "  float s = v_TexSlot + 0.5;\n" +
  "  vec4 tex;\n" +
  "  if (s < 1.0) { tex = texture2D(u_Sampler0, v_UV); }\n" +
  "  else if (s < 2.0) { tex = texture2D(u_Sampler1, v_UV); }\n" +
  "  else if (s < 3.0) { tex = texture2D(u_Sampler2, v_UV); }\n" +
  "  else if (s < 4.0) { tex = texture2D(u_Sampler3, v_UV); }\n" +
  "  else if (s < 5.0) { tex = texture2D(u_Sampler4, v_UV); }\n" +
  "  else if (s < 6.0) { tex = texture2D(u_Sampler5, v_UV); }\n" +
  "  else if (s < 7.0) { tex = texture2D(u_Sampler6, v_UV); }\n" +
  "  else { tex = texture2D(u_Sampler7, v_UV); }\n" +
  "  float t = u_texColorWeight;\n" +
  "  vec3 texRgb = tex.rgb * v_Color;\n" +
  "  vec3 base = u_baseColor * v_Color;\n" +
  "  vec3 outRgb = (1.0 - t) * base + t * texRgb;\n" +
  "  gl_FragColor = vec4(outRgb, 1.0);\n" +
  "}\n";

var identityModel = new Matrix4();

function drawTexBrick(ctx, n) {
  ctx.fillStyle = "#6a4a38";
  ctx.fillRect(0, 0, n, n);
  ctx.strokeStyle = "#3a2518";
  ctx.lineWidth = 2;
  const bh = n / 5;
  for (let r = 0; r < 5; r++) {
    const y = r * bh;
    const off = (r % 2) * (n / 10);
    for (let x = -off; x < n; x += n / 5) {
      ctx.strokeRect(x, y, n / 5 + 2, bh);
    }
  }
}

function drawTexStone(ctx, n) {
  const g = ctx.createLinearGradient(0, 0, n, n);
  g.addColorStop(0, "#7a7a82");
  g.addColorStop(1, "#4a4a52");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = "rgba(255,255,255," + (0.02 + Math.random() * 0.04) + ")";
    ctx.fillRect(Math.random() * n, Math.random() * n, 3, 3);
  }
}

function drawTexWood(ctx, n) {
  ctx.fillStyle = "#5c3a22";
  ctx.fillRect(0, 0, n, n);
  for (let x = 0; x < n; x += 6) {
    ctx.strokeStyle = "rgba(30,15,8,0.35)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 14, n);
    ctx.stroke();
  }
}

function drawTexSand(ctx, n) {
  ctx.fillStyle = "#c9a86c";
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = "rgba(100,80,40,0.08)";
    ctx.fillRect(Math.random() * n, Math.random() * n, 2, 2);
  }
}

function drawTexGrass(ctx, n) {
  const g = ctx.createLinearGradient(0, 0, 0, n);
  g.addColorStop(0, "#3d8c3a");
  g.addColorStop(1, "#1e5a22");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = "rgba(20,80,20,0.25)";
    ctx.beginPath();
    const x = Math.random() * n;
    const y = Math.random() * n;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - 6 - Math.random() * 8);
    ctx.stroke();
  }
}

function drawTexSky(ctx, n) {
  const g = ctx.createRadialGradient(n * 0.3, n * 0.2, 0, n * 0.5, n * 0.5, n * 0.7);
  g.addColorStop(0, "#a8d8ff");
  g.addColorStop(0.5, "#4080e0");
  g.addColorStop(1, "#102060");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(Math.random() * n, Math.random() * n, 2, 2);
  }
}

function createCanvasTexture(drawFn) {
  var c = document.createElement("canvas");
  var size = 256;
  c.width = size;
  c.height = size;
  var ctx = c.getContext("2d");
  drawFn(ctx, size);
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}

function bindTextureUnits() {
  var i;
  for (i = 0; i <= 7; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    var loc = gl.getUniformLocation(gl.program, "u_Sampler" + i);
    if (loc) gl.uniform1i(loc, i);
  }
}

function isPowerOfTwo(n) {
  return (n & (n - 1)) === 0 && n > 0;
}

function loadDirtTextureFromImage(onSuccess, onError) {
  var img = new Image();
  img.onload = function () {
    var w = img.width;
    var h = img.height;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if (w === h && isPowerOfTwo(w)) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } else {
      var size = 256;
      var c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      var ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    onSuccess(tex);
  };
  img.onerror = onError;
  img.src = "textures/dirt.png";
}

function loadGrassFloorTextureFromImage(onSuccess, onError) {
  var img = new Image();
  img.onload = function () {
    var w = img.width;
    var h = img.height;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    if (w === h && isPowerOfTwo(w)) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } else {
      var size = 256;
      var c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      var ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, size, size);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    onSuccess(tex);
  };
  img.onerror = onError;
  img.src = "textures/grass.png";
}

function loadDiamondTextureFromImage(onSuccess, onError) {
  var img = new Image();
  img.onload = function () {
    var size = 64;
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, size, size);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    onSuccess(tex);
  };
  img.onerror = onError;
  img.src = "textures/diamond.webp";
}

function loadZombieAtlasFromImage(onSuccess, onError) {
  var img = new Image();
  img.onload = function () {
    var N = 128;
    var c = document.createElement("canvas");
    c.width = N;
    c.height = N;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#152a18";
    ctx.fillRect(0, 0, N, N);
    var colW = (img.width / 4) | 0;
    var headSrcH = (img.height * 0.5) | 0;
    ctx.drawImage(img, 0, 0, colW, headSrcH, 0, 0, 64, 60);
    ctx.fillStyle = "#00a9c1";
    ctx.fillRect(66, 2, 40, 18);
    ctx.fillStyle = "#618a3d";
    ctx.fillRect(66, 22, 40, 22);
    ctx.fillStyle = "#3c308e";
    ctx.fillRect(66, 46, 40, 24);
    ctx.fillStyle = "#404040";
    ctx.fillRect(66, 72, 40, 14);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    onSuccess(tex);
  };
  img.onerror = onError;
  img.src = "textures/zombie.png";
}

function loadAllTexturesThen(onReady) {
  textures[5] = createCanvasTexture(drawTexSky);
  function afterDiamond(blockFallbackTex) {
    loadZombieAtlasFromImage(
      function (zTex) {
        textures[7] = zTex;
        gl.useProgram(gl.program);
        bindTextureUnits();
        onReady();
      },
      function () {
        console.log("Could not load textures/zombie.png; zombies use block texture.");
        textures[7] = blockFallbackTex || textures[6];
        gl.useProgram(gl.program);
        bindTextureUnits();
        onReady();
      }
    );
  }
  loadDirtTextureFromImage(
    function (dirtTex) {
      var i;
      for (i = 0; i < 4; i++) textures[i] = dirtTex;
      loadGrassFloorTextureFromImage(
        function (grassTex) {
          textures[4] = grassTex;
          loadDiamondTextureFromImage(
            function (diamondTex) {
              textures[6] = diamondTex;
              afterDiamond(dirtTex);
            },
            function () {
              console.log("Could not load textures/diamond.webp; diamonds use dirt texture.");
              textures[6] = dirtTex;
              afterDiamond(dirtTex);
            }
          );
        },
        function () {
          console.log("Could not load textures/grass.png; floor uses dirt texture.");
          textures[4] = dirtTex;
          loadDiamondTextureFromImage(
            function (diamondTex) {
              textures[6] = diamondTex;
              afterDiamond(dirtTex);
            },
            function () {
              textures[6] = dirtTex;
              afterDiamond(dirtTex);
            }
          );
        }
      );
    },
    function () {
      console.log("Could not load textures/dirt.png; using procedural sand for blocks.");
      var fb = createCanvasTexture(drawTexSand);
      var j;
      for (j = 0; j < 4; j++) textures[j] = fb;
      loadGrassFloorTextureFromImage(
        function (grassTex) {
          textures[4] = grassTex;
          loadDiamondTextureFromImage(
            function (diamondTex) {
              textures[6] = diamondTex;
              afterDiamond(fb);
            },
            function () {
              textures[6] = fb;
              afterDiamond(fb);
            }
          );
        },
        function () {
          textures[4] = createCanvasTexture(drawTexGrass);
          loadDiamondTextureFromImage(
            function (diamondTex) {
              textures[6] = diamondTex;
              afterDiamond(fb);
            },
            function () {
              textures[6] = fb;
              afterDiamond(fb);
            }
          );
        }
      );
    }
  );
}

function setupAttributes() {
  var FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
  var stride = VERT_STRIDE * FLOAT_SIZE;
  var a_Position = gl.getAttribLocation(gl.program, "a_Position");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(a_Position);
  var a_Color = gl.getAttribLocation(gl.program, "a_Color");
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, stride, 3 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_Color);
  var a_UV = gl.getAttribLocation(gl.program, "a_UV");
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, stride, 6 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_UV);
  var a_TexSlot = gl.getAttribLocation(gl.program, "a_TexSlot");
  gl.vertexAttribPointer(a_TexSlot, 1, gl.FLOAT, false, stride, 8 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_TexSlot);
}

function rebuildWorldIfNeeded() {
  if (!worldNeedsRebuild) return;
  worldGeo = buildWorldGeometry();
  worldNeedsRebuild = false;
}

function drawBatchedData(floatArray, count) {
  if (!count) return;
  gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
  gl.uniformMatrix4fv(locUModel, false, identityModel.elements);
  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function setMix(texWeight, baseR, baseG, baseB) {
  gl.uniform1f(locTexWeight, texWeight);
  gl.uniform3f(locBaseColor, baseR, baseG, baseB);
}

function renderScene() {
  rebuildWorldIfNeeded();

  gl.uniformMatrix4fv(locUView, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(locUProj, false, camera.projectionMatrix.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  if (worldGeo.counts[5]) {
    gl.disable(gl.DEPTH_TEST);
    setMix(0.12, 0.25, 0.55, 1.0);
    drawBatchedData(worldGeo.batches[5], worldGeo.counts[5]);
    gl.enable(gl.DEPTH_TEST);
  }

  var s;
  for (s = 0; s <= 3; s++) {
    if (!worldGeo.counts[s]) continue;
    setMix(0.92, 1.0, 1.0, 1.0);
    drawBatchedData(worldGeo.batches[s], worldGeo.counts[s]);
  }

  if (worldGeo.counts[4]) {
    setMix(0.88, 0.95, 1.0, 0.92);
    drawBatchedData(worldGeo.batches[4], worldGeo.counts[4]);
  }

  var t = performance.now() * 0.001;
  animalVerts = buildAnimalGeometry(t);
  animalCount = (animalVerts.length / VERT_STRIDE) | 0;
  setMix(1.0, 1.0, 1.0, 1.0);
  drawBatchedData(animalVerts, animalCount);

  var diamondVerts = [];
  var i;
  for (i = 0; i < diamondPositions.length; i++) {
    if (diamondCollected[i]) continue;
    var rx = diamondPositions[i][0] + 0.5;
    var rz = diamondPositions[i][2] + 0.5;
    var ry = standingBaseY(rx, rz) + 0.65 + Math.sin(t * 2 + i) * 0.08;
    var pulse = 0.22 + Math.sin(t * 3 + i) * 0.04;
    var rm = buildModelMatrix(rx, ry, rz, pulse, pulse * 1.4, pulse);
    appendUnitCubeFullTextureFaces(diamondVerts, rm, 6, 1, 1, 1);
  }
  if (diamondVerts.length) {
    drawBatchedData(new Float32Array(diamondVerts), (diamondVerts.length / VERT_STRIDE) | 0);
  }
}

function updateHUD() {
  var total = diamondPositions.length;
  var got = 0;
  var i;
  for (i = 0; i < diamondCollected.length; i++) if (diamondCollected[i]) got++;
  var pct = total ? ((got / total) * 100) | 0 : 0;
  var bar = document.getElementById("quest-bar-fill");
  if (bar) bar.style.width = pct + "%";
  var pctEl = document.getElementById("quest-pct");
  if (pctEl) pctEl.textContent = String(pct);

  var title = document.getElementById("quest-title");
  if (title) title.textContent = "Quest: Recover the Diamonds";

  var body = document.getElementById("quest-body");
  if (body) {
    body.innerHTML =
      "Creeper popped the chest — <strong>5 diamonds</strong> scattered this chunk. " +
      "Walk into each floating gem to collect. " +
      "<span class=\"quest-count\">" +
      got +
      " / " +
      total +
      "</span>";
  }

  var done = document.getElementById("quest-complete");
  if (done) {
    if (got >= total) {
      done.style.display = "block";
      done.innerHTML =
        "<strong>Achievement get!</strong> Cover Me in Diamonds! — " +
        "DIAMOOONNNDSSS";
    } else {
      done.style.display = "none";
      done.innerHTML = "";
    }
  }

  var el = document.getElementById("hud");
  if (el) el.innerHTML = "";
}

function tryCollectDiamonds() {
  var ex = camera.eye.elements[0];
  var ey = camera.eye.elements[1];
  var ez = camera.eye.elements[2];
  var i;
  for (i = 0; i < diamondPositions.length; i++) {
    if (diamondCollected[i]) continue;
    var rx = diamondPositions[i][0] + 0.5;
    var rz = diamondPositions[i][2] + 0.5;
    var ry = standingBaseY(rx, rz) + 0.45;
    var dx = ex - rx;
    var dy = ey - ry;
    var dz = ez - rz;
    if (dx * dx + dy * dy + dz * dz < 2.8) diamondCollected[i] = true;
  }
}

function resolveMovement() {
  var speed = keysDown["shift"] ? 0.14 : 0.08;
  var turn = 2.8;
  if (keysDown["w"]) camera.moveForward(speed);
  if (keysDown["s"]) camera.moveBackwards(speed);
  if (keysDown["a"]) camera.moveLeft(speed);
  if (keysDown["d"]) camera.moveRight(speed);
  if (keysDown["q"]) camera.panLeft(turn);
  if (keysDown["e"]) camera.panRight(turn);

  var ox = camera.eye.elements[0];
  var oz = camera.eye.elements[2];
  var margin = 0.4;
  var ex = Math.max(margin, Math.min(MAP_SIZE - margin, ox));
  var ez = Math.max(margin, Math.min(MAP_SIZE - margin, oz));
  var dx = ex - ox;
  var dz = ez - oz;
  camera.eye.elements[0] = ex;
  camera.eye.elements[2] = ez;
  camera.at.elements[0] += dx;
  camera.at.elements[2] += dz;

  var eyeH = 1.65;
  camera.eye.elements[1] = standingBaseY(camera.eye.elements[0], camera.eye.elements[2]) + eyeH;
  camera.rebuildAtFromAngles();
  camera.updateView();
}

function forwardMapCell() {
  var f = new Vector3();
  f.set(camera.at);
  f.sub(camera.eye);
  if (f.magnitude() < 1e-4) return [0, 0];
  f.normalize();
  var ex = camera.eye.elements[0];
  var ez = camera.eye.elements[2];
  var ix = Math.floor(ex + f.elements[0] * 1.25);
  var iz = Math.floor(ez + f.elements[2] * 1.25);
  return [ix, iz];
}

function onKeyDown(ev) {
  var k = ev.key.toLowerCase();
  keysDown[k] = true;
  if (k === " ") {
    ev.preventDefault();
    var c = forwardMapCell();
    var h = heightAt(c[0], c[1]);
    if (h < 4) {
      setHeight(c[0], c[1], h + 1);
      worldNeedsRebuild = true;
    }
  } else if (k === "x") {
    var c2 = forwardMapCell();
    var h2 = heightAt(c2[0], c2[1]);
    if (h2 > 0) {
      setHeight(c2[0], c2[1], h2 - 1);
      worldNeedsRebuild = true;
    }
  }
}

function onKeyUp(ev) {
  keysDown[ev.key.toLowerCase()] = false;
}

function requestCanvasPointerLock() {
  if (document.pointerLockElement === canvas) return;
  var req =
    canvas.requestPointerLock ||
    canvas.mozRequestPointerLock ||
    canvas.webkitRequestPointerLock;
  if (req) req.call(canvas);
}

function onPointerLockChange() {
  pointerLocked = document.pointerLockElement === canvas;
}

function onWindowBlur() {
  keysDown = {};
}

function onMouseDown(ev) {
  if (ev.button !== 0) return;
  if (document.pointerLockElement !== canvas) {
    requestCanvasPointerLock();
  }
  mouseDragging = true;
  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;
}

function onMouseUp() {
  mouseDragging = false;
}

function onMouseMove(ev) {
  if (pointerLocked) {
    var mx = ev.movementX;
    var my = ev.movementY;
    if (mx === undefined) mx = 0;
    if (my === undefined) my = 0;
    if (mx !== 0 || my !== 0) {
      camera.applyMouseLook(mx, my, 0.08, 0.06);
      camera.updateView();
    }
    return;
  }
  if (!mouseDragging) return;
  var dx = ev.clientX - lastMouseX;
  var dy = ev.clientY - lastMouseY;
  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;
  camera.applyMouseLook(dx, dy, 0.12, 0.1);
  camera.updateView();
}

function tick() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  resolveMovement();
  tryCollectDiamonds();
  updateHUD();
  renderScene();
  requestAnimationFrame(tick);
}

function main() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get WebGL context.");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0.02, 0.04, 0.08, 1.0);

  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
    console.log("Failed to compile shaders.");
    return;
  }

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  setupAttributes();

  locUView = gl.getUniformLocation(gl.program, "u_viewMatrix");
  locUProj = gl.getUniformLocation(gl.program, "u_projectionMatrix");
  locUModel = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  locTexWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
  locBaseColor = gl.getUniformLocation(gl.program, "u_baseColor");

  initWorldMaps();
  worldNeedsRebuild = true;
  rebuildWorldIfNeeded();

  camera = new Camera(canvas.width, canvas.height, 0.1, 1000);

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("blur", onWindowBlur);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);

  loadAllTexturesThen(function () {
    updateHUD();
    requestAnimationFrame(tick);
  });
}
