var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
void main() {
  gl_Position = a_Position;
  gl_PointSize = u_Size;
}
`;

var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}
`;

var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_Size;

var POINT = 0;
var TRIANGLE = 1;
var CIRCLE = 2;

var g_shapesList = [];
var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 10.0;
var g_selectedSegments = 10;
var g_selectedType = POINT;
var g_mirrorMode = false;
var g_partyMode = false;
var g_partyTick = 0;

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function() {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };

  document.getElementById('red').onclick = function() {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };

  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };
  document.getElementById('pictureButton').onclick = function() {
    drawReferencePicture();
    renderAllShapes();
  };

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triangleButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };
  document.getElementById('mirrorButton').onclick = function() {
    g_mirrorMode = !g_mirrorMode;
    this.textContent = g_mirrorMode ? 'Mirror: On' : 'Mirror: Off';
  };
  document.getElementById('partyButton').onclick = function() {
    g_partyMode = !g_partyMode;
    this.textContent = g_partyMode ? 'Party Brush: On' : 'Party Brush: Off';
  };

  document.getElementById('redSlide').addEventListener('mouseup', function() {
    g_selectedColor[0] = this.value / 100;
  });

  document.getElementById('greenSlide').addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value / 100;
  });

  document.getElementById('blueSlide').addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById('sizeSlide').addEventListener('mouseup', function() {
    g_selectedSize = Number(this.value);
  });

  document.getElementById('segmentSlide').addEventListener('mouseup', function() {
    g_selectedSegments = Number(this.value);
  });
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    gl = getWebGLContext(canvas);
  }
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  return true;
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return false;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return false;
  }
  return true;
}

function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;
  addActionsForHtmlUI();

  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  g_shapesList.push(createShapeAt(x, y));
  if (g_mirrorMode) {
    g_shapesList.push(createShapeAt(-x, y));
  }

  renderAllShapes();
}

function createShapeAt(x, y) {
  var shape;
  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
  }

  var color = g_partyMode ? getPartyColor() : g_selectedColor.slice();
  var size = g_partyMode ? g_selectedSize * (0.7 + 0.4 * Math.abs(Math.sin(g_partyTick))) : g_selectedSize;
  g_partyTick += 0.35;

  shape.position = [x, y, 0.0];
  shape.color = color;
  shape.size = size;
  if (g_selectedType === CIRCLE) {
    shape.segments = g_selectedSegments;
  }
  return shape;
}

function getPartyColor() {
  return [
    0.5 + 0.5 * Math.sin(g_partyTick),
    0.5 + 0.5 * Math.sin(g_partyTick + 2.094),
    0.5 + 0.5 * Math.sin(g_partyTick + 4.188),
    1.0
  ];
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  var startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML('numdot: ' + len + ' ms: ' + Math.floor(duration), 'numdot');
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}

function createPictureTriangle(vertices, color) {
  var t = new Triangle();
  t.vertices = vertices;
  t.color = color;
  t.size = 1.0;
  return t;
}

function drawReferencePicture() {
  var red = [0.75, 0.13, 0.11, 1.0];
  var red2 = [0.65, 0.08, 0.08, 1.0];
  var dark = [0.18, 0.18, 0.2, 1.0];
  var pale = [0.92, 0.91, 0.88, 1.0];
  var black = [0.06, 0.06, 0.06, 1.0];

  var xmin = -0.72;
  var xmax = 0.72;
  var ymin = -0.9;
  var ymax = 0.82;
  var cols = 24;
  var rows = 24;

  function gp(c, r) {
    return [
      xmin + (xmax - xmin) * (c / cols),
      ymax - (ymax - ymin) * (r / rows)
    ];
  }

  function add(c1, r1, c2, r2, c3, r3, color) {
    var p1 = gp(c1, r1);
    var p2 = gp(c2, r2);
    var p3 = gp(c3, r3);
    g_shapesList.push(createPictureTriangle([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]], color));
  }

  add(10, 12, 16, 12, 10, 21, red);
  add(16, 12, 16, 21, 10, 21, red2);
  add(8, 11, 10, 11, 8, 18, red2);
  add(10, 11, 10, 18, 8, 18, red);
  add(8, 7, 14, 7, 8, 12, red);
  add(14, 7, 14, 12, 8, 12, red2);
  add(8, 2, 14, 7, 7, 7, red2);
  add(8, 2, 10, 1, 9, 4, red);
  add(10, 2, 12, 1, 11, 4, red);
  add(12, 3, 14, 2, 13, 5, red);

  add(14, 5, 16, 3, 14, 7, red);
  add(14, 7, 17, 5, 15, 8, red2);
  add(14, 9, 17, 7, 15, 10, red);
  add(14, 11, 17, 9, 15, 12, red2);
  add(14, 13, 17, 11, 15, 14, red);

  add(6, 7, 8, 7, 7, 9, pale);
  add(7, 7, 9, 7, 8, 9, pale);
  add(8, 7, 10, 7, 9, 9, pale);
  add(6, 10, 8, 10, 7, 8, pale);
  add(7, 10, 9, 10, 8, 8, pale);
  add(8, 10, 10, 10, 9, 8, pale);

  add(9.2, 4.7, 10.4, 4.9, 9.5, 6.2, pale);
  add(10.0, 5.05, 9.35, 5.4, 10.0, 5.85, dark);
  add(7, 6, 8, 7, 8, 6, dark);

  add(16, 11, 18, 10, 16, 15, red2);
  add(18, 10, 19, 13, 16, 15, red);
  add(16, 15, 18, 16, 16, 21, red);
  add(18, 16, 19, 18, 16, 21, red2);

  add(18, 11, 21, 10, 19, 12, red2);
  add(21, 10, 23, 11, 21, 12, red);
  add(21, 12, 23, 13, 21, 15, red2);
  add(19, 13, 21, 15, 18, 16, red);

  add(8, 14, 9, 14, 8, 17, red);
  add(9, 14, 9, 17, 8, 17, red2);
  add(7, 16, 8, 15, 8, 17, red2);
  add(7, 17, 8, 17, 7, 18, red);
  add(8, 17, 9, 17, 8, 18, red2);
  add(6, 16, 7, 16, 6, 17, pale);
  add(6, 17, 7, 17, 6, 18, pale);
  add(6, 18, 7, 18, 6, 19, pale);

  add(10, 21, 12, 21, 10, 24, red2);
  add(12, 21, 12, 24, 10, 24, red);
  add(13, 21, 15, 21, 13, 24, red2);
  add(15, 21, 15, 24, 13, 24, red);
  add(8.2, 23.8, 12.2, 23.8, 8.2, 25.7, black);
  add(12.2, 23.8, 12.2, 25.7, 8.2, 25.7, dark);
  add(8.2, 25.7, 10.3, 25.7, 8.9, 26.8, pale);
  add(8.2, 25.7, 9.0, 25.7, 8.3, 26.4, pale);
  add(9.0, 25.7, 9.8, 25.7, 9.1, 26.4, pale);
  add(9.8, 25.7, 10.6, 25.7, 9.9, 26.4, pale);
  add(9.7, 23.2, 10.1, 24.0, 9.2, 23.9, pale);
  add(12.7, 23.2, 13.1, 24.0, 12.2, 23.9, pale);
}
