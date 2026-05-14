class Camera {
  constructor(canvasWidth, canvasHeight, near, far) {
    this.fov = 60;
    this.eye = new Vector3([16, 1.7, 4]);
    this.at = new Vector3([16, 1.7, 8]);
    this.up = new Vector3([0, 1, 0]);

    this.yawDeg = 0;
    this.pitchDeg = 0;

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.aspectRatio = canvasWidth / canvasHeight;
    this.near = near;
    this.far = far;

    this.syncAnglesFromAt();
    this.updateView();
    this.updateProjection();
  }

  syncAnglesFromAt() {
    const f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    const len = f.magnitude();
    if (len < 1e-6) return;
    f.normalize();
    this.pitchDeg = Math.asin(Math.max(-1, Math.min(1, f.elements[1]))) * (180 / Math.PI);
    const horiz = Math.sqrt(f.elements[0] * f.elements[0] + f.elements[2] * f.elements[2]);
    if (horiz > 1e-6) {
      this.yawDeg = Math.atan2(f.elements[0], f.elements[2]) * (180 / Math.PI);
    }
  }

  rebuildAtFromAngles() {
    const yaw = (this.yawDeg * Math.PI) / 180;
    const pitch = (this.pitchDeg * Math.PI) / 180;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const fx = sy * cp;
    const fy = sp;
    const fz = cy * cp;
    this.at.elements[0] = this.eye.elements[0] + fx;
    this.at.elements[1] = this.eye.elements[1] + fy;
    this.at.elements[2] = this.eye.elements[2] + fz;
  }

  updateProjection() {
    this.projectionMatrix.setPerspective(this.fov, this.aspectRatio, this.near, this.far);
  }

  resize(canvasWidth, canvasHeight) {
    this.aspectRatio = canvasWidth / canvasHeight;
    this.updateProjection();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0],
      this.eye.elements[1],
      this.eye.elements[2],
      this.at.elements[0],
      this.at.elements[1],
      this.at.elements[2],
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );
  }

  forwardXZ() {
    const f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.elements[1] = 0;
    const m = f.magnitude();
    if (m < 1e-6) {
      f.elements[0] = 0;
      f.elements[1] = 0;
      f.elements[2] = 1;
      return f;
    }
    f.normalize();
    return f;
  }

  moveForward(speed) {
    const f = this.forwardXZ();
    f.mul(speed);
    this.eye.add(f);
    this.at.add(f);
  }

  moveBackwards(speed) {
    const f = this.forwardXZ();
    f.mul(speed);
    this.eye.sub(f);
    this.at.sub(f);
  }

  moveLeft(speed) {
    const f = this.forwardXZ();
    const s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
  }

  moveRight(speed) {
    const f = this.forwardXZ();
    const s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
  }

  panLeft(angleDeg) {
    const f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    const rot = new Matrix4();
    rot.setRotate(angleDeg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    const fp = rot.multiplyVector3(f);
    this.at.elements[0] = this.eye.elements[0] + fp.elements[0];
    this.at.elements[1] = this.eye.elements[1] + fp.elements[1];
    this.at.elements[2] = this.eye.elements[2] + fp.elements[2];
    this.syncAnglesFromAt();
  }

  panRight(angleDeg) {
    this.panLeft(-angleDeg);
  }

  applyMouseLook(dx, dy, yawSens, pitchSens) {
    this.yawDeg -= dx * yawSens;
    this.pitchDeg -= dy * pitchSens;
    if (this.pitchDeg > 89) this.pitchDeg = 89;
    if (this.pitchDeg < -89) this.pitchDeg = -89;
    this.rebuildAtFromAngles();
  }
}
