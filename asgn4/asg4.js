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
var locUNormalMatrix;
var locTexWeight;
var locBaseColor;
var locLightPos;
var locLightColor;
var locViewPos;
var locLightingOn;
var locNormalVizOn;
var locPointLightOn;
var locSpotLightOn;
var locSpotPos;
var locSpotDir;
var locSpotColor;
var locSpotCutoff;
var locSpotOuterCutoff;

var normalMatrix = new Matrix4();
var lightPosition = [16, 5.0, 16];
var lightColor = [1.0, 0.95, 0.75];
var pointLightOn = true;
var spotLightOn = true;
var lightingOn = true;
var normalVizOn = false;
var animateLight = true;
var lightAngleDeg = 35;
var lastTickMs = performance.now();
var sphereVerts;
var sphereCount = 0;
var objModel = null;
var objModelMatrix = new Matrix4();
var spotLightPos = [16, 6, 8];
var spotLightDir = [0, -0.75, 1];

var VERTEX_SHADER =
  "" +
  "attribute vec3 a_Position;\n" +
  "attribute vec3 a_Color;\n" +
  "attribute vec2 a_UV;\n" +
  "attribute float a_TexSlot;\n" +
  "attribute vec3 a_Normal;\n" +
  "varying vec3 v_Color;\n" +
  "varying vec2 v_UV;\n" +
  "varying float v_TexSlot;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec3 v_WorldPos;\n" +
  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_NormalMatrix;\n" +
  "uniform mat4 u_viewMatrix;\n" +
  "uniform mat4 u_projectionMatrix;\n" +
  "void main() {\n" +
  "  v_Color = a_Color;\n" +
  "  v_UV = a_UV;\n" +
  "  v_TexSlot = a_TexSlot;\n" +
  "  vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);\n" +
  "  v_WorldPos = worldPos.xyz;\n" +
  "  v_Normal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);\n" +
  "  gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;\n" +
  "}\n";

var FRAGMENT_SHADER =
  "" +
  "precision mediump float;\n" +
  "varying vec3 v_Color;\n" +
  "varying vec2 v_UV;\n" +
  "varying float v_TexSlot;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec3 v_WorldPos;\n" +
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
  "uniform vec3 u_LightPos;\n" +
  "uniform vec3 u_LightColor;\n" +
  "uniform vec3 u_ViewPos;\n" +
  "uniform bool u_LightingOn;\n" +
  "uniform bool u_NormalVizOn;\n" +
  "uniform bool u_PointLightOn;\n" +
  "uniform bool u_SpotLightOn;\n" +
  "uniform vec3 u_SpotPos;\n" +
  "uniform vec3 u_SpotDir;\n" +
  "uniform vec3 u_SpotColor;\n" +
  "uniform float u_SpotCutoff;\n" +
  "uniform float u_SpotOuterCutoff;\n" +
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
  "  vec3 normal = normalize(v_Normal);\n" +
  "  if (u_NormalVizOn) {\n" +
  "    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);\n" +
  "    return;\n" +
  "  }\n" +
  "  if (!u_LightingOn) {\n" +
  "    gl_FragColor = vec4(outRgb, 1.0);\n" +
  "    return;\n" +
  "  }\n" +
  "  vec3 viewDir = normalize(u_ViewPos - v_WorldPos);\n" +
  "  vec3 lit = outRgb * 0.18;\n" +
  "  if (u_PointLightOn) {\n" +
  "    vec3 lightDir = normalize(u_LightPos - v_WorldPos);\n" +
  "    float diff = max(dot(normal, lightDir), 0.0);\n" +
  "    vec3 reflectDir = reflect(-lightDir, normal);\n" +
  "    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);\n" +
  "    float dist = length(u_LightPos - v_WorldPos);\n" +
  "    float atten = 1.0 / (1.0 + 0.035 * dist + 0.006 * dist * dist);\n" +
  "    lit += (outRgb * diff + vec3(0.65) * spec) * u_LightColor * atten;\n" +
  "  }\n" +
  "  if (u_SpotLightOn) {\n" +
  "    vec3 spotDirToLight = normalize(u_SpotPos - v_WorldPos);\n" +
  "    float theta = dot(normalize(v_WorldPos - u_SpotPos), normalize(u_SpotDir));\n" +
  "    float edge = max(u_SpotCutoff - u_SpotOuterCutoff, 0.001);\n" +
  "    float intensity = clamp((theta - u_SpotOuterCutoff) / edge, 0.0, 1.0);\n" +
  "    float diff = max(dot(normal, spotDirToLight), 0.0);\n" +
  "    vec3 reflectDir = reflect(-spotDirToLight, normal);\n" +
  "    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 40.0);\n" +
  "    float dist = length(u_SpotPos - v_WorldPos);\n" +
  "    float atten = 1.0 / (1.0 + 0.025 * dist + 0.004 * dist * dist);\n" +
  "    lit += (outRgb * diff + vec3(0.8) * spec) * u_SpotColor * intensity * atten;\n" +
  "  }\n" +
  "  gl_FragColor = vec4(clamp(lit, vec3(0.0), vec3(1.0)), 1.0);\n" +
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

function rebindAllTextures() {
  gl.useProgram(gl.program);
  bindTextureUnits();
}

function initProceduralTextures() {
  var sand = createCanvasTexture(drawTexSand);
  var grass = createCanvasTexture(drawTexGrass);
  var brick = createCanvasTexture(drawTexBrick);
  var stone = createCanvasTexture(drawTexStone);
  textures[0] = brick;
  textures[1] = stone;
  textures[2] = sand;
  textures[3] = brick;
  textures[4] = grass;
  textures[5] = createCanvasTexture(drawTexSky);
  textures[6] = createCanvasTexture(drawTexStone);
  textures[7] = sand;
}

/** Start rendering immediately; optionally swap in image textures when they load. */
function loadAllTexturesThen(onReady) {
  initProceduralTextures();
  rebindAllTextures();
  onReady();

  loadDirtTextureFromImage(
    function (dirtTex) {
      var i;
      for (i = 0; i < 4; i++) textures[i] = dirtTex;
      rebindAllTextures();
      loadGrassFloorTextureFromImage(
        function (grassTex) {
          textures[4] = grassTex;
          rebindAllTextures();
        },
        function () {
          console.log("Could not load textures/grass.png; floor uses procedural grass.");
        }
      );
      loadDiamondTextureFromImage(
        function (diamondTex) {
          textures[6] = diamondTex;
          rebindAllTextures();
        },
        function () {
          console.log("Could not load textures/diamond.webp; diamonds use procedural texture.");
        }
      );
      loadZombieAtlasFromImage(
        function (zTex) {
          textures[7] = zTex;
          rebindAllTextures();
        },
        function () {
          console.log("Could not load textures/zombie.png; zombies use block texture.");
        }
      );
    },
    function () {
      console.log("Could not load textures/dirt.png; keeping procedural block textures.");
    }
  );
}

function showBootStatus(msg, isError) {
  var hud = document.getElementById("hud");
  if (hud) {
    hud.innerHTML =
      '<p style="color:' +
      (isError ? "#ff8888" : "#9ee8ff") +
      ';max-width:720px;line-height:1.45">' +
      msg +
      "</p>";
  }
  if (isError) console.error(msg);
  else console.log(msg);
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
  var a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, stride, 9 * FLOAT_SIZE);
  gl.enableVertexAttribArray(a_Normal);
}

function rebuildWorldIfNeeded() {
  if (!worldNeedsRebuild) return;
  worldGeo = buildWorldGeometry();
  worldNeedsRebuild = false;
}

function drawBatchedData(floatArray, count) {
  if (!count) return;
  gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
  setModelMatrix(identityModel);
  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function setModelMatrix(modelMatrix) {
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(locUModel, false, modelMatrix.elements);
  gl.uniformMatrix4fv(locUNormalMatrix, false, normalMatrix.elements);
}

function drawModelData(floatArray, count, modelMatrix) {
  if (!count) return;
  gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
  setModelMatrix(modelMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, count);
}

function setMix(texWeight, baseR, baseG, baseB) {
  gl.uniform1f(locTexWeight, texWeight);
  gl.uniform3f(locBaseColor, baseR, baseG, baseB);
}

function updateLightingUniforms() {
  gl.uniform3f(locLightPos, lightPosition[0], lightPosition[1], lightPosition[2]);
  gl.uniform3f(locLightColor, lightColor[0], lightColor[1], lightColor[2]);
  gl.uniform3f(locViewPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  gl.uniform1i(locLightingOn, lightingOn ? 1 : 0);
  gl.uniform1i(locNormalVizOn, normalVizOn ? 1 : 0);
  gl.uniform1i(locPointLightOn, pointLightOn ? 1 : 0);
  gl.uniform1i(locSpotLightOn, spotLightOn ? 1 : 0);
  gl.uniform3f(locSpotPos, spotLightPos[0], spotLightPos[1], spotLightPos[2]);
  gl.uniform3f(locSpotDir, spotLightDir[0], spotLightDir[1], spotLightDir[2]);
  gl.uniform3f(locSpotColor, 0.7, 0.85, 1.0);
  gl.uniform1f(locSpotCutoff, Math.cos((12 * Math.PI) / 180));
  gl.uniform1f(locSpotOuterCutoff, Math.cos((23 * Math.PI) / 180));
}

function buildSphereGeometry(radius, latBands, lonBands, color) {
  var verts = [];
  var lat;
  var lon;
  for (lat = 0; lat < latBands; lat++) {
    var theta0 = (lat * Math.PI) / latBands;
    var theta1 = ((lat + 1) * Math.PI) / latBands;
    for (lon = 0; lon < lonBands; lon++) {
      var phi0 = (lon * Math.PI * 2) / lonBands;
      var phi1 = ((lon + 1) * Math.PI * 2) / lonBands;
      var p00 = spherePoint(radius, theta0, phi0);
      var p10 = spherePoint(radius, theta1, phi0);
      var p11 = spherePoint(radius, theta1, phi1);
      var p01 = spherePoint(radius, theta0, phi1);
      pushSphereTri(verts, p00, p10, p11, color, lon / lonBands, lat / latBands, (lon + 1) / lonBands, (lat + 1) / latBands);
      pushSphereTri(verts, p00, p11, p01, color, lon / lonBands, lat / latBands, (lon + 1) / lonBands, (lat + 1) / latBands);
    }
  }
  return new Float32Array(verts);
}

function spherePoint(radius, theta, phi) {
  var st = Math.sin(theta);
  var x = Math.cos(phi) * st;
  var y = Math.cos(theta);
  var z = Math.sin(phi) * st;
  return [x * radius, y * radius, z * radius, x, y, z];
}

function pushSphereVertex(out, p, color, u, v) {
  out.push(p[0], p[1], p[2], color[0], color[1], color[2], u, v, 4, p[3], p[4], p[5]);
}

function pushSphereTri(out, a, b, c, color, u0, v0, u1, v1) {
  pushSphereVertex(out, a, color, u0, v0);
  pushSphereVertex(out, b, color, u0, v1);
  pushSphereVertex(out, c, color, u1, v1);
}

function makeModelMatrix(tx, ty, tz, sx, sy, sz, ry) {
  var m = new Matrix4();
  m.setTranslate(tx, ty, tz);
  if (ry) m.rotate(ry, 0, 1, 0);
  m.scale(sx, sy, sz);
  return m;
}

function syncLightPositionSliders() {
  var lx = document.getElementById("light-x");
  var ly = document.getElementById("light-y");
  var lz = document.getElementById("light-z");
  if (lx) lx.value = String(Math.round(lightPosition[0] * 2));
  if (ly) ly.value = String(Math.round(lightPosition[1] * 2));
  if (lz) lz.value = String(Math.round(lightPosition[2] * 2));
}

function readLightPositionFromSliders() {
  var lx = document.getElementById("light-x");
  var ly = document.getElementById("light-y");
  var lz = document.getElementById("light-z");
  if (lx) lightPosition[0] = (parseFloat(lx.value) || 0) / 2;
  if (ly) lightPosition[1] = (parseFloat(ly.value) || 0) / 2;
  if (lz) lightPosition[2] = (parseFloat(lz.value) || 0) / 2;
}

function applyLightAngleToPosition() {
  var a = (lightAngleDeg * Math.PI) / 180;
  lightPosition[0] = 16 + Math.cos(a) * 8;
  lightPosition[1] = 5.5 + Math.sin(a * 1.7) * 1.3;
  lightPosition[2] = 16 + Math.sin(a) * 8;
}

function updateMovingLight(dt) {
  if (animateLight) {
    lightAngleDeg = (lightAngleDeg + dt * 32) % 360;
    var slider = document.getElementById("point-light-angle");
    if (slider) slider.value = String(lightAngleDeg | 0);
    applyLightAngleToPosition();
    syncLightPositionSliders();
  }
}

function renderLightMarker(pos, color, scale) {
  var marker = [];
  // Inverted cube so normals face outward from the light center (lecture).
  var m = buildModelMatrix(pos[0], pos[1], pos[2], -scale, -scale, -scale);
  appendUnitCubeFullTextureFaces(marker, m, 4, color[0], color[1], color[2]);
  setMix(0.0, 1.0, 1.0, 1.0);
  drawBatchedData(new Float32Array(marker), (marker.length / VERT_STRIDE) | 0);
}

function parseObjToVertexData(text, color) {
  var positions = [];
  var normals = [];
  var packed = [];
  var lines = text.split(/\r?\n/);
  var i;
  for (i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === "#") continue;
    var parts = line.split(/\s+/);
    if (parts[0] === "v") {
      positions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (parts[0] === "vn") {
      normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (parts[0] === "f" && parts.length >= 4) {
      var face = [];
      var j;
      for (j = 1; j < parts.length; j++) face.push(parseObjRef(parts[j], positions, normals));
      for (j = 1; j < face.length - 1; j++) pushObjTriangle(packed, face[0], face[j], face[j + 1], color);
    }
  }
  return new Float32Array(packed);
}

function parseObjRef(token, positions, normals) {
  var comps = token.split("/");
  var vi = parseInt(comps[0], 10);
  if (vi < 0) vi = positions.length + vi + 1;
  var ni = comps.length >= 3 && comps[2] ? parseInt(comps[2], 10) : 0;
  if (ni < 0) ni = normals.length + ni + 1;
  return {
    p: positions[vi - 1],
    n: ni ? normals[ni - 1] : null,
  };
}

function pushObjTriangle(out, a, b, c, color) {
  var nx;
  var ny;
  var nz;
  if (a.n && b.n && c.n) {
    pushObjVertex(out, a.p, a.n, color);
    pushObjVertex(out, b.p, b.n, color);
    pushObjVertex(out, c.p, c.n, color);
    return;
  }
  var ux = b.p[0] - a.p[0];
  var uy = b.p[1] - a.p[1];
  var uz = b.p[2] - a.p[2];
  var vx = c.p[0] - a.p[0];
  var vy = c.p[1] - a.p[1];
  var vz = c.p[2] - a.p[2];
  var n = [0, 1, 0];
  normalizeInto(n, uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
  nx = n[0];
  ny = n[1];
  nz = n[2];
  pushObjVertex(out, a.p, [nx, ny, nz], color);
  pushObjVertex(out, b.p, [nx, ny, nz], color);
  pushObjVertex(out, c.p, [nx, ny, nz], color);
}

function pushObjVertex(out, p, n, color) {
  out.push(p[0], p[1], p[2], color[0], color[1], color[2], 0, 0, 4, n[0], n[1], n[2]);
}

function fallbackObjText() {
  return [
    "v 0 1.6 0",
    "v -0.7 0.3 -0.7",
    "v 0.7 0.3 -0.7",
    "v 0.7 0.3 0.7",
    "v -0.7 0.3 0.7",
    "v 0 -1.0 0",
    "v -1.0 0 -0.2",
    "v 1.0 0 -0.2",
    "v 0.2 0 1.0",
    "v -0.2 0 1.0",
    "f 1 2 3",
    "f 1 3 4",
    "f 1 4 5",
    "f 1 5 2",
    "f 6 3 2",
    "f 6 4 3",
    "f 6 5 4",
    "f 6 2 5",
    "f 7 2 5",
    "f 8 4 3",
    "f 9 5 4",
    "f 10 2 5",
  ].join("\n");
}

function loadObjModel() {
  objModel = { loaded: false, data: null, count: 0 };
  objModelMatrix = makeModelMatrix(21, 1.0, 16, 0.55, 0.55, 0.55, -35);
  fetch("crystal.obj")
    .then(function (response) {
      if (!response.ok) throw new Error("OBJ fetch failed");
      return response.text();
    })
    .then(function (text) {
      objModel.data = parseObjToVertexData(text, [0.88, 0.58, 0.35]);
      objModel.count = (objModel.data.length / VERT_STRIDE) | 0;
      objModel.loaded = true;
    })
    .catch(function () {
      objModel.data = parseObjToVertexData(fallbackObjText(), [0.88, 0.58, 0.35]);
      objModel.count = (objModel.data.length / VERT_STRIDE) | 0;
      objModel.loaded = true;
    });
}

function renderScene() {
  rebuildWorldIfNeeded();

  gl.uniformMatrix4fv(locUView, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(locUProj, false, camera.projectionMatrix.elements);
  updateLightingUniforms();

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

  setMix(0.0, 1.0, 1.0, 1.0);
  drawModelData(sphereVerts, sphereCount, makeModelMatrix(12.5, standingBaseY(12.5, 16.5) + 1.0, 16.5, 1.0, 1.0, 1.0, 0));
  drawModelData(sphereVerts, sphereCount, makeModelMatrix(18.5, standingBaseY(18.5, 14.5) + 0.75, 14.5, 0.75, 0.75, 0.75, 0));

  if (objModel && objModel.loaded) {
    setMix(0.0, 1.0, 1.0, 1.0);
    drawModelData(objModel.data, objModel.count, objModelMatrix);
  }

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

  if (lightingOn && pointLightOn) renderLightMarker(lightPosition, lightColor, 0.28);
  if (lightingOn && spotLightOn) renderLightMarker(spotLightPos, [0.55, 0.75, 1.0], 0.22);
}

function updateLightingControlsText() {
  var lightingBtn = document.getElementById("toggle-lighting");
  setButtonState(lightingBtn, "Lighting", lightingOn);
  var normalBtn = document.getElementById("toggle-normals");
  setButtonState(normalBtn, "Normals", normalVizOn);
  var pointBtn = document.getElementById("toggle-point-light");
  setButtonState(pointBtn, "Point Light", pointLightOn);
  var spotBtn = document.getElementById("toggle-spot-light");
  setButtonState(spotBtn, "Spot Light", spotLightOn);
  var animateBtn = document.getElementById("toggle-light-animation");
  setButtonState(animateBtn, "Animate Point Light", animateLight);
}

function setButtonState(btn, label, isOn) {
  if (!btn) return;
  btn.textContent = label + ": " + (isOn ? "On" : "Off");
  btn.className = isOn ? "" : "is-off";
  btn.setAttribute("aria-pressed", isOn ? "true" : "false");
}

function bindToggleButton(id, toggleFn) {
  var btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener("click", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    toggleFn();
    updateLightingControlsText();
    if (camera) renderScene();
  });
}

function initLightingControls() {
  bindToggleButton("toggle-lighting", function () {
    lightingOn = !lightingOn;
  });
  bindToggleButton("toggle-normals", function () {
    normalVizOn = !normalVizOn;
  });
  bindToggleButton("toggle-point-light", function () {
    pointLightOn = !pointLightOn;
  });
  bindToggleButton("toggle-spot-light", function () {
    spotLightOn = !spotLightOn;
  });
  bindToggleButton("toggle-light-animation", function () {
    animateLight = !animateLight;
  });
  var angle = document.getElementById("point-light-angle");
  if (angle) {
    angle.value = String(lightAngleDeg);
    angle.oninput = function () {
      lightAngleDeg = parseFloat(angle.value) || 0;
      animateLight = false;
      applyLightAngleToPosition();
      syncLightPositionSliders();
      updateLightingControlsText();
    };
  }
  var lx = document.getElementById("light-x");
  var ly = document.getElementById("light-y");
  var lz = document.getElementById("light-z");
  function onLightPositionSlider() {
    animateLight = false;
    readLightPositionFromSliders();
  }
  if (lx) lx.oninput = onLightPositionSlider;
  if (ly) ly.oninput = onLightPositionSlider;
  if (lz) lz.oninput = onLightPositionSlider;
  applyLightAngleToPosition();
  syncLightPositionSliders();
  var red = document.getElementById("light-red");
  var green = document.getElementById("light-green");
  var blue = document.getElementById("light-blue");
  function readColor() {
    lightColor[0] = red ? (parseFloat(red.value) || 0) / 100 : lightColor[0];
    lightColor[1] = green ? (parseFloat(green.value) || 0) / 100 : lightColor[1];
    lightColor[2] = blue ? (parseFloat(blue.value) || 0) / 100 : lightColor[2];
  }
  if (red) red.oninput = readColor;
  if (green) green.oninput = readColor;
  if (blue) blue.oninput = readColor;
  readColor();
  updateLightingControlsText();
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
  try {
    var now = performance.now();
    var dt = Math.min(0.1, (now - lastTickMs) * 0.001);
    lastTickMs = now;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    resolveMovement();
    updateMovingLight(dt);
    tryCollectDiamonds();
    updateHUD();
    renderScene();
  } catch (err) {
    console.error(err);
    showBootStatus("Render error: " + err.message + " (see console).", true);
    return;
  }
  requestAnimationFrame(tick);
}

function main() {
  canvas = document.getElementById("webgl");
  if (!canvas) {
    showBootStatus("Canvas #webgl not found.", true);
    return;
  }
  gl = getWebGLContext(canvas, false);
  if (!gl) {
    showBootStatus("WebGL is not available in this browser.", true);
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0.02, 0.04, 0.08, 1.0);

  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
    showBootStatus("Shader compile/link failed. Open the browser console (F12) for details.", true);
    return;
  }

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  setupAttributes();

  locUView = gl.getUniformLocation(gl.program, "u_viewMatrix");
  locUProj = gl.getUniformLocation(gl.program, "u_projectionMatrix");
  locUModel = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  locUNormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  locTexWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
  locBaseColor = gl.getUniformLocation(gl.program, "u_baseColor");
  locLightPos = gl.getUniformLocation(gl.program, "u_LightPos");
  locLightColor = gl.getUniformLocation(gl.program, "u_LightColor");
  locViewPos = gl.getUniformLocation(gl.program, "u_ViewPos");
  locLightingOn = gl.getUniformLocation(gl.program, "u_LightingOn");
  locNormalVizOn = gl.getUniformLocation(gl.program, "u_NormalVizOn");
  locPointLightOn = gl.getUniformLocation(gl.program, "u_PointLightOn");
  locSpotLightOn = gl.getUniformLocation(gl.program, "u_SpotLightOn");
  locSpotPos = gl.getUniformLocation(gl.program, "u_SpotPos");
  locSpotDir = gl.getUniformLocation(gl.program, "u_SpotDir");
  locSpotColor = gl.getUniformLocation(gl.program, "u_SpotColor");
  locSpotCutoff = gl.getUniformLocation(gl.program, "u_SpotCutoff");
  locSpotOuterCutoff = gl.getUniformLocation(gl.program, "u_SpotOuterCutoff");

  initWorldMaps();
  worldNeedsRebuild = true;
  rebuildWorldIfNeeded();

  camera = new Camera(canvas.width, canvas.height, 0.1, 1000);
  sphereVerts = buildSphereGeometry(1.0, 24, 32, [0.35, 0.65, 1.0]);
  sphereCount = (sphereVerts.length / VERT_STRIDE) | 0;
  loadObjModel();
  initLightingControls();

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointerlockchange", onPointerLockChange);
  window.addEventListener("blur", onWindowBlur);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);

  showBootStatus(
    "Loading… Serve this folder with HTTP: <code>cd asgn4 && python3 -m http.server 8001</code> then open <code>http://localhost:8001/asg4.html</code>",
    false
  );

  loadAllTexturesThen(function () {
    requestAnimationFrame(tick);
  });
}
