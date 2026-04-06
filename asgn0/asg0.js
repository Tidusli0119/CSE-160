// CSE160 asg0

var ctx;

var CANVAS_W = 400;
var CENTER = CANVAS_W / 2;
var SCALE = 20;

function main() {
    var canvas = document.getElementById('example');
    if (!canvas) {
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_W);

    document.getElementById('drawButton').onclick = handleDrawEvent;
    document.getElementById('drawOperationButton').onclick = handleDrawOperationEvent;
}

function handleDrawEvent() {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_W);

    var x1 = parseFloat(document.getElementById('xCoord').value);
    var y1 = parseFloat(document.getElementById('yCoord').value);
    var v1 = new Vector3([x1, y1, 0]);

    var x2 = parseFloat(document.getElementById('xCoord2').value);
    var y2 = parseFloat(document.getElementById('yCoord2').value);
    var v2 = new Vector3([x2, y2, 0]);

    drawVector(v1, 'red');
    drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_W);

    var x1 = parseFloat(document.getElementById('xCoord').value);
    var y1 = parseFloat(document.getElementById('yCoord').value);
    var v1 = new Vector3([x1, y1, 0]);

    var x2 = parseFloat(document.getElementById('xCoord2').value);
    var y2 = parseFloat(document.getElementById('yCoord2').value);
    var v2 = new Vector3([x2, y2, 0]);

    drawVector(v1, 'red');
    drawVector(v2, 'blue');

    var op = document.getElementById('operationSelect').value;
    var s = parseFloat(document.getElementById('scalarInput').value);

    if (op === 'add') {
        var v3 = new Vector3(v1.elements);
        v3.add(v2);
        drawVector(v3, 'green');
    } else if (op === 'sub') {
        var v3 = new Vector3(v1.elements);
        v3.sub(v2);
        drawVector(v3, 'green');
    } else if (op === 'mul') {
        var v3 = new Vector3(v1.elements);
        var v4 = new Vector3(v2.elements);
        v3.mul(s);
        v4.mul(s);
        drawVector(v3, 'green');
        drawVector(v4, 'green');
    } else if (op === 'div') {
        var v3 = new Vector3(v1.elements);
        var v4 = new Vector3(v2.elements);
        v3.div(s);
        v4.div(s);
        drawVector(v3, 'green');
        drawVector(v4, 'green');
    } else if (op === 'magnitude') {
        console.log('magnitude of v1:', v1.magnitude());
        console.log('magnitude of v2:', v2.magnitude());
    } else if (op === 'normalize') {
        console.log('magnitude of v1:', v1.magnitude());
        console.log('magnitude of v2:', v2.magnitude());
        var nv1 = new Vector3(v1.elements);
        var nv2 = new Vector3(v2.elements);
        nv1.normalize();
        nv2.normalize();
        drawVector(nv1, 'green');
        drawVector(nv2, 'green');
    } else if (op === 'angleBetween') {
        var alpha = angleBetween(v1, v2);
        console.log('angle between v1 and v2 (radians):', alpha);
        console.log('angle between v1 and v2 (degrees):', (alpha * 180) / Math.PI);
    } else if (op === 'area') {
        var area = areaTriangle(v1, v2);
        console.log('triangle area (v1, v2 from origin):', area);
    }
}

// dot(v1,v2) = ||v1|| ||v2|| cos(alpha)  =>  alpha = acos(dot / (||v1|| ||v2||))
function angleBetween(v1, v2) {
    var dot = Vector3.dot(v1, v2);
    var len1 = v1.magnitude();
    var len2 = v2.magnitude();
    if (len1 === 0 || len2 === 0) {
        return NaN;
    }
    var cosAlpha = dot / (len1 * len2);
    if (cosAlpha > 1) {
        cosAlpha = 1;
    }
    if (cosAlpha < -1) {
        cosAlpha = -1;
    }
    return Math.acos(cosAlpha);
}

// Parallelogram area = ||v1 x v2||; triangle (origin, v1, v2) is half of that.
function areaTriangle(v1, v2) {
    var c = Vector3.cross(v1, v2);
    return 0.5 * c.magnitude();
}

function drawVector(v, color) {
    var ex = v.elements[0];
    var ey = v.elements[1];
    var endX = CENTER + ex * SCALE;
    var endY = CENTER - ey * SCALE;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}
