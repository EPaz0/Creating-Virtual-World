//import Stats from "/lib/Stats.js";

// FPS Monitor, check out https://github.com/mrdoob/stats.js/ for more info
var stats = new Stats();

// move panel to right side instead of left
// cuz our canvas will be covered
stats.dom.style.left = "auto";
stats.dom.style.right = "0";
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position; 
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4  u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main()  {

  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  v_UV = a_UV;
  }`
//  
//uniform mat4 u_ViewMatrix;
// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;

  void main() {
      if(u_whichTexture == -2){
        gl_FragColor = u_FragColor;               //Use Color 
      
      } else if(u_whichTexture == -1){
        gl_FragColor = vec4(v_UV, 1.0, 1.0);              //Use UV Debug Color 
      
      }else if(u_whichTexture == 0){
        gl_FragColor = texture2D(u_Sampler0, v_UV); //Use Texture 0
      
      }else if(u_whichTexture == 1){
        gl_FragColor = texture2D(u_Sampler1, v_UV); //Use Texture 1
      }else if(u_whichTexture == 2){
        gl_FragColor = texture2D(u_Sampler2, v_UV); //Use Texture 2
      }else if(u_whichTexture == 3){
        gl_FragColor = texture2D(u_Sampler3, v_UV); //Use Texture 3
      }  else{

      
        gl_FragColor = vec4(1,.2,.2,1);             // Error put redish
      }
  
  }`

  //Global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix; 
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;
let u_GlobalRotateMatrix; // Global rotation matrix
let u_ViewMatrix; // View matrix
let u_ProjectionMatrix; // Projection matrix

let camera;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST); // Enable depth test
  gl.clearDepth(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear everything

}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }


  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }


  //Get the storage locaiton of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0){
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1){
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2){  
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3){
    console.log('Failed to get the storage location of u_Sampler3');
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if(!u_whichTexture){
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }
    
  //set an intital value for this matrix to identity
  var identityM = new Matrix4(); // Create a matrix object
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements); // Pass the matrix to u_ModelMatrix attribute
}

function initTextures(){
  var image = new Image(); // Create the image object

  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  image.onload = function(){ sendImageToTEXTURE0(image);};

  image.src = 'sky.jpg';

  // ADD MORE TEXTURES LATER


  var imageSnow = new Image(); // Create the image object
  if (!imageSnow) {
    console.log('Failed to create the image object');
    return false;
  }
  imageSnow.onload = function(){ sendImageToTEXTURE1(imageSnow);};
  imageSnow.src = 'snow2.jpg';


  var imageJP = new Image(); // Create the image object
  if (!imageJP) {
    console.log('Failed to create the image object');
    return false;
  }
  imageJP.onload = function(){ sendImageToTEXTURE2(imageJP);};
  imageJP.src = 'johnpork.jpg';


  var snow2 = new Image(); // Create the image object
  if (!snow2) {
    console.log('Failed to create the image object');
    return false;
  }

  snow2.onload = function(){ sendImageToTEXTURE3(snow2);};
  snow2.src = 'snow1.jpg';

}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y-axis
  gl.activeTexture(gl.TEXTURE0); 
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the texture object to target

  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Set texture filtering
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Set texture image

  gl.uniform1i(u_Sampler0, 0); // Pass the texture


  console.log('texture loaded');

}
function sendImageToTEXTURE1(image) {
  const tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);          // use unit 1
  gl.bindTexture (gl.TEXTURE_2D, tex);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D  (gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler1, 1);            // tell the shader “sampler1 = unit 1”
  console.log('grass texture loaded');
}

function sendImageToTEXTURE2(image) {
  const tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);          // use unit 1
  gl.bindTexture (gl.TEXTURE_2D, tex);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D  (gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler2, 2);            // tell the shader “sampler1 = unit 1”
  console.log('jp loaded');
}
function sendImageToTEXTURE3(image) {
  const tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);          // use unit 1
  gl.bindTexture (gl.TEXTURE_2D, tex);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D  (gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler3, 3);            // tell the shader “sampler1 = unit 1”
  console.log('snow2 loaded');
}

//Constant
const POINT = 0; // Point type
const TRIANGLE = 1; // Triangle type
const CIRCLE = 2; // Circle type

//For camera movement
let g_camYaw   = 0;   // left–right   (Y-axis)
let g_camPitch = 0;   // up–down      (X-axis)
let g_isDragging = false;
let g_lastX, g_lastY;
let g_zoom = 1.0;  // scale factor

//Global variables related to UI Elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // Default color is white
let g_selectedSize = 5; // Default size is 10.0
let g_selectedType = POINT; // Default type is point
let g_globalAngle = 0; // Default angle is 0
let g_globalArmAngle = 0; // Default arm angle is 0
let g_lowerArmAngle = 0; // Default arm angle is 0
let g_armAnimation = true;
let g_lowerArmAnimation = true;
let g_globalHeadAngle = 0; // Default head angle is 0
let g_headAnimation = true; // Default head angle is 0
let g_legAnimation = true;
let g_legStride = 0;

//Poke Animation
const POKE_DURATION   = 5;          // seconds
const RAISE_UPPER_ARM = 120;        // degrees
const RAISE_LOWER_ARM = -120;       // degrees
const BEAK_CLOSED_Y   = 0.04;
const BEAK_OPEN_Y     = 0.01;

let g_pokeAnimation = false;
let g_pokeStart     = 0;
let g_beakLowerY    = BEAK_CLOSED_Y; // current Y for lower beak
     

function addActionForHtmlElement() {

  //Buttons Events
  document.getElementById('armAnimationStart').onclick = function(){g_armAnimation = true;}; // Set the selected type to point
  document.getElementById('armAnimationEnd').onclick = function(){g_armAnimation = false;}; // Set the selected
  
  document.getElementById('lowerArmAnimationStart').onclick = function(){g_lowerArmAnimation = true;}; // Set the selected type to point
  document.getElementById('lowerArmAnimationEnd').onclick = function(){g_lowerArmAnimation = false;};

  document.getElementById('headAnimationStart').onclick = function(){g_headAnimation = true;}; // Set the selected type to point
  document.getElementById('headAnimationEnd').onclick = function(){g_headAnimation = false;}; // Set the selected type to point

  document.getElementById('legAnimationStart').onclick = function(){g_legAnimation = true;}; // Set the selected type to point
  document.getElementById('legAnimationEnd').onclick = function(){g_legAnimation = false;}; // Set the selected type to point
  //Camera Angle Slider
  document.getElementById('angleSlide').addEventListener('mousemove', function() {
    g_globalAngle = this.value; // Get the value of the slider
    //console.log(g_globalAngle);
    renderAllShapes(); // Redraw the shapes with the new angle
  });

  //Arm Rotation Slider
  document.getElementById('leftArmAngle').addEventListener('mousemove', function() {
    g_globalArmAngle = this.value; // Get the value of the slider
    
    renderAllShapes(); // Redraw the shapes with the new angle
  });

  //lower arm angle slider
  document.getElementById('lowerArmAngle').addEventListener('mousemove', function() {
    g_lowerArmAngle = this.value; // Get the value of the slider
    
    renderAllShapes(); // Redraw the shapes with the new angle
  });
  document.getElementById('headAngle').addEventListener('mousemove', function() {
    g_globalHeadAngle = this.value; // Get the value of the slider
    
    renderAllShapes(); // Redraw the shapes with the new angle
  });
  document.getElementById('legAngle').addEventListener('mousemove', function() {
    g_legStride = this.value; // Get the value of the slider
    
    renderAllShapes(); // Redraw the shapes with the new angle
  });


  window.addEventListener('keydown', (e) => {
    const speed = 0.2;
    switch (e.key.toLowerCase()) {
      case 'w': camera.moveForward(speed);    break;
      case 's': camera.moveBackwards(speed);  break;
      case 'a': camera.moveLeft(speed);       break;
      case 'd': camera.moveRight(speed);      break;
      case 'q': camera.panLeft(3);            break; // optional
      case 'e': camera.panRight(3);           break;
    }
    renderAllShapes();        // repaint with new view
  });

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();          // hides the cursor
    }
  });
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;   // not locked
    const dx = e.movementX;   // pixels since last event
    const dy = e.movementY;
    const SENS = 0.25;
    camera.yaw(  dx * SENS);
    camera.pitch(-dy * SENS);
    renderAllShapes();
  });
}


function main() {
  //Set up canvas and gl variables
  setupWebGL();

  //set up GLSL shader programs and conenct GLSL variables 
  connectVariablesToGLSL()
 
  //Set up actions for HTML elements
  addActionForHtmlElement();

  camera = new Camera(canvas);  

  //document.onkeydown = keydown;

  initTextures(); // Initialize texture and set up the texture


  // Specify the color for clearing <canvas>
  gl.clearColor(0.75, 0.75, 0.75, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  setupMouseCamera(); 
  canvas.addEventListener("mousedown", (ev) => {
    if (ev.shiftKey) {
      g_pokeAnimation = true;         // start (do NOT toggle)
      g_pokeStart     = g_seconds;    // reset the timer
    } else {
      click(ev);                      // your normal click handler
    }
  });
  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime; // seconds since the start of the program

function tick(){
  stats.begin();
  g_seconds = performance.now()/1000.0-g_startTime; // seconds since the start of the program
 // console.log(performance.now());

  updateAnimationAngles();
  renderAllShapes(); // Draw the shapes
  stats.end();
  requestAnimationFrame(tick); // Request that the browser calls tick

}


var g_shapesList = []; // The array for the position of a mouse press
// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = []; // Default size is 10.0


function setupMouseCamera() {
  const SENS = 0.25;          // deg per pixel – tweak to taste
  canvas.onmousedown = (ev) => {
  g_isDragging = true;
  g_lastX = ev.clientX;
  g_lastY = ev.clientY;
};

canvas.onmousemove = (ev) => {
  if (!g_isDragging) return;
  const dx = ev.clientX - g_lastX;
  const dy = ev.clientY - g_lastY;
  g_lastX = ev.clientX;
  g_lastY = ev.clientY;

  camera.yaw(  -dx * SENS);   // left / right
  camera.pitch(-dy * SENS);  // up / down  (invert Y)

  renderAllShapes();
};

canvas.onmouseup    =
canvas.onmouseleave = () => (g_isDragging = false);
}

//Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
}

//Update the angles of everything if currently animated
function updateAnimationAngles(){
  if(g_armAnimation){
    g_globalArmAngle = 80 * Math.abs(Math.sin(g_seconds));
  }

  if(g_lowerArmAnimation){
    g_lowerArmAngle = 90 * Math.abs(Math.sin(g_seconds));
  }
  if(g_headAnimation){
    g_globalHeadAngle = 60 * Math.sin(g_seconds);
  }

  if (g_legAnimation) {
    const D = 0.08;           // stride distance (tweak)
    const w = 2 * Math.PI;    // one full step per second
    g_legStride = D * Math.sin(w * g_seconds);
  }

  if (g_pokeAnimation) {
    const t = g_seconds - g_pokeStart;       // elapsed time (s)

    /* whatever motion you like – example: head nod */
    g_globalHeadAngle = 30 * Math.sin(6 * Math.PI * t);

    // phases: 0–0.5 lift & open  |  0.5–4.5 hold  |  4.5–5.0 close
    let k;        // interpolation 0 → 1

    if (t < 0.5) {               // ease in
      k = t / 0.5;               // 0 → 1
    } else if (t < 4.5) {        // hold
      k = 1;
    } else if (t < 5) {          // ease out
      k = 1 - (t - 4.5) / 0.5;   // 1 → 0
    } else {                     // done
      g_pokeAnimation = false;
      k = 0;
    }

    /* blend between rest and target pose */
    g_globalArmAngle = RAISE_UPPER_ARM * k;
    g_lowerArmAngle  = RAISE_LOWER_ARM * k;
    g_beakLowerY     = BEAK_CLOSED_Y  + (BEAK_OPEN_Y - BEAK_CLOSED_Y) * k;
  }
}

var g_eye =[0,0,3]; // The camera position (eye point)
var g_at  =[0,0,-100]; // The camera looks at the origin (0,0,0)
var g_up  =[0,1,0]; // The up vector points to positive Y direction


var g_map = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1]
]

function drawMap(){
  for(X =0; X<8; X++){
    for(y = 0; y<8;y++){

      if(g_map[X][y] == 1){
        var cube = new Cube();
        cube.color = [0.0, 0.0, 0.0, 1.0]; // Red color
        cube.textureNum = -1; // Set the texture number to 0
        cube.matrix.rotate(90, 0, 1, 0);
        cube.matrix.translate(X-10, -.60, y-4); // Translate the cube to the right
       // cube.matrix.scale(1, 1, 1); // Rotate the cube by 45 degrees around the z-axis
        cube.render();
      }
    }
  }
}

const EXTRA_DROP = -0.5;   // ↓ ½ cube
const PUSH_Z     = -3;     // move 3 cubes toward –Z (tweak to taste)

// ---------------------------------------------------------------------------
// Call drawIgloo() from inside renderAllShapes().
// ---------------------------------------------------------------------------
function drawIgloo() {
  /*---------------- user‑tweakable parameters ----------------*/
  const baseR      = 5;          // ground‑ring radius (cubes)
  const layers     = 4;          // vertical courses
  const stepDeg    = 18;         // angular spacing between blocks
  const doorWidth  = 2;          // doorway blocks (ground course)
  const doorHeight = 3;          // doorway blocks (vertical)
  const centreX = 0, centreZ = 0;/* igloo origin */

  /*---- global transform --------------------------------------------------*/
  const ROT90 = (x, z) => ({ x: -z, z:  x }); // rotate +90° about Y

  const EXTRA_DROP = -1;   // ↓ another ½‑cube
  const PUSH_Z     = 5;     // slide toward –Z   (tweak to taste)

  const Y_SHIFT = -0.10 + EXTRA_DROP;          // overall vertical offset
  /*------------------------------------------------------------------------*/

  /* side walls – ring by ring */
  for (let y = 0; y < layers; ++y) {
    const r        = baseR - y;                       // taper inward
    const yPos     = -0.60 + y + Y_SHIFT;             // vertical position
    const doorSpan = doorWidth * 180 / (Math.PI * r); // width → degrees

    for (let a = 0; a < 360; a += stepDeg) {
      const centred = ((a + stepDeg / 2) % 360) - 180;      // [-180,180]
      const inDoor  = (Math.abs(centred) < doorSpan / 2) && (y < doorHeight);
      if (inDoor) continue;                                 // leave doorway

      const rad     = a * Math.PI / 180;
      const rawX    = Math.round(r * Math.cos(rad));
      const rawZ    = Math.round(r * Math.sin(rad));
      const { x, z} = ROT90(rawX, rawZ);                    // rotate ring

      const cube = new Cube();
      cube.textureNum = 3;   // snow texture
      cube.color      = [1, 1, 1, 1];
      cube.matrix.setTranslate(centreX + x,
                               yPos,
                               centreZ + z + PUSH_Z);       // apply PUSH_Z
      cube.render();
    }
  }

  /* roof‑cap – 3 × 3 patch on top */
  const capY = -0.60 + layers + Y_SHIFT;
  for (let dx = -1; dx <= 1; ++dx) {
    for (let dz = -1; dz <= 1; ++dz) {
      const { x, z } = ROT90(dx, dz);                       // rotate cap

      const cube = new Cube();
      cube.textureNum = 3;
      cube.color      = [1, 1, 1, 1];
      cube.matrix.setTranslate(centreX + x,
                               capY,
                               centreZ + z + PUSH_Z);       // apply PUSH_Z
      cube.render();
    }
  }
}
//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){

  var startTime = performance.now(); // Start time

  const gRot = new Matrix4().rotate(g_globalAngle, 0, 1, 0);   // or just new Matrix4()
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, gRot.elements);

  camera.uploadToShader(gl, u_ViewMatrix, u_ProjectionMatrix);


  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //drawMap(); // Draw the map


  //eggs
  const egg1 = new Sphere();
  egg1.color = [0.741, 0.678, 0.6, 1.0];   // pale‑blue ice ball
  egg1.radius = 0.8;
  egg1.latSeg = 20;                     // finer mesh if you like
  egg1.lonSeg = 40;
  egg1.matrix.setTranslate(1, -.4, 5);
  egg1.matrix.scale(0.2, 0.2, 0.2);     // scale to egg shape
  egg1.render();

  const egg2 = new Sphere();
  egg2.color = [0.741, 0.678, 0.6, 1.0];   // pale‑blue ice ball
  egg2.radius = 0.8;
  egg2.latSeg = 20;                     // finer mesh if you like
  egg2.lonSeg = 40;
  egg2.matrix.setTranslate(0.6, -.4, 5);
  egg2.matrix.scale(0.2, 0.2, 0.2);     // scale to egg shape
  egg2.render();


  drawIgloo();
  //jp Cube
  var jp = new Cube();
  jp.color = [0.0, .5, 0.0, 1.0]; // Red color
  jp.textureNum = 2; // Set the texture number to 0
  jp.matrix.setTranslate(.1, -0.6, 6); // Translate the cube to the right
  jp.matrix.scale(1, 1, 1); // Rotate the cube by 45 degrees around the z-axis
  
  jp.render();

  //Draw the floor
  var floor = new Cube();
  floor.color = [0.0, .5, 0.0, 1.0]; // Red color
  floor.textureNum = 1; // Set the texture number to 0
  floor.matrix.setTranslate(0, -0.60, 0); // Translate the cube to the right
  floor.matrix.scale(32, 0, 32); // Rotate the cube by 45 degrees around the z-axis
  floor.matrix.translate(-.5, 0, -.5); // Rotate the cube by 45 degrees around the z-axis
  floor.render();

  //Draw the sky
  var sky = new Cube();
  sky.color = [0.0, 0.0, 1.0, .8]; // blue color
  sky.textureNum = -2; // Set the texture number to 0
  sky.matrix.scale(50,50,50);
  sky.matrix.translate(-.5, -.5, -0.5); // Translate the cube to the right
  sky.render();














//   //Head
//   var head = new Cube();
//   head.color = [0.0, 0.0, 0.0, 1.0]; // Red color
//   head.textureNum = -2; // Set the texture number to 0
//   head.matrix.setTranslate(-0.19, .5, .05);
//   head.matrix.translate(0.2, 0, 0.2);           // ½ width, ½ depth (move origin to centre)
//   head.matrix.rotate(g_globalHeadAngle, 0, 1, 0); // yaw at neck centre
//   var headFrame = new Matrix4(head.matrix);
//   head.matrix.translate(-0.2, 0, -0.2);         // move origin back to corner
  
//   head.matrix.scale(0.4, 0.35, 0.4);
//   head.render();

//   //beak upper part
//   var beakUpper = new Cube();
//   beakUpper.color = [1.0, 0.5, 0.0, 1.0]; // Orange color
//   beakUpper.textureNum = -2; 
//   beakUpper.matrix = new Matrix4(headFrame);
//   beakUpper.matrix.translate(-0.07, .08, -.3);
//   beakUpper.matrix.scale(0.14, 0.045,0.2);
//   beakUpper.render();


//   //TONUGE
//   var beakUpper = new Cube();
//   beakUpper.color = [1.0, 0, 0.0, 1.0]; // Orange color
//   beakUpper.textureNum = -2;
//   beakUpper.matrix = new Matrix4(headFrame);
//   beakUpper.matrix.translate(-0.06, .06, -.25);
//   beakUpper.matrix.scale(0.11, 0.045,0.2);
//   beakUpper.render();

//   //beak lower part
//   var beakLower = new Cube();
//   beakLower.color = [1.0, 0.5, 0.0, .97]; // Orange color
//   beakLower.textureNum = -2; // Set the texture number to 0
//   beakLower.matrix = new Matrix4(headFrame);
//   beakLower.matrix.translate(-0.07, g_beakLowerY, -.3);
//   beakLower.matrix.scale(0.14, 0.045, 0.2);
//   beakLower.render();

//   //left eye
//   var leftEye = new Cube();
//   leftEye.color = [1.0, 1.0, 1.0, 1.0]; // white color
//   leftEye.textureNum = -2; // Set the texture number to 0
//   leftEye.matrix = new Matrix4(headFrame);
//   leftEye.matrix.translate(-0.13, .2, -.22);
//   var leftEyeFrame = new Matrix4(leftEye.matrix);
//   leftEye.matrix.scale(0.1, 0.1, 0.1);
//   leftEye.render();

//   //pupil left eye
//   var leftEyePupil = new Cube();
//   leftEyePupil.color = [0.0, 0.0, 0.0, 1.0]; // black color
//   leftEyePupil.textureNum = -2; // Set the texture number to 0
//   leftEyePupil.matrix = leftEyeFrame;
//   leftEyePupil.matrix.translate(.02, .02, -.0011);
//   leftEyePupil.matrix.scale(0.05, 0.06, 0.1);
//   leftEyePupil.render();

//   //right eye
//   var rightEye = new Cube();
//   rightEye.color = [1.0, 1.0, 1.0, 1.0]; // white color
//   rightEye.textureNum = -2; // Set the texture number to 0
//   rightEye.matrix = new Matrix4(headFrame);
//   rightEye.matrix.translate(.04, .2, -.22);
//   var rightEyeFrame = new Matrix4(rightEye.matrix);
//   rightEye.matrix.scale(0.1, 0.1, 0.1);
//   rightEye.render();

//   //pupil right eye
//   var rightPupil = new Cube();
//   rightPupil.color = [0.0, 0.0, 0.0, 1.0]; // black color
//   rightPupil.textureNum = -2; // Set the texture number to 0
//   rightPupil.matrix = rightEyeFrame;
//   rightPupil.matrix.translate(.02, .02, -.0011);
//   rightPupil.matrix.scale(0.05, 0.06, 0.1);
//   rightPupil.render();


//   //draw  cube
//   var body = new Cube();
//   body.color = [0.0, 0.0, 0.0, 1.0]; 
//   body.textureNum = -2; // Set the texture number to 0
//   body.matrix.setTranslate(-0.25, -0.5, 0.0); // Translate the cube to the right
//   body.matrix.scale(0.5, 1, .5); // Rotate the cube by 45 degrees around the z-axis
//   body.render();

// //white part of the body
//   var whiteBelly = new Cube();
//   whiteBelly.color = [1.0, 1.0, 1.0, 1.0]; // white color
//   whiteBelly.textureNum = -2; // Set the texture number to 0
//   whiteBelly.matrix.setTranslate(-0.16, -0.44, -.01); // Translate the cube to the right
//   //front.matrix.scale(0.5, 1, .5); // Rotate the cube by 45 degrees around the z-axis
//   whiteBelly.matrix.scale(0.33, 0.9, 0.5);
//   whiteBelly.render();

//   //yellow part of the body
//   var yellowPart = new Cube();
//   yellowPart.color = [1.0, 1.0, 0.8, 1.0]; // yellow color
//   yellowPart.textureNum = -2; // Set the texture number to 0
//   yellowPart.matrix.setTranslate(-0.16, .301, -.011); // Translate the cube to the right
//   yellowPart.matrix.scale(0.33, 0.2, 0.5);
//   yellowPart.render();

//   // constants so it’s easy to tweak
//   const ARM_LEN   = 0.30;   // final height
//   const ARM_THICK = 0.09;   // final width
//   const t = g_seconds;           // or however you update time
//   const armAngle = -80 * Math.abs(Math.sin(t));
//   // ------------- LEFT WING, pivot at the shoulder -------------
//   var leftArm = new Cube();
//   leftArm.color = [0, 0, 0, 1];
//   leftArm.textureNum = -2; 
//   leftArm.matrix.setTranslate(.25, .45, .5);
//   leftArm.matrix.rotate(180, 180, 0, 1);          // flip so it points left

//   leftArm.matrix.rotate(-g_globalArmAngle, 0, 0, 1);
//   // if(g_armAnimation){
//   //   leftArm.matrix.rotate(armAngle,0,0,1);
//   // }else{
//   //   leftArm.matrix.rotate(-g_globalArmAngle, 0, 0, 1);
//   // }

//   // *** copy the matrix NOW (before we scale!) ***
//   var elbowFrame = new Matrix4(leftArm.matrix);

//   leftArm.matrix.scale(ARM_THICK, ARM_LEN, 0.5);
//   leftArm.render();

//   //white under arm
//   var wleftArm = new Cube();
//   wleftArm.color = [1, 1, 1, 1];
//   wleftArm.textureNum = -2;
//   wleftArm.matrix.setTranslate(.24, .45, .4);
//   wleftArm.matrix.rotate(180, 180, 0, 1);          // flip so it points left

//   wleftArm.matrix.rotate(-g_globalArmAngle, 0, 0, 1);

//   // *** copy the matrix NOW (before we scale!) ***
//   wleftArm.matrix.scale(.09, ARM_LEN, 0.25);
//   wleftArm.render();

//   // ── LOWER ARM ──────────────────────────────────────────────
//   var lowLeftArm = new Cube();
//   lowLeftArm.color = [0, 0, 0, 1];               // use black later
//   lowLeftArm.textureNum = -2;               // use black later
//   lowLeftArm.matrix = new Matrix4(elbowFrame);   // start at the shoulder

//   //put the cube’s **top-centre** at the elbow
//   lowLeftArm.matrix.translate( ARM_THICK * 0.5, ARM_LEN, 0 );

//   // rotate around that top-centre
//   lowLeftArm.matrix.rotate( g_lowerArmAngle, 0, 0, 1 );

//   // move the origin back to the corner
//   lowLeftArm.matrix.translate( -ARM_THICK * 0.5, 0, 0 );

//   //stretch the cube into a fore-arm
//   lowLeftArm.matrix.scale( ARM_THICK, ARM_LEN, 0.5 );

//   lowLeftArm.render();  
   
//   var wlowLeftArm = new Cube();
//   wlowLeftArm.color = [1, 1, 1, 1];               // use black later
//   wlowLeftArm.textureNum = -2;               // use black later
//   wlowLeftArm.matrix = new Matrix4(elbowFrame);   // start at the shoulder

//   //put the cube’s **top-centre** at the elbow
//   wlowLeftArm.matrix.translate( ARM_THICK * 0.5, ARM_LEN, 0 );

//   // rotate around that top-centre
//   wlowLeftArm.matrix.rotate( g_lowerArmAngle, 0, 0, 1 );

//   // move the origin back to the corner
//   wlowLeftArm.matrix.translate( -ARM_THICK * 0.5, 0, 0 );

//   //stretch the cube into a fore-arm
//   wlowLeftArm.matrix.scale( ARM_THICK, ARM_LEN, 0.15 );
//   wlowLeftArm.matrix.translate(-.1, -.02, 1.0);

//   wlowLeftArm.render();   


//   //right arm
//   var rightArm = new Cube();
//   rightArm.color = [0.0, 0.0, 0.0, 1.0]; // Same black color
//   rightArm.textureNum = -2; 
//   rightArm.matrix.setTranslate( -0.25, .45, 0);
//   rightArm.matrix.rotate(180, 0, 0, 1);


//   rightArm.matrix.rotate(-g_globalArmAngle, 0, 0, 1);
  
  
//   var rightElbowFrame = new Matrix4(rightArm.matrix);
//   rightArm.matrix.scale(ARM_THICK,  ARM_LEN, 0.5); // Same scale
//   rightArm.render();


//   //white upper arm
//   var wRightArm = new Cube();
//   wRightArm.color = [1.0, 1.0, 1.0, 1.0]; // Same black color
//   wRightArm.textureNum = -2;
//   wRightArm.matrix.setTranslate( -.24, .45, .15);
//   wRightArm.matrix.rotate(180, 0, 0, 1);


//   wRightArm.matrix.rotate(-g_globalArmAngle, 0, 0, 1);
  
//   wRightArm.matrix.scale(.09, ARM_LEN, 0.25); // Same scale
//   wRightArm.render();

//   //lower right arm
//   var lowRightArm = new Cube();
//   lowRightArm.color = [0.0, 0.0, 0.0, 1.0]; // Same black color
//   lowRightArm.textureNum = -2; 
//   lowRightArm.matrix = new Matrix4(rightElbowFrame); // start at the shoulder

//   //put the cube’s **top-centre** at the elbow
//   lowRightArm.matrix.translate( ARM_THICK * 0.5, ARM_LEN, 0 );

//   // rotate around that top-centre
//   lowRightArm.matrix.rotate(g_lowerArmAngle, 0, 0, 1 );

//   // move the origin back to the corner
//   lowRightArm.matrix.translate( -ARM_THICK * 0.5, 0, 0 );

//   //stretch the cube into a fore-arm
//   lowRightArm.matrix.scale( ARM_THICK, ARM_LEN, 0.5 );
//   lowRightArm.render();

// //white lower right arm
//   //lower right arm
//   var wLowRightArm = new Cube();
//   wLowRightArm.color = [1.0, 1.0, 1.0, 1.0]; // Same black color
//   wLowRightArm.textureNum = -2;
//   wLowRightArm.matrix = new Matrix4(rightElbowFrame); // start at the shoulder

//   //put the cube’s **top-centre** at the elbow
//   wLowRightArm.matrix.translate( ARM_THICK * 0.5, ARM_LEN, 0 );

//   // rotate around that top-centre
//   wLowRightArm.matrix.rotate(g_lowerArmAngle, 0, 0, 1 );

//   // move the origin back to the corner
//   wLowRightArm.matrix.translate( -ARM_THICK * 0.5, 0, 0 );

//   //stretch the cube into a fore-arm
//   wLowRightArm.matrix.scale( ARM_THICK, ARM_LEN, 0.15 );
//   wLowRightArm.matrix.translate(-.1, -.03, 1.2);
//   wLowRightArm.render();



//   //right foot
//   var rightFoot = new Cube();
//   rightFoot.color = [1.0, 0.5, 0.0, 1.0]; // Orange color
//   rightFoot.textureNum = -2; 
//   rightFoot.matrix.setTranslate(.03, -.57, -.08);
//   rightFoot.matrix.rotate(5, 0, 1, 0 );
//   rightFoot.matrix.translate(0, 0,  g_legStride);
//   rightFoot.matrix.scale(0.14, 0.07, 0.5);
//   rightFoot.render();


//   //left foot
//     var leftFoot = new Cube();
//     leftFoot.color = [1.0, 0.5, 0.0, 1.0]; // Orange color
//     leftFoot.textureNum = -2;
//     leftFoot.matrix.setTranslate(-.18, -.57, -.08);
//     leftFoot.matrix.rotate(-5, 0, 1, 0 );
//     leftFoot.matrix.translate(0, 0, -g_legStride); 
//     leftFoot.matrix.scale(0.14, 0.07, 0.5);
//     leftFoot.render();


//     //Left Shoulder
//     const leftShoulder = new Cylinder();
//     leftShoulder.color  = [0, 0, 0, 1];
//     leftShoulder.textureNum = -2; 
//     leftShoulder.matrix.setTranslate(-0.28, .478, -0.01);
//     leftShoulder.matrix.rotate(90, 1, 0, 0 );
//     leftShoulder.matrix.scale(0.13, .5, 0.13);   // stretch height & radius
//     leftShoulder.render();

//     //right Shoulder
//     const rightShoulder = new Cylinder();
//     rightShoulder.color  = [0, 0, 0, 1];
//     rightShoulder.textureNum = -2;
//     rightShoulder.matrix.setTranslate(0.28, .478, -0.01);
//     rightShoulder.matrix.rotate(90, 1, 0, 0 );
//     rightShoulder.matrix.scale(0.13, .5, 0.13);   // stretch height & radius
//     rightShoulder.render();

//     //left elbow  cylinder
//     const leftElbow = new Cylinder();
//     leftElbow.color  = [0, 0, 0, 1];
//     leftElbow.textureNum = -2;
//     leftElbow.matrix = new Matrix4(elbowFrame); // start at the shoulder
//     // 2. move origin to the elbow (top-centre of upper arm)
//     leftElbow.matrix.translate(ARM_THICK * 0.5, ARM_LEN, 0);

//     // 3. follow the fore-arm rotation so the disc stays between the two parts
//     leftElbow.matrix.rotate(g_lowerArmAngle, 0, 0, 1);

//     // 4. turn cylinder sideways → disc
//     leftElbow.matrix.rotate(90, 1, 0, 0);

//     // 5. make it small and thin  (radius ≈ ARM_THICK, height very small)
//     leftElbow.matrix.scale(.1, .51, .1);
//         leftElbow.render();

//     //right elbow  cylinder
//     const rightElbow = new Cylinder();
//     rightElbow.color  = [0, 0, 0, 1];
//     rightElbow.textureNum = -2;
//     rightElbow.matrix = new Matrix4(rightElbowFrame); // start at the shoulder
//     rightElbow.matrix.translate(ARM_THICK * 0.5, ARM_LEN, 0);
//     rightElbow.matrix.rotate(g_lowerArmAngle, 0, 0, 1); // rotate around that top-centre
//     // 4. turn cylinder sideways → disc
//     rightElbow.matrix.rotate(90, 1, 0, 0);

//     // 5. make it small and thin  (radius ≈ ARM_THICK, height very small)
//     rightElbow.matrix.scale(.1, .50, .1);

//     rightElbow.render();

drawPenguin(0, 0, 0);           // origin penguin
drawPenguin(2, 0, -6,{         // custom animation for this guy
  headAngle: 0,
  wingAngle: 0,
  lowerWingAngle: 0,
  yaw: 360,
  stride: 0          // standing still
});          

  

drawPenguin(-1, 0, 1, {         // custom animation for this guy
  headAngle: 0,
  wingAngle: 45,
  lowerWingAngle: -20,
  yaw: 0,
  stride: 0          // standing still
});
  var duration = performance.now() - startTime; // End time
  //console.log("Render time: " + duration + " ms"); // Log the render time

}

function drawPenguin(px, py, pz, opts = {}) {
  const yaw            = opts.yaw            ?? 0;   // <‑‑ NEW
  const headAngle      = opts.headAngle      ?? g_globalHeadAngle;
  const wingAngle      = opts.wingAngle      ?? g_globalArmAngle;
  const lowerWingAngle = opts.lowerWingAngle ?? g_lowerArmAngle;
  const legStride      = opts.stride         ?? g_legStride;
  const t              = g_seconds;

  /* ---------- root transform ---------- *
   * 1) rotate the whole bird at the origin
   * 2) move it out to its world position
   * This keeps the turn centred on the penguin itself.
   */
  const root = new Matrix4();
  root.rotate(yaw, 0, 1, 0);    // spin around Y
  root.translate(px, py, pz);

  // ────────── HEAD ──────────
  const headBase = new Matrix4(root);        // start from penguin root
  headBase.translate(-0.19, .5, .05);        // neck corner
  headBase.translate(0.2, 0, 0.2);           // move pivot to neck centre
  headBase.rotate(headAngle, 0, 1, 0);       // yaw
  
  const headFrame = new Matrix4(headBase);   // <-- SAVE HERE (un‑scaled!)
  
  // draw the actual cube
  const head = new Cube();
  head.color=[0,0,0,1]; head.textureNum=-2;
  head.matrix = new Matrix4(headBase);
  head.matrix.translate(-0.2, 0, -0.2);      // move pivot back to corner
  head.matrix.scale(0.4, 0.35, 0.4);         // scale only the cube
  head.render();
  // Save frame at the neck centre for eyes / beak
  //const headFrame = new Matrix4(head.matrix);

  // ─── BEAK upper / tongue / lower ───
  const makeBeakPiece = (color, tx, ty, tz, sx, sy, sz) => {
    const c = new Cube();
    c.color = color; c.textureNum = -2;
    c.matrix = new Matrix4(headFrame);
    c.matrix.translate(tx, ty, tz).scale(sx, sy, sz);
    c.render();
  };
  makeBeakPiece([1,0.5,0,1], -0.07, .08, -.3,  0.14, 0.045, 0.2); // upper
  makeBeakPiece([1,0,0,1],   -0.06, .06, -.25, 0.11, 0.045, 0.2); // tongue
  makeBeakPiece([1,0.5,0,.97],-0.07,g_beakLowerY,-.3,0.14,0.045,0.2);// lower

  // ─── EYES ───
  const makeEye = (baseTx) => {
    const sclera = new Cube();
    sclera.color=[1,1,1,1]; sclera.textureNum=-2;
    sclera.matrix = new Matrix4(headFrame);
    sclera.matrix.translate(baseTx, .2, -.22).scale(0.1,0.1,0.1);
    sclera.render();

    const pupil = new Cube();
    pupil.color=[0,0,0,1]; pupil.textureNum=-2;
    pupil.matrix = new Matrix4(sclera.matrix);
    pupil.matrix.translate(.02,.02,-.0011).scale(0.5,0.6,1);
    pupil.render();
  };
  makeEye(-0.13); // left
  makeEye( 0.04); // right

  // ────────── BODY & BELLY ──────────
  const body = new Cube();
  body.color=[0,0,0,1]; body.textureNum=-2;
  body.matrix = new Matrix4(root);
  body.matrix.translate(-0.25,-0.5,0).scale(0.5,1,0.5);
  body.render();

  const belly = new Cube();
  belly.color=[1,1,1,1]; belly.textureNum=-2;
  belly.matrix = new Matrix4(root);
  belly.matrix.translate(-0.16,-0.44,-.01).scale(0.33,0.9,0.5);
  belly.render();

  const chestYellow = new Cube();
  chestYellow.color=[1,1,0.8,1]; chestYellow.textureNum=-2;
  chestYellow.matrix = new Matrix4(root);
  chestYellow.matrix.translate(-0.16, .301,-.011).scale(0.33,0.2,0.5);
  chestYellow.render();

  // Constants
  const ARM_LEN=0.30, ARM_THICK=0.09;
  const flap = -80*Math.abs(Math.sin(t)); // idle flap demo

  // Shared helper to build a full wing (upper + lower) -------------
  function buildWing(isLeft) {
    const sign = isLeft ? 1 : -1;
    // Upper
    const upper = new Cube();
    upper.color=[0,0,0,1]; upper.textureNum=-2;
    upper.matrix = new Matrix4(root);
    upper.matrix.translate(sign*0.25, .45, isLeft? .5 : 0)
                .rotate(180, isLeft?180:0,0,1)
                .rotate(-wingAngle,0,0,1)
                .scale(ARM_THICK,ARM_LEN,0.5);
    upper.render();

    // White underside
    const wUpper = new Cube();
    wUpper.color=[1,1,1,1]; wUpper.textureNum=-2;
    wUpper.matrix = new Matrix4(root);
    wUpper.matrix.translate(sign*0.24,.45,isLeft?.4:.15)
                .rotate(180, isLeft?180:0,0,1)
                .rotate(-wingAngle,0,0,1)
                .scale(.09,ARM_LEN,0.25);
    wUpper.render();

    // ---------- lower wing ------------
    const elbowFrame = new Matrix4(root);
    elbowFrame.translate(sign*0.25,.45,isLeft?.5:0)
               .rotate(180,isLeft?180:0,0,1)
               .rotate(-wingAngle,0,0,1);

    const lower = new Cube();
    lower.color=[0,0,0,1]; lower.textureNum=-2;
    lower.matrix = new Matrix4(elbowFrame);
    lower.matrix.translate(ARM_THICK*0.5, ARM_LEN, 0)
                 .rotate(lowerWingAngle,0,0,1)
                 .translate(-ARM_THICK*0.5,0,0)
                 .scale(ARM_THICK,ARM_LEN,0.5);
    lower.render();

    const wLower = new Cube();
    wLower.color=[1,1,1,1]; wLower.textureNum=-2;
    wLower.matrix = new Matrix4(lower.matrix);
    wLower.matrix.translate(0,0,0.7).scale(1,1,0.3);
    //wLower.render();
  }
  buildWing(true);  // left
  buildWing(false); // right

  // ────────── FEET ──────────
  const makeFoot = (tx) => {
    const foot = new Cube();
    foot.color=[1,0.5,0,1]; foot.textureNum=-2;
    foot.matrix = new Matrix4(root);
    foot.matrix.translate(tx,-.57,-.08)
                .rotate(tx>0 ? 5 : -5,0,1,0)
                .translate(0,0, tx>0?legStride:-legStride)
                .scale(0.14,0.07,0.5);
    foot.render();
  };
  makeFoot( 0.03); // right
  makeFoot(-0.18); // left

  // Shoulders + elbows (cylinders) omitted for brevity,
  // but the pattern is the same: new Matrix4(root) → relative transforms
}