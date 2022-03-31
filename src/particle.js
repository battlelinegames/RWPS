import { Renderer } from "./renderer.js";

const INACTIVE_OFFSET = 1024.0;
const TWO_PI = Math.PI * 2.0;

export class Particle {
  static LIST = null;

  constructor(parent) {
    this.parent = parent;
    this._id = parent.particleList.length | 0;

    console.assert(this._id < Renderer.SN.maxSprites, `
    Attempted to create more than ${Renderer.SN.maxSprites} particles.  
    Change the maximum number of sprites.
    `);

    parent.particleList.push(this);
    //this.scale = 1.0;
    //this.rotation = 0.0;
    this._active = false;
    this.x = 0;
    this.y = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.lifeRemaining = 0;
    //this.gravityX = 0;
    //this.gravityY = 0;
    this.gravity = 0;
    this.angularVelocity = 0;
    this.scaleDelta = 0;
  }

  activate(lifetime,
    startX, startY, startSpeed,
    startScale, endScale,
    startRotation, angularVelocity, alignRotation,
    startRed = 0xff, endRed = 0xff,
    startGreen = 0xff, endGreen = 0xff,
    startBlue = 0xff, endBlue = 0xff,
    startAlpha = 0xff, endAlpha = 0xff,
    gravity = 0.0, accelerate = 0.0, friction = 0.0) {

    this.randomAngle = Math.random() * TWO_PI;
    this.velocityX = startSpeed * Math.cos(this.randomAngle);
    this.velocityY = startSpeed * Math.sin(this.randomAngle);
    this.accelerateX = accelerate * Math.cos(this.randomAngle);
    this.accelerateY = accelerate * Math.sin(this.randomAngle);


    this.lifeRemaining = lifetime;
    this.frictionMultiplier = 1.0 - friction;
    this.x = startX;
    this.y = startY;
    this.scale = startScale;
    this.scaleDelta = (endScale - startScale) / lifetime;
    this.rotation = startRotation;

    if (alignRotation) {
      this.rotation = this.randomAngle - Math.PI / 2;
    }

    this.angularVelocity = angularVelocity;
    this.active = true;

    this.startRed = startRed;
    this.endRed = endRed;
    this.startGreen = startGreen;
    this.endGreen = endGreen;
    this.startBlue = startBlue;
    this.endBlue = endBlue;
    this.startAlpha = startAlpha;
    this.endAlpha = endAlpha;

    this.redDelta = (endRed - startRed) / lifetime;
    this.greenDelta = (endGreen - startGreen) / lifetime;
    this.blueDelta = (endBlue - startBlue) / lifetime;
    this.alphaDelta = (endAlpha - startAlpha) / lifetime;

    this.red = startRed;
    this.green = startGreen;
    this.blue = startBlue;
    this.alpha = startAlpha;
    this.gravity = gravity;
  }

  run(delta) {
    this.lifeRemaining -= delta;
    if (this.lifeRemaining <= 0) {
      this.active = false;
      return;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    //this.velocityX += this.gravityX;
    //this.velocityY += this.gravityY;
    this.velocityY += this.gravity;
    this.velocityX += this.accelerateX;
    this.velocityY += this.accelerateY;

    this.velocityX *= this.frictionMultiplier;
    this.velocityY *= this.frictionMultiplier;

    this.rotation += this.angularVelocity;
    this.scale += this.scaleDelta * delta;

    this.red += this.redDelta * delta;
    this.green += this.greenDelta * delta;
    this.blue += this.blueDelta * delta;
    this.alpha += this.alphaDelta * delta;
  }

  set x(val) {
    this._x = val;
    if (this._active === false) {
      Renderer.positionData[(this._id << 2) + Renderer.X_OFFSET] = val + INACTIVE_OFFSET;
    }
    else {
      Renderer.positionData[(this._id << 2) + Renderer.X_OFFSET] = val;
    }
  }

  get x() {
    return this._x;
  }

  set y(val) {
    Renderer.positionData[(this._id << 2) + Renderer.Y_OFFSET] = val;
  }

  get y() {
    return Renderer.positionData[(this._id << 2) + Renderer.Y_OFFSET];
  }

  set rotation(val) {
    Renderer.positionData[(this._id << 2) + Renderer.ROTATION_OFFSET] = val;
  }

  get rotation() {
    return Renderer.positionData[(this._id << 2) + Renderer.ROTATION_OFFSET];
  }

  set scale(val) {
    Renderer.positionData[(this._id << 2) + Renderer.SCALE_OFFSET] = val;
  }

  get scale() {
    return Renderer.positionData[(this._id << 2) + Renderer.SCALE_OFFSET];
  }

  get active() {
    return this._active;
  }
  set active(val) {
    if (val === this._active) {
      return;
    }

    this._active = val;
    if (val === true) {
      Renderer.positionData[(this._id << 2) + Renderer.X_OFFSET] = this._x;
    }
    else {
      Renderer.positionData[(this._id << 2) + Renderer.X_OFFSET] = this._x + INACTIVE_OFFSET;
    }
  }

  set color(c) {
    Renderer.colorData[this._id] = c;
  }

  get color() {
    return Renderer.colorData[this._id];
  }

  set red(r) {
    this._red = Math.max(Math.min(r, 255), 0);
    Renderer.colorData[this._id] = (Renderer.colorData[this._id] & 0x00_ff_ff_ff) |
      (parseInt(this._red) << 24);
  }

  get red() {
    return this._red;
  }

  set green(g) {
    this._green = Math.min(g, 255);
    Renderer.colorData[this._id] = (Renderer.colorData[this._id] & 0xff_00_ff_ff) |
      ((parseInt(this._green) & 0xff) << 16);
  }

  get green() {
    return this._green;
  }

  set blue(b) {
    this._blue = Math.min(b, 255);
    Renderer.colorData[this._id] = (Renderer.colorData[this._id] & 0xff_ff_00_ff) |
      ((parseInt(this._blue) & 0xff) << 8);
  }

  get blue() {
    return this._blue;
  }

  set alpha(a) {
    this._alpha = Math.min(a, 255);
    this._alpha = Math.max(this._alpha, 0);
    Renderer.colorData[this._id] = (Renderer.colorData[this._id] & 0xff_ff_ff_00) |
      ((parseInt(this._alpha)) & 0xff);

  }

  get alpha() {
    return this._alpha;
  }

}

