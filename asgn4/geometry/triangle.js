class triangle extends geometry {
  constructor() {
    super();
    this.vertices = new Float32Array([
      // Per vertex: position (x,y,z), color (r,g,b), texture (u,v)
      -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
      0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
      0.0, 0.5, 0.0, 0.0, 0.0, 1.0, 0.5, 1.0,
    ]);
  }
}
