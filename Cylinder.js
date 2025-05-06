class Cylinder {
    constructor() {
      this.type   = 'cylinder';
      this.color  = [1, 1, 1, 1];
      this.matrix = new Matrix4();
      this.radius = 0.5;   // local size before scaling
      this.height = 1.0;
      this.segs   = 24;    // more → smoother
    }
  
    render() {
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const r = this.radius, h = this.height;
      const n = this.segs;
      const dθ = 2 * Math.PI / n;
  
      /* ---------- 1. top & bottom caps (two triangle-fans) ---------- */
      for (let cap = 0; cap < 2; ++cap) {
        const y = cap ? h : 0;                  // y = 0 (bottom) or h (top)
        for (let i = 0; i < n; ++i) {
          const θ0 = i * dθ,
                θ1 = (i + 1) * dθ;
  
          const x0 = r * Math.cos(θ0),
                z0 = r * Math.sin(θ0),
                x1 = r * Math.cos(θ1),
                z1 = r * Math.sin(θ1);
  
          // centre – rim – next-rim
          drawTriangle3D([
            0,     y, 0,
            x0,    y, z0,
            x1,    y, z1
          ]);
        }
      }
  
      /* ---------- 2. side wall (quad strip split into triangles) --- */
      for (let i = 0; i < n; ++i) {
        const θ0 = i * dθ,
              θ1 = (i + 1) * dθ;
  
        const x0 = r * Math.cos(θ0),
              z0 = r * Math.sin(θ0),
              x1 = r * Math.cos(θ1),
              z1 = r * Math.sin(θ1);
  
        // (x0,0,z0) bottom-left  →  (x1,0,z1) bottom-right
        // (x0,h,z0) top-left     →  (x1,h,z1) top-right
  
        // first triangle
        drawTriangle3D([
          x0, 0, z0,
          x1, 0, z1,
          x0, h, z0
        ]);
  
        // second triangle
        drawTriangle3D([
          x0, h, z0,
          x1, 0, z1,
          x1, h, z1
        ]);
      }
    }
  }
  