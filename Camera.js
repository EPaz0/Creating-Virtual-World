class Camera{
    constructor(canvas, fov = 60){
        this.canvas = canvas;
        this.fov = fov;
        this.eye = new Vector3([0, 0, -3]);
        this.at  = new Vector3([0, 0, 100]);
        this.up  = new Vector3([0, 1, 0]);
        this.viewMatrix       = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.updateView();
        this.updateProjection();
    }

  /* helpers */
  updateView() {
    this.viewMatrix.setLookAt(
      ...this.eye.elements,
      ...this.at.elements,
      ...this.up.elements
    );
  }
  updateProjection() {
    this.projectionMatrix.setPerspective(
      this.fov,
      this.canvas.width / this.canvas.height,
      0.1,
      1000
    );
  }
    _forward() {
        const f = new Vector3();
        return f.set(this.at).subtract(this.eye).normalize();
    }

    /* movement */
    _forward() {
        // at – eye  (returns NEW Vector3)
        const f = this.at.difference(this.eye).normalize();
        return f;                 // already unit‑length
    }
  
    /*──────── movement ───────*/
    moveForward(speed = 0.1) {
        const v = this._forward().scale(speed);         // in‑place scale
        this.eye = this.eye.add(v);   // add() returns a NEW vector
        this.at  = this.at .add(v);
        this.updateView();
    }
  
    moveBackwards(speed = 0.1) { this.moveForward(-speed); }
    
    moveLeft(speed = 0.1) {
        const v = this.up.crossed(this._forward())      // left = up × f
                        .normalize()
                        .scale(speed);
        this.eye = this.eye.add(v);
        this.at  = this.at .add(v);
        this.updateView();
    }
  
    moveRight(speed = 0.1) {
        const v = this._forward().crossed(this.up)      // right = f × up
                        .normalize()
                        .scale(speed);
        this.eye = this.eye.add(v);
        this.at  = this.at .add(v);
        this.updateView();
    }

    /* panning */
    panLeft(alpha = 5)  { this._pan(alpha); }
    panRight(alpha = 5) { this._pan(-alpha); }
    _pan(alpha) {
        const f     = this._forward();                               // unit f
        const rot   = new Matrix4().setRotate(alpha,
                                            this.up.x(), this.up.y(), this.up.z());
        const fPrime = rot.multiplyVector3(f);                       // rotated f
    
        // **make a brand‑new “at” = eye + f′**
        this.at = this.eye.add(fPrime);
        this.updateView();
    }

    /*──────────────────── look around ────────────────────*/
        // Yaw = spin left / right around the world‑up axis
        yaw(deltaDeg) {
        const rot = new Matrix4().setRotate(-deltaDeg,
                                            this.up.x(), this.up.y(), this.up.z());
        const fPrime = rot.multiplyVector3(this._forward());
        this.at = this.eye.add(fPrime);          // eye + rotated forward
        this.updateView();
        }
    
    // Pitch = look up / down around the side axis
    pitch(deltaDeg) {
        // 1) side axis = right vector
        const side = this._forward().crossed(this.up).normalize();
    
        // 2) rotate forward around that axis
        const rot    = new Matrix4().setRotate(deltaDeg,
                                            side.x(), side.y(), side.z());
        let   fPrime = rot.multiplyVector3(this._forward());
    
        /* 3) clamp so we never flip over: keep dot(forward, up) in (-0.99, 0.99) */
        const dot = fPrime.normalized().dotted(this.up);
        if (dot > 0.99 || dot < -0.99) return;   // reached look‑straight‑up limit
    
        // 4) accept new orientation
        this.at = this.eye.add(fPrime);
        this.updateView();
    }

    uploadToShader(gl, uView, uProj) {
        gl.uniformMatrix4fv(uView, false, this.viewMatrix.elements);
        gl.uniformMatrix4fv(uProj, false, this.projectionMatrix.elements);
    }

}