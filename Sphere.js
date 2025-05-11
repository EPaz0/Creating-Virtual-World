class Sphere {
    constructor() {
      this.type   = 'sphere';
      this.color  = [1, 1, 1, 1];     // default: white
      this.matrix = new Matrix4();
      this.radius = 0.5;              // local size before scaling
      this.latSeg = 12;               // ↑↓ slices   (more → smoother)
      this.lonSeg = 24;               // ◐  stacks   (ditto)
    }
  
    render () {
      const rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      const r   = this.radius;
      const nφ  = this.latSeg;                // latitude  (φ) slices
      const nθ  = this.lonSeg;                // longitude (θ) stacks
      const dφ  = Math.PI / nφ;               // pole → pole
      const dθ  = 2 * Math.PI / nθ;           // full rotation
  
      /* loop over latitude bands (φ) ────────────────────────────── */
      for (let i = 0; i < nφ; ++i) {
        const φ0 =  i      * dφ;              // south edge of band
        const φ1 = (i + 1) * dφ;              // north edge
  
        const y0 =  r * Math.cos(φ0);         // y on band’s south edge
        const y1 =  r * Math.cos(φ1);         // y on band’s north edge
        const rc0 = r * Math.sin(φ0);         // radius of current ring
        const rc1 = r * Math.sin(φ1);
  
        /* loop over longitude wedges (θ) ───────────────────────── */
        for (let j = 0; j < nθ; ++j) {
          const θ0 =  j      * dθ;
          const θ1 = (j + 1) * dθ;
  
          /* four corner points of the little quad */
          const p00 = [ rc0 * Math.cos(θ0), y0, rc0 * Math.sin(θ0) ]; // south west
          const p01 = [ rc0 * Math.cos(θ1), y0, rc0 * Math.sin(θ1) ]; // south east
          const p10 = [ rc1 * Math.cos(θ0), y1, rc1 * Math.sin(θ0) ]; // north west
          const p11 = [ rc1 * Math.cos(θ1), y1, rc1 * Math.sin(θ1) ]; // north east
  
          /* south‑pole & north‑pole triangles degenerate to one   */
          if (i === 0) {
            // bottom cap  (single triangle – fan into the pole)
            drawTriangle3D([ ...p00, ...p11, ...p01 ]);
          } else if (i === nφ - 1) {
            // top cap
            drawTriangle3D([ ...p00, ...p10, ...p11 ]);
          } else {
            // regular quad split into two triangles
            drawTriangle3D([ ...p00, ...p10, ...p11 ]);
            drawTriangle3D([ ...p00, ...p11, ...p01 ]);
          }
        }
      }
    }
  }