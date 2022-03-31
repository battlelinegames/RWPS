import { ParticleSystem } from "./particleSystem.js";

var gl = null;
//var quadVAO = null;
//var quadBuffer = null;
//var program = null;

const QUAD_POS_LOC = 0;
const QUAD_UV_LOC = 1;
const OBJ_POS_LOC = 2;
const OBJ_SCALE_LOC = 3;
const OBJ_ROTATION_LOC = 4;
const COLOR_LOC = 5;

const quadData = new Float32Array([
  -1.0, -1.0, 0, 1,
  1.0, 1.0, 1, 0,
  -1.0, 1.0, 0, 0,
  -1.0, -1.0, 0, 1,
  1.0, -1.0, 1, 1,
  1.0, 1.0, 1, 0,
]);

let frameAdjustUniformId = null;

let widthRatioId = null;
let heightRatioId = null;

let texture = null;
let sampler = null;

export var uvMap;
var sheetWidth = 1;
var sheetHeight = 1;
var spriteSheetCount = 1;
export var frameArray = [];

function x2u(x) {
  return (x / sheetWidth);
}

function y2v(y) {
  return (y / sheetHeight);
}

function c2glW(width) {
  return (width / Renderer.SN.canvasWidth);
}

function c2glH(height) {
  return (height / Renderer.SN.canvasHeight);
}

export class Renderer {
  static SN = null;
  static X_OFFSET = 0 | 0;
  static Y_OFFSET = 1 | 0;
  static SCALE_OFFSET = 2 | 0;
  static ROTATION_OFFSET = 3 | 0;
  static OBJ_STRIDE = 16 | 0;

  constructor(canvas, maxSprites, gameLogicCallback) {
    Renderer.SN = this;

    this.spriteCount = 0;
    this.visibleSpriteCount = 0; // still figuring this out

    this.maxSprites = maxSprites;
    this.canvas = canvas;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.gameLogicCallback = gameLogicCallback;

    this.img = null;

    Renderer.positionData = new Float32Array(maxSprites * 4);
    Renderer.colorData = new Uint32Array(maxSprites);
    // FILL SCALE DATA WITH 1.0
    Renderer.positionData.fill(1.0, 0, Renderer.positionData.length);
    Renderer.colorData.fill(0xff_ff_ff_ff, 0, Renderer.colorData.length);

    this.positionBuffer = null;
    this.colorBuffer = null;

    gl = canvas.getContext('webgl2', {
      antialias: false,
      //depth: true,
      alpha: true,
      stencil: false,
      desynchronized: true,
      preserveDrawingBuffer: true,
    });

    const VERTEX_SHADER_CODE = `#version 300 es
    precision mediump float;

    layout(location=${QUAD_POS_LOC}) in vec2 quadVertexPos;
    layout(location=${QUAD_UV_LOC}) in vec2 quadUV;

    layout(location=${OBJ_POS_LOC}) in vec2 objPos;
    layout(location=${OBJ_SCALE_LOC}) in float scale;
    layout(location=${OBJ_ROTATION_LOC}) in float rotation;

    layout(location=${COLOR_LOC}) in uint colorAdjust;

    uniform float widthRatio;
    uniform float heightRatio;

    out vec2 uv;
    out vec4 adjustColor;
    
    void main() {
      uv = quadUV;
      float x_temp = quadVertexPos.x * cos(rotation) - quadVertexPos.y * sin(rotation);
      float y_temp = quadVertexPos.y * cos(rotation) + quadVertexPos.x * sin(rotation);
      float x = x_temp * widthRatio  * scale + objPos.x;
      float y = y_temp * heightRatio * scale + objPos.y;

      uint R = (colorAdjust >> 24) & uint(0xff);
      uint G = (colorAdjust >> 16) & uint(0xff);
      uint B = (colorAdjust >> 8) & uint(0xff);
      uint A = colorAdjust & uint(0xff);

      adjustColor.r = float(R) / 255.0;
      adjustColor.g = float(G) / 255.0;
      adjustColor.b = float(B) / 255.0;
      adjustColor.a = float(A) / 255.0;
      gl_Position = vec4(x, y, 0.0, 1.0);
    }
    `;

    const FRAGMENT_SHADER_CODE = `#version 300 es
      precision mediump float;
    
      uniform sampler2D sampler;
    
      in vec2 uv;
      in vec4 adjustColor;
      out vec4 color;
    
      void main() {
        color = texture(sampler, uv) * adjustColor;
      }
    `;

    // SET UP BACKGROUND SHADER
    const vertex_shader = gl.createShader(gl.VERTEX_SHADER);

    gl.shaderSource(vertex_shader, VERTEX_SHADER_CODE);

    gl.compileShader(vertex_shader);

    let message = gl.getShaderInfoLog(vertex_shader);

    if (message.length > 0) {
      alert(`failed to compile vertex shader: ${message}`);
      throw message;
    }

    const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment_shader, FRAGMENT_SHADER_CODE);
    gl.compileShader(fragment_shader);
    message = gl.getShaderInfoLog(fragment_shader);

    if (message.length > 0) {
      alert(`failed to compile fragment shader: ${message}`);
      throw message;
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vertex_shader);
    gl.attachShader(this.program, fragment_shader);

    gl.linkProgram(this.program);

    let link_status = gl.getProgramParameter(this.program, gl.LINK_STATUS);
    if (link_status === 'false') {
      alert(`program failed to link`);
      throw display.innerHTML;
    }

    gl.useProgram(this.program);

    // set up the uniform data

    this.widthRatioId = gl.getUniformLocation(this.program, "widthRatio");
    this.heightRatioId = gl.getUniformLocation(this.program, "heightRatio");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.setScale(canvas.width, canvas.height);

    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    this.quadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.quadVAO);

    gl.vertexAttribPointer(QUAD_POS_LOC, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(QUAD_UV_LOC, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(QUAD_POS_LOC);
    gl.enableVertexAttribArray(QUAD_UV_LOC);

    // set up the instance specific data
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(OBJ_POS_LOC, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(OBJ_POS_LOC);

    this.scaleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(OBJ_SCALE_LOC, 1, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(OBJ_SCALE_LOC);

    this.rotationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(OBJ_ROTATION_LOC, 1, gl.FLOAT, false, 16, 12);
    gl.enableVertexAttribArray(OBJ_ROTATION_LOC);

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.colorData, gl.DYNAMIC_DRAW);
    gl.vertexAttribIPointer(COLOR_LOC, 1, gl.UNSIGNED_INT, 4, 0);
    gl.enableVertexAttribArray(COLOR_LOC);

    gl.vertexAttribDivisor(OBJ_POS_LOC, 1);
    gl.vertexAttribDivisor(OBJ_SCALE_LOC, 1);
    gl.vertexAttribDivisor(OBJ_ROTATION_LOC, 1);
    gl.vertexAttribDivisor(COLOR_LOC, 1);

  }

  setSprite(spriteFile) {
    this.img = new Image();
    this.img.onload = () => {
      texture = gl.createTexture();
      sampler = gl.getUniformLocation(this.program, 'sampler');

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);

      this._spriteWidth = this.img.naturalWidth * 2 / this.canvasWidth;
      this._spriteHeight = this.img.naturalHeight * 2 / this.canvasHeight;

      //this.setScale(this._spriteWidth, this._spriteHeight);
      this.widthAdjust = this._spriteWidth;
      this.heightAdjust = this._spriteHeight;

      gl.uniform1f(this.widthRatioId, this.widthAdjust);
      gl.uniform1f(this.heightRatioId, this.heightAdjust);

      this.gameLogicCallback();
    }


    this.img.src = URL.createObjectURL(spriteFile);
  }

  setScale(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.widthAdjust = sheetWidth / 3200;
    this.heightAdjust = sheetHeight / 1800;

    gl.uniform1f(this.widthRatioId, this.widthAdjust);
    gl.uniform1f(this.heightRatioId, this.heightAdjust);
  }

  renderScene() {
    gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT); // | gl.DEPTH_BUFFER_BIT);

    // draw background last
    // switch program

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.scaleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.positionData, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Renderer.colorData, gl.DYNAMIC_DRAW)

    gl.bindVertexArray(this.quadVAO);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, ParticleSystem.LIST.length);
  }
}