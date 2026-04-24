 // main.js
import { tracks } from './trackbuilder.js';
export const levels = {
  LVL1: ['LVL1'],
  LVL2: ['LVL2'],
  LVL3: ['LVL3'],
  LVL4: ['LVL4_1', 'LVL4_2'],
  LVL5: ['LVL5_1', 'LVL5_2'],
  LVL6: ['LVL6_1', 'LVL6_2'],
  LVL7: ['LVL7'],
};
let ghostPlayback = createGhostPlaybackState();
let ghostRecord = createGhostRecordState();
const GHOST_HZ = 30;
const GHOST_MIN_DIST = 0.02;
const carSelectMenu = document.getElementById("carSelectMenu");
const btnChooseCar  = document.getElementById("btnChooseCar");
const btnCarBack    = document.getElementById("btnCarBack");
const btnResetStats = document.getElementById("btnResetStats");
btnChooseCar?.addEventListener("click", () => {
  carSelectMenu.style.display = "flex";
});
btnCarBack?.addEventListener("click", () => {
  carSelectMenu.style.display = "none";
});
const ui = {
  startMenu: document.getElementById("startMenu"),
  statsMenu: document.getElementById("statsMenu"),
  startNameP1: document.getElementById("startNameP1"),
  driverImg: document.getElementById("driverImg"),
  selectedCarImg: document.getElementById("selectedCarImg"), // ✅ ADD THIS
  carGridOverlay: document.getElementById("carGridOverlay"),
  selectedCarLabel: document.getElementById("selectedCarLabel"),
  btnStats: document.getElementById("btnStats"),
  btnNewRace: document.getElementById("btnNewRace"),
  btnStatsBack: document.getElementById("btnStatsBack"),
  statsList: document.getElementById("statsList")
};
const SETTINGS_KEYS = {
  nameP1: "circuitracer_name_p1",
  genderP1: "circuitracer_gender_p1",
  carP1: "circuitracer_car_p1"
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const CONFIG = {
  TILE_SIZE: 16,
  SPEED: 400,
  BASE_PLANK: 220,
  MIN_PLANK: 160,
  MAX_PLANK: 260,
  MAX_ANGLE: 35,
  BALANCE_DURATION: 3,
  BALANCE_ZONE: 30,
  GRAVITY: 420,
  FRICTION: 0.98
};
const state = {
  gameOver: false,
  currentTable: "LVL1",
  track: null,
  activeTrack: null,
  currentLevel: null,
  teleporting: false,
  levelCheckpointState: {},
  plankLength: CONFIG.BASE_PLANK

};
const dom = {
  trackMenu: document.getElementById("trackMenu"),
  overlay: document.getElementById("overlay"),
  winnerText: document.getElementById("winnerText"),
  nameP1: document.getElementById("nameP1"),
  nameP2: document.getElementById("nameP2"),
  lapInput: document.getElementById("lapInput"),
  statsP1: document.getElementById("statsP1"),
  statsP2: document.getElementById("statsP2"),
  rotateWarning: document.getElementById("rotateWarning"),
  gameWrapper: document.getElementById("gameWrapper"),
  mobileControls: document.getElementById("mobileControls"),
  minigameOverlay: document.getElementById("minigameOverlay"),
  panelP1: document.getElementById("panelP1"),
  newGameBtn: document.getElementById("newGameBtn"),
  newGameBtn1: document.getElementById("newGameBtn1"),

};
window.addEventListener("DOMContentLoaded", () => {
  Object.keys(levels).forEach((lvl, index) => {
    document
    .getElementById(`track${index + 1}Btn`)
    ?.addEventListener("click", () => startLevel(lvl));
  });

  initStartScreen();
});
// === Spelers ===
const players = {
  P1: {
    lane:"1",
    x:0, y:0,
    angle: 0,
    keys:{
      z:[0,-1], s:[0,1], q:[-1,0], d:[1,0],
      i:[0,-1], k:[0,1], j:[-1,0], l:[1,0],
      "8":[0,-1], "5":[0,1], "4":[-1,0], "6":[1,0],
      arrowup:[0,-1], arrowdown:[0,1],
      arrowleft:[-1,0], arrowright:[1,0]
    },
    started:false,
    lap:0,
    lapStart:0,
    bestLap:null,
    lastTile:null,
    onStartTile:false,
    canTriggerCheckpoints:false,
    inMinigame:false,
    minigameCooldown:false,
    finishTime:null,
    lapTimes:[],
    runStart:null
  },
  P2: {
    lane:"1",
    x:0,
    y:0,
    angle:0
  }
};
state.plankLength = clamp(state.plankLength, CONFIG.MIN_PLANK, CONFIG.MAX_PLANK);
const MINIGAME_MAPPING = { "B": "balance", "L": "looping", "J": "jump" };
const minigameKeys = {
  P1: { left: ["q","arrowleft"], right: ["d","arrowright"] }
};
const mgCanvases = {
  P1: document.getElementById("minigameCanvas1")
};
const mgCtxs = {
  P1: mgCanvases.P1.getContext("2d")
};
const minigameState = {
  P1: {
    active:false,
    type:null,
    plankAngle:0,
    ballX:0,
    ballSpeed:0,
    balanceTime:0,
    angle:0,
    speed:0,
    completed:false,
    lastTime:0
  }
};
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
[dom.newGameBtn, dom.newGameBtn1].forEach(btn => {
  btn?.addEventListener("click", () => location.reload());
});
const carSprites = {
  P1: new Image(),
  P2: new Image()
};
carSprites.P1.src = "icons/1.png";
carSprites.P2.src = "icons/2.png";


let trackCacheCanvas = null;
let trackCacheCtx = null;
let trackCacheKey = "";


//--------------------
//FUNCTIONSSSSSS
//---------------------





function invalidateTrackCache() {
  trackCacheCanvas = null;
  trackCacheCtx = null;
  trackCacheKey = "";
}

function resetPlayerForStart(player, x, y, extra = {}) {
  Object.assign(player, {
    x,
    y,
    angle: Math.PI / 2,
    ...extra
  });
  ghostPlayback.sampleCursor = 0;
}

function drawTrack() {
  drawTrackToCache();
  if (trackCacheCanvas) {
    ctx.drawImage(trackCacheCanvas, 0, 0);
  }
}

function resetGhostPlayback(overrides = {}) {
  Object.assign(ghostPlayback, createGhostPlaybackState(), overrides);
}

function resetGhostRecord(overrides = {}) {
  Object.assign(ghostRecord, createGhostRecordState(), overrides);
}

function createGhostPlaybackState() {
  return {
    active: false,
    samples: null,
    duration: 0,
    clock: 0,
    paused: false,
    gates: [],
    gateIndices: [],
    resumeRequested: false,
    resumeDelayFrames: 0,
    resumeNudge: 0,
    resumeTargetTime: null,
    returnToStartT: null,
    returningToStart: false,
    segmentCursor: 0,
    skipGateOnce: false,
    segmentReady: false,
    waitingForPlayerTeleport: false,
    hidden: false,
    hardHideFrames: 0,
    poseLock: false,
    sampleCursor: 0,
    justTeleported: false

  };
}
function createGhostRecordState() {
  return {
    active: false,
    samples: [],
    gates: [],
    gateIndices: [],
    lastT: 0,
    lastX: null,
    lastY: null,
    returnToStartT: null
  };
}
function sampleIndexAtOrBeforeTime(samples, t) {
  if (!samples || !samples.length) return 0;
  let idx = 0;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i][0] <= t + 1e-6) idx = i;
    else break;
  }
  return idx;
}
function shouldDrawGhostNow() {
  if (!ghostPlayback.active || !ghostPlayback.samples?.length) return true;
  if (
    ghostPlayback.hidden ||
    ghostPlayback.hardHideFrames > 0 ||
    ghostPlayback.poseLock ||
    ghostPlayback.waitingForPlayerTeleport
  ) {
    return false;
  }
  if (ghostPlayback.returningToStart) {
    return true;
  }
  if (ghostPlayback.resumeRequested) {
    return false;
  }
  const segs = levels[state.currentLevel] || [];
  const segIdx = Math.max(
    0,
    Math.min(segs.length - 1, ghostPlayback.segmentCursor || 0)
  );
  const gateIdx =
  Array.isArray(ghostPlayback.gateIndices)
  ? ghostPlayback.gateIndices[segIdx]
  : null;
  if (!Number.isInteger(gateIdx) || gateIdx < 0) return true;
  const s = ghostPlayback.samples[gateIdx];
  if (!s) return true;
  return ghostPlayback.clock <= s[0] + 0.0005;
}
function isTeleportJumpSamplePair(a, b, jumpThreshold = 2.0) {
  if (!a || !b) return false;
  const dx = b[1] - a[1];
  const dy = b[2] - a[2];
  const dist = Math.hypot(dx, dy);
  return dist >= jumpThreshold;
}
function forceRecordGhostSampleAt(t, x, y, a) {
  if (!ghostRecord.active) return;
  ghostRecord.samples.push({
    t: +t.toFixed(3),
                           x: +x.toFixed(3),
                           y: +y.toFixed(3),
                           a: +a.toFixed(3)
  });
  ghostRecord.lastT = t;
  ghostRecord.lastX = x;
  ghostRecord.lastY = y;
}
function findPercentSpawnForLane(laneChar){ // "1" of "2"
  for (let y=0; y<state.track.length; y++){
    for (let x=0; x<state.track[y].length; x++){
      if (state.track[y][x] === "%" && state.track[y][x+1] === laneChar){
        return { x: x + 0.5, y: y + 0.5 };
      }
    }
  }
  return null;
}
function resetAllStats() {
  const toDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("circuitracer_")) toDelete.push(k);
  }
  toDelete.forEach(k => localStorage.removeItem(k));
  localStorage.setItem("circuitracer_name_p1", "P1");
  localStorage.setItem("circuitracer_name_p2", "Ghost");
  localStorage.setItem("circuitracer_gender_p1", "M");
  localStorage.setItem("circuitracer_car_p1", "1");
  localStorage.setItem("circuitracer_laps", "3");
  resetGhostPlayback();
  resetGhostRecord();
  if (ui.startNameP1) ui.startNameP1.value = "P1";
  if (dom.nameP1) dom.nameP1.value = "P1";
  if (dom.nameP2) dom.nameP2.value = "Ghost";
  if (dom.lapInput) dom.lapInput.value = 3;
  document.querySelectorAll('input[name="genderP1"]').forEach(r => {
    r.checked = (r.value === "M");
  });
  if (ui.driverImg) ui.driverImg.src = "icons/driverM.png";
  setCarP1("1");
  if (typeof renderStats === "function") renderStats();
}
btnResetStats?.addEventListener("click", () => {
  resetAllStats();
});
function nextSampleTimeAfter(samples, t) {
  if (!samples) return null;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i][0] > t + 1e-6) return samples[i][0];
  }
  return null;
}
function setGhostPoseAtTime(p2, t) {
  const samples = ghostPlayback.samples;
  if (!samples || samples.length < 2) return;
  if (t <= samples[0][0]) {
    const s0 = samples[0];
    p2.x = s0[1]; p2.y = s0[2]; p2.angle = s0[3];
    return;
  }
  if (t >= samples[samples.length - 1][0]) {
    const last = samples[samples.length - 1];
    p2.x = last[1]; p2.y = last[2]; p2.angle = last[3];
    return;
  }
  let i = ghostPlayback.sampleCursor || 0;
  if (samples[i]?.[0] > t) i = 0;
  while (i < samples.length - 1 && samples[i + 1][0] < t) {
    i++;
  }

  ghostPlayback.sampleCursor = i;
  const a = samples[i], b = samples[i + 1];
  const tA = a[0], tB = b[0];
  const u = (t - tA) / Math.max(0.0001, (tB - tA));
  const lerp = (v1, v2, u) => v1 + (v2 - v1) * u;
  p2.x = lerp(a[1], b[1], u);
  p2.y = lerp(a[2], b[2], u);
  const angA = a[3], angB = b[3];
  const d = Math.atan2(Math.sin(angB - angA), Math.cos(angB - angA));
  p2.angle = angA + d * u;
}
function updateGhost(p2, dt) {
  if (!ghostPlayback.active || !ghostPlayback.samples?.length) return;
  const samples = ghostPlayback.samples;
  const TELEPORT_JUMP_DIST = 2.0;
  if (ghostPlayback.poseLock) {
    ghostPlayback.hidden = true;
    return;
  }
  if (ghostPlayback.hardHideFrames > 0) {
    ghostPlayback.hardHideFrames--;
    ghostPlayback.hidden = true;
    return;
  }
  if (!players.P1.started) {
    ghostPlayback.clock = 0;
    ghostPlayback.paused = true;
    ghostPlayback.resumeRequested = false;
    ghostPlayback.resumeDelayFrames = 0;
    ghostPlayback.resumeTargetTime = null;
    ghostPlayback.returningToStart = false;
    ghostPlayback.waitingForPlayerTeleport = false;
    ghostPlayback.hidden = false;
    setGhostPoseAtTime(p2, 0);
    return;
  }
  if (ghostPlayback.waitingForPlayerTeleport) {
    ghostPlayback.hidden = true;
    return;
  }
  if (ghostPlayback.resumeRequested) {
    ghostPlayback.resumeDelayFrames = Math.max(
      0,
      (ghostPlayback.resumeDelayFrames || 0) - 1
    );
    if (ghostPlayback.resumeDelayFrames > 0) {
      ghostPlayback.hidden = true;
      return;
    }
    ghostPlayback.resumeRequested = false;
    if (ghostPlayback.resumeTargetTime != null) {
      ghostPlayback.clock = ghostPlayback.resumeTargetTime;
      ghostPlayback.resumeTargetTime = null;
    } else if (ghostPlayback.resumeNudge) {
      ghostPlayback.clock += ghostPlayback.resumeNudge;
      ghostPlayback.resumeNudge = 0;
    }
    ghostPlayback.skipGateOnce = true;
    ghostPlayback.paused = false;
    setGhostPoseAtTime(p2, ghostPlayback.clock);
    if (ghostPlayback.justTeleported) {
      ghostPlayback.hidden = true;
      ghostPlayback.justTeleported = false;
      return;
    }
    ghostPlayback.hidden = !!ghostPlayback.returningToStart;
    return;
  }
  if (ghostPlayback.paused) {
    const segs = levels[state.currentLevel] || [];
    const segIdx = Math.max(
      0,
      Math.min(segs.length - 1, ghostPlayback.segmentCursor || 0)
    );
    const playerLapT =
    players.P1.runStart != null
    ? (performance.now() / 1000) - players.P1.runStart
    : 0;
    const ghostTotal =
    ghostPlayback.duration ||
    samples.at(-1)?.[0] ||
    0;
    if (
      segIdx === 0 &&
      !ghostPlayback.returningToStart &&
      !ghostPlayback.resumeRequested &&
      playerLapT >= ghostTotal
    ) {
      const sTile = findPercentSpawnForLane("1");
      if (sTile) {
        p2.x = sTile.x;
        p2.y = sTile.y;
        p2.angle = Math.PI / 2;
      } else {
        setGhostPoseAtTime(p2, 0);
      }
      ghostPlayback.clock = 0;
      ghostPlayback.hidden = false;
      return;
    }
    ghostPlayback.hidden = true;
    return;
  }
  const prevT = ghostPlayback.clock;
  const nextT = prevT + dt;
  // =========================================
  // Terug naar start
  // =========================================
  if (ghostPlayback.returningToStart) {
    ghostPlayback.clock = nextT;
    const t = ghostPlayback.clock;
    const stopT =
    ghostPlayback.duration ||
    samples.at(-1)?.[0] ||
    null;
    if (stopT != null && t >= stopT) {
      ghostPlayback.clock = stopT;
      setGhostPoseAtTime(p2, stopT);
      ghostPlayback.hidden = true;
      ghostPlayback.paused = true;
      ghostPlayback.returningToStart = false;
      return;
    }
    if (t >= samples[samples.length - 1][0]) {
      const last = samples[samples.length - 1];
      p2.x = last[1];
      p2.y = last[2];
      p2.angle = last[3];
      ghostPlayback.hidden = true;
      ghostPlayback.paused = true;
      ghostPlayback.returningToStart = false;
      return;
    }
    let i = 0;
    while (i < samples.length - 1 && samples[i + 1][0] < t) i++;
    const a = samples[i];
    const b = samples[i + 1];
    if (isTeleportJumpSamplePair(a, b, TELEPORT_JUMP_DIST)) {
      ghostPlayback.clock = a[0];
      p2.x = a[1];
      p2.y = a[2];
      p2.angle = a[3];
      ghostPlayback.hidden = true;
      ghostPlayback.paused = true;
      ghostPlayback.returningToStart = false;
      return;
    }
    const tA = a[0];
    const tB = b[0];
    const u = (t - tA) / Math.max(0.0001, (tB - tA));
    const lerp = (v1, v2, uu) => v1 + (v2 - v1) * uu;
    p2.x = lerp(a[1], b[1], u);
    p2.y = lerp(a[2], b[2], u);
    const angA = a[3];
    const angB = b[3];
    const d = Math.atan2(Math.sin(angB - angA), Math.cos(angB - angA));
    p2.angle = angA + d * u;
    ghostPlayback.hidden = false;
    return;
  }
  const segs = levels[state.currentLevel] || [];
  const segIdx = Math.max(
    0,
    Math.min(segs.length - 1, ghostPlayback.segmentCursor || 0)
  );
  const gateIdx =
  Array.isArray(ghostPlayback.gateIndices)
  ? ghostPlayback.gateIndices[segIdx]
  : null;
  if (!ghostPlayback.skipGateOnce && Number.isInteger(gateIdx) && gateIdx >= 0) {
    const nextIdx = sampleIndexAtOrBeforeTime(samples, nextT);
    if (nextIdx > gateIdx) {
      const s = samples[gateIdx];
      if (s) {
        ghostPlayback.clock = s[0];
        p2.x = s[1];
        p2.y = s[2];
        p2.angle = s[3];
      }
      ghostPlayback.hidden = true;
      ghostPlayback.paused = true;
      ghostPlayback.waitingForPlayerTeleport = true;
      ghostPlayback.poseLock = true;
      return;
    }
  }
  ghostPlayback.skipGateOnce = false;
  ghostPlayback.clock = nextT;
  const t = ghostPlayback.clock;

  if (t >= samples[samples.length - 1][0]) {
    const last = samples[samples.length - 1];
    p2.x = last[1];
    p2.y = last[2];
    p2.angle = last[3];
    ghostPlayback.hidden = false;
    return;
  }

  setGhostPoseAtTime(p2, t);
  ghostPlayback.hidden = false;
  }
function resetP1ForStart(x, y) {
  resetPlayerForStart(players.P1, x, y, {
    started: false,
    lap: 0,
    finishTime: null,
    lastTile: null,
    onStartTile: false,
    minigameCooldownUntil: 0,
    inMinigame: false,
    lapTimes: [],
    bestLap: null,
    runStart: null,
    lapStart: 0,
    canTriggerCheckpoints: false
  });
}
function resetGhostForStart(x, y) {
  resetPlayerForStart(players.P2, x, y, {
    lane: "1"
  });
}
function loadAndArmGhostForCurrentLevel() {
  const lvl = state.currentLevel;
  if (!lvl) {
    resetGhostPlayback({ paused: true });
    return;
  }
  const tiers = ["best", "gold", "silver", "bronze"];
  let g = null;
  for (const t of tiers) {
    g = loadGhost(lvl, t);
    if (g) break;
  }
  if (!g) {
    resetGhostPlayback({ paused: true });
    return;
  }
  resetGhostPlayback({
    active: true,
    samples: g.samples,
    duration: g.time ?? (g.samples.at(-1)?.[0] ?? 0),
    clock: 0,
    paused: true,
    gates: Array.isArray(g.gates) ? g.gates.slice() : [],
    gateIndices: Array.isArray(g.gateIndices) ? g.gateIndices.slice() : [],
    returnToStartT: g.returnToStartT ?? null,
    hidden: false
  });
  const segs = levels[lvl] || [];
  const lastT = ghostPlayback.duration || ghostPlayback.samples.at(-1)?.[0] || 0;
  while (ghostPlayback.gates.length < segs.length) {
    ghostPlayback.gates.push(null);
  }
  if (segs.length >= 2 && ghostPlayback.gates[segs.length - 1] == null) {
    ghostPlayback.gates[segs.length - 1] = +lastT.toFixed(3);
  }
  const s0 = ghostPlayback.samples[0];
  players.P2.x = s0[1];
  players.P2.y = s0[2];
  players.P2.angle = s0[3];
}
function startGhostRecording(){
  ghostRecord.active = true;
  ghostRecord.samples = [];
  ghostRecord.gates = [];
  ghostRecord.gateIndices = [];
  ghostRecord.lastT = 0;
  ghostRecord.lastX = null;
  ghostRecord.lastY = null;
  ghostRecord.returnToStartT = null;
}
function stopGhostRecording(){
  ghostRecord.active = false;
}
function recordGhostSample(){
  if(!ghostRecord.active) return;
  const p = players.P1;
  if(!p.started || p.runStart == null) return;
  const t = (performance.now()/1000) - p.runStart;   // ✅ runStart !!
  const step = 1 / GHOST_HZ;
  if (t - ghostRecord.lastT < step) return;
  if (ghostRecord.lastX != null && ghostRecord.lastY != null) {
    const dx = p.x - ghostRecord.lastX;
    const dy = p.y - ghostRecord.lastY;
    if (Math.hypot(dx, dy) < GHOST_MIN_DIST) {
      ghostRecord.lastT = t;
      return;
    }
  }
  ghostRecord.samples.push({ t, x:p.x, y:p.y, a:p.angle });
  ghostRecord.lastT = t;
  ghostRecord.lastX = p.x;
  ghostRecord.lastY = p.y;
}
function ghostKey(levelName, tier){
  return `circuitracer_ghost_${tier}_${levelName}`;
}
function saveGhost(levelName, tier, time, samples, gates = [], gateIndices = [], returnToStartT = null) {
  const packed = samples.map(s => [
    +s.t.toFixed(3),
                             +s.x.toFixed(3),
                             +s.y.toFixed(3),
                             +s.a.toFixed(3),
  ]);
  const payload = {
    tier,
    time,
    ts: Date.now(),
    samples: packed,
    gates,
    gateIndices,
    returnToStartT
  };
  localStorage.setItem(ghostKey(levelName, tier), JSON.stringify(payload));
}
function loadGhost(levelName, tier = "best") {
  try {
    const raw = localStorage.getItem(ghostKey(levelName, tier));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.samples) || data.samples.length < 2) return null;
    return data;
  } catch {
    return null;
  }
}
function upsertMedalGhost(levelName, tier, time, samples, gates, gateIndices, returnToStartT = null){
  const existing = loadGhost(levelName, tier);
  if (!existing || time < existing.time) {
    saveGhost(levelName, tier, time, samples, gates, gateIndices, returnToStartT);
    return true;
  }
  return false;
}
function hideAllMenus() {
  [
    ui.startMenu,
    ui.statsMenu,
    carSelectMenu,
    dom.trackMenu,
    dom.overlay
  ].forEach(el => {
    if (el) el.style.display = "none";
  });
}
function getGenderP1() {
  const saved = localStorage.getItem(SETTINGS_KEYS.genderP1) || "M";
  return (saved === "V") ? "V" : "M";
}
function setGenderP1(g) {
  localStorage.setItem(SETTINGS_KEYS.genderP1, g);
  ui.driverImg.src = (g === "V") ? "icons/driverV.png" : "icons/driverM.png";
}
function getCarP1() {
  const saved = localStorage.getItem(SETTINGS_KEYS.carP1) || "1";
  const n = parseInt(saved, 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return "1";
  return String(n);
}
function setCarP1(carId) {
  localStorage.setItem(SETTINGS_KEYS.carP1, String(carId));
  if (ui.selectedCarImg) {
    ui.selectedCarImg.src = `icons/${carId}.png`;
    ui.selectedCarImg.alt = `Car ${carId}`;
  }
  if (ui.selectedCarLabel) {
    ui.selectedCarLabel.textContent = `Selected car: ${carId}`;
  }
  carSprites.P1.src = `icons/${carId}.png`;
}
function initStartScreen() {
  const savedName = localStorage.getItem(SETTINGS_KEYS.nameP1) || (dom.nameP1?.value || "P1");
  ui.startNameP1.value = savedName;
  if (dom.nameP1) dom.nameP1.value = savedName;
  ui.startNameP1.addEventListener("input", () => {
    localStorage.setItem(SETTINGS_KEYS.nameP1, ui.startNameP1.value);
    if (dom.nameP1) dom.nameP1.value = ui.startNameP1.value;
  });
    const g = getGenderP1();
    document.querySelectorAll('input[name="genderP1"]').forEach(r => {
      r.checked = (r.value === g);
      r.addEventListener("change", () => setGenderP1(r.value));
    });
    setGenderP1(g);
    ui.carGridOverlay.innerHTML = "";
    const currentCar = getCarP1();
    setCarP1(currentCar);
    for (let i = 1; i <= 5; i++) {
      const img = document.createElement("img");
      img.src = `icons/${i}.png`;
      img.alt = `Car ${i}`;
      if (String(i) === String(currentCar)) img.classList.add("selected");
      img.addEventListener("click", () => {
        ui.carGridOverlay.querySelectorAll("img").forEach(x => x.classList.remove("selected"));
        img.classList.add("selected");
        setCarP1(i);
        if (carSelectMenu) carSelectMenu.style.display = "none";
      });
        ui.carGridOverlay.appendChild(img);
    }

    // buttons
    ui.btnNewRace.addEventListener("click", () => {
      hideAllMenus();
      dom.trackMenu.style.display = "flex";
    });

    ui.btnStats.addEventListener("click", () => {
      hideAllMenus();
      ui.statsMenu.style.display = "flex";
      renderStats();
    });
    ui.btnStatsBack.addEventListener("click", () => {
      hideAllMenus();
      ui.startMenu.style.display = "flex";
    });
    ui.startMenu.style.display = "flex";
    ui.statsMenu.style.display = "none";
    dom.trackMenu.style.display = "none";
}

function readBestLapForTable(tableName) {
  try {
    const raw = localStorage.getItem(`circuitracer_bestlap_${tableName}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.time !== "number") return null;
    return data; // {time, ts, level, table}
  } catch {
    return null;
  }
}
function renderStats() {
  ui.statsList.innerHTML = "";
  Object.keys(levels).forEach(lvl => {
    const tables = levels[lvl];
    let best = null;
    for (const t of tables) {
      const r = readBestLapForTable(t);
      if (!r) continue;
      if (!best || r.time < best.time) best = r;
    }
    const block = document.createElement("div");
    block.className = "statBlock";
    const title = document.createElement("div");
    title.className = "statLvlTitle";
    title.textContent = lvl;
    block.appendChild(title);
    const addLine = (label, value) => {
      const line = document.createElement("div");
      line.className = "statLine";
      const l = document.createElement("span");
      l.className = "label";
      l.textContent = label;
      const v = document.createElement("span");
      v.className = "value";
      v.textContent = value;
      line.appendChild(l);
      line.appendChild(v);
      block.appendChild(line);
    };
    if (!best) {
      addLine("Best time:", "--");
      addLine("When:", "--");
    } else {
      const when = new Date(best.ts).toLocaleString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      addLine("Best time:", formatTime(best.time));
      addLine("When:", when);
    }
    const sep = document.createElement("div");
    sep.className = "statAsciiSep";
    sep.textContent = "==================";
    block.appendChild(sep);

    ui.statsList.appendChild(block);
  });
}
function bestLapKey() {
  return `circuitracer_bestlap_${state.currentTable}`;
}
function loadBestLap() {
  try {
    const raw = localStorage.getItem(bestLapKey());
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.time !== "number") return null;
    return data; // { time, ts, level, table }
  } catch {
    return null;
  }
}
function saveBestLapIfBetter(lapTime) {
  const current = loadBestLap();
  if (!current || lapTime < current.time) {
    const payload = {
      time: lapTime,
      ts: Date.now(),                 // timestamp in ms
      level: state.currentLevel,
      table: state.currentTable
    };
    localStorage.setItem(bestLapKey(), JSON.stringify(payload));
    return payload; // teruggeven is handig voor debug/UI
  }
  return current;
}
function stickForP1(){
  return getCombinedStick();
}
function setPlayersToStart() {
  // ⚠️ vind startpositie van de P1 en P2
  for (let y = 0; y < state.track.length; y++) {
    for (let x = 0; x < state.track[y].length; x++) {
      const tile = state.track[y][x];
      if (tile === "%" && x + 1 < state.track[y].length) {
        const nextTile = state.track[y][x + 1];
        if (nextTile === "1") resetPlayerForStart(players.P1, x + 0.5, y + 0.5);
        if (nextTile === "1") resetPlayerForStart(players.P2, x + 0.5, y + 0.5);
        x++; // overslaan van het volgende teken
      }
    }
  }

}
function startLevel(level){
  hideAllMenus();
  dom.gameWrapper.style.display = "flex";
  state.currentLevel = level;
  state.gameOver = false;
  loadAndArmGhostForCurrentLevel();
  lastTime = performance.now();
  startTrack(levels[level][0]);
}
function countCPFromMap(map) {
  const grid = map.map(row => {
    if (typeof row === "string") return row.split("");
    if (Array.isArray(row) && typeof row[0] === "string" && row.length === 1) return row[0].split("");
    return row; // al goed
  });
  const visited = new Set();
  const cps = { "1": [], "2": [] };
  const key = (x,y)=>`${x},${y}`;
  function flood(x,y){
    const stack=[{x,y}], cluster=[];
    visited.add(key(x,y));
    while(stack.length){
      const c = stack.pop();
      cluster.push(c);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const nx=c.x+dx, ny=c.y+dy;
        if(grid[ny]?.[nx]==="C" && !visited.has(key(nx,ny))){
          visited.add(key(nx,ny));
          stack.push({x:nx,y:ny});
        }
      });
    }
    return cluster;
  }
  for(let y=0;y<grid.length;y++){
    for(let x=0;x<grid[y].length;x++){
      if(grid[y][x]!=="C" || visited.has(key(x,y))) continue;
      const cluster = flood(x,y);
      let lane1=false, lane2=false;
      cluster.forEach(c=>{
        const around=[
          grid[c.y]?.[c.x-1],
          grid[c.y]?.[c.x+1],
          grid[c.y-1]?.[c.x],
          grid[c.y+1]?.[c.x]
        ];
        if(around.includes("1")) lane1=true;
        if(around.includes("2")) lane2=true;
      });

        if (lane1) cps["1"].push({ tileSet: new Set(cluster.map(c => `${c.x},${c.y}`)) });
        if (lane2) cps["2"].push({ tileSet: new Set(cluster.map(c => `${c.x},${c.y}`)) });
    }
  }
  return cps;
}
function startTrack(levelName) {
  const trackMenu = dom.trackMenu;
  if (trackMenu) trackMenu.style.display = "none";
  dom.gameWrapper.style.display = "flex";
  const raw = tracks[levelName];
  if (!raw) {
    console.warn("Track niet gevonden:", levelName);
    return;
  }
  state.activeTrack = buildTrackData(levelName, raw);
  state.track = state.activeTrack.map;
  state.currentTable = levelName;
  initLevelCheckpoints(state.currentLevel);
  const subIndex = levels[state.currentLevel].indexOf(levelName);
  if (subIndex === 0) {
    state.activeTrack.checkpoints = state.levelCheckpointState[state.currentLevel].persistent;
  } else {
    const cps = countCPFromMap(state.activeTrack.map);
    state.activeTrack.checkpoints = {
      "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
      "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
    };
  }
  const ghostActive = !!(ghostPlayback.active && ghostPlayback.samples?.length);
  if (!ghostActive) {
    setPlayersToStart();
  } else {
    for (let y = 0; y < state.track.length; y++) {
      for (let x = 0; x < state.track[y].length; x++) {
        const tile = state.track[y][x];

        if (tile === "%" && x + 1 < state.track[y].length) {
          const nextTile = state.track[y][x + 1];

          if (nextTile === "1") {
            resetP1ForStart(x + 0.5, y + 0.5);
          }

          x++;
        }
      }
    }
  }
  players.P1.lapTimes = [];
  resizeCanvas();
  checkOrientation();
  if (!window.__gameLoopRunning) {
    window.__gameLoopRunning = true;
    requestAnimationFrame(loop);
  }
  invalidateTrackCache();

}
function buildTrackData(name, rawTrack) {
  const map = rawTrack.map.map(row => {
    if (typeof row === "string") return row.split("");
    if (Array.isArray(row) && typeof row[0] === "string") return row[0].split("");
    return row;
  });
  return { name, map };
}
function determineLane(x, y, currentLane) {
  const t = tileAt(x, y);
  if (t === "1") return "1";
  if (t === "2") return "2";
  return currentLane;
}
function getNextSubLevel() {
  const sections = levels[state.currentLevel];
  const idx = sections.indexOf(state.currentTable);
  const nextIndex = (idx + 1) % sections.length;
  return sections[nextIndex];
}
function selectTrack(name, level = null, customSpawn = {}, preservePlayerState = false) {
  const raw = tracks[name];
  if (!raw) { console.warn("Track not found:", name); return; }
  state.activeTrack = buildTrackData(name, raw);
  state.track = state.activeTrack.map;
  if (level) state.currentLevel = level;
  state.currentTable = name;
  initLevelCheckpoints(state.currentLevel);
  invalidateTrackCache();
  const subIndex = levels[state.currentLevel].indexOf(name);
  if (subIndex === 0) {
    state.activeTrack.checkpoints = state.levelCheckpointState[state.currentLevel].persistent;
  } else {
    const cps = countCPFromMap(state.activeTrack.map);
    state.levelCheckpointState[state.currentLevel].dynamic = {
      "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
      "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
    };
    state.activeTrack.checkpoints = state.levelCheckpointState[state.currentLevel].dynamic;
  }
  // -------------------------
  // Spelerspositionering
  // -------------------------
  const ghostActive = !!(ghostPlayback.active && ghostPlayback.samples?.length);
  let p1Set = false,  p2Set = false;
  if (customSpawn.P1) {
    Object.assign(players.P1, { ...customSpawn.P1, angle: Math.PI / 2 });
    p1Set = true;
  }
  if (customSpawn.P2 && !ghostActive) {
    Object.assign(players.P2, { ...customSpawn.P2, angle: Math.PI / 2 });
    p2Set = true;
  }
  if (!preservePlayerState) {
    for (let y = 0; y < state.track.length && (!p1Set || !p2Set); y++) {
      for (let x = 0; x < state.track[y].length && (!p1Set || !p2Set); x++) {
        const tile = state.track[y][x];
        if (tile === "P" && x + 1 < state.track[y].length) {
          const nextTile = state.track[y][x + 1];
          if (nextTile === "1" && !p1Set) {
            Object.assign(players.P1, { x: x + 0.5, y: y + 0.5, angle: Math.PI / 2 });
            p1Set = true;
          }
          if (nextTile === "1" && !p2Set && !ghostActive) {
            Object.assign(players.P2, { x: x + 0.5, y: y + 0.5, angle: Math.PI / 2 });
            p2Set = true;
          }
          x++;
        }
      }
    }
  }
  if (!preservePlayerState) {
    if (!p1Set) Object.assign(players.P1, { x: 1, y: 1, angle: -Math.PI / 2 });
    if (!p2Set && !ghostActive) Object.assign(players.P2, { x: 2, y: 1, angle: -Math.PI / 2 });
  }
  players.P1.lane = determineLane(Math.floor(players.P1.x), Math.floor(players.P1.y), "1");
  if (!ghostActive) {
    players.P2.lane = determineLane(Math.floor(players.P2.x), Math.floor(players.P2.y), "2");
  } else {
    players.P2.lane = "2";
  }
  if (ghostActive && !state.teleporting && !ghostPlayback.poseLock) {
    setGhostPoseAtTime(players.P2, ghostPlayback.clock || 0);
  }
  resizeCanvas();
  checkOrientation();
  if (!window.__gameLoopRunning) {
    window.__gameLoopRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}
function resizeMinigameCanvas(pName){
  if (pName !== "P1") return;
  const panel = dom.panelP1;
  const canvasMG = mgCanvases.P1;
  canvasMG.width  = panel.clientWidth - 12;
  canvasMG.height = panel.clientHeight - 20;
  const desired = canvasMG.width * 0.65;
  state.plankLength = clamp(desired, CONFIG.MIN_PLANK, CONFIG.MAX_PLANK);
}
const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
&& window.innerWidth <= 900;
function checkOrientation() {
  const warning = dom.rotateWarning;
  const gameWrapper = dom.gameWrapper;
  const mobileControls = dom.mobileControls;
  if (isMobile && window.innerHeight > window.innerWidth) {
    warning.style.display = "flex";
    gameWrapper.style.display = "none";
    mobileControls.style.display = "none";
  } else {
    warning.style.display = "none";
    gameWrapper.style.display = "flex";
    mobileControls.style.display = isMobile ? "flex" : "none";
    resizeCanvas();  // 🔑 ensure minigames scale correctly
  }
}
function initLevelCheckpoints(level) {
  if (state.levelCheckpointState[level]) return;
  const firstSub = levels[level][0];
  const raw = tracks[firstSub];
  if (!raw) return;
  const built = buildTrackData(firstSub, raw);   // ✅ maakt 2D char-map
  const cps = countCPFromMap(built.map);
  state.levelCheckpointState[level] = {
    persistent: {
      "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
      "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
    }
  };
}
function resizeCanvas() {
  if (!state.track) return;

  const gameWidth  = state.track[0].length * CONFIG.TILE_SIZE;
  const gameHeight = state.track.length * CONFIG.TILE_SIZE;

  canvas.width  = gameWidth;
  canvas.height = gameHeight;

  invalidateTrackCache();

  const wrapper = dom.gameWrapper;
  const vw = window.innerWidth;
  const vh = wrapper.clientHeight || window.innerHeight;

  const scale = Math.min(vw / gameWidth, vh / gameHeight);

  canvas.style.width  = (gameWidth * scale) + "px";
  canvas.style.height = (gameHeight * scale) + "px";

  positionMinigamePanel("P1");
}

window.addEventListener("resize", checkOrientation);

window.addEventListener("orientationchange", checkOrientation);

function tileAt(x, y) {
  const t = state.track;
  if (t?.[y]?.[x] !== undefined) return t[y][x];
  return null;
}

function startMinigame(pName, tileChar) {
  pName = "P1";

  const mgType = MINIGAME_MAPPING[tileChar];
  if (!mgType || players.P1.inMinigame) return;

  players.P1.inMinigame = true;
  players.P1.minigameCooldown = true;
  dom.minigameOverlay.style.display = "flex";

  const callback = () => {
    const p = players.P1;
    p.minigameCooldownUntil = performance.now() + 350;

    const exit = findExitForLane(p.lane);
    if (exit) {
      p.x = exit.x + 0.5;
      p.y = exit.y + 0.5;
    }

    dom.minigameOverlay.style.display = "none";
    p.inMinigame = false;
    p.minigameCooldown = false;
  };

  switch (mgType) {
    case "balance":
      startBalanceMinigame("P1", callback);
      break;
    case "looping":
      startLoopingMinigame("P1", callback);
      break;
    case "jump":
      startJumpMinigame("P1", callback);
      break;
  }
}

//-----------------------MINIGAME Functies------------------------------
function startBalanceMinigame(pName, callback){
  const mg = minigameState[pName];
  if(mg.active) return;
  mg.active = true;
  mg.plankAngle = 0;
  mg.ballX = (-state.plankLength / 2) * 0.7;
  mg.ballSpeed = 0;
  mg.balanceTime = 0;
  mg.completed = false;
  mg.lastTime = performance.now();
  const panel = document.getElementById("panelP1");
  panel.style.display = "flex";
  positionMinigamePanel(pName);
  function anim(){
    if(!mg.active){
      panel.style.display = "none";
      if(callback) callback();
      return;
    }
    animateBalanceMinigame(pName);
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}
// ----------------------------------------
// animate BALANCE minigame
function animateBalanceMinigame(pName) {
  const canvasMG = mgCanvases[pName];
  const ctxMG = mgCtxs[pName];
  const mg = minigameState[pName];
  const now = performance.now();
  const dt = Math.min(0.05, (now - mg.lastTime) / 1000);
  mg.lastTime = now;
  ctxMG.clearRect(0, 0, canvasMG.width, canvasMG.height);
  const angleRad = mg.plankAngle * Math.PI / 180;
  let input = 0;
  const keyset = minigameKeys[pName];
  if (keyset.left.some(k => keys[k])) input -= 1;
  if (keyset.right.some(k => keys[k])) input += 1;
  input += stickForP1().x;
  mg.plankAngle += input * 120 * dt;
  mg.plankAngle = Math.max(-CONFIG.MAX_ANGLE, Math.min(CONFIG.MAX_ANGLE, mg.plankAngle));
  const halfPlank = state.plankLength / 2;
  const gravityScale = Math.min(1.3, Math.max(0.7, state.plankLength / CONFIG.BASE_PLANK));
  mg.ballSpeed += CONFIG.GRAVITY * gravityScale * Math.sin(angleRad) * dt;
  mg.ballSpeed *= CONFIG.FRICTION;
  mg.ballX += mg.ballSpeed * dt;
  // clamp ball
  if (mg.ballX < -halfPlank) { mg.ballX = -halfPlank; mg.ballSpeed = 0; }
  if (mg.ballX >  halfPlank) { mg.ballX =  halfPlank; mg.ballSpeed = 0; }
  // === BALANCE CHECK ===
  const inZone = Math.abs(mg.ballX) < CONFIG.BALANCE_ZONE;
  mg.balanceTime = inZone ? (mg.balanceTime + dt) : 0;
  const timeLeft = Math.max(0, CONFIG.BALANCE_DURATION - mg.balanceTime);
  if (mg.balanceTime >= CONFIG.BALANCE_DURATION) {
    mg.completed = true;
    mg.active = false;
    return;
  }
  // === DRAW PLANK ===
  ctxMG.save();
  ctxMG.translate(canvasMG.width / 2, canvasMG.height / 2);
  ctxMG.rotate(angleRad);
  ctxMG.strokeStyle = "#fff";
  ctxMG.lineWidth = 6;
  ctxMG.beginPath();
  ctxMG.moveTo(-halfPlank, 0);
  ctxMG.lineTo(halfPlank, 0);
  ctxMG.stroke();
  // ball
  ctxMG.fillStyle = inZone ? "#00ff00" : "#ff8800";
  ctxMG.beginPath();
  ctxMG.arc(mg.ballX, -14, 10, 0, Math.PI * 2);
  ctxMG.fill();
  ctxMG.restore();
  // countdown
  ctxMG.fillStyle = "#fff";
  ctxMG.font = `${Math.floor(canvasMG.height / 6)}px monospace`;
  ctxMG.textAlign = "center";
  ctxMG.textBaseline = "top";
  ctxMG.fillText(timeLeft.toFixed(1) + "s", canvasMG.width / 2, 10);
}
//-----------------------------------------------------
function startLoopingMinigame(pName, callback) {
  const mg = minigameState[pName];
  if (mg.active) return;
  mg.active = true;
  mg.completed = false;
  mg.lastTime = performance.now();
  const panel = document.getElementById("panelP1");
  panel.style.display = "flex";
  positionMinigamePanel(pName);
  const canvasMG = mgCanvases[pName];
  const ctxMG = mgCtxs[pName];
  const radius = Math.min(canvasMG.width, canvasMG.height) / 2 - 20;
  const centerX = canvasMG.width / 2;
  const centerY = canvasMG.height / 2;
  // start links
  mg.angle = Math.PI;
  mg.speed = 0;
  // ---- TUNABLES (dt-based) ----
  const GRAVITY = 8.0;        // 4.5 - 8.0
  const MAX_SPEED = 4.0;     // clamp
  const PUMP_STRENGTH = 1;  // 2.5 - 5.0
  const ball = { radius: 15, color: "yellow" };
  // lokale input listeners (zodat minigame niet je globale keys stuk maakt)
  const keysLocal = {};
  function keyDown(e){ keysLocal[e.key.toLowerCase()] = true; }
  function keyUp(e){ keysLocal[e.key.toLowerCase()] = false; }
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  function drawZones() {
    // boven groen
    ctxMG.fillStyle = "rgba(0,255,0,0.3)";
    ctxMG.beginPath();
    ctxMG.moveTo(centerX, centerY);
    ctxMG.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctxMG.closePath();
    ctxMG.fill();
    // onder rood
    ctxMG.fillStyle = "rgba(255,0,0,0.3)";
    ctxMG.beginPath();
    ctxMG.moveTo(centerX, centerY);
    ctxMG.arc(centerX, centerY, radius, 0, Math.PI, false);
    ctxMG.closePath();
    ctxMG.fill();
  }
  function cleanupAndExit() {
    panel.style.display = "none";
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    if (callback) callback(); // callback teleporteert + sluit overlay bij jou
  }
  function anim() {
    if (!mg.active) return cleanupAndExit();
    const now = performance.now();
    const dt = Math.min(0.033, (now - mg.lastTime) / 1000);
    mg.lastTime = now;
    ctxMG.clearRect(0, 0, canvasMG.width, canvasMG.height);
    // input: up/down + joystick y
    let input = 0;
    if (keysLocal["z"] || keysLocal["arrowup"]) input -= 1;
    if (keysLocal["s"] || keysLocal["arrowdown"]) input += 1;
    input += stickForP1().y;
    // dt-based physics
    mg.speed += GRAVITY * Math.sin(mg.angle) * dt;
    mg.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, mg.speed));
    mg.angle += (mg.speed + input * PUMP_STRENGTH) * dt;
    // draw
    const ballX = centerX + radius * Math.cos(mg.angle);
    const ballY = centerY + radius * Math.sin(mg.angle);
    drawZones();
    ctxMG.strokeStyle = "#fff";
    ctxMG.lineWidth = 3;
    ctxMG.beginPath();
    ctxMG.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctxMG.stroke();
    ctxMG.fillStyle = ball.color;
    ctxMG.beginPath();
    ctxMG.arc(ballX, ballY, ball.radius, 0, Math.PI * 2);
    ctxMG.fill();
    ctxMG.fillStyle = "white";
    ctxMG.font = "bold 18px Arial";
    ctxMG.textAlign = "center";
    ctxMG.fillText("Press UP/DOWN", centerX, centerY + 5);
    ctxMG.fillText("to PUMP!", centerX, centerY + 25);
    // ✅ success: top zone (12 o'clock) i.p.v. "rechts"
    const a = (mg.angle + 2 * Math.PI) % (2 * Math.PI);
    const TOP = 3 * Math.PI / 2;
    const diff = Math.atan2(Math.sin(a - TOP), Math.cos(a - TOP));
    if (Math.abs(diff) <= Math.PI / 8) {
      mg.completed = true;
      mg.active = false;
      // laat callback teleport doen
      return cleanupAndExit();
    }
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}
//-----------------------------------------------------
function startJumpMinigame(pName, callback) {
  const mg = minigameState[pName];
  if (mg.active) return;
  mg.active = true;
  mg.completed = false;
  mg.lastTime = performance.now();
  const panel = document.getElementById("panelP1");
  panel.style.display = "flex";
  positionMinigamePanel(pName);
  const canvas = mgCanvases[pName];
  const ctx = mgCtxs[pName];
  const barWidth = canvas.width * 0.8;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height / 2;
  const zones = (() => {
    const redWidth = barWidth * 0.4;
    const greenWidth = barWidth * 0.2;
    return {
      leftRed:  { x: barX,                          w: redWidth },
      green:    { x: barX + redWidth,               w: greenWidth },
      rightRed: { x: barX + redWidth + greenWidth,  w: redWidth }
    };
  })();
  const BASE_SPEED = canvas.width * 0.6;
  const arrow = { x: barX, w: 10, speed: BASE_SPEED, dir: 1 };
  const JUMP_THRESHOLD = -0.35;
  let prevStickY = 0;
  let prevKeyDown = false;
  let crashLockUntil = 0;
  const isJumpKeyDown = () =>
  (keys["z"] || keys["arrowup"] || keys["i"] || keys["8"]);
  function resetAttempt(now, s, keyDown) {
    arrow.x = barX;
    arrow.dir = 1;
    arrow.speed = BASE_SPEED;
    prevStickY = s.y;
    prevKeyDown = keyDown;
    crashLockUntil = now + 250;
  }
  function endMinigame() {
    mg.active = false;
    panel.style.display = "none";
    players[pName].lastTile = null;
    if (callback) callback();
  }
  function anim() {
    if (!mg.active) return;
    const now = performance.now();
    const dt = Math.min(0.03, (now - mg.lastTime) / 1000);
    mg.lastTime = now;
    // arrow move: ALTIJD
    arrow.x += arrow.speed * arrow.dir * dt;
    if (arrow.x <= barX) arrow.dir = 1;
    if (arrow.x + arrow.w >= barX + barWidth) arrow.dir = -1;
    const s = stickForP1();
    const keyDown = isJumpKeyDown();
    const locked = now < crashLockUntil;
    if (!locked) {
      const joystickEdge = prevStickY >= JUMP_THRESHOLD && s.y < JUMP_THRESHOLD;
      const keyEdge = !prevKeyDown && keyDown;
      if (joystickEdge || keyEdge) {
        const left = arrow.x;
        const right = arrow.x + arrow.w;
        const inLeftRed  = right <= zones.leftRed.x + zones.leftRed.w;
        const inRightRed = left  >= zones.rightRed.x;
        const crash = inLeftRed || inRightRed;
        if (crash) {
          resetAttempt(now, s, keyDown);
        } else {
          endMinigame();
          return;
        }
      }
    }
    prevStickY = s.y;
    prevKeyDown = keyDown;
    // DRAW
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fillRect(zones.leftRed.x,  barY, zones.leftRed.w,  barHeight);
    ctx.fillRect(zones.rightRed.x, barY, zones.rightRed.w, barHeight);
    ctx.fillStyle = "green";
    ctx.fillRect(zones.green.x, barY, zones.green.w, barHeight);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = "white";
    ctx.fillRect(arrow.x, barY - 15, arrow.w, barHeight + 30);
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PUSH UP!", canvas.width / 2, barY - 30);
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);
}
//--------------------------------------------
function positionMinigamePanel(pName){
  // ✅ enkel P1 minigame tonen
  if (pName !== "P1") return;

  const panel = dom.panelP1;
  if (!panel) return;
  const canvasRect = canvas.getBoundingClientRect();
  const PANEL_W = Math.max(260, canvasRect.width - 20);
  const PANEL_H = Math.max(180, canvasRect.height * 0.85);
  panel.style.width = PANEL_W + "px";
  panel.style.height = PANEL_H + "px";
  panel.style.left = (canvasRect.left + (canvasRect.width - PANEL_W) / 2) + "px";
  panel.style.top  = (canvasRect.top  + (canvasRect.height - PANEL_H) / 2) + "px";
  resizeMinigameCanvas("P1");
}
function findExitForLane(lane){
  for(let y = 0; y < state.track.length; y++){
    for(let x = 0; x < state.track[y].length; x++){
      if(state.track[y][x] !== "<") continue;
      const around = [
        tileAt(x-1,y),
        tileAt(x+1,y),
        tileAt(x,y-1),
        tileAt(x,y+1)
      ];
      if (
        (lane === "1" && around.includes("1")) ||
        (lane === "2" && around.includes("2"))
      ) {
        return { x: x + 1, y };
      }
    }
  }
  return null;
}
// === Input ===
const keys = {};
window.addEventListener("keydown", e=>keys[e.key.toLowerCase()]=true);
window.addEventListener("keyup", e=>keys[e.key.toLowerCase()]=false);
const sticks = {
  P1: { x:0, y:0 },
  P2: { x:0, y:0 }
};
function setupStick(stickId, player){
  const stick = document.getElementById(stickId);
  if (!stick) return;

  const knob = stick.querySelector(".knob");
  if (!knob) return;

  const radius = 50;

  function start(e){
    e.preventDefault();
    move(e);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", end);
  }
  function move(e){
    if(!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    const rect = stick.getBoundingClientRect();
    let dx = t.clientX - (rect.left + rect.width/2);
    let dy = t.clientY - (rect.top + rect.height/2);
    const len = Math.hypot(dx, dy);
    if(len > radius){
      dx = dx/len * radius;
      dy = dy/len * radius;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    sticks[player].x = dx / radius;
    sticks[player].y = dy / radius;
  }
  function end(){
    sticks[player].x = 0;
    sticks[player].y = 0;
    knob.style.transform = "translate(-50%,-50%)";
    window.removeEventListener("touchmove", move);
    window.removeEventListener("touchend", end);
  }
  stick.addEventListener("touchstart", start);
}
setupStick("stickP1", "P1");
setupStick("stickP2", "P2");
function getCombinedStick(){
  return {
    x: Math.max(-1, Math.min(1, sticks.P1.x + sticks.P2.x)),
    y: Math.max(-1, Math.min(1, sticks.P1.y + sticks.P2.y))
  };
}
// === update speler ===
function updatePlayer(p, dt){
  if(p.inMinigame) return;
  let ax=0, ay=0;
  for(const k in p.keys){
    if(keys[k]){
      ax += p.keys[k][0];
      ay += p.keys[k][1];
    }
  }
  let s = {x:0, y:0};
  if (p === players.P1) {
    s = getCombinedStick();
    recordGhostSample();
  }
  ax += s.x;
  ay += s.y;
  const len = Math.hypot(ax, ay);
  if(len > 0){
    ax /= len;
    ay /= len;
    p.angle = Math.atan2(ay, ax);
  }
  const speedX = ax * CONFIG.SPEED * dt / CONFIG.TILE_SIZE;
  const speedY = ay * CONFIG.SPEED * dt / CONFIG.TILE_SIZE;
  const steps = Math.ceil(Math.max(Math.abs(speedX), Math.abs(speedY)) * 2);
  for (let i = 1; i <= steps; i++) {
    const nx = p.x + speedX * i / steps;
    const ny = p.y + speedY * i / steps;
    if (walkableTile(p, nx, p.y)) p.x = nx;
    if (walkableTile(p, p.x, ny)) p.y = ny;
  }
  const lane = determineLane(
    Math.floor(p.x),
    Math.floor(p.y),
    p.lane
  );
  if (lane && lane !== p.lane) {
    p.lane = lane;
  }
  const pName = (p === players.P1) ? "P1" : "P2";
  checkTriggers(p, performance.now()/1000, pName);
}
// === Check triggers ===
function checkTriggers(p, now, pName) {
  if (!state.activeTrack) return;
  // checkpoints kunnen even null zijn (bv. net na load). Triggers zoals start/ghost moeten nog kunnen.
  if (!state.activeTrack.checkpoints) {
    p.lastTile = tileAt(Math.floor(p.x), Math.floor(p.y));
    return;
  }
  const tx = Math.floor(p.x);
  const ty = Math.floor(p.y);
  const tile = tileAt(tx, ty);
  // always keep lastTile updated on early exit
  if (state.gameOver || p.inMinigame) {
    p.lastTile = tile;
    return;
  }
  // ✅ ensure Sets
  Object.values(state.activeTrack.checkpoints).forEach(laneCps => {
    laneCps.forEach(cp => { if (!cp.hitByPlayer) cp.hitByPlayer = new Set(); });
  });
  const playerTile = `${tx},${ty}`;
  const laneCps = state.activeTrack.checkpoints[p.lane] || [];
  // =====
  // CHECKPOINT HIT
  // =======================
  if (p.canTriggerCheckpoints) {
    for (const cp of laneCps) {
      if (cp.hitByPlayer.has(pName)) continue;
      if (cp.tileSet.has(playerTile)) {
        cp.hitByPlayer.add(pName);
        break;
      }
    }
  }
  // =======================
  // START / FINISH
  // =======================
  if (tile === "S") {
    if (!p.onStartTile) {
      p.onStartTile = true;
      p.canTriggerCheckpoints = false;
      // ---- FIRST START ----
      if (!p.started) {
        p.started = true;
        p.lap = 1;
        // (lapStart mag blijven bestaan voor compat, maar runStart is de echte timer)
        p.lapStart = now;
        p.runStart = now;
        p.segmentStart = now;
        if (pName === "P1") {
          startGhostRecording();
          if (ghostPlayback.active && ghostPlayback.samples?.length) {
            ghostPlayback.clock = 0;
            ghostPlayback.paused = false;
            ghostPlayback.segmentCursor = 0;
            ghostPlayback.hidden = false;
            ghostPlayback.returningToStart = false;
            ghostPlayback.resumeRequested = false;
            ghostPlayback.resumeDelayFrames = 0;
            ghostPlayback.resumeTargetTime = null;
            ghostPlayback.skipGateOnce = false;
            ghostPlayback.waitingForPlayerTeleport = false;
            const s0 = ghostPlayback.samples[0];
            players.P2.x = s0[1];
            players.P2.y = s0[2];
            players.P2.angle = s0[3];
          }
        }
        p.lastTile = tile;
        return;
      }
      // ---- LAP COMPLETE (ALL CHECKPOINTS) ----
      const allHit = laneCps.length > 0 && laneCps.every(cp => cp.hitByPlayer.has(pName));
      if (allHit) {
        const lapTime = now - p.runStart;
        if (pName === "P1" && ghostRecord.active) {
          forceRecordGhostSampleAt(
            lapTime,
            players.P1.x,
            players.P1.y,
            players.P1.angle
          );
        }
        p.lapTimes.push(lapTime);
        // session best
        if (p.bestLap === null || lapTime < p.bestLap) p.bestLap = lapTime;

        saveBestLapIfBetter(lapTime);

        // ✅ save ghost (incl. gates) + stop recording
        if (pName === "P1") {
          const segs = levels[state.currentLevel] || [];
          const finalT = lapTime;
          const gates = (ghostRecord.gates || []).slice();
          while (gates.length < segs.length) gates.push(null);
          if (segs.length >= 2 && gates[segs.length - 1] == null) {
            gates[segs.length - 1] = +finalT.toFixed(3);
          }
          upsertMedalGhost(
            state.currentLevel,
            "best",
            lapTime,
            ghostRecord.samples,
            gates,
            ghostRecord.gateIndices || [],
            ghostRecord.returnToStartT
          );
          stopGhostRecording();
        }
        const maxLaps = parseInt(dom.lapInput.value, 10);
        if (p.lap >= maxLaps) {
          p.finishTime = now;
          state.gameOver = true;
          showWinner();
          p.lastTile = tile;
          return;
        }
        // ✅ next lap
        p.lap++;
        p.lapStart = now;
        p.runStart = now;
        p.segmentStart = now;
        // ✅ start new ghost recording for next lap + reset playback clock
        if (pName === "P1") {
          startGhostRecording();
          if (ghostPlayback.active) {
            ghostPlayback.clock = 0;
            ghostPlayback.paused = false;
            ghostPlayback.segmentCursor = 0;
            ghostPlayback.returningToStart = false;
            ghostPlayback.resumeRequested = false;
            ghostPlayback.resumeDelayFrames = 0;
            ghostPlayback.resumeTargetTime = null;
            ghostPlayback.skipGateOnce = false;
            ghostPlayback.hidden = false;
          }
        }
        // reset CP for that player
        resetCheckpointsForPlayer(p.lane, pName);
        // ✅ re-arm minigame trigger
        p.lastTile = null;
        return;
      }
    }
  } else if (p.onStartTile) {
    p.onStartTile = false;
    p.canTriggerCheckpoints = true;
  }
  // ======================
  // MINIGAME (edge detect only)
  // =======================
  if (pName === "P1" && tile === ">" && p.lastTile !== ">") {
    const nextTile = tileAt(tx + 1, ty);
    if (["B", "J", "L"].includes(nextTile)) {
      startMinigame(pName, nextTile);
      // lock until you leave '>'
      p.lastTile = ">";
      return;
    }
  }
  // =======================
  // TELEPORT (M-tile)
  // =======================
  if (tile === "M" && !state.teleporting) {
    state.teleporting = true;
    ghostPlayback.hidden = true;
    ghostPlayback.hardHideFrames = 3;
    ghostPlayback.justTeleported = true;
    ghostPlayback.poseLock = true;
    ghostPlayback.paused = true;
    const segs = levels[state.currentLevel] || [];
    const prevTable = state.currentTable;
    const prevSegIdx = segs.indexOf(prevTable);
    const next = getNextSubLevel();
    const nextSegIdx = segs.indexOf(next);
    const goingBackToFirst = (nextSegIdx === 0);
    // ===== RECORD gate (1x per M) =====
    if (pName === "P1" && ghostRecord.active && p.runStart != null) {
      const tGate = +(now - p.runStart).toFixed(3);
      ghostRecord.gates.push(tGate);
      const lastIdx = Math.max(0, ghostRecord.samples.length - 1);
      ghostRecord.gateIndices.push(lastIdx);
    }
    // ===== PLAYBACK teleport behaviour =====
    if (ghostPlayback.active && ghostPlayback.samples?.length) {
      const p1LapT =
      (players.P1.runStart != null)
      ? (now - players.P1.runStart)
      : 0;
      const ghostTotal =
      ghostPlayback.duration ||
      (ghostPlayback.samples.at(-1)?.[0] ?? 0);
      if (goingBackToFirst) {
        // ========= *_2 -> *_1 =========
        const gateT =
        ghostPlayback.gates?.[prevSegIdx] ??
        ghostPlayback.clock;

        const resumeT =
        ghostPlayback.returnToStartT ??
        nextSampleTimeAfter(ghostPlayback.samples, gateT) ??
        gateT;
        if (p1LapT < ghostTotal) {
          // speler nog sneller → ghost moet nog stuk naar finish rijden
          ghostPlayback.paused = true;
          ghostPlayback.resumeRequested = true;
          ghostPlayback.resumeDelayFrames = 2;
          ghostPlayback.resumeTargetTime = resumeT;
          ghostPlayback.resumeNudge = 0;
          ghostPlayback.skipGateOnce = true;
          ghostPlayback.returningToStart = true;
        } else {
          // ghost was al klaar: clock resetten, maar pose nog NIET visueel zetten
          ghostPlayback.clock = 0;
          ghostPlayback.paused = true;
          ghostPlayback.resumeRequested = false;
          ghostPlayback.resumeDelayFrames = 0;
          ghostPlayback.resumeTargetTime = null;
          ghostPlayback.resumeNudge = 0;
          ghostPlayback.skipGateOnce = false;
          ghostPlayback.returningToStart = false;
          ghostPlayback.hidden = false;
        }
      } else {
        const gateT =
        ghostPlayback.gates?.[prevSegIdx] ??
        ghostPlayback.clock;
        const resumeT =
        nextSampleTimeAfter(ghostPlayback.samples, gateT) ||
        gateT;
        ghostPlayback.paused = true;
        ghostPlayback.resumeRequested = true;
        ghostPlayback.resumeDelayFrames = 2;
        ghostPlayback.resumeTargetTime = resumeT;
        ghostPlayback.resumeNudge = 0;
        ghostPlayback.skipGateOnce = true;
        ghostPlayback.returningToStart = false;
      }
    }
    // ===== DO THE MAP SWITCH =====
    const customSpawn = {
      P1: findExitForLane(players.P1.lane),
      P2: null
    };
    selectTrack(next, state.currentLevel, customSpawn, false);
    // ===== forced ghost sample na teleport =====
    let tAfterTeleport = null;
    if (
      pName === "P1" &&
      ghostRecord.active &&
      p.runStart != null
    ) {
      tAfterTeleport =
      ((performance.now() / 1000) - p.runStart) + 0.001;
      forceRecordGhostSampleAt(
        tAfterTeleport,
        players.P1.x,
        players.P1.y,
        players.P1.angle
      );
      if (goingBackToFirst && tAfterTeleport != null) {
        ghostRecord.returnToStartT =
        +tAfterTeleport.toFixed(3);
      }
    }
    // ===== segment cursor updaten =====
    if (ghostPlayback.active) {
      ghostPlayback.segmentCursor =
      levels[state.currentLevel].indexOf(state.currentTable);
      ghostPlayback.waitingForPlayerTeleport = false;
    }
    // ===== After teleport: ghost visueel plaatsen =====
    if (ghostPlayback.active && ghostPlayback.samples?.length) {
      const p1LapT =
      (players.P1.runStart != null)
      ? ((performance.now() / 1000) - players.P1.runStart)
      : 0;
      const ghostTotal =
      ghostPlayback.duration ||
      (ghostPlayback.samples.at(-1)?.[0] ?? 0);
      if (goingBackToFirst) {
        const sTile = findPercentSpawnForLane("2");
        if (p1LapT < ghostTotal) {
          ghostPlayback.paused = true;
          ghostPlayback.hidden = false;
        } else {
          // ghost was al sneller klaar -> terug naar start/wachtpositie
          if (sTile) {
            players.P2.x = sTile.x;
            players.P2.y = sTile.y;
            players.P2.angle = Math.PI / 2;
          } else {
            setGhostPoseAtTime(players.P2, 0);
          }
          ghostPlayback.clock = 0;
          ghostPlayback.paused = true;
          ghostPlayback.resumeRequested = false;
          ghostPlayback.resumeDelayFrames = 0;
          ghostPlayback.resumeTargetTime = null;
          ghostPlayback.resumeNudge = 0;
          ghostPlayback.skipGateOnce = false;
          ghostPlayback.returningToStart = false;
          ghostPlayback.hidden = false;
        }
      } else {
        // *_1 -> *_2
        // ook hier NIET manueel tonen tijdens resume
        ghostPlayback.paused = true;
        ghostPlayback.hidden = true;
      }
    }
    players.P1.lastTile = null;
    players.P2.lastTile = null;
    if (players.P1.started) {
      players.P1.segmentStart = performance.now() / 1000;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        state.teleporting = false;
        ghostPlayback.poseLock = false;
      });
    });
    return;
  }
  p.lastTile = tile;
} // einde checkTriggers
function resetCheckpointsForPlayer(lane, pName) {
  const cps = state.activeTrack.checkpoints?.[lane] || [];
  cps.forEach(cp => {
    cp.hitByPlayer.delete(pName);
  });
}
//function walableTile
function walkableTile(p, x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const t = tileAt(tx, ty);

  if (!t) return false;
  if (["|", "G",].includes(t)) return false;

  if (["S", "C","=", "%", "P", "1", "2", "B", "J", "L"].includes(t)) {
    return true;
  }

  if (t === "H") {
    return p === players.P1 || p.lane === "1";
  }

  if (t === "Y") {
    return p === players.P1 || p.lane === "2";
  }

  return true;
}

function drawActiveCheckpoints() {
  if (!state.activeTrack?.checkpoints) return;

  for (const lane of ["1", "2"]) {
    for (const cp of state.activeTrack.checkpoints[lane] || []) {
      if (!cp.hitByPlayer?.size) continue;

      for (const pos of cp.tileSet) {
        const [x, y] = pos.split(",").map(Number);
        ctx.fillStyle = "green";
        ctx.fillRect(
          x * CONFIG.TILE_SIZE,
          y * CONFIG.TILE_SIZE,
          CONFIG.TILE_SIZE,
          CONFIG.TILE_SIZE
        );
      }
    }
  }
}


// === Tekenen ===

function drawTrackToCache() {
  if (!state.track) return;

  const key = state.currentTable + "_" + canvas.width + "x" + canvas.height;

  if (trackCacheCanvas && trackCacheKey === key) return;

  trackCacheKey = key;
  trackCacheCanvas = document.createElement("canvas");
  trackCacheCanvas.width = canvas.width;
  trackCacheCanvas.height = canvas.height;
  trackCacheCtx = trackCacheCanvas.getContext("2d");

  for (let y = 0; y < state.track.length; y++) {
    for (let x = 0; x < state.track[y].length; x++) {
      const tile = state.track[y][x];
      let color;

      if (tile === "S") color = "white";
      else if (tile === ">") color = "#ff9900";
      else if (tile === "<") color = "#39ff14";
      else {
        switch (tile) {
          case "|": color = "#b30000"; break;
          case "1":
          case "2": color = "#555"; break;
          case "=": color = "#777"; break;
          case "G": color = "green"; break;
          case "C": color = "purple"; break;
          case "Y": color = "red"; break;
          case "*": color = "white"; break;
          case "%": color = "#555"; break;
          case "H": color = "cyan"; break;
          case "N": color = "black"; break;
          case "P": color = "#555"; break;
          case "M": color = "#555"; break;
          case "B": color = "#C4A484"; break;
          case "O": color = "#5C4033"; break;
          case "L": color = "red"; break;
          case "J": color = "purple"; break;
          default: color = "#777";
        }
      }

      trackCacheCtx.fillStyle = color;
      trackCacheCtx.fillRect(
        x * CONFIG.TILE_SIZE,
        y * CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE,
        CONFIG.TILE_SIZE
      );
    }
  }
}

function drawPlayers() {
  for (const [key, p] of Object.entries(players)) {
    if (key === "P2" && !shouldDrawGhostNow()) continue;
    const sprite = carSprites[key];
    if (!sprite.complete) continue;
    const size = CONFIG.TILE_SIZE * 2;
    ctx.save();
    ctx.translate(p.x * CONFIG.TILE_SIZE, p.y * CONFIG.TILE_SIZE);
    ctx.rotate(p.angle - Math.PI / 2);
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
}
function fmt(t){
  return t!=null?t.toFixed(2)+"s":"--";
}
function showWinner() {
  dom.overlay.style.display = "flex";

  const nameP1 = dom.nameP1?.value || "P1";
  const best = loadBestLap();
  const allTimeBest = best?.time ?? null;
  const bestNow = players.P1.bestLap;

  const lapLines = (players.P1.lapTimes || [])
  .map((t, i) => `<div>Lap ${i + 1}: ${formatTime(t)}</div>`)
  .join("");

  dom.winnerText.innerHTML = `
  <div>${nameP1} Finished!</div>
  <div>All-time Best: ${allTimeBest ? formatTime(allTimeBest) : "--"}</div>
  <div>Best time now: ${bestNow ? formatTime(bestNow) : "--"}</div>
  <div style="margin-top:10px;">${lapLines || "<div>No laps recorded</div>"}</div>
  `;
}
function formatTime(seconds) {
  if (seconds === undefined || seconds === null) return "N/A";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}
function drawHUD() {
  const laps = parseInt(dom.lapInput.value, 10);
  const now = performance.now() / 1000;

  const p1 = players.P1;
  const p1Stats = [];
  p1Stats.push(`Lap: ${p1.lap}/${laps}`);
  p1Stats.push(`Best: ${fmt(p1.bestLap)}`);
  if (p1.started && p1.runStart != null) {
    p1Stats.push(`Current: ${fmt(now - p1.runStart)}`);
  }

  dom.statsP1.textContent = p1Stats.join(" | ");
  dom.statsP2.textContent = "";
}
// === Loop ===
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (!state.gameOver) {
    updatePlayer(players.P1, dt);
    updateGhost(players.P2, dt);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack();
    drawActiveCheckpoints();
    drawPlayers();
    drawHUD();
  }

  requestAnimationFrame(loop);
}

lastTime = performance.now();
/* === PLAYER NAME  houden === */
const nameInputP1 = dom.nameP1;
const nameInputP2 = dom.nameP2;
const lapInput = dom.lapInput;
// Load saved names
const savedP1 = localStorage.getItem("circuitracer_name_p1");
const savedP2 = localStorage.getItem("circuitracer_name_p2");
if (savedP1) nameInputP1.value = savedP1;
if (savedP2) nameInputP2.value = savedP2;
nameInputP1.addEventListener("input", () => {
  localStorage.setItem("circuitracer_name_p1", nameInputP1.value);
});
nameInputP2.addEventListener("input", () => {
  localStorage.setItem("circuitracer_name_p2", nameInputP2.value);
});
lapInput.addEventListener("change", () => {
  let value = parseInt(lapInput.value, 10);
  if (isNaN(value) || value < 1) value = 1;
  if (value > 99) value = 99;
  lapInput.value = value;
  localStorage.setItem("circuitracer_laps", value);
});
