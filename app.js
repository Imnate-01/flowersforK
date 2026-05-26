const canvas = document.querySelector("#garden");
const ctx = canvas.getContext("2d");

const dedicationText = "Hecho para ti, mi querida Kristen";
const letterParagraphs = [
  "Los girasoles no son bonitos solo por el color, sino por la forma en que insisten en orientarse hacia lo que les da vida.",
  "Me dio ternura saber que te gustan, y por eso quise dejarte esta nota.",
  "Si alguna vez me preguntaran en qu\u00e9 sentido eras hermosa, dir\u00eda esto, procurando no decir demasiado: ten\u00edas el cabello casta\u00f1o oscuro, un tanto corto y liso; los ojos como el caf\u00e9 de la ma\u00f1ana; la cara ovalada y cuidada, con plomo y elegancia. Y al final dir\u00eda lo \u00fanico que de verdad alcanza: eras preciosa. Tremendamente hermosa, incluso con tus fallos o defectos. Al menos para m\u00ed."
];

const els = {
  dedication: document.querySelector("#dedication"),
  dateLine: document.querySelector("#dateLine"),
  heroTitle: document.querySelector("#heroTitle"),
  introText: document.querySelector("#introText"),
  flowerCount: document.querySelector("#flowerCount"),
  sunState: document.querySelector("#sunState"),
  touchHint: document.querySelector("#touchHint"),
  plantButton: document.querySelector("#plantButton"),
  letterButton: document.querySelector("#letterButton"),
  letterDialog: document.querySelector("#letterDialog"),
  letterBody: document.querySelector("#letterBody"),
  closeLetter: document.querySelector("#closeLetter"),
  letterPlant: document.querySelector("#letterPlant"),
  shareButton: document.querySelector("#shareButton"),
  musicButton: document.querySelector("#musicButton"),
  sunflowerTrack: document.querySelector("#sunflowerTrack"),
  sunRange: document.querySelector("#sunRange"),
  windRange: document.querySelector("#windRange"),
  toast: document.querySelector("#toast")
};

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  time: 0,
  sun: Number(els.sunRange.value) / 100,
  wind: Number(els.windRange.value) / 100,
  pointer: { x: 0.5, y: 0.5, active: false },
  tilt: { x: 0, y: 0 },
  flowers: [],
  pollen: [],
  ripples: [],
  musicOn: false,
  trackReady: false,
  usingTrack: false,
  audio: null,
  nextNoteAt: 0,
  typewriterTimer: null,
  letterRun: 0
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hour = new Date().getHours();

seedCopy();
resize();
seedGarden();
requestAnimationFrame(draw);

window.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", handlePlant);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", () => {
  state.pointer.active = false;
});
canvas.addEventListener("pointercancel", () => {
  state.pointer.active = false;
});

els.plantButton.addEventListener("click", () => plantBurst(5));
els.letterButton.addEventListener("click", openLetter);
els.closeLetter.addEventListener("click", closeLetter);
els.letterPlant.addEventListener("click", () => {
  plantBurst(18);
  closeLetter();
});
els.sunRange.addEventListener("input", event => {
  state.sun = Number(event.target.value) / 100;
  updateSunLabel();
});
els.windRange.addEventListener("input", event => {
  state.wind = Number(event.target.value) / 100;
});
els.shareButton.addEventListener("click", copyLink);
els.musicButton.addEventListener("click", toggleMusic);
els.sunflowerTrack.addEventListener("canplaythrough", () => {
  state.trackReady = true;
});
els.sunflowerTrack.addEventListener("error", () => {
  state.trackReady = false;
  state.usingTrack = false;
});

window.addEventListener("deviceorientation", event => {
  state.tilt.x = clamp((event.gamma || 0) / 24, -1, 1);
  state.tilt.y = clamp((event.beta || 0) / 36, -1, 1);
}, { passive: true });

function seedCopy() {
  els.dedication.textContent = dedicationText;
  els.dateLine.textContent = dedicationText;

  updateSunLabel();
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function seedGarden() {
  const count = Math.max(18, Math.floor(state.width / 34));
  for (let i = 0; i < count; i += 1) {
    const x = randomRange(-40, state.width + 40);
    const y = randomRange(state.height * 0.55, state.height * 0.98);
    state.flowers.push(createFlower(x, y, randomRange(0.52, 1.25), true));
  }
  updateFlowerCount();
}

function createFlower(x, y, scale = 1, mature = false) {
  const depth = clamp((y - state.height * 0.4) / (state.height * 0.62), 0.2, 1);
  return {
    x,
    y,
    scale: scale * (0.72 + depth * 0.45),
    depth,
    growth: mature ? randomRange(0.76, 1) : 0,
    targetGrowth: 1,
    lean: randomRange(-0.26, 0.26),
    phase: randomRange(0, Math.PI * 2),
    petals: Math.floor(randomRange(18, 26)),
    seeds: Math.floor(randomRange(42, 78)),
    hue: randomRange(-8, 12)
  };
}

function handlePointerMove(event) {
  state.pointer.x = event.clientX / state.width;
  state.pointer.y = event.clientY / state.height;
}

function handlePlant(event) {
  state.pointer.active = true;
  handlePointerMove(event);
  plantAt(event.clientX, event.clientY);
  makeRipple(event.clientX, event.clientY);
  playPluck();
}

function plantAt(x, y) {
  const groundY = Math.max(y, state.height * 0.48);
  state.flowers.push(createFlower(x, groundY, randomRange(0.7, 1.18)));
  if (state.flowers.length > 92) state.flowers.shift();
  for (let i = 0; i < 8; i += 1) {
    state.pollen.push(createPollen(x, groundY - randomRange(30, 110), true));
  }
  updateFlowerCount();
  els.touchHint.textContent = "Otra vez";
}

function plantBurst(amount) {
  for (let i = 0; i < amount; i += 1) {
    const x = randomRange(state.width * 0.08, state.width * 0.92);
    const y = randomRange(state.height * 0.54, state.height * 0.95);
    setTimeout(() => {
      plantAt(x, y);
      makeRipple(x, y);
      playPluck();
    }, prefersReducedMotion ? 0 : i * 75);
  }
}

function createPollen(x, y, fresh = false) {
  return {
    x,
    y,
    vx: randomRange(-0.24, 0.34),
    vy: randomRange(-0.42, fresh ? -1.2 : -0.12),
    r: randomRange(1.1, 2.7),
    life: randomRange(0.45, 1),
    phase: randomRange(0, Math.PI * 2)
  };
}

function makeRipple(x, y) {
  state.ripples.push({ x, y, age: 0, size: randomRange(18, 36) });
  if (state.ripples.length > 18) state.ripples.shift();
}

function draw(now) {
  const dt = Math.min(0.033, (now - state.time) / 1000 || 0.016);
  state.time = now;

  update(dt);
  drawSky();
  drawSun();
  drawHills();
  drawGround();
  drawRipples();
  drawFlowers();
  drawPollen();
  drawVignette();

  requestAnimationFrame(draw);
}

function update(dt) {
  const windForce = (state.wind - 0.5) * 2;

  state.flowers.forEach(flower => {
    flower.growth += (flower.targetGrowth - flower.growth) * (prefersReducedMotion ? 1 : dt * 2.7);
    flower.lean += Math.sin(state.time * 0.00055 + flower.phase) * 0.0005 * state.wind;
    flower.lean = clamp(flower.lean + windForce * 0.0006 + state.tilt.x * 0.0008, -0.45, 0.45);
  });

  if (state.pollen.length < 72 && Math.random() < 0.34) {
    state.pollen.push(createPollen(randomRange(0, state.width), randomRange(state.height * 0.35, state.height * 0.82)));
  }

  state.pollen.forEach(dot => {
    dot.phase += dt * 1.8;
    dot.x += (dot.vx + Math.sin(dot.phase) * 0.2 + windForce * 0.42 + state.tilt.x * 0.34) * (dt * 60);
    dot.y += dot.vy * (dt * 60);
    dot.life -= dt * 0.035;
    if (dot.x < -20) dot.x = state.width + 20;
    if (dot.x > state.width + 20) dot.x = -20;
  });
  state.pollen = state.pollen.filter(dot => dot.life > 0 && dot.y > -40);

  state.ripples.forEach(ripple => {
    ripple.age += dt;
  });
  state.ripples = state.ripples.filter(ripple => ripple.age < 1.1);

  if (state.musicOn && !state.usingTrack && state.audio && nowSeconds() > state.nextNoteAt) {
    playTone(randomFrom([392, 440, 523.25, 587.33]), 0.12, 0.035);
    state.nextNoteAt = nowSeconds() + randomRange(1.6, 3.8);
  }
}

function drawSky() {
  const night = hour >= 20 || hour < 6;
  const warmth = state.sun;
  const top = night ? lerpColor("#24344c", "#495c7e", warmth) : lerpColor("#86c6e6", "#f8d06a", warmth);
  const mid = night ? lerpColor("#46516d", "#756d80", warmth) : lerpColor("#d8eef1", "#ffe7a2", warmth);
  const bottom = night ? lerpColor("#776045", "#ad8551", warmth) : lerpColor("#fff1b7", "#f3bd59", warmth);
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.56, mid);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.globalAlpha = 0.18 + warmth * 0.12;
  for (let i = 0; i < 9; i += 1) {
    const x = (i * 173 + state.time * 0.006) % (state.width + 220) - 110;
    const y = state.height * (0.1 + (i % 5) * 0.055);
    drawCloud(x, y, 0.7 + (i % 3) * 0.18);
  }
  ctx.globalAlpha = 1;
}

function drawSun() {
  const x = state.width * (0.78 + state.tilt.x * 0.025);
  const y = state.height * (0.17 + (1 - state.sun) * 0.12 + state.tilt.y * 0.012);
  const r = Math.min(state.width, state.height) * (0.12 + state.sun * 0.05);
  const glow = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 3.2);
  glow.addColorStop(0, "rgba(255, 238, 111, 0.95)");
  glow.addColorStop(0.25, "rgba(255, 198, 74, 0.38)");
  glow.addColorStop(1, "rgba(255, 214, 92, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffe067";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "#fff7db";
  ctx.beginPath();
  ctx.ellipse(x, y, 62 * scale, 20 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 42 * scale, y + 4 * scale, 44 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 34 * scale, y + 7 * scale, 40 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills() {
  drawHill(state.height * 0.55, "#8ebf73", 0.18, 0.18);
  drawHill(state.height * 0.62, "#6ea45f", 0.24, 0.34);
}

function drawHill(baseY, color, amp, offset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, state.height);
  for (let x = 0; x <= state.width + 20; x += 24) {
    const y = baseY + Math.sin(x * 0.006 + offset + state.time * 0.00005) * state.height * amp * 0.12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(state.width, state.height);
  ctx.closePath();
  ctx.fill();
}

function drawGround() {
  const gradient = ctx.createLinearGradient(0, state.height * 0.58, 0, state.height);
  gradient.addColorStop(0, "#4c9059");
  gradient.addColorStop(0.55, "#2f7249");
  gradient.addColorStop(1, "#5b3a24");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, state.height * 0.58, state.width, state.height * 0.42);

  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#f3d36a";
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 43 + Math.sin(state.time * 0.0003 + i) * 20) % state.width;
    const y = state.height * 0.62 + ((i * 29) % Math.max(1, state.height * 0.37));
    const h = 10 + (i % 5) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + 5, y + h * 0.4, x + 1, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawRipples() {
  state.ripples.forEach(ripple => {
    const t = ripple.age / 1.1;
    ctx.globalAlpha = (1 - t) * 0.42;
    ctx.strokeStyle = "#ffe36b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, ripple.size + t * 78, (ripple.size + t * 78) * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawFlowers() {
  const sorted = [...state.flowers].sort((a, b) => a.y - b.y);
  sorted.forEach(drawFlower);
}

function drawFlower(flower) {
  const growth = easeOutBack(clamp(flower.growth, 0, 1));
  const stemHeight = (92 + flower.depth * 120) * flower.scale * growth;
  const sway = Math.sin(state.time * 0.0012 + flower.phase) * (7 + state.wind * 14) * flower.depth;
  const headX = flower.x + sway + flower.lean * stemHeight + state.tilt.x * 12 * flower.depth;
  const headY = flower.y - stemHeight;
  const headR = (18 + flower.depth * 15) * flower.scale * growth;
  const stemWidth = Math.max(2, 4.2 * flower.scale * flower.depth);

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#28623d";
  ctx.lineWidth = stemWidth;
  ctx.beginPath();
  ctx.moveTo(flower.x, flower.y);
  ctx.bezierCurveTo(
    flower.x - 12 * flower.scale,
    flower.y - stemHeight * 0.36,
    headX - 10 * flower.scale,
    flower.y - stemHeight * 0.7,
    headX,
    headY
  );
  ctx.stroke();

  drawLeaf(flower.x, flower.y - stemHeight * 0.45, -1, flower.scale * growth, flower.phase);
  drawLeaf(flower.x + 3, flower.y - stemHeight * 0.62, 1, flower.scale * growth * 0.85, flower.phase + 1);

  ctx.translate(headX, headY);
  const faceAngle = Math.atan2(state.height * 0.17 - headY, state.width * 0.78 - headX) * 0.1;
  ctx.rotate(faceAngle + flower.lean * 0.28);

  const petalCount = flower.petals;
  for (let i = 0; i < petalCount; i += 1) {
    const angle = (Math.PI * 2 * i) / petalCount;
    const wobble = Math.sin(state.time * 0.0016 + flower.phase + i) * 0.04;
    drawPetal(angle + wobble, headR, flower.hue, i % 2);
  }

  const center = ctx.createRadialGradient(0, 0, headR * 0.12, 0, 0, headR * 0.92);
  center.addColorStop(0, "#6b3a18");
  center.addColorStop(0.7, "#4a2714");
  center.addColorStop(1, "#2e170d");
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, headR * 0.88, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 218, 80, 0.5)";
  for (let i = 0; i < flower.seeds; i += 1) {
    const a = i * 2.399963;
    const r = headR * 0.82 * Math.sqrt(i / flower.seeds);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(0.7, headR * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPetal(angle, headR, hue, alternate) {
  const length = headR * (1.22 + alternate * 0.18);
  const width = headR * 0.36;
  ctx.save();
  ctx.rotate(angle);
  ctx.translate(headR * 0.62, 0);
  const gradient = ctx.createLinearGradient(0, 0, length, 0);
  gradient.addColorStop(0, `hsl(${42 + hue}, 92%, 54%)`);
  gradient.addColorStop(0.78, `hsl(${49 + hue}, 96%, 63%)`);
  gradient.addColorStop(1, `hsl(${35 + hue}, 90%, 47%)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.22, -width, length * 0.82, -width * 0.74, length, 0);
  ctx.bezierCurveTo(length * 0.82, width * 0.74, length * 0.22, width, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawLeaf(x, y, side, scale, phase) {
  const length = 34 * scale;
  const lift = Math.sin(state.time * 0.001 + phase) * 3 * state.wind;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * (0.55 + state.wind * 0.08));
  ctx.fillStyle = side < 0 ? "#2f7b4d" : "#3c925a";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(side * length * 0.55, -length * 0.48 + lift, side * length, -length * 0.08);
  ctx.quadraticCurveTo(side * length * 0.46, length * 0.38 + lift, 0, 0);
  ctx.fill();
  ctx.strokeStyle = "rgba(238, 246, 185, 0.34)";
  ctx.lineWidth = Math.max(1, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(side * length * 0.5, -length * 0.12 + lift, side * length * 0.88, -length * 0.06);
  ctx.stroke();
  ctx.restore();
}

function drawPollen() {
  state.pollen.forEach(dot => {
    ctx.globalAlpha = clamp(dot.life, 0, 0.8);
    ctx.fillStyle = "#fff0a1";
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(
    state.width * 0.5,
    state.height * 0.46,
    state.height * 0.16,
    state.width * 0.5,
    state.height * 0.5,
    state.height * 0.82
  );
  gradient.addColorStop(0, "rgba(255, 246, 185, 0)");
  gradient.addColorStop(1, "rgba(64, 37, 12, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
}

function openLetter() {
  if (typeof els.letterDialog.showModal === "function") {
    els.letterDialog.showModal();
    startTypewriter();
  } else {
    showToast("Tu navegador no abrio la nota, pero el jardin si esta vivo.");
  }
}

function closeLetter() {
  cancelTypewriter();
  els.letterDialog.close();
}

function startTypewriter() {
  cancelTypewriter();
  els.letterBody.textContent = "";
  els.letterBody.classList.remove("is-done");

  const run = state.letterRun;
  const paragraphs = letterParagraphs.map(text => {
    const paragraph = document.createElement("p");
    els.letterBody.appendChild(paragraph);
    return { element: paragraph, text, index: 0 };
  });

  if (prefersReducedMotion) {
    paragraphs.forEach(paragraph => {
      paragraph.element.textContent = paragraph.text;
    });
    els.letterBody.classList.add("is-done");
    return;
  }

  let paragraphIndex = 0;
  const typeNext = () => {
    if (run !== state.letterRun || paragraphIndex >= paragraphs.length) return;

    const paragraph = paragraphs[paragraphIndex];
    if (paragraph.index < paragraph.text.length) {
      paragraph.element.textContent += paragraph.text[paragraph.index];
      paragraph.index += 1;
      els.letterBody.scrollTop = els.letterBody.scrollHeight;
      const char = paragraph.text[paragraph.index - 1];
      const delay = /[.,;:]/.test(char) ? 96 : 22;
      state.typewriterTimer = setTimeout(typeNext, delay);
      return;
    }

    paragraphIndex += 1;
    if (paragraphIndex >= paragraphs.length) {
      els.letterBody.classList.add("is-done");
      return;
    }
    state.typewriterTimer = setTimeout(typeNext, 320);
  };

  state.typewriterTimer = setTimeout(typeNext, 220);
}

function cancelTypewriter() {
  state.letterRun += 1;
  clearTimeout(state.typewriterTimer);
  state.typewriterTimer = null;
}

async function copyLink() {
  const url = new URL(window.location.href);
  try {
    await navigator.clipboard.writeText(url.toString());
    showToast("Enlace copiado");
  } catch {
    showToast("Puedes copiarlo desde la barra del navegador");
  }
}

async function toggleMusic() {
  if (state.musicOn) {
    pauseMusic();
    return;
  }

  if (await playSunflowerTrack()) {
    setMusicState(true, true);
    showToast("Reproduciendo Sunflower");
    return;
  }

  if (!state.audio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      showToast("Agrega assets/sunflower.mp3 para reproducir la cancion");
      return;
    }
    state.audio = new AudioContext();
  }

  if (state.audio.state === "suspended") {
    state.audio.resume();
  }

  setMusicState(true, false);
  showToast("Agrega assets/sunflower.mp3 para usar Sunflower");
  playTone(523.25, 0.2, 0.05);
}

async function playSunflowerTrack() {
  const track = els.sunflowerTrack;
  if (!track) return false;

  track.volume = 0.72;
  try {
    await track.play();
    return true;
  } catch {
    return false;
  }
}

function pauseMusic() {
  if (state.usingTrack && els.sunflowerTrack) {
    els.sunflowerTrack.pause();
  }
  setMusicState(false, false);
  showToast("Musica pausada");
}

function setMusicState(isOn, usingTrack) {
  state.musicOn = isOn;
  state.usingTrack = usingTrack;
  els.musicButton.setAttribute("aria-label", isOn ? "Pausar musica" : "Activar musica");
  els.musicButton.setAttribute("title", isOn ? "Pausar musica" : "Activar musica");
  els.musicButton.classList.toggle("is-active", isOn);
}

function playPluck() {
  if (!state.musicOn || state.usingTrack || !state.audio) return;
  playTone(randomFrom([329.63, 392, 493.88, 659.25]), 0.1, 0.04);
}

function playTone(freq, duration, volume) {
  const audio = state.audio;
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration + 0.03);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2100);
}

function updateFlowerCount() {
  els.flowerCount.textContent = String(state.flowers.length);
}

function updateSunLabel() {
  els.sunState.textContent = state.sun < 0.35 ? "Suave" : state.sun > 0.72 ? "Dorado" : "Claro";
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function nowSeconds() {
  return performance.now() / 1000;
}

function lerpColor(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const mix = ca.map((value, index) => Math.round(value + (cb[index] - value) * amount));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ];
}
