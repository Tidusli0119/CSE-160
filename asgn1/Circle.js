class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10;
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var d = this.size / 200.0;
    var angleStep = 360 / this.segments;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_Size, this.size);

    for (var angle = 0; angle < 360; angle += angleStep) {
      var angle1 = angle * Math.PI / 180.0;
      var angle2 = (angle + angleStep) * Math.PI / 180.0;

      var pt1 = [xy[0] + Math.cos(angle1) * d, xy[1] + Math.sin(angle1) * d];
      var pt2 = [xy[0] + Math.cos(angle2) * d, xy[1] + Math.sin(angle2) * d];

      drawTriangle([xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]]);
    }
  }
}
