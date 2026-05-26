class square extends geometry {
  constructor() {
    super();
    this.vertices = new Float32Array([
      // Two triangles on the XY plane; each vertex: xyz, rgb, uv
      // First triangle
      -1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
      1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
      // Second triangle
      -1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
      1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
      1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
    ]);
  }
}
