// main.js
  import { tracks } from './trackbuilder.js';

  // dynamisch levels + secties
  export const levels = {
    LVL1: ['LVL1'],
    LVL2: ['LVL2'],
    LVL3: ['LVL3'],
    LVL4: ['LVL4_1', 'LVL4_2'],
    LVL5: ['LVL5_1', 'LVL5_2'],
    LVL6: ['LVL6_1', 'LVL6_2']
  };

  console.log("levels.LVL5 =", levels.LVL5);
  let gameOver = false;
  let currentTable = "LVL1";


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

  let track = null;
  let GLOBAL_PLANK_LENGTH = CONFIG.BASE_PLANK;
  let currentLevel = null;
  let currentSectionIndex = 0;
  let teleporting = false;
  let activeTrack = null;
  const levelCheckpointState = {};
  const activeMinigames = { P1: null, P2: null };
  window.addEventListener("DOMContentLoaded", () => {
      document.getElementById('track1Btn').addEventListener('click', () => startLevel('LVL1'));
      document.getElementById('track2Btn').addEventListener('click', () => startLevel('LVL2'));
      document.getElementById('track3Btn').addEventListener('click', () => startLevel('LVL3'));
      document.getElementById('track4Btn').addEventListener('click', () => startLevel('LVL4'));
      document.getElementById('track5Btn').addEventListener('click', () => startLevel('LVL5'));
      document.getElementById('track6Btn').addEventListener('click', () => startLevel('LVL6'));
  });
      // === Spelers ===
    const players = {
      P1: {
        lane:"1", x:0,y:0,color:"cyan",
        angle: 0,
        keys:{
          z:[0,-1], s:[0,1], q:[-1,0], d:[1,0],      // AZERTY
          arrowup:[0,-1], arrowdown:[0,1],           // pijltjes
          arrowleft:[-1,0], arrowright:[1,0]
        },
        started:false, lap:0, lapStart:0,
        totalTime:0, bestLap:null,
        lastTile:null,
        onStartTile: false,
        canTriggerCheckpoints: false,
        inMinigame:false,
        lastCPY : null,
        minigameCooldown: false,
        justExitedMinigame: false,
        finishTime: null

      },
      P2: {
        lane:"2", x:0,y:0,color:"yellow",
        angle: 0,
        keys:{
          i:[0,-1], k:[0,1], j:[-1,0], l:[1,0],       // letters
          "8":[0,-1], "5":[0,1], "4":[-1,0], "6":[1,0] // NUMPAD (NumLock)
        },

        started:false, lap:0, lapStart:0,
        totalTime:0, bestLap:null,
        lastTile:null,
        onStartTile: false,
        canTriggerCheckpoints: false,
        inMinigame:false,
        lastCPY : null,
        minigameCooldown: false,
        justExitedMinigame: false,
        finishTime: null
      }
    }


  // later, waar je hem wilt aanpassen:
  GLOBAL_PLANK_LENGTH = Math.max(
    CONFIG.MIN_PLANK,
    Math.min(GLOBAL_PLANK_LENGTH, CONFIG.MAX_PLANK)
  );
    const boosts = { P1: false, P2: false };
    const MINIGAME_MAPPING = { "B": "balance", "L": "looping", "J": "jump" };

    // KEYMAPPING
  const minigameKeys = {
      P1: { left: ["q","arrowleft"], right: ["d","arrowright"] },
      P2: { left: ["j","4"], right: ["l","6"] }
  };
    const minigameOverlay = document.getElementById("minigameOverlay");
    const mgCanvases = {
      P1: document.getElementById("minigameCanvas1"),
      P2: document.getElementById("minigameCanvas2")
    };
    const mgCtxs = {
      P1: mgCanvases.P1.getContext("2d"),
      P2: mgCanvases.P2.getContext("2d")
    };
    const mgStatus = {
      P1: document.getElementById("minigameStatus1"),
      P2: document.getElementById("minigameStatus2")
    };
    // Track minigame state per speler
    const minigameState = {
    P1: {
      active:false,
      type:null,
      plankAngle:0,
      ballX:0,
      ballSpeed:0,
      balanceTime:0,
      angle:90,
      speed:0,
      completed:false,
      lastTime:0
    },
    P2: {
      active:false,
      type:null,
      plankAngle:0,
      ballX:0,
      ballSpeed:0,
      balanceTime:0,
      angle:90,
      speed:0,
      completed:false,
      lastTime:0
    }
  };
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
    document.getElementById("newGameBtn1").addEventListener("click", () => {
      location.reload();
    });
    document.getElementById("newGameBtn").addEventListener("click", () => {
      location.reload();
    });
        // === CAR SPRITES ===
    const carSprites = {
      P1: new Image(),
      P2: new Image()
    };
    carSprites.P1.src = "icons/P1.png";
    carSprites.P2.src = "icons/P2.png";
    // (optioneel debug)
    carSprites.P1.onload = () => console.log("P1 car loaded");
    carSprites.P2.onload = () => console.log("P2 car loaded");

  //--------------------
  //FUNCTIONSSSSSS
  //---------------------
    // Nieuw: aparte functie voor eerste starttiles
    function setPlayersToStart() {
      // ⚠️ vind startpositie van de P1 en P2
      for (let y = 0; y < track.length; y++) {
        for (let x = 0; x < track[y].length; x++) {
          const tile = track[y][x];
          if (tile === "%" && x + 1 < track[y].length) {
            const nextTile = track[y][x + 1];

            if (nextTile === "1") {
              Object.assign(players.P1, {
                x: x + 0.5,
                y: y + 0.5,
                angle: Math.PI / 2,
                started: false,
                lap: 0,
                finishTime: null,
                lastTile: null,
                onStartTile: false,
                inMinigame: false
              });
            }
            if (nextTile === "2") {
              Object.assign(players.P2, {
                x: x + 0.5,
                y: y + 0.5,
                angle: Math.PI / 2,
                started: false,
                lap: 0,
                finishTime: null,
                lastTile: null,
                onStartTile: false,
                inMinigame: false
              });
            }
            x++; // overslaan van het volgende teken
          }
        }
      }
    }

    //TESTFUNCTIES
    function startLevel(level){
      currentLevel = level;
      currentSectionIndex = 0;
      const firstSegment = levels[level][0];
      startTrack(firstSegment);
    }
    function countCPFromMap(map) {
      // ✅ normalize: zorg dat elke row een array chars is
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




    // Nieuw: startTrack voor eerste keer starten
    function startTrack(levelName) {
      // hide LVL menu
      const trackMenu = document.getElementById("trackMenu");
      if (trackMenu) trackMenu.style.display = "none";

      // 1️⃣ Track opbouwen
      const raw = tracks[levelName];
      if (!raw) {
        console.warn("Track niet gevonden:", levelName);
        return;
      }
      activeTrack = buildTrackData(levelName, raw);
      track = activeTrack.map;


      currentTable = levelName;
      initLevelCheckpoints(currentLevel);

      const subIndex = levels[currentLevel].indexOf(levelName);

      if (subIndex === 0) {
        activeTrack.checkpoints = levelCheckpointState[currentLevel].persistent;
      } else {
        const cps = countCPFromMap(activeTrack.map);
        activeTrack.checkpoints = {
          "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
          "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
        };
      } // ✅ sluit else

      setPlayersToStart();
      resizeCanvas();
      checkOrientation();

      if (!window.__gameLoopRunning) {
        window.__gameLoopRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
    }

    function teleportToSubLevel(targetSubLevel) {
      const isReturning = levels[currentLevel].indexOf(targetSubLevel) < levels[currentLevel].indexOf(currentTable);

      teleporting = true;
      requestAnimationFrame(() => {
        const exit = findExitForLane(players.P1.lane); // voor P1
        const exit2 = findExitForLane(players.P2.lane); // voor P2

        selectTrack(targetSubLevel, currentLevel, { P1: exit, P2: exit2 }, !isReturning);

        teleporting = false;
        // alleen lastTile resetten als terugkeer: anders lap counter stopt
        if (!isReturning) {
          players.P1.lastTile = null;
          players.P2.lastTile = null;
        }
        players.P1.canTriggerCheckpoints = true;
        players.P2.canTriggerCheckpoints = true;

        console.log(isReturning ? "Terugkeer, checkpoints behouden!" : "Vooruit teleport, CPs gereset!");
      });
    }

    // Bij teleport: spawn op exit van vorige lane
    function teleportToNextSubLevel() {
      const next = getNextSubLevel();
      if (!next) return;
      // haal de echte map op
      const raw = tracks[next];
      if (!raw) {
        console.error("Track niet gevonden:", next);
        return;
      }
      const customSpawn = {
        P1: findExitForLane(players.P1.lane),
        P2: findExitForLane(players.P2.lane)
      };
      selectTrack(next, currentLevel, raw, customSpawn);
    }
    function buildTrackData(name, rawTrack) {
      const map = rawTrack.map.map(row => {
        if (typeof row === "string") {
          const arr = [];
          for (let i = 0; i < row.length; i++) {
            if (row[i] === "%" && row[i+1] === "1") { arr.push("%1"); i++; }
            else if (row[i] === "%" && row[i+1] === "2") { arr.push("%2"); i++; }
            else arr.push(row[i]);
          }
          return arr;
        } else return row[0].split("");
      });
        const spawns = {};
        // SPAWNS (S)
        for (let y = 0; y < map.length; y++) {
          for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === "%1") spawns["P1"] = { x: x + 0.5, y: y + 0.5 };
            if (map[y][x] === "%2") spawns["P2"] = { x: x + 0.5, y: y + 0.5 };
          }
        }
        return { name, map, spawns };
    }
    function determineLane(x, y, currentLane) {
      const t = tileAt(x, y);
      if (t === "1") return "1";
      if (t === "2") return "2";
      // ❌ nooit gokken met x < mid
      return currentLane;
    }
    function getNextSubLevel() {
      const sections = levels[currentLevel];
      const idx = sections.indexOf(currentTable);
      const nextIndex = (idx + 1) % sections.length;
      currentSectionIndex = nextIndex;
      return sections[nextIndex];
    }



    function selectTrack(name, level = null, customSpawn = {}, preservePlayerState = false) {
      // 1️⃣ Track ophalen en bouwen
      const raw = tracks[name];
      if (!raw) { console.warn("Track not found:", name); return; }
      activeTrack = buildTrackData(name, raw);
      track = activeTrack.map;
      if (level) currentLevel = level;
      initLevelCheckpoints(currentLevel);

      const subIndex = levels[currentLevel].indexOf(name);

      if (subIndex === 0) {
        // 🔒 persistent
        activeTrack.checkpoints = levelCheckpointState[currentLevel].persistent;
      } else {
        // 🔁 dynamic → altijd nieuw
        const cps = countCPFromMap(activeTrack.map);
        levelCheckpointState[currentLevel].dynamic = {
          "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
          "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
        };
        activeTrack.checkpoints = levelCheckpointState[currentLevel].dynamic;
      }

      currentTable = name;



      // 3️⃣ Spelerspositionering
      let p1Set = false, p2Set = false;

      if(customSpawn.P1) {
        Object.assign(players.P1, { ...customSpawn.P1, angle: Math.PI/2 });
        p1Set = true;
      }
      if(customSpawn.P2) {
        Object.assign(players.P2, { ...customSpawn.P2, angle: Math.PI/2 });
        p2Set = true;
      }

      // Normale starttiles alleen als geen custom spawn **en niet preservePlayerState**
      if (!preservePlayerState) {
        for (let y=0; y<track.length && (!p1Set || !p2Set); y++) {
          for (let x=0; x<track[y].length && (!p1Set || !p2Set); x++) {
            const tile = track[y][x];
            if (tile === "P" && x+1 < track[y].length) {
              const nextTile = track[y][x+1];
              if(nextTile==="1" && !p1Set){
                Object.assign(players.P1, { x:x+0.5, y:y+0.5, angle: Math.PI/2 });
                p1Set = true;
              }
              if(nextTile==="2" && !p2Set){
                Object.assign(players.P2, { x:x+0.5, y:y+0.5, angle: Math.PI/2 });
                p2Set = true;
              }
              x++;
            }
          }
        }
      }

      // fallback: alleen als niet preservePlayerState
      if(!preservePlayerState){
        if(!p1Set) Object.assign(players.P1, { x:1, y:1, angle:-Math.PI/2 });
        if(!p2Set) Object.assign(players.P2, { x:2, y:1, angle:-Math.PI/2 });
      }

      // 4️⃣ Update lanes
      players.P1.lane = determineLane(Math.floor(players.P1.x), Math.floor(players.P1.y), "1");
      players.P2.lane = determineLane(Math.floor(players.P2.x), Math.floor(players.P2.y), "2");

      // 5️⃣ Canvas & orientatie
      resizeCanvas();
      checkOrientation();

      // 6️⃣ Start game-loop als nog niet actief
      if(!window.__gameLoopRunning){
        window.__gameLoopRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(loop);
      }
    }


  function resizeMinigameCanvas(pName){
      const panel = document.getElementById(pName === "P1" ? "panelP1" : "panelP2");
      const canvasMG = mgCanvases[pName];

      canvasMG.width  = panel.clientWidth - 12;
      canvasMG.height = panel.clientHeight - 20;

      // Schaal plank op basis van green field
      const green = findGreenFieldBounds();
      const scaleX = canvas.getBoundingClientRect().width / canvas.width;
      GLOBAL_PLANK_LENGTH = Math.max(CONFIG.MIN_PLANK, Math.min(green.width * scaleX * 0.35, CONFIG.MAX_PLANK));
  }
  // ✅ Detect mobile / touch devices reliably
  const isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
                  && window.innerWidth <= 900;
  function checkOrientation() {
      const warning = document.getElementById("rotateWarning");
      const gameWrapper = document.getElementById("gameWrapper");
      const mobileControls = document.getElementById("mobileControls");
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
    if (levelCheckpointState[level]) return;

    const firstSub = levels[level][0];
    const raw = tracks[firstSub];
    if (!raw) return;

    const built = buildTrackData(firstSub, raw);   // ✅ maakt 2D char-map
    const cps = countCPFromMap(built.map);

    levelCheckpointState[level] = {
      persistent: {
        "1": cps["1"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() })),
        "2": cps["2"].map(cp => ({ tileSet: cp.tileSet, hitByPlayer: new Set() }))
      }
    };
  }


  function resizeCanvas() {
      if (!track) return; // veiligheid: track moet geladen zijn
      // 1️⃣ Bereken de echte canvas grootte op basis van tiles
      const gameWidth  = track[0].length * CONFIG.TILE_SIZE;
      const gameHeight = track.length * CONFIG.TILE_SIZE;
      canvas.width  = gameWidth;
      canvas.height = gameHeight;
      // 2️⃣ Bereken schaal zodat het past in het wrapper-element
      const wrapper = document.getElementById("gameWrapper");
      const vw = window.innerWidth;
      const vh = wrapper.clientHeight;
      const scale = Math.min(vw / gameWidth, vh / gameHeight);
      canvas.style.width  = (gameWidth  * scale) + "px";
      canvas.style.height = (gameHeight * scale) + "px";
      // 3️⃣ Update minigame plank-grootte op basis van green field
      const green = findGreenFieldBounds(); // bounds van 'G'-tiles
      const scaleX = canvas.getBoundingClientRect().width / canvas.width;
      GLOBAL_PLANK_LENGTH = green.width * scaleX * 0.35;
      // 4️⃣ Clamp lengte zodat het niet te klein of groot wordt
      GLOBAL_PLANK_LENGTH = Math.max(160, Math.min(GLOBAL_PLANK_LENGTH, 260));
      // 5️⃣ Update minigame panels (positie & grootte)
      positionMinigamePanel("P1");
      positionMinigamePanel("P2");
  }
  window.addEventListener("resize", checkOrientation);
  window.addEventListener("orientationchange", checkOrientation);
  function tileAt(x, y) {
    if (track[y] && track[y][x] !== undefined) return track[y][x];
    return null;
  }
  function startMinigame(pName, tileChar) {
    console.log("START MINIGAME voor:", pName, "teken:", tileChar);

    const mgType = MINIGAME_MAPPING[tileChar];
    if (!mgType || players[pName].inMinigame) return;

    // owner: only here sets true
    players[pName].inMinigame = true;
    players[pName].minigameCooldown = true;
    activeMinigames[pName] = mgType;
    // UI
    minigameOverlay.style.display = "flex";

    const callback = () => {
      // owner: only here sets false
      players[pName].inMinigame = false;

      players[pName].lastTile = null;
      players[pName].minigameCooldown = false;

      minigameOverlay.style.display = "none";

      const exit = findExitForLane(players[pName].lane);
      if (exit) {
        requestAnimationFrame(() => {
          players[pName].x = exit.x + 0.5;
          players[pName].y = exit.y + 0.5;
        });
      }
    };

    switch (mgType) {
      case "balance": startBalanceMinigame(pName, callback); break;
      case "looping": startLoopingMinigame(pName, callback); break;
      case "jump": startJumpMinigame(pName, callback); break;
    }
  }

  //-----------------------MINIGAME Functies------------------------------
  //-----------------------------------------------------
    function startBalanceMinigame(pName, callback){

      const state = minigameState[pName];
      if(state.active) return;
      state.active = true;
      state.plankAngle = 0;
      state.ballX = -GLOBAL_PLANK_LENGTH/2 + 10;
      state.ballSpeed = 0;
      state.balanceTime = 0;
      state.completed = false;
      state.lastTime = performance.now();
      const panel = document.getElementById(pName === "P1" ? "panelP1" : "panelP2");
      panel.style.display = "flex";
      positionMinigamePanel(pName);
      function anim(){
        if(!state.active){
          panel.style.display = "none";
          if(callback) callback();
          return;
        }
        animateBalanceMinigame(pName);
        requestAnimationFrame(anim);
      }
      requestAnimationFrame(anim);
    }
  //-----------------------------------------------------
  function startLoopingMinigame(pName, callback) {
      const state = minigameState[pName];
      if (state.active) return;
      state.active = true;
      state.completed = false;
      state.lastTime = performance.now();
      const panel = document.getElementById(pName === "P1" ? "panelP1" : "panelP2");
      panel.style.display = "flex";
      positionMinigamePanel(pName);
      const canvas = mgCanvases[pName];
      const ctx = mgCtxs[pName];
      const radius = Math.min(canvas.width, canvas.height) / 2 - 20;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // ---- TUNABLES ----
      const GRAVITY = 6.0;          // per seconde (probeer 4.5 - 8.0)
      const MAX_SPEED = 10;         // rad/s-ish
      const PUMP_STRENGTH = 3.2;    // 2.5 - 5.0
      
      // physics (nu wél dt-based)
      state.speed += GRAVITY * Math.sin(state.angle) * dt;
      state.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, state.speed));
      
      // angle update
      state.angle += (state.speed + input * PUMP_STRENGTH) * dt;
     
  

      const ball = { radius: 15, color: "yellow" };
      // input toetsen
      const keysLocal = {};
      function keyDown(e){ keysLocal[e.key.toLowerCase()] = true; }
      function keyUp(e){ keysLocal[e.key.toLowerCase()] = false; }
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", keyUp);
      function drawZones() {
        // BOVENKANT GROEN (van links naar rechts boven)
        ctx.fillStyle = "rgba(0,255,0,0.3)";
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false); // boven
        ctx.closePath();
        ctx.fill();
        // ONDERKANT ROOD (van rechts naar links onder)
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, 0, Math.PI, false); // onder
        ctx.closePath();
        ctx.fill();
      }
      function anim() {
  if (!state.active) {
    panel.style.display = "none";
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    if (callback) callback();
    return;
  }

  const now = performance.now();
  const dt = Math.min(0.033, (now - state.lastTime) / 1000); // 0.033 = smoother
  state.lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // input
  let input = 0;
  if (keysLocal["z"] || keysLocal["arrowup"]) input -= 1;
  if (keysLocal["s"] || keysLocal["arrowdown"]) input += 1;
  input += sticks[pName].y;

  // ---- dt-based physics ----
  const GRAVITY = 6.0;        // tweak 4.5 - 8.0
  const MAX_SPEED = 10;       // clamp
  const PUMP_STRENGTH = 3.2;  // tweak 2.5 - 5.0

  state.speed += GRAVITY * Math.sin(state.angle) * dt;
  state.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, state.speed));

  state.angle += (state.speed + input * PUMP_STRENGTH) * dt;

  // draw
  const ballX = centerX + radius * Math.cos(state.angle);
  const ballY = centerY + radius * Math.sin(state.angle);

  drawZones();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press UP/DOWN", centerX, centerY + 5);
  ctx.fillText("to PUMP!", centerX, centerY + 25);

  // success check (jij had dit op 0 rad "rechts")
  const angleNormalized = (state.angle + 2 * Math.PI) % (2 * Math.PI);
  if (angleNormalized <= Math.PI / 8 || angleNormalized >= 15 * Math.PI / 8) {
    state.completed = true;
    state.active = false;
    players[pName].inMinigame = false;
    panel.style.display = "none";
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    if (callback) callback();
    return;
  }

  requestAnimationFrame(anim);
}
  //-----------------------------------------------------
  function startJumpMinigame(pName, callback) {
    const state = minigameState[pName];
    if (state.active) return;

    state.active = true;
    state.completed = false;
    state.lastTime = performance.now();

    const panel = document.getElementById(pName === "P1" ? "panelP1" : "panelP2");
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
        leftRed:  { x: barX,                     w: redWidth },
        green:    { x: barX + redWidth,          w: greenWidth },
        rightRed: { x: barX + redWidth + greenWidth, w: redWidth }
      };
    })();

    const arrow = { x: barX, w: 10, speed: canvas.width * 0.6, dir: 1 };

    const JUMP_THRESHOLD = -0.35;
    let prevStickY = 0;
    let prevKeyDown = false;

    const isJumpKeyDown = () =>
    pName === "P1" ? (keys["z"] || keys["arrowup"]) : (keys["i"] || keys["8"]);

    function endMinigame(success) {
      state.active = false;
      panel.style.display = "none";
      players[pName].lastTile = null; // belangrijk: '>' re-armen

      if (success) {
        state.completed = true;
        const exit = findExitForLane(players[pName].lane);
        if (exit) {
          requestAnimationFrame(() => {
            players[pName].x = exit.x + 1;
            players[pName].y = exit.y;
          });
        }
      }

      if (callback) callback(); // owner callback zet inMinigame false enz.
    }

    function anim() {
      if (!state.active) return;

      const now = performance.now();
      const dt = Math.min(0.03, (now - state.lastTime) / 1000);
      state.lastTime = now;

      // move arrow
      arrow.x += arrow.speed * arrow.dir * dt;
      if (arrow.x <= barX) arrow.dir = 1;
      if (arrow.x + arrow.w >= barX + barWidth) arrow.dir = -1;

      // edge detect input (joystick of key)
      const s = sticks[pName];
      const keyDown = isJumpKeyDown();
      const joystickEdge = prevStickY >= JUMP_THRESHOLD && s.y < JUMP_THRESHOLD;
      const keyEdge = !prevKeyDown && keyDown;
      prevStickY = s.y;
      prevKeyDown = keyDown;

      if (joystickEdge || keyEdge) {
        const left = arrow.x;
        const right = arrow.x + arrow.w;

        const crash =
        right <= zones.leftRed.x + zones.leftRed.w ||
        left  >= zones.rightRed.x;

        const perfect =
        left >= zones.green.x &&
        right <= zones.green.x + zones.green.w;

        // success bij perfect of barely (zoals vroeger)
        endMinigame(!crash);
        return;
      }

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
  //LOOPING
  //-------------------------------------

  //----------------------------------------
  // animate BALANCE minigame
  function animateBalanceMinigame(pName) {
      const canvas = mgCanvases[pName];
      const ctx = canvas.getContext("2d");
      const state = minigameState[pName];
      const now = performance.now();
      const dt = Math.min(0.05, (now - state.lastTime) / 1000);
      state.lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const angleRad = state.plankAngle * Math.PI / 180;
  // === INPUT ===
      let input = 0;
          // toetsenbord
      const keyset = minigameKeys[pName];
      if (keyset.left.some(k => keys[k])) input -= 1;
      if (keyset.right.some(k => keys[k])) input += 1;
      // joystick (mobile)
      const s = sticks[pName];
      input += s.x; // x is horizontaal
      //update plankhoek
      state.plankAngle += input * 120  * dt;
      state.plankAngle = Math.max(-CONFIG.MAX_ANGLE, Math.min(CONFIG.MAX_ANGLE, state.plankAngle));
      // === PHYSICS ===
      const gravityScale = Math.min(1.3, Math.max(0.7, GLOBAL_PLANK_LENGTH / CONFIG.BASE_PLANK));
      state.ballSpeed += CONFIG.GRAVITY * gravityScale * Math.sin(angleRad) * dt;
      state.ballSpeed *= CONFIG.FRICTION;
      state.ballX += state.ballSpeed * dt;
      // === BALANCE CHECK ===
      const inZone = Math.abs(state.ballX) < CONFIG.BALANCE_ZONE;
      if (inZone) state.balanceTime += dt;
      else state.balanceTime = 0;
      const timeLeft = Math.max(0, CONFIG.BALANCE_DURATION - state.balanceTime);
      if (state.balanceTime >= CONFIG.BALANCE_DURATION) {
        state.completed = true;
        state.active = false;
        players[pName].inMinigame = false;
        document.getElementById(pName === "P1" ? "panelP1" : "panelP2").style.display = "none";
        // ✅ Teleporteer speler naar de exit (<)
        const exit = findExitForLane(players[pName].lane);
        if (exit) {
            players[pName].x = exit.x + 0.5;
            players[pName].y = exit.y + 0.5;
        }
        return;
      }
      // Clamp ball
      const halfPlank = GLOBAL_PLANK_LENGTH / 2;
      if (state.ballX < -halfPlank) { state.ballX = -halfPlank; state.ballSpeed = 0; }
      if (state.ballX > halfPlank) { state.ballX = halfPlank; state.ballSpeed = 0; }
      // === DRAW PLANK ===
      ctx.save();
      const pivotX = canvas.width / 2;
      const pivotY = canvas.height / 2;
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angleRad);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-halfPlank, 0);
      ctx.lineTo(halfPlank, 0);
      ctx.stroke();
      // === DRAW BALL OP PLANK ===
      const ballX = state.ballX;
      const ballY = 0; // op plank
      ctx.fillStyle = inZone ? "#00ff00" : "#ff8800";
      ctx.beginPath();
      ctx.arc(ballX, ballY - 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // === DRAW COUNTDOWN ONDER DE PLANK ===
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.floor(canvas.height / 6)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
          timeLeft.toFixed(1) + "s",
          canvas.width / 2,
          10 // 10px vanaf de top
      );
  }
  function findGreenFieldBounds(){
    let minX=Infinity, maxX=-Infinity;
    let minY=Infinity, maxY=-Infinity;
    for(let y=0;y<track.length;y++){
      for(let x=0;x<track[y].length;x++){
        if(track[y][x] !== "G") continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (minX === Infinity) {
      return { x:0, y:0, width: CONFIG.TILE_SIZE*10, height: CONFIG.TILE_SIZE*10 };
    }
    return {
      x: minX * CONFIG.TILE_SIZE,
      y: minY * CONFIG.TILE_SIZE,
      width: (maxX - minX + 1) * CONFIG.TILE_SIZE,
      height:(maxY - minY + 1) * CONFIG.TILE_SIZE
    };
  }
      // === Minigame panel positioning ===
  function positionMinigamePanel(pName){
      const panel = document.getElementById(pName === "P1" ? "panelP1" : "panelP2");
      const canvasRect = canvas.getBoundingClientRect();
      // Breedte = max 50% van canvas
      const PANEL_W = canvasRect.width / 2 - 20; // 20px marge
      // Hoogte = max 80% van canvas, min 150px
      const PANEL_H = Math.max(150, Math.min(canvasRect.height * 0.8, canvasRect.height * 0.8));
      panel.style.width = PANEL_W + "px";
      panel.style.height = PANEL_H + "px";
      // Links/rechts positioneren
      panel.style.left = pName === "P1"
          ? canvasRect.left + 10 + "px"
          : canvasRect.left + canvasRect.width / 2 + 10 + "px";
      // Verticaal centreren
      panel.style.top = canvasRect.top + (canvasRect.height - PANEL_H) / 2 + "px";
      resizeMinigameCanvas(pName);
  }
  function findExitForLane(lane){
    for(let y = 0; y < track.length; y++){
      for(let x = 0; x < track[y].length; x++){
        if(track[y][x] !== "<") continue;
        const around = [
          tileAt(x-1,y),
          tileAt(x+1,y),
          tileAt(x,y-1),
          tileAt(x,y+1)
        ];
        if(
          (lane === "1" && around.includes("1")) ||
          (lane === "2" && around.includes("2"))
        ){
          if(lane === "1") {
            return { x: x + 1, y };   // 👈 2 tiles links
          } else {
            return { x: x + 1, y };   // 👉 2 tiles rechts
          }
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
      const knob = stick.querySelector(".knob");
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
    // === Update speler ===
  function updatePlayer(p, dt){
    if(p.inMinigame) return;
    let ax=0, ay=0;
    for(const k in p.keys){
      if(keys[k]){
        ax += p.keys[k][0];
        ay += p.keys[k][1];
      }
    }
    const s = sticks[p === players.P1 ? "P1" : "P2"];
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
    // ✅ Hier lane auto-correct
   // Lane is state, map mag het wijzigen — nooit omgekeerd
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
    if (!activeTrack || !activeTrack.checkpoints) return;

    const tx = Math.floor(p.x);
    const ty = Math.floor(p.y);
    const tile = tileAt(tx, ty);

    // always keep lastTile updated on early exit
    if (gameOver || p.inMinigame) {
      p.lastTile = tile;
      return;
    }

    // ✅ ensure Sets
    Object.values(activeTrack.checkpoints).forEach(laneCps => {
      laneCps.forEach(cp => { if (!cp.hitByPlayer) cp.hitByPlayer = new Set(); });
    });

    const playerTile = `${tx},${ty}`;
    const laneCps = activeTrack.checkpoints[p.lane] || [];

    // =======================
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

        if (!p.started) {
          p.started = true;
          p.lap = 1;
          p.lapStart = now;
          p.lastTile = tile;
          return;
        }

        const allHit = laneCps.length > 0 && laneCps.every(cp => cp.hitByPlayer.has(pName));
        if (allHit) {
          const lapTime = now - p.lapStart;
          if (p.bestLap === null || lapTime < p.bestLap) p.bestLap = lapTime;

          const maxLaps = parseInt(document.getElementById("lapInput").value, 10);
          if (p.lap >= maxLaps) {
            p.finishTime = now;
            gameOver = true;
            showWinner();
            p.lastTile = tile;
            return;
          }

          p.lap++;
          p.lapStart = now;

          // reset CP for that player
          resetCheckpointsForPlayer(p.lane, pName);

          // ✅ re-arm minigame trigger
          p.lastTile = null;

          console.log(`🔁 ${pName} start lap ${p.lap}`);
          return;
        }
      }
    } else if (p.onStartTile) {
      p.onStartTile = false;
      p.canTriggerCheckpoints = true;
    }

    // =======================
    // MINIGAME (edge detect only)
    // =======================
    if (tile === ">" && p.lastTile !== ">") {
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
    if (tile === "M" && !teleporting) {
      teleporting = true;

      const next = getNextSubLevel();
      if (next) {
        const customSpawn = findExitForLane(p.lane);
        selectTrack(next, currentLevel, { [pName]: customSpawn });

        // ✅ re-arm triggers after teleport
        p.lastTile = null;
        setTimeout(() => teleporting = false, 200);
        return;
      }

      teleporting = false;
    }

    // ✅ single place at end
    p.lastTile = tile;
  } //einde checktriggers
  function resetCheckpointsForPlayer(lane, pName) {
    const cps = activeTrack.checkpoints?.[lane] || [];
    cps.forEach(cp => {
      cp.hitByPlayer.delete(pName);
    });

  }
  //function walableTile
  function walkableTile(p, x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    const t = tileAt(tx, ty);
    if (!t) return false; // buiten de track
    if (["|","G","="].includes(t)) return false;
    // start, finish en checkpoints altijd toegankelijk
    if (["S","C","%","P"].includes(t)) return true;
    // minigame triggers
    if (["B","J","L"].includes(t)) return true;
    // lane-restricties
    if ((t === "1" && p.lane !== "1") ||
      (t === "2" && p.lane !== "2") ||
      (t === "H" && p.lane !== "1") ||
      (t === "Y" && p.lane !== "2")) return false;

    return true;
  }
  function isCheckpointTileActive(x, y, lane) {
    if (!activeTrack || !activeTrack.checkpoints) return false;

    const cps = activeTrack.checkpoints[lane] || [];
    const key = `${x},${y}`;

    return cps.some(
      cp => cp.tileSet.has(key) && cp.hitByPlayer.size > 0
    );
  }
    // === Tekenen ===
  function drawTrack() {
      for (let y = 0; y < track.length; y++) {
          for (let x = 0; x < track[y].length; x++) {
              const tile = track[y][x];
              let color;
              if (tile === "S") color = "white";       // start = wit
              else if (tile === ">") color = "#ff9900"; // trigger = geel-oranje
              else if (tile === "<") color = "#39ff14"; // exit = neon groen
              else {
                  switch(tile) {
                      case "|": color = "#b30000"; break;
                      case "1": case "2": color = "#555"; break;
                      case "=": color = "#777"; break;
                      case "G": color = "green"; break;
                      case "C":
                        const lane1Active = isCheckpointTileActive(x, y, "1");
                        const lane2Active = isCheckpointTileActive(x, y, "2");
                        ctx.fillStyle = (lane1Active || lane2Active) ? "green" : "purple";
                        break;
                      case "N": color = "black"; break;
                      case "Y": color = "yellow"; break;
                      case "*": case "%": color = "white"; break;
                      case "H": color = "cyan"; break;
                      case "B": color = "#C4A484"; break;   // balance
                      case "O":  color = "#5C4033"; break;   // balance
                      case "L": color = "red"; break;    // looping
                      case "J": color = "purple"; break; // jump
                      default: color = "#777";
                  }
              }
              ctx.fillStyle = color;
              ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
      }
  }
  function drawPlayers() {
    for (const [key, p] of Object.entries(players)) {
      const sprite = carSprites[key];
      // wacht tot de sprite geladen is
      if (!sprite.complete) continue;
      const size = CONFIG.TILE_SIZE * 2; // grootte van de auto
      ctx.save();
      // zet de auto in het midden van de tegel
      ctx.translate(p.x * CONFIG.TILE_SIZE, p.y * CONFIG.TILE_SIZE);
      // roteer de sprite: -Math.PI/2 want sprite kijkt standaard omhoog
      ctx.rotate(p.angle - Math.PI / 2);
      // teken de auto gecentreerd
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
  function fmt(t){
  return t!=null?t.toFixed(2)+"s":"--";
  }
  function showWinner() {
      const overlay = document.getElementById("overlay");
      overlay.style.display = "flex";
      const winnerText = document.getElementById("winnerText");
      // Haal naam op uit input
      const nameP1 = document.getElementById("nameP1").value || "P1";
      const nameP2 = document.getElementById("nameP2").value || "P2";
      const p1Time = players.P1.finishTime ?? Infinity;
      const p2Time = players.P2.finishTime ?? Infinity;
      let winnerName = "TIE";
      if (p1Time < p2Time) winnerName = nameP1;
      else if (p2Time < p1Time) winnerName = nameP2;
      // Maak overlay inhoud compleet
      winnerText.innerHTML = `
          <div style="font-size: 48px; margin-bottom: 20px;">${winnerName} Wins!</div>
          <div>Best Lap ${nameP1}: ${formatTime(players.P1.bestLap) ?? "N/A"}</div>
          <div>Best Lap ${nameP2}: ${formatTime(players.P2.bestLap) ?? "N/A"}</div>
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
      const laps = parseInt(document.getElementById("lapInput").value, 10);
      const now = performance.now() / 1000;
      // P1 stats
      const p1 = players.P1;
      const p1Stats = [];
      p1Stats.push(`Lap: ${p1.lap}/${laps}`);
      p1Stats.push(`Best: ${fmt(p1.bestLap)}`);
      if (p1.started) p1Stats.push(`Current: ${fmt(now - p1.lapStart)}`);
      document.getElementById("statsP1").textContent = p1Stats.join(" | ");
      // P2 stats
      const p2 = players.P2;
      const p2Stats = [];
      p2Stats.push(`Lap: ${p2.lap}/${laps}`);
      p2Stats.push(`Best: ${fmt(p2.bestLap)}`);
      if (p2.started) p2Stats.push(`Current: ${fmt(now - p2.lapStart)}`);
      document.getElementById("statsP2").textContent = p2Stats.join(" | ");
  }
    // === Loop ===
    let lastTime = performance.now();
  function loop(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (!gameOver) {
          // Update spelers
          updatePlayer(players.P1, dt);
          updatePlayer(players.P2, dt);
          // Teken alles
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawTrack();
          drawPlayers();
          drawHUD();
          // Check game over
          if(players.P1.finishTime && players.P2.finishTime) gameOver = true;
      }
      requestAnimationFrame(loop);
  }
  // Start de game-loop
  lastTime = performance.now();
    /* === PLAYER NAME PERSISTENCE === */
    const nameInputP1 = document.getElementById("nameP1");
    const nameInputP2 = document.getElementById("nameP2");
    const lapInput = document.getElementById("lapInput");
    // Load saved names
    const savedP1 = localStorage.getItem("circuitracer_name_p1");
    const savedP2 = localStorage.getItem("circuitracer_name_p2");
    const savedLaps = localStorage.getItem("circuitracer_laps");
    if (savedP1) nameInputP1.value = savedP1;
    if (savedP2) nameInputP2.value = savedP2;
    // Save on change
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
