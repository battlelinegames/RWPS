import { ParticleSystem } from "./particleSystem.js";

export var particleSystem = null;
let canvas = null;
let lastTime = Date.now();
let delay = 100;

function gameLoop() {
  let currentTime = Date.now();
  let timeDelta = currentTime - lastTime;
  lastTime = currentTime;
  particleSystem.run(timeDelta);
  requestAnimationFrame(gameLoop);
}

function callLoop() {
  setTimeout(gameLoop, delay);
}

export function gameInit(cnvs, maxParticles, startDelay, display) {
  delay = startDelay;
  canvas = cnvs;
  particleSystem = new ParticleSystem(canvas, maxParticles, callLoop, display);
}

