import { Particle } from './particle.js';
import { Renderer } from './renderer.js';

export class ParticleSystem {
  static SHAPE = {
    CIRCLE: 0,
    ELLIIPSE: 1,
    SQUARE: 2,
    RECTANGLE: 3,
  }

  static stringToShape(str) {
    switch (str) {
      case "rectangle":
        return ParticleSystem.SHAPE.RECTANGLE;
      case "circle":
        return ParticleSystem.SHAPE.CIRCLE;
      case "ellipse":
        return ParticleSystem.SHAPE.ELLIIPSE;
      default:
        return ParticleSystem.SHAPE.SQUARE;
    }
  }

  constructor(canvas, maxParticles, callback, display) {
    if (ParticleSystem.LIST != null) {
      return;
    }
    this.display = display;
    this.particleList = [];
    this.maxParticles = maxParticles;
    this.particlesPerSec = 20;
    this._x = 0;
    this._y = 0;
    this._startSizeMin = 0.125;
    this._endSizeMin = 0.0125;
    this._sizeVariance = 0.0;
    this._lifeTimeVariance = 0;
    this._lifeTime = 2000;
    this._runtimeRemaining = this._runtime = 2000;
    this._startRotationMin = 0.0;
    this._startRotationVariance = 0.0;
    this._angularVelocityMin = 0.0;
    this._angularVelocityVariance = 0.0;
    this._startSpeedMin = 0.005;
    this._startSpeedVariance = 0.0;
    this._spriteWidth = 1.0;
    this._spriteHeight = 1.0;


    this.renderer = new Renderer(canvas, maxParticles, callback)

    ParticleSystem.LIST = this.particleList;

    //Particle.LIST = new Float32Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      new Particle(this);
    }

    // sprite is not there
    // callback is not there
  }

  log(string) {
    this.display.innerHTML = string;
  }

  // THIS NEEDS TO BE CALLED FROM THE WEB PAGE.
  setSprite(spriteFile) {
    if (this.spriteFile !== spriteFile) {
      this.spriteFile = spriteFile;
      Renderer.SN.setSprite(spriteFile);
      this.resetLoop();
    }
  }

  run(timeDelta) {
    this._runtimeRemaining -= timeDelta;
    if (this._runtimeRemaining < 0) {
      if (this._runloop === true) {
        this._runtimeRemaining = this._runtime;
        this._burst1Countdown = this._burstTime1;
        this._burst2Countdown = this._burstTime2;
        this._burst3Countdown = this._burstTime3;
        this._burst4Countdown = this._burstTime4;
      }
      else {
        this._runtimeRemaining = 0;
      }
    }

    let releaseCount = 0;
    if (this._nextRelease <= 0) {
      releaseCount++;
      this._nextRelease = this._releaseTime;
    }

    if (this._burst1Countdown > 0) {
      this._burst1Countdown -= timeDelta;
      if (this._burst1Countdown <= 0) {
        releaseCount += this._burstCount1;
      }
    }

    if (this._burst2Countdown > 0.0) {
      this._burst2Countdown -= timeDelta;
      if (this._burst2Countdown <= 0.0) {
        releaseCount += this._burstCount2;
      }
    }

    if (this._burst3Countdown > 0.0) {
      this._burst3Countdown -= timeDelta;
      if (this._burst3Countdown <= 0.0) {
        releaseCount += this._burstCount3;
      }
    }

    if (this._burst4Countdown > 0.0) {
      this._burst4Countdown -= timeDelta;
      if (this._burst4Countdown <= 0.0) {
        releaseCount += this._burstCount4;
      }
    }

    this.log(`
    releaseCount: ${releaseCount} | runtimeRemaining: ${this._runtimeRemaining} | burstCount: ${this._burst1Countdown}
    `);
    if (this._runtimeRemaining === 0 && releaseCount !== 0) {
      releaseCount = 0;
    }

    this.log(`
    releaseCount: ${releaseCount} | runtimeRemaining: ${this._runtimeRemaining} | burstCount: ${this._burst1Countdown}
    `);

    for (let i = 0; i < this.particleList.length; i++) {
      let particle = this.particleList[i];
      if (particle.active === true) {
        console.log(`run particle: ${i}`);
        particle.run(timeDelta);
      }
      else if (releaseCount > 0) {
        console.log(`releaseCount: ${releaseCount} id: ${i}`);
        releaseCount--;
        let speed = this._startSpeedMin + Math.random() * this._startSpeedVariance;
        let sizeDiff = Math.random() * this._sizeVariance;
        let life = this._lifeTime + Math.random() * this._lifeTimeVariance;
        let rotation = this._startRotationMin + Math.random() * this._startRotationVariance;
        let angularVel = this._angularVelocityMin + Math.random() * this._angularVelocityVariance;

        const startRed = this._startColor >>> 16;
        const endRed = this._endColor >>> 16;

        const startGreen = (this._startColor >>> 8) & 0xff;
        const endGreen = (this._endColor >>> 8) & 0xff;

        const startBlue = this._startColor & 0xff;
        const endBlue = this._endColor & 0xff;

        const xval = (this._x - this.emitterSize / 2.0) + this.emitterSize * Math.random();
        const yval = (this._y - this.emitterSize / 2.0) + this.emitterSize * Math.random();

        particle.activate(life,
          xval, yval,
          speed,
          this._startSizeMin + sizeDiff, this._endSizeMin + sizeDiff,
          rotation, angularVel, this._alignrotation,
          startRed, endRed,
          startGreen, endGreen,
          startBlue, endBlue,
          this._startAlpha, this._endAlpha,
          this._gravity, this._accelerate, this._friction
        );
      }
    }

    this._nextRelease -= timeDelta;
    Renderer.SN.renderScene();
  }

  set emitterSize(val) {
    this._emitterSize = val;
  }

  get emitterSize() {
    return this._emitterSize;
  }

  set runtime(val) {
    this._runtime = val;
    this.resetLoop();
  }

  get runtime() {
    return this._runtime;
  }

  set runloop(val) {
    this._runloop = !!val;
    this.resetLoop();
  }

  get runloop() {
    return this._runloop;
  }

  resetLoop() {
    this._runtimeRemaining = this._runtime;
    this._burst1Countdown = this._burstTime1;
    this._burst2Countdown = this._burstTime2;
    this._burst3Countdown = this._burstTime3;
    this._burst4Countdown = this._burstTime4;
    this.log(`
    runtime: ${this._runtime} | runtimeRemaining: ${this._runtimeRemaining} | burst1Countdown: ${this._burst1Countdown}
    `);
  }

  set burstTime1(val) {
    this._burstTime1 = val;
    this.resetLoop();
  }

  get burstTime1() {
    return this._burstTime1;
  }

  set burstTime2(val) {
    this._burstTime2 = val;
    this.resetLoop();
  }

  get burstTime2() {
    return this._burstTime2;
  }

  set burstTime3(val) {
    this._burstTime3 = val;
    this.resetLoop();
  }

  get burstTime3() {
    return this._burstTime3;
  }

  set burstTime4(val) {
    this._burstTime4 = val;
    this.resetLoop();
  }

  get burstTime4() {
    return this._burstTime4;
  }

  set burstCount1(val) {
    this._burstCount1 = val;
    this.resetLoop();
  }

  get burstCount1() {
    return this._burstCount1;
  }

  set burstCount2(val) {
    this._burstCount2 = val;
    this.resetLoop();
  }

  get burstCount2() {
    return this._burstCount2;
  }

  set burstCount3(val) {
    this._burstCount3 = val;
    this.resetLoop();
  }

  get burstCount3() {
    return this._burstCount3;
  }

  set burstCount4(val) {
    this._burstCount4 = val;
    this.resetLoop();
  }

  get burstCount4() {
    return this._burstCount4;
  }

  set alignrotation(val) {
    this._alignrotation = !!val;
  }

  get alignrotation() {
    return this._alignrotation;
  }

  //=========================

  set x(val) {
    this._x = val;
  }

  set y(val) {
    this._y = val;
  }

  set lifeTime(time) {
    this._lifeTime = time;
  }

  set lifeTimeVariance(variance) {
    this._lifeTimeVariance = variance;
  }

  set particles(val) {
    this._particles = val;
  }

  set startDelay(val) {
    this._startDelay = val;
  }

  set startSpeedMin(val) {
    this._startSpeedMin = val;
  }

  set startSpeedVariance(val) {
    this._startSpeedVariance = val;
  }

  set gravity(val) {
    this._gravity = val;
  }

  set accelerate(val) {
    this._accelerate = val;
  }

  set friction(val) {
    this._friction = val;
  }

  set startSizeMin(val) {
    this._startSizeMin = val;
    this._endSizeMin = val;
  }

  set endSizeMin(val) {
    this._endSizeMin = val;
  }

  set sizeVariance(val) {
    this._sizeVariance = val;
  }

  set startRotationMin(val) {
    this._startRotationMin = val;
  }

  set startRotationVariance(val) {
    this._startRotationVariance = val;
  }

  set startColor(val) {
    this._startColor = parseInt(val.slice(1), 16);
  }

  set endColor(val) {
    this._endColor = parseInt(val.slice(1), 16);
  }

  set startAlpha(val) {
    val *= 255;
    val = Math.min(val, 255);
    this._startAlpha = parseInt(Math.max(val, 0.0));
  }

  set endAlpha(val) {
    val *= 255;
    val = Math.min(val, 255);
    this._endAlpha = parseInt(Math.max(val, 0.0));
  }

  set particlesPerSec(val) {
    this._releaseTime = 1000 / val;
    this._nextRelease = 0;
  }

  set angularVelocityMin(val) {
    this._angularVelocityMin = val;
  }

  set angularVelocityVariance(val) {
    this._angularVelocityVariance = val;
  }

  set emitterShape(shape) {
    this._emitterShape = shape;
  }

  set animated(val) {
    this._animated = val;
  }
}
