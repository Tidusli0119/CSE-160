// -------------------- SHADERS --------------------
var VERTEX_SHADER = `
  precision mediump float;
  attribute vec3 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  void main() {
    gl_Position = u_GlobalRotation * u_ModelMatrix * vec4(a_Position, 1.0);
  }
`;

var FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// -------------------- GLOBALS --------------------
var canvas;
var gl;
var a_Position;
var u_ModelMatrix;
var u_GlobalRotation;
var u_FragColor;

var cubeBuffer = null;
var cubeVertexCount = 0;
var cylBuffer = null;
var cylVertexCount = 0;

var gAnimalGlobalRotationY = 0;
var gAnimalGlobalRotationX = 0;
var gShoulder = 15;
var gElbow = -20;
var gWrist = 10;
var gHeadYaw = 0;
var gTailAngle = 0;

var gAnimateShoulder = true;
var gAnimateElbow = true;
var gAnimateWrist = true;
var gAnimateHead = true;
var gAnimateTail = true;
var gPokeUntil = 0;
var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;
var g_lastFrame = performance.now();
var g_fps = 0;

function showStatus(msg) {
  var el = document.getElementById("statusLabel");
  if (el) el.textContent = msg;
}

function buildCubeVertices() {
  return new Float32Array([
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
     0.5, -0.5,  0.5,   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
     0.5, -0.5,  0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5
  ]);
}

function buildCylinderVertices(segments) {
  var verts = [];
  for (var i = 0; i < segments; i++) {
    var a0 = (i / segments) * Math.PI * 2.0;
    var a1 = ((i + 1) / segments) * Math.PI * 2.0;
    var x0 = Math.cos(a0) * 0.5;
    var z0 = Math.sin(a0) * 0.5;
    var x1 = Math.cos(a1) * 0.5;
    var z1 = Math.sin(a1) * 0.5;

    verts.push(x0, -0.5, z0, x1, -0.5, z1, x1, 0.5, z1);
    verts.push(x0, -0.5, z0, x1, 0.5, z1, x0, 0.5, z0);
    verts.push(0, 0.5, 0, x1, 0.5, z1, x0, 0.5, z0);
    verts.push(0, -0.5, 0, x0, -0.5, z0, x1, -0.5, z1);
  }
  return new Float32Array(verts);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas);
  if (!gl) return false;
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.90, 0.95, 1.0, 1.0);
  return true;
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) return false;
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotation = gl.getUniformLocation(gl.program, "u_GlobalRotation");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  return true;
}

function initBuffers() {
  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  var cubeVerts = buildCubeVertices();
  gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
  cubeVertexCount = cubeVerts.length / 3;

  cylBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cylBuffer);
  var cylVerts = buildCylinderVertices(20);
  gl.bufferData(gl.ARRAY_BUFFER, cylVerts, gl.STATIC_DRAW);
  cylVertexCount = cylVerts.length / 3;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function drawCube(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Fake lighting: draw each face with slightly different brightness.
  // Cube vertex order is 6 faces * 2 triangles * 3 vertices = 36 vertices.
  var faceBrightness = [1.00, 0.85, 0.92, 0.78, 0.95, 0.70];
  for (var i = 0; i < 6; i++) {
    var b = faceBrightness[i];
    gl.uniform4f(u_FragColor, color[0] * b, color[1] * b, color[2] * b, 1.0);
    gl.drawArrays(gl.TRIANGLES, i * 6, 6);
  }
}

function drawCylinder(modelMatrix, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], 1.0);
  gl.bindBuffer(gl.ARRAY_BUFFER, cylBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, cylVertexCount);
}

function drawLimb(bodyRoot, side, isFront, shoulderSwing, elbowAngle, wristAngle) {
  var zAttach = isFront ? 0.18 : -0.22;
  var yAttach = isFront ? 0.12 : -0.10;
  var upperLen = isFront ? 0.34 : 0.33;
  var lowerLen = isFront ? 0.30 : 0.28;
  var upperW = isFront ? 0.16 : 0.18;
  var lowerW = isFront ? 0.13 : 0.15;
  var xAttach = isFront ? 0.43 : 0.33;
  var sideHang = isFront ? side * 42 : side * 10;
  var inward = isFront ? -side * 8 : side * 10;

  var upper = new Matrix4(bodyRoot);
  upper.translate(side * xAttach, yAttach, zAttach);
  upper.rotate(sideHang, 0, 0, 1);
  upper.rotate(inward, 0, 0, 1);
  upper.rotate(shoulderSwing, 1, 0, 0);

  // Shoulder cap makes the arm visually attached to torso side
  if (isFront) {
    var shoulderCap = new Matrix4(bodyRoot);
    shoulderCap.translate(side * (xAttach - 0.06), yAttach + 0.02, zAttach - 0.01);
    shoulderCap.scale(0.16, 0.18, 0.16);
    drawCube(shoulderCap, [0.50, 0.36, 0.26]);
  }
  var upperShape = new Matrix4(upper);
  upperShape.translate(0, -upperLen * 0.5, 0);
  upperShape.scale(upperW, upperLen, upperW);
  drawCube(upperShape, [0.47, 0.33, 0.23]);

  var lower = new Matrix4(upper);
  lower.translate(0, -upperLen, 0);
  lower.rotate(elbowAngle, 1, 0, 0);
  var lowerShape = new Matrix4(lower);
  lowerShape.translate(0, -lowerLen * 0.5, 0);
  lowerShape.scale(lowerW, lowerLen, lowerW);
  drawCube(lowerShape, [0.43, 0.30, 0.21]);

  var paw = new Matrix4(lower);
  paw.translate(0, -lowerLen, isFront ? 0.02 : 0.03);
  paw.rotate(wristAngle, 1, 0, 0);
  var pawShape = new Matrix4(paw);
  pawShape.scale(isFront ? 0.13 : 0.14, 0.09, isFront ? 0.18 : 0.19);
  drawCube(pawShape, [0.22, 0.19, 0.18]);

  // Two claw blocks to give a hook-like sloth claw silhouette
  var clawA = new Matrix4(paw);
  clawA.translate(0.03, -0.025, 0.08);
  clawA.rotate(-35, 1, 0, 0);
  clawA.scale(0.05, 0.13, 0.05);
  drawCube(clawA, [0.10, 0.10, 0.10]);

  var clawB = new Matrix4(paw);
  clawB.translate(-0.03, -0.025, 0.08);
  clawB.rotate(-35, 1, 0, 0);
  clawB.scale(0.05, 0.13, 0.05);
  drawCube(clawB, [0.10, 0.10, 0.10]);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var globalRot = new Matrix4();
  globalRot.rotate(gAnimalGlobalRotationX, 1, 0, 0);
  globalRot.rotate(gAnimalGlobalRotationY, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRot.elements);

  var bodyRoot = new Matrix4();
  bodyRoot.translate(0, -0.05, 0);

  // Round torso: cylinder core + soft top/bottom caps
  var body = new Matrix4(bodyRoot);
  body.scale(0.92, 0.90, 0.86);
  drawCylinder(body, [0.56, 0.40, 0.28]);

  var bodyTop = new Matrix4(bodyRoot);
  bodyTop.translate(0, 0.42, 0);
  bodyTop.scale(0.78, 0.18, 0.72);
  drawCube(bodyTop, [0.56, 0.40, 0.28]);

  var bodyBottom = new Matrix4(bodyRoot);
  bodyBottom.translate(0, -0.42, 0.02);
  bodyBottom.scale(0.80, 0.18, 0.72);
  drawCube(bodyBottom, [0.55, 0.39, 0.28]);

  var belly = new Matrix4(bodyRoot);
  belly.translate(0, -0.02, 0.32);
  belly.scale(0.62, 0.52, 0.34);
  drawCube(belly, [0.80, 0.73, 0.61]);

  var neck = new Matrix4(bodyRoot);
  neck.translate(0, 0.18, 0.45);
  neck.rotate(-20, 1, 0, 0);
  neck.scale(0.20, 0.28, 0.20);
  drawCylinder(neck, [0.50, 0.35, 0.25]);

  var headBase = new Matrix4(bodyRoot);
  headBase.translate(0, 0.46, 0.56);
  headBase.rotate(gHeadYaw, 0, 1, 0);
  var head = new Matrix4(headBase);
  head.scale(0.60, 0.56, 0.50);
  drawCube(head, [0.60, 0.43, 0.31]);

  var face = new Matrix4(headBase);
  face.translate(0, -0.01, 0.25);
  face.scale(0.40, 0.34, 0.12);
  drawCube(face, [0.88, 0.85, 0.77]);

  // Sloth eye mask patches
  var leftMask = new Matrix4(headBase);
  leftMask.translate(-0.115, 0.065, 0.33);
  leftMask.scale(0.13, 0.13, 0.028);
  drawCube(leftMask, [0.41, 0.29, 0.22]);

  var rightMask = new Matrix4(headBase);
  rightMask.translate(0.115, 0.065, 0.33);
  rightMask.scale(0.13, 0.13, 0.028);
  drawCube(rightMask, [0.41, 0.29, 0.22]);

  // Eyes
  var leftEye = new Matrix4(headBase);
  leftEye.translate(-0.115, 0.062, 0.358);
  leftEye.scale(0.046, 0.046, 0.018);
  drawCube(leftEye, [0.08, 0.08, 0.08]);

  var leftEyeHighlight = new Matrix4(headBase);
  leftEyeHighlight.translate(-0.100, 0.075, 0.370);
  leftEyeHighlight.scale(0.016, 0.016, 0.009);
  drawCube(leftEyeHighlight, [0.95, 0.95, 0.95]);

  var leftEyeHighlight2 = new Matrix4(headBase);
  leftEyeHighlight2.translate(-0.123, 0.048, 0.369);
  leftEyeHighlight2.scale(0.008, 0.008, 0.007);
  drawCube(leftEyeHighlight2, [0.90, 0.90, 0.90]);

  var rightEye = new Matrix4(headBase);
  rightEye.translate(0.115, 0.062, 0.358);
  rightEye.scale(0.046, 0.046, 0.018);
  drawCube(rightEye, [0.08, 0.08, 0.08]);

  var rightEyeHighlight = new Matrix4(headBase);
  rightEyeHighlight.translate(0.130, 0.075, 0.370);
  rightEyeHighlight.scale(0.016, 0.016, 0.009);
  drawCube(rightEyeHighlight, [0.95, 0.95, 0.95]);

  var rightEyeHighlight2 = new Matrix4(headBase);
  rightEyeHighlight2.translate(0.107, 0.048, 0.369);
  rightEyeHighlight2.scale(0.008, 0.008, 0.007);
  drawCube(rightEyeHighlight2, [0.90, 0.90, 0.90]);

  // Nose
  var nose = new Matrix4(headBase);
  nose.translate(0, -0.02, 0.365);
  nose.scale(0.055, 0.04, 0.025);
  drawCube(nose, [0.20, 0.16, 0.16]);

  var noseBridge = new Matrix4(headBase);
  noseBridge.translate(0, 0.01, 0.347);
  noseBridge.scale(0.024, 0.035, 0.016);
  drawCube(noseBridge, [0.44, 0.32, 0.25]);

  var smile = new Matrix4(headBase);
  smile.translate(0, -0.10, 0.352);
  smile.scale(0.12, 0.018, 0.012);
  drawCube(smile, [0.30, 0.21, 0.17]);

  var leftCheek = new Matrix4(headBase);
  leftCheek.translate(-0.15, -0.05, 0.33);
  leftCheek.scale(0.055, 0.045, 0.015);
  drawCube(leftCheek, [0.92, 0.86, 0.80]);

  var rightCheek = new Matrix4(headBase);
  rightCheek.translate(0.15, -0.05, 0.33);
  rightCheek.scale(0.055, 0.045, 0.015);
  drawCube(rightCheek, [0.92, 0.86, 0.80]);

  var tail = new Matrix4(bodyRoot);
  tail.translate(0, -0.10, -0.43);
  tail.rotate(gTailAngle, 1, 0, 0);
  tail.scale(0.16, 0.16, 0.28);
  drawCylinder(tail, [0.45, 0.31, 0.23]);

  // Front limbs: long and expressive
  drawLimb(bodyRoot, -1, true, gShoulder, gElbow, gWrist);
  drawLimb(bodyRoot,  1, true, gShoulder, gElbow, gWrist);
  // Rear limbs: shorter
  drawLimb(bodyRoot, -1, false, -8 + -0.35 * gShoulder, gElbow * 0.35, gWrist * 0.4);
  drawLimb(bodyRoot,  1, false, -8 + -0.35 * gShoulder, gElbow * 0.35, gWrist * 0.4);
}

function updateAnimationAngles() {
  var sway = Math.sin(g_seconds * 1.7);
  var nod = Math.sin(g_seconds * 1.2);
  if (gAnimateShoulder) gShoulder = 6 + 7 * sway;
  if (gAnimateElbow) gElbow = -35 + 9 * Math.sin(g_seconds * 1.7 + 0.6);
  if (gAnimateWrist) gWrist = 20 + 6 * Math.sin(g_seconds * 1.7 + 1.1);
  if (gAnimateHead) gHeadYaw = 4 * nod;
  if (gAnimateTail) gTailAngle = 6 * Math.sin(g_seconds * 2.1);
  updateSliderValues();
}

function updatePokeAnimation() {
  if (g_seconds > gPokeUntil) return;
  var t = (gPokeUntil - g_seconds) * 14.0;
  gHeadYaw = Math.sin(t) * 35;
  gWrist = Math.sin(t * 0.7) * 25;
}

function tick() {
  var now = performance.now();
  g_seconds = now / 1000.0 - g_startTime;

  try {
    updateAnimationAngles();
    updatePokeAnimation();
    renderScene();
    showStatus("Running");
  } catch (err) {
    showStatus("Runtime error: " + err.message);
    console.error(err);
    return;
  }

  var dt = now - g_lastFrame;
  g_lastFrame = now;
  var instantFPS = dt > 0 ? 1000.0 / dt : 0;
  g_fps = g_fps === 0 ? instantFPS : g_fps * 0.9 + instantFPS * 0.1;
  var fpsEl = document.getElementById("fpsLabel");
  if (fpsEl) fpsEl.textContent = "FPS: " + g_fps.toFixed(1);

  requestAnimationFrame(tick);
}

function bindSlider(id, labelId, onChange) {
  var slider = document.getElementById(id);
  var label = document.getElementById(labelId);
  slider.addEventListener("input", function(ev) {
    var val = Number(ev.target.value);
    onChange(val);
    label.textContent = String(val);
    renderScene();
  });
}

function updateSliderValues() {
  var mapping = [
    ["leftShoulder", "leftShoulderVal", gShoulder],
    ["leftElbow", "leftElbowVal", gElbow],
    ["leftWrist", "leftWristVal", gWrist],
    ["headYaw", "headYawVal", gHeadYaw],
    ["tailAngle", "tailAngleVal", gTailAngle]
  ];

  for (var i = 0; i < mapping.length; i++) {
    var row = mapping[i];
    var slider = document.getElementById(row[0]);
    var label = document.getElementById(row[1]);
    var v = Math.round(row[2]);
    if (slider) slider.value = String(v);
    if (label) label.textContent = String(v);
  }
}

function addActionsForHtmlUI() {
  bindSlider("globalY", "globalYVal", function(v) { gAnimalGlobalRotationY = v; });
  bindSlider("globalX", "globalXVal", function(v) { gAnimalGlobalRotationX = v; });
  bindSlider("leftShoulder", "leftShoulderVal", function(v) { gShoulder = v; });
  bindSlider("leftElbow", "leftElbowVal", function(v) { gElbow = v; });
  bindSlider("leftWrist", "leftWristVal", function(v) { gWrist = v; });
  bindSlider("headYaw", "headYawVal", function(v) { gHeadYaw = v; });
  bindSlider("tailAngle", "tailAngleVal", function(v) { gTailAngle = v; });

  var animOnBtn = document.getElementById("animOn");
  var animOffBtn = document.getElementById("animOff");
  var shoulderAnimOnBtn = document.getElementById("shoulderAnimOn");
  var shoulderAnimOffBtn = document.getElementById("shoulderAnimOff");
  var elbowAnimOnBtn = document.getElementById("elbowAnimOn");
  var elbowAnimOffBtn = document.getElementById("elbowAnimOff");

  if (animOnBtn) animOnBtn.onclick = function() {
    gAnimateShoulder = true;
    gAnimateElbow = true;
    gAnimateWrist = true;
    gAnimateHead = true;
    gAnimateTail = true;
  };
  if (animOffBtn) animOffBtn.onclick = function() {
    gAnimateShoulder = false;
    gAnimateElbow = false;
    gAnimateWrist = false;
    gAnimateHead = false;
    gAnimateTail = false;
  };
  if (shoulderAnimOnBtn) shoulderAnimOnBtn.onclick = function() { gAnimateShoulder = true; };
  if (shoulderAnimOffBtn) shoulderAnimOffBtn.onclick = function() { gAnimateShoulder = false; };
  if (elbowAnimOnBtn) elbowAnimOnBtn.onclick = function() { gAnimateElbow = true; };
  if (elbowAnimOffBtn) elbowAnimOffBtn.onclick = function() { gAnimateElbow = false; };
}

function addMouseControls() {
  var dragging = false;

  canvas.addEventListener("mousedown", function(ev) {
    dragging = true;
    if (ev.shiftKey) gPokeUntil = g_seconds + 1.2;
  });
  canvas.addEventListener("mouseup", function() { dragging = false; });
  canvas.addEventListener("mouseleave", function() { dragging = false; });

  canvas.addEventListener("mousemove", function(ev) {
    if (!dragging) return;
    var rect = canvas.getBoundingClientRect();
    var x = (ev.clientX - rect.left) / rect.width;
    var y = (ev.clientY - rect.top) / rect.height;
    gAnimalGlobalRotationY = x * 360 - 180;
    gAnimalGlobalRotationX = y * 180 - 90;

    document.getElementById("globalY").value = String(Math.round(gAnimalGlobalRotationY));
    document.getElementById("globalX").value = String(Math.round(gAnimalGlobalRotationX));
    document.getElementById("globalYVal").textContent = String(Math.round(gAnimalGlobalRotationY));
    document.getElementById("globalXVal").textContent = String(Math.round(gAnimalGlobalRotationX));
  });
}

function main() {
  try {
    if (!setupWebGL()) {
      showStatus("Failed to setup WebGL context");
      return;
    }
    if (!connectVariablesToGLSL()) {
      showStatus("Shader compile/link failed");
      return;
    }
  } catch (err) {
    showStatus("Init error: " + err.message);
    console.error(err);
    return;
  }
  initBuffers();
  addActionsForHtmlUI();
  addMouseControls();
  updateSliderValues();
  try {
    renderScene();
    showStatus("Running");
  } catch (err) {
    showStatus("Render error: " + err.message);
    console.error(err);
    return;
  }
  requestAnimationFrame(tick);
}
