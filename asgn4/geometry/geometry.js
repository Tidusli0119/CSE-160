/**
 * Base geometry: holds interleaved vertex data and cuon-matrix transform helpers.
 * Subclasses assign this.vertices (position, color, UV per vertex).
 */
class geometry {
  constructor() {
    this.vertices = new Float32Array();

    this.modelMatrix = new Matrix4();

    this.translationMatrix = new Matrix4();

    this.rotationMatrix = new Matrix4();

    this.scaleMatrix = new Matrix4();
  }

  /** Apply translation to this.translationMatrix. */
  translate(x, y, z) {
    this.translationMatrix.setTranslate(x, y, z);
  }

  /** Apply rotation about the X axis (degrees). */
  rotateX(angle) {
    this.rotationMatrix.setRotate(angle, 1, 0, 0);
  }

  /** Apply rotation about the Y axis (degrees). */
  rotateY(angle) {
    this.rotationMatrix.setRotate(angle, 0, 1, 0);
  }

  /** Apply rotation about the Z axis (degrees). */
  rotateZ(angle) {
    this.rotationMatrix.setRotate(angle, 0, 0, 1);
  }

  /** Apply non-uniform scale. */
  scale(x, y, z) {
    this.scaleMatrix.setScale(x, y, z);
  }
}
