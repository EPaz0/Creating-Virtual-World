class Cube{
    constructor(){
        this.type = 'cube';
        //this.position = [.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default color is white
        //this.size = 5.0;
        //this.segments = 10;
        this.matrix = new Matrix4();
        this.textureNum = 0;
    }

    render(){
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;

        gl.uniform1i(u_whichTexture, this.textureNum);

        //pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        //       y
        //       ↑
        // |
        // |      D__________C
        // |     /|         /|
        // |    / |        / |
        // |   H__|_______G  |
        // |   |  |       |  |
        // |   |  A_______|__B   → x
        // |   | /        | /
        // |   |/         |/
        // |   E__________F

        //A(0,0,0) B(1,0,0) C(1,1,0) D(0,1,0)
        //E(0,0,1) F(1,0,1) G(1,1,1) H(0,1,1)

 
// FRONT  (+Z) ───────────────────────────────
drawTriangle3DUV(
    [0,0,0,   1,1,0,   1,0,0],   // (L,D,F) (R,U,F) (R,D,F)
    [0,0,      1,1,     1,0]     //  u=x , v=y
  );
  drawTriangle3DUV(
    [0,0,0,   0,1,0,   1,1,0],   // (L,D,F) (L,U,F) (R,U,F)
    [0,0,      0,1,     1,1]
  );
  
  // BACK  (‑Z) — flip **U** so left→right stays consistent
  drawTriangle3DUV(
    [1,0,1,   0,1,1,   0,0,1],   // (R,D,B) (L,U,B) (L,D,B)
    [0,0,      1,1,     1,0]     //  u=1‑x , v=y
  );
  drawTriangle3DUV(
    [1,0,1,   1,1,1,   0,1,1],   // (R,D,B) (R,U,B) (L,U,B)
    [0,0,      0,1,     1,1]
  );
  
  // RIGHT  (+X) — map Z across **U**
  drawTriangle3DUV(
    [1,0,0,   1,1,1,   1,0,1],   // (R,D,F) (R,U,B) (R,D,B)
    [0,0,      1,1,     1,0]     //  u=1‑z , v=y
  );
  drawTriangle3DUV(
    [1,0,0,   1,1,0,   1,1,1],   // (R,D,F) (R,U,F) (R,U,B)
    [0,0,      0,1,     1,1]
  );
  
  // LEFT  (‑X) — mirror of RIGHT
  drawTriangle3DUV(
    [0,0,1,   0,1,0,   0,0,0],   // (L,D,B) (L,U,F) (L,D,F)
    [0,0,      1,1,     1,0]     //  u=z , v=y
  );
  drawTriangle3DUV(
    [0,0,1,   0,1,1,   0,1,0],   // (L,D,B) (L,U,B) (L,U,F)
    [0,0,      0,1,     1,1]
  );
  
  // TOP  (+Y) — map X across **U** and Z (flipped) across **V**
  drawTriangle3DUV(
    [0,1,0,   1,1,0,   1,1,1],   // (L,U,F) (R,U,F) (R,U,B)
    [0,1,      1,1,     1,0]     //  u=x , v=1‑z
  );
  drawTriangle3DUV(
    [0,1,0,   1,1,1,   0,1,1],   // (L,U,F) (R,U,B) (L,U,B)
    [0,1,      1,0,     0,0]
  );
  
  // BOTTOM (‑Y) — map X across **U** and Z across **V**
  drawTriangle3DUV(
    [0,0,1,   1,0,0,   1,0,1],   // (L,D,B) (R,D,F) (R,D,B)
    [0,0,      1,1,     1,0]     //  u=x , v=z
  );
  drawTriangle3DUV(
    [0,0,1,   0,0,0,   1,0,0],   // (L,D,B) (L,D,F) (R,D,F)
    [0,0,      0,1,     1,1]
  );

}



}