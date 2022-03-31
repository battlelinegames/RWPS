export class TweenManager {
  static SN = null;
  constructor(tweenCount) {
    console.assert(TweenManager.SN == null, `More than one TweenManager created`);
    TweenManager.SN = this;

    this.pool = new Array(tweenCount);
    for (let i = 0; i < tweenCount; i++) {
      this.pool[i] = new Tween();
    }
    this.tweenIndex = 0;
  }

  createTween(object, propName, startValue, endValue, runTime, endCallback) {
    let tween;
    let first = this.tweenIndex;
    do {
      this.tweenIndex++;

      if (this.tweenIndex >= this.pool.length) {
        this.tweenIndex = 0;
      }

      tween = this.pool[this.tweenIndex];
    } while (tween.active === true && this.tweenIndex !== first);
    tween.start(object, propName, startValue, endValue, runTime, endCallback);
  }

  run() {
    for (let i = 0; i < this.pool.length; i++) {
      let tween = this.pool[i];
      if (tween.active === true) {
        tween.run();
      }
    }
  }
}

class Tween {
  static TYPE = {
    LINEAR: 0,
    EASEIN: 1,
    EASEOUT: 2,
    EASEINOUT: 3,
  }
  constructor() {
    this.object = null;
    this.propName = null;
    this.active = false;
    this.startValue = 0;
    this.endValue = 0;
    this.time = 0;
    this.endCallback = null;
  }

  start(object, propName, startValue, endValue, runTime, endCallback) {
    console.assert(this.active === false, `Not enough Tween objects allocated`);
    this.object = object;
    this.propName = propName;
    this.startValue = startValue;
    this.endValue = endValue;
    this.runTime = runTime;
    this.endCallback = endCallback;
    this.startTime = Date.now();
    this.active = true;
    this.valueDiff = endValue - startValue;
    this.currentValue = startValue;
    object[propName] = startValue;
    this.type = Tween.TYPE.LINEAR;
    this._easing = 1.1;
    this._invertEasing = 1 / this._easing;
  }

  run() {
    switch (this.type) {
      case Tween.TYPE.EASEIN:
        this._easeIn();
        break;
      case Tween.TYPE.EASEOUT:
        this._easeOut();
        break;
      case Tween.TYPE.EASEINOUT:
        this._easeInOut();
        break;
      default:
        this._linear();
    }
  }

  set easing(val) {
    this._easing = val;
    this._invertEasing = 1 / this._easing;
  }

  _easeIn() {
    let timePassed = Date.now() - this.startTime;
    let pct = timePassed / this.runTime;
    this.currentValue = Math.pow(pct, this._easing) * this.valueDiff + this.startValue;
    //     return c * (t /= d) * t + b;
  }

  _easeOut() {
    let timePassed = Date.now() - this.startTime;
    let pct = timePassed / this.runTime;
    this.currentValue = Math.pow(pct, this._invertEasing) * this.valueDiff + this.startValue;
  }

  _easeInOut() {
    let timePassed = Date.now() - this.startTime;
    let pct = timePassed / this.runTime;
    if (pct <= 0.5) {
      pct *= 2;
      this.currentValue = (Math.pow(pct, this._easing) * this.valueDiff + this.startValue) / 2.0;
    }
    else {
      let tempPct = (pct - 0.5) * 2.0;
      let midPoint = 0.5 * this.valueDiff + this.startValue;
      this.currentValue = (Math.pow(tempPct, this._invertEasing) * this.valueDiff + this.startValue) / 2.0 + midPoint;
    }
  }

  _linear() {
    // y = mx + b
    // return c * t / d + b;
    let timePassed = Date.now() - this.startTime;
    let pct = timePassed / this.runTime;
    this.currentValue = pct * this.valueDiff + this.startValue;
    if (timePassed >= this.runTime) {
      this.currentValue = this.endValue;
      this.active = false;
      if (this.endCallback != null) {
        this.endCallback();
      }
    }
    this.object[this.propName] = this.currentValue;
  }
}
