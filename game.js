(function () {
  "use strict";

  const W = 960;
  const H = 540;
  const APP_VERSION = "2.00";
  const GROUND_Y = 420;
  const PLAYER_X = 180;
  const GRAVITY = 2200;
  const JUMP_V = -780;
  const DOUBLE_JUMP_V = -700;
  const TRIPLE_JUMP_V = -680;
  const DIVE_V = 1650;
  const MAX_JUMPS = 2;
  const PEACH_SCORE = 100;
  const STAR_SCORE = 50;
  const FEATHER_BONUS = 200;
  const SMASH_SCORE = 100;
  const MOON_MAX = 100;
  const MOON_DASH_TIME = 2.8;
  const COMBO_WINDOW = 2.8;
  const DEBUG_TAPS_NEEDED = 10;

  const BEST_KEY = "momoDash2Best";
  const RECORDS_KEY = "momoDash2Records";
  const MODE_KEY = "momoDash2Mode";
  const BGM_MODE_KEY = "momoDash2BgmMode";
  const SFX_KEY = "momoDash2Sfx";
  const STARS_KEY = "momoDash2Stars";
  const CHAR_KEY = "momoDash2Char";
  const USER_KEY = "momoDash2UserName";
  const STAR_UNLOCK_KEY = "momoDash2StarUnlock";

  const CHAR_IDS = ["night", "comet", "meteor", "luna", "star"];
  const MODE_IDS = ["easy", "normal", "hard"];
  const BGM_MODE_VALUES = ["moonlight", "nightdash", "sequence", "off"];
  const CHARACTERS = {
    night: {
      id: "night",
      name: "ナイト桃",
      desc: "夜のもも。1度だけ障害物への接触を我慢できる。距離スコアが少し多め。急降下もできるぞ！",
      distMult: 1.2,
      canDive: true,
      moonGain: 1,
    },
    comet: {
      id: "comet",
      name: "コメット桃",
      desc: "ジャンプ上昇中は障害物を彗星のように吹き飛ばしてスコアにする！急降下もできるぞ！",
      distMult: 0.8,
      canDive: true,
      moonGain: 1,
    },
    meteor: {
      id: "meteor",
      name: "メテオ桃",
      desc: "急降下中に接触した障害物を破壊！羽があるときだけ、急降下の着地で落とし穴も壊せる。3段ジャンプはできない。",
      distMult: 0.8,
      canDive: true,
      moonGain: 1,
    },
    luna: {
      id: "luna",
      name: "ルナ桃",
      desc: "常に3段ジャンプができて落とし穴も無効！星を取ると急降下を2回まで使える。スコアの伸びは一番遅い。",
      distMult: 0.65,
      canDive: false,
      moonGain: 1.2,
    },
    star: {
      id: "star",
      name: "スター桃",
      desc: "夜空の隠しもも。常時3段ジャンプ、ムーンゲージが貯まりやすい。スタート時にムーンダッシュ1回分を持っているぞ！",
      distMult: 1.15,
      canDive: true,
      moonGain: 1.6,
    },
  };

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score-value");
  const bestEl = document.getElementById("best-value");
  const speedEl = document.getElementById("speed-value");
  const moonFillEl = document.getElementById("moon-fill");
  const comboHud = document.getElementById("combo-hud");
  const comboValueEl = document.getElementById("combo-value");
  const comboMultEl = document.getElementById("combo-mult");
  const statusHud = document.getElementById("status-hud");
  const charDescEl = document.getElementById("char-desc");
  const charButtons = Array.prototype.slice.call(document.querySelectorAll(".char-btn"));
  const modeButtons = Array.prototype.slice.call(document.querySelectorAll(".mode-btn"));
  const titleScreen = document.getElementById("title-screen");
  const gameoverScreen = document.getElementById("gameover-screen");
  const nameRegisterScreen = document.getElementById("name-register-screen");
  const finalScoreEl = document.getElementById("final-score");
  const finalScoreLabelEl = document.getElementById("final-score-label");
  const finalComboEl = document.getElementById("final-combo");
  const newBestEl = document.getElementById("new-best");
  const titleUserNameEl = document.getElementById("title-user-name");
  const btnDeleteUser = document.getElementById("btn-delete-user");
  const inputUserName = document.getElementById("input-user-name");
  const nameRegisterError = document.getElementById("name-register-error");
  const btnNameOk = document.getElementById("btn-name-ok");
  const btnNameCancel = document.getElementById("btn-name-cancel");
  const btnStart = document.getElementById("btn-start");
  const btnRetry = document.getElementById("btn-retry");
  const btnTitle = document.getElementById("btn-title");
  const btnDebugTitle = document.getElementById("btn-debug-title");
  const debugBadge = document.getElementById("debug-badge");
  const bgmModeSelect = document.getElementById("bgm-mode");
  const toggleSfx = document.getElementById("toggle-sfx");
  const toggleStars = document.getElementById("toggle-stars");
  const charBtnStar = document.getElementById("char-btn-star");

  let state = "title";
  let debugMode = false;
  let debugTapCount = 0;
  let records = loadRecords();
  let starUnlocked = localStorage.getItem(STAR_UNLOCK_KEY) === "1";
  let bgmMode = loadBgmMode();
  let sfxEnabled = localStorage.getItem(SFX_KEY) !== "0";
  let starsEnabled = localStorage.getItem(STARS_KEY) !== "0";
  let userName = loadUserName();
  let pendingStartAsDebug = false;
  let selectedCharId = loadSelectedChar();
  let selectedMode = loadSelectedMode();
  let secretTap = { count: 0, last: "" };

  let score = 0;
  let distance = 0;
  let distScoreAcc = 0;
  let speed = 280;
  let spawnTimer = 0;
  let nextSpawn = 1.4;
  let itemSpawnTimer = 0;
  let nextItemSpawn = 1.6;
  let lastTime = 0;
  let animT = 0;
  let shake = 0;
  let combo = 0;
  let comboTimer = 0;
  let maxCombo = 0;
  let moonGauge = 0;
  let moonlight = 0;

  let clouds = [];
  let hills = [];
  let stars = [];
  let shootingStars = [];
  let buildings = [];
  let shootTimer = 0;
  let obstacles = [];
  let items = [];
  let particles = [];
  let floatTexts = [];
  let trails = [];

  let audioCtx = null;
  let bgmTimer = null;
  let bgmTrackIndex = 0;
  let bgmPlaying = false;
  let bgmStep = 0;

  const player = {
    x: PLAYER_X,
    y: GROUND_Y,
    vy: 0,
    r: 28,
    onGround: true,
    jumpsLeft: MAX_JUMPS,
    feather: false,
    diving: false,
    squish: 1,
    blink: 0,
    shield: 0,
    diveCharges: 0,
    spinAngle: 0,
    invuln: 0,
    fallingInHole: false,
  };

  function emptyRecords() {
    const rec = {};
    for (let i = 0; i < MODE_IDS.length; i++) {
      rec[MODE_IDS[i]] = { score: 0, char: "" };
    }
    rec.chars = {};
    for (let i = 0; i < CHAR_IDS.length; i++) {
      rec.chars[CHAR_IDS[i]] = { easy: 0, normal: 0, hard: 0 };
    }
    return rec;
  }

  function loadRecords() {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (!raw) return emptyRecords();
      const parsed = JSON.parse(raw);
      const base = emptyRecords();
      for (let i = 0; i < MODE_IDS.length; i++) {
        const m = MODE_IDS[i];
        if (parsed[m] && typeof parsed[m].score === "number") {
          base[m] = { score: parsed[m].score, char: parsed[m].char || "" };
        }
      }
      if (parsed.chars) {
        for (let i = 0; i < CHAR_IDS.length; i++) {
          const id = CHAR_IDS[i];
          if (parsed.chars[id]) {
            base.chars[id] = {
              easy: parsed.chars[id].easy || 0,
              normal: parsed.chars[id].normal || 0,
              hard: parsed.chars[id].hard || 0,
            };
          }
        }
      }
      return base;
    } catch (e) {
      return emptyRecords();
    }
  }

  function saveRecords() {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }

  function loadSelectedChar() {
    const id = localStorage.getItem(CHAR_KEY);
    if (id === "star" && localStorage.getItem(STAR_UNLOCK_KEY) !== "1") return "night";
    return CHAR_IDS.indexOf(id) >= 0 ? id : "night";
  }

  function loadSelectedMode() {
    const id = localStorage.getItem(MODE_KEY);
    return MODE_IDS.indexOf(id) >= 0 ? id : "normal";
  }

  function loadBgmMode() {
    const id = localStorage.getItem(BGM_MODE_KEY);
    return BGM_MODE_VALUES.indexOf(id) >= 0 ? id : "moonlight";
  }

  function loadUserName() {
    return localStorage.getItem(USER_KEY) || "";
  }

  function saveUserName(name) {
    userName = name;
    localStorage.setItem(USER_KEY, name);
    syncUserNameUi();
  }

  function clearUserName() {
    userName = "";
    localStorage.removeItem(USER_KEY);
    syncUserNameUi();
  }

  function syncUserNameUi() {
    if (titleUserNameEl) titleUserNameEl.textContent = userName || "未登録";
    if (btnDeleteUser) btnDeleteUser.classList.toggle("hidden", !userName);
  }

  function currentChar() {
    return CHARACTERS[selectedCharId] || CHARACTERS.night;
  }

  function currentModeBest() {
    return (records[selectedMode] && records[selectedMode].score) || 0;
  }

  function comboMult() {
    return 1 + Math.min(7, Math.floor(combo / 3));
  }

  function setSelectedChar(id) {
    if (id === "star" && !starUnlocked) return;
    selectedCharId = id;
    localStorage.setItem(CHAR_KEY, id);
    syncCharSelectUi();
  }

  function setSelectedMode(id) {
    selectedMode = id;
    localStorage.setItem(MODE_KEY, id);
    syncModeSelectUi();
    syncBestDisplay();
  }

  function syncModeSelectUi() {
    for (let i = 0; i < modeButtons.length; i++) {
      const id = modeButtons[i].getAttribute("data-mode");
      modeButtons[i].setAttribute("aria-pressed", id === selectedMode ? "true" : "false");
    }
  }

  function applyRecordCharIcon(el, charId) {
    if (!el) return;
    el.className = "record-char char-swatch";
    if (!charId) return;
    el.classList.add("char-swatch-" + charId, "has-record");
  }

  function syncModeRecordsUi() {
    const map = {
      easy: document.getElementById("record-easy-score"),
      normal: document.getElementById("record-normal-score"),
      hard: document.getElementById("record-hard-score"),
    };
    const icons = {
      easy: document.getElementById("record-easy-char"),
      normal: document.getElementById("record-normal-char"),
      hard: document.getElementById("record-hard-char"),
    };
    for (let i = 0; i < MODE_IDS.length; i++) {
      const m = MODE_IDS[i];
      if (map[m]) map[m].textContent = String((records[m] && records[m].score) || 0);
      applyRecordCharIcon(icons[m], records[m] && records[m].char);
    }
  }

  function syncCharRecordsUi() {
    const rec = (records.chars && records.chars[selectedCharId]) || { easy: 0, normal: 0, hard: 0 };
    const easyEl = document.getElementById("char-best-easy");
    const normalEl = document.getElementById("char-best-normal");
    const hardEl = document.getElementById("char-best-hard");
    if (easyEl) easyEl.textContent = String(rec.easy || 0);
    if (normalEl) normalEl.textContent = String(rec.normal || 0);
    if (hardEl) hardEl.textContent = String(rec.hard || 0);
  }

  function syncCharSelectUi() {
    if (charBtnStar) charBtnStar.classList.toggle("hidden", !starUnlocked);
    for (let i = 0; i < charButtons.length; i++) {
      const id = charButtons[i].getAttribute("data-char");
      charButtons[i].setAttribute("aria-pressed", id === selectedCharId ? "true" : "false");
    }
    if (charDescEl) charDescEl.textContent = currentChar().desc;
    syncCharRecordsUi();
  }

  function handleSecretModeTap(modeId) {
    if (starUnlocked) return;
    const seq = ["easy", "easy", "hard", "hard", "easy"];
    if (modeId === seq[secretTap.count]) {
      secretTap.count += 1;
      if (secretTap.count >= seq.length) {
        starUnlocked = true;
        localStorage.setItem(STAR_UNLOCK_KEY, "1");
        syncCharSelectUi();
        spawnFloatText(W * 0.5, 80, "スター桃 解除！", "#ffd24a");
        sfxPeach();
      }
    } else {
      secretTap.count = modeId === seq[0] ? 1 : 0;
    }
  }

  function submitScore(finalScore) {
    let isNew = false;
    const modeRec = records[selectedMode] || { score: 0, char: "" };
    if (finalScore > (modeRec.score || 0)) {
      records[selectedMode] = { score: finalScore, char: selectedCharId };
      isNew = true;
    }
    if (!records.chars[selectedCharId]) records.chars[selectedCharId] = { easy: 0, normal: 0, hard: 0 };
    if (finalScore > (records.chars[selectedCharId][selectedMode] || 0)) {
      records.chars[selectedCharId][selectedMode] = finalScore;
      isNew = true;
    }
    const oldBest = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    if (finalScore > oldBest) localStorage.setItem(BEST_KEY, String(finalScore));
    saveRecords();
    syncModeRecordsUi();
    syncCharRecordsUi();
    syncBestDisplay();
    return isNew;
  }

  function syncBestDisplay() {
    if (bestEl) bestEl.textContent = String(currentModeBest());
  }

  function syncSpeedDisplay() {
    if (speedEl) speedEl.textContent = Math.round((speed / 280) * 100) + "%";
  }

  function syncMoonHud() {
    if (moonFillEl) moonFillEl.style.width = Math.round((moonGauge / MOON_MAX) * 100) + "%";
  }

  function syncComboHud() {
    if (!comboHud) return;
    comboHud.classList.toggle("hidden", combo < 2);
    if (comboValueEl) comboValueEl.textContent = String(combo);
    if (comboMultEl) comboMultEl.textContent = "×" + comboMult();
  }

  function syncStatusHud() {
    const label = statusHud && statusHud.querySelector(".status-label");
    if (selectedCharId === "luna") {
      if (label) label.textContent = "急降下×" + player.diveCharges;
      statusHud.classList.toggle("hidden", player.diveCharges <= 0);
    } else if (selectedCharId === "meteor") {
      if (label) label.textContent = "穴破壊";
      statusHud.classList.toggle("hidden", !player.feather);
    } else {
      if (label) label.textContent = "3段ジャンプ";
      statusHud.classList.toggle("hidden", !player.feather);
    }
  }

  function setScore(value) {
    score = value;
    if (scoreEl) scoreEl.textContent = String(score);
  }

  function addScore(amount) {
    const gained = Math.round(amount * (debugMode ? 3 : 1));
    setScore(score + gained);
    return gained;
  }

  function scoreGainLabel(base) {
    return String(Math.round(base * comboMult() * (debugMode ? 3 : 1)));
  }

  function bumpCombo() {
    combo += 1;
    comboTimer = COMBO_WINDOW;
    if (combo > maxCombo) maxCombo = combo;
    syncComboHud();
  }

  function breakCombo() {
    combo = 0;
    comboTimer = 0;
    syncComboHud();
  }

  function addMoon(amount) {
    if (moonlight > 0) return;
    moonGauge = Math.min(MOON_MAX, moonGauge + amount * currentChar().moonGain);
    if (moonGauge >= MOON_MAX) startMoonlight();
    syncMoonHud();
  }

  function startMoonlight() {
    moonGauge = 0;
    moonlight = MOON_DASH_TIME;
    player.invuln = Math.max(player.invuln, MOON_DASH_TIME);
    syncMoonHud();
    sfxMoon();
    spawnBurst(player.x, player.y - player.r, "#ffe08a", 22);
    spawnFloatText(player.x, player.y - player.r - 36, "ムーンダッシュ！", "#ffd24a");
  }

  function worldPhase() {
    if (score >= 7000) return "cosmos";
    if (score >= 4000) return "moon";
    if (score >= 1800) return "night";
    return "dusk";
  }

  function initDecor() {
    clouds = [];
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 30 + Math.random() * 130,
        s: 0.55 + Math.random() * 0.9,
        speed: 16 + Math.random() * 24,
      });
    }
    hills = [
      { x: 0, h: 90, w: 280 },
      { x: 220, h: 130, w: 340 },
      { x: 500, h: 100, w: 300 },
      { x: 740, h: 140, w: 320 },
    ];
    buildings = [];
    for (let i = 0; i < 10; i++) {
      buildings.push({
        x: i * 120 + Math.random() * 30,
        w: 50 + Math.random() * 50,
        h: 70 + Math.random() * 110,
      });
    }
    stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * (GROUND_Y - 50),
        r: 0.6 + Math.random() * 1.8,
        tw: Math.random() * Math.PI * 2,
        bright: 0.4 + Math.random() * 0.6,
      });
    }
    shootingStars = [];
    shootTimer = 0;
  }

  function initAudio() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();
  }

  function resumeAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function playTone(freq, duration, type, volume, slide) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + duration);
    gain.gain.setValueAtTime(volume || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  function sfxJump(kind) {
    if (!sfxEnabled) return;
    if (kind === "triple") {
      playTone(560, 0.1, "triangle", 0.16, 980);
      playTone(880, 0.1, "sine", 0.12, 1280);
    } else if (kind === "double") {
      playTone(520, 0.1, "triangle", 0.16, 880);
      playTone(780, 0.08, "sine", 0.1, 1100);
    } else {
      playTone(420, 0.12, "triangle", 0.18, 720);
    }
  }

  function sfxDive() {
    if (!sfxEnabled) return;
    playTone(320, 0.08, "sawtooth", 0.14, 90);
    playTone(180, 0.16, "triangle", 0.12, 55);
  }

  function sfxHit() {
    if (!sfxEnabled) return;
    playTone(180, 0.18, "sawtooth", 0.22, 60);
    playTone(90, 0.28, "square", 0.12, 40);
  }

  function sfxPeach() {
    if (!sfxEnabled) return;
    playTone(740, 0.08, "sine", 0.14);
    playTone(980, 0.1, "triangle", 0.1, 1200);
  }

  function sfxStar() {
    if (!sfxEnabled) return;
    playTone(880, 0.08, "sine", 0.12, 1400);
    playTone(1320, 0.1, "triangle", 0.1);
  }

  function sfxFeather() {
    if (!sfxEnabled) return;
    playTone(520, 0.08, "sine", 0.12, 760);
    playTone(880, 0.12, "triangle", 0.1, 1400);
  }

  function sfxMoon() {
    if (!sfxEnabled) return;
    playTone(392, 0.16, "triangle", 0.16, 784);
    playTone(784, 0.2, "sine", 0.12, 1175);
  }

  const BGM_PATTERNS = {
    moonlight: [
      392, 494, 587, 659, 587, 494, 392, 330,
      349, 440, 523, 587, 523, 440, 349, 294,
    ],
    nightdash: [
      330, 392, 494, 392, 523, 392, 494, 330,
      294, 349, 440, 349, 494, 349, 440, 294,
    ],
  };

  function currentBgmTrack() {
    if (bgmMode === "nightdash") return "nightdash";
    if (bgmMode === "sequence") return bgmTrackIndex % 2 === 0 ? "moonlight" : "nightdash";
    return "moonlight";
  }

  function stopBgm() {
    bgmPlaying = false;
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function pauseBgm() {
    stopBgm();
  }

  function playBgm(restart) {
    if (bgmMode === "off") {
      stopBgm();
      return;
    }
    resumeAudio();
    if (!audioCtx) return;
    if (restart) {
      bgmStep = 0;
      if (bgmMode !== "sequence") bgmTrackIndex = bgmMode === "nightdash" ? 1 : 0;
    }
    stopBgm();
    bgmPlaying = true;
    const stepMs = 220;
    bgmTimer = setInterval(function () {
      if (!bgmPlaying || !audioCtx || state !== "playing") return;
      const track = currentBgmTrack();
      const notes = BGM_PATTERNS[track];
      const freq = notes[bgmStep % notes.length];
      playTone(freq, 0.18, bgmStep % 4 === 0 ? "triangle" : "sine", 0.045);
      if (bgmStep % 2 === 0) playTone(freq / 2, 0.2, "sine", 0.03);
      bgmStep += 1;
      if (bgmMode === "sequence" && bgmStep % notes.length === 0 && bgmStep > 0) {
        bgmTrackIndex = (bgmTrackIndex + 1) % 2;
      }
    }, stepMs);
  }

  function maxJumps() {
    if (selectedCharId === "luna" || selectedCharId === "star") return 3;
    if (selectedCharId === "meteor") return MAX_JUMPS;
    return MAX_JUMPS + (player.feather ? 1 : 0);
  }

  function resetGame() {
    score = 0;
    distance = 0;
    distScoreAcc = 0;
    speed = 280;
    spawnTimer = 0;
    nextSpawn = selectedMode === "easy" ? 2.4 : selectedMode === "hard" ? 1.05 : 1.35;
    itemSpawnTimer = 0;
    nextItemSpawn = 1.5;
    obstacles = [];
    items = [];
    particles = [];
    floatTexts = [];
    trails = [];
    shootingStars = [];
    shootTimer = 0;
    shake = 0;
    animT = 0;
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    moonGauge = selectedCharId === "star" ? MOON_MAX : 0;
    moonlight = 0;
    player.x = PLAYER_X;
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
    player.feather = false;
    player.diving = false;
    player.squish = 1;
    player.blink = 0;
    player.shield = selectedCharId === "night" ? 1 : 0;
    player.diveCharges = 0;
    player.spinAngle = 0;
    player.invuln = 0;
    player.fallingInHole = false;
    player.jumpsLeft = maxJumps();
    setScore(0);
    syncBestDisplay();
    syncMoonHud();
    syncComboHud();
    syncStatusHud();
    syncSpeedDisplay();
  }

  function syncDebugUi() {
    btnDebugTitle.classList.toggle("hidden", !(debugMode && state === "playing"));
    debugBadge.classList.toggle("hidden", !(debugMode && state === "playing"));
  }

  function showNameRegister(asDebug) {
    pendingStartAsDebug = !!asDebug;
    if (nameRegisterError) nameRegisterError.classList.add("hidden");
    if (inputUserName) inputUserName.value = "";
    nameRegisterScreen.classList.remove("hidden");
    if (inputUserName) setTimeout(function () { inputUserName.focus(); }, 30);
  }

  function hideNameRegister() {
    nameRegisterScreen.classList.add("hidden");
    pendingStartAsDebug = false;
  }

  function isNameRegisterOpen() {
    return !!(nameRegisterScreen && !nameRegisterScreen.classList.contains("hidden"));
  }

  function confirmNameAndStart() {
    const name = (inputUserName && inputUserName.value ? inputUserName.value : "").trim();
    if (!name) {
      if (nameRegisterError) nameRegisterError.classList.remove("hidden");
      return;
    }
    saveUserName(name);
    const asDebug = pendingStartAsDebug;
    hideNameRegister();
    startGame(asDebug);
  }

  function requestStartGame(asDebug) {
    if (!userName) {
      showNameRegister(asDebug);
      return;
    }
    startGame(asDebug);
  }

  function showTitle() {
    state = "title";
    debugMode = false;
    debugTapCount = 0;
    hideNameRegister();
    titleScreen.classList.remove("hidden");
    gameoverScreen.classList.add("hidden");
    hud.classList.add("hidden");
    syncDebugUi();
    stopBgm();
    resetGame();
    initDecor();
    syncCharSelectUi();
    syncModeRecordsUi();
    syncCharRecordsUi();
    syncBestDisplay();
    syncUserNameUi();
  }

  function startGame(asDebug) {
    resumeAudio();
    debugMode = !!asDebug;
    debugTapCount = 0;
    hideNameRegister();
    resetGame();
    initDecor();
    state = "playing";
    titleScreen.classList.add("hidden");
    gameoverScreen.classList.add("hidden");
    hud.classList.remove("hidden");
    syncSpeedDisplay();
    syncDebugUi();
    if (selectedCharId === "star") startMoonlight();
    playBgm(true);
    lastTime = performance.now();
  }

  function endGame() {
    if (state !== "playing") return;
    if (debugMode) return;
    state = "gameover";
    pauseBgm();
    sfxHit();
    shake = 12;
    spawnBurst(player.x, player.y - player.r, "#ff8fab", 18);
    finalScoreEl.textContent = String(score);
    if (finalScoreLabelEl) {
      finalScoreLabelEl.textContent = userName ? userName + "さんのスコア" : "スコア";
    }
    if (finalComboEl) finalComboEl.textContent = String(maxCombo);
    const isNew = submitScore(score);
    newBestEl.classList.toggle("hidden", !isNew);
    gameoverScreen.classList.remove("hidden");
    syncDebugUi();
  }

  function jump() {
    if (state !== "playing") return;
    if (player.jumpsLeft <= 0) return;

    let kind = "single";
    let vy = JUMP_V;
    let color = "#c8e6a0";
    let burst = 6;
    const canTriple = selectedCharId === "luna" || selectedCharId === "star" || (selectedCharId !== "meteor" && player.feather);
    const isTriple = canTriple && !player.onGround && player.jumpsLeft === 1;
    const isDouble = !player.onGround && !isTriple;

    if (isTriple) {
      kind = "triple";
      vy = TRIPLE_JUMP_V;
      color = "#a8e8ff";
      burst = 14;
      if (selectedCharId !== "luna" && selectedCharId !== "star") {
        player.feather = false;
        syncStatusHud();
      }
    } else if (isDouble) {
      kind = "double";
      vy = DOUBLE_JUMP_V;
      color = "#ffd0e0";
      burst = 10;
    }

    player.diving = false;
    player.vy = vy;
    player.onGround = false;
    player.jumpsLeft -= 1;
    player.squish = kind === "triple" ? 1.4 : kind === "double" ? 1.35 : 1.25;
    sfxJump(kind);
    spawnBurst(player.x, kind === "single" ? GROUND_Y - 4 : player.y - player.r, color, burst);
  }

  function canPlayerDive() {
    if (selectedCharId === "luna") return player.diveCharges > 0;
    return currentChar().canDive;
  }

  function dive() {
    if (state !== "playing") return;
    if (!canPlayerDive()) return;
    if (player.onGround) return;
    if (player.jumpsLeft > 0) return;
    if (player.diving) return;
    player.diving = true;
    player.vy = DIVE_V;
    player.squish = 0.55;
    if (selectedCharId === "luna") {
      player.diveCharges = Math.max(0, player.diveCharges - 1);
      syncStatusHud();
    }
    sfxDive();
    spawnBurst(player.x, player.y - player.r, "#ffe08a", 12);
  }

  function tryAction() {
    if (isNameRegisterOpen()) return;
    if (state === "title") {
      requestStartGame(false);
      return;
    }
    if (state === "gameover") {
      requestStartGame(false);
      return;
    }
    if (!player.onGround && player.jumpsLeft <= 0) {
      dive();
      return;
    }
    jump();
  }

  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function hitTitlePeach(x, y) {
    const dx = x - player.x;
    const dy = y - (player.y - player.r);
    return dx * dx + dy * dy <= (player.r * 1.6) * (player.r * 1.6);
  }

  function handleTitlePeachTap() {
    if (isNameRegisterOpen()) return;
    debugTapCount += 1;
    player.squish = 1.3;
    spawnBurst(player.x, player.y - player.r, "#ff8fab", 5);
    if (debugTapCount >= DEBUG_TAPS_NEEDED) requestStartGame(true);
  }

  function difficultyFactor() {
    return Math.min(1, distance / 3600);
  }

  function spawnObstacle() {
    const d = difficultyFactor();
    const phase = worldPhase();
    let types = ["hole"];
    if (selectedMode === "easy") {
      if (score >= 1200) types.push("rock");
      if (score >= 2800) types.push("lantern");
      if (score >= 4500) types.push("bat");
    } else {
      types = ["rock", "lantern", "hole"];
      if (d > 0.12) types.push("bat");
      if (d > 0.28) types.push("slime");
      if (d > 0.45 || phase === "moon" || phase === "cosmos") types.push("bat", "hole");
      if (score >= 3500) types.push("beam");
      if (selectedMode === "hard") types.push("bat", "slime");
    }
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === "rock") {
      obstacles.push({ type: "rock", x: W + 40, y: GROUND_Y, w: 46, h: 38, blown: false });
    } else if (type === "lantern") {
      obstacles.push({ type: "lantern", x: W + 40, y: GROUND_Y, w: 28, h: 92, blown: false });
    } else if (type === "hole") {
      const w = 70 + Math.random() * 36;
      obstacles.push({ type: "hole", x: W + 20, y: GROUND_Y, w: w, h: 80, blown: false });
    } else if (type === "bat") {
      const y = GROUND_Y - 90 - Math.random() * 110;
      obstacles.push({ type: "bat", x: W + 40, y: y, baseY: y, w: 36, h: 24, t: Math.random() * 10, blown: false });
    } else if (type === "slime") {
      obstacles.push({ type: "slime", x: W + 40, y: GROUND_Y, w: 40, h: 34, t: Math.random() * 6, blown: false });
    } else if (type === "beam") {
      obstacles.push({
        type: "beam",
        x: W + 80,
        y: GROUND_Y,
        w: 22,
        h: GROUND_Y - 40,
        warn: 0.9,
        active: 0.5,
        phase: "warn",
        blown: false,
      });
    }
  }

  function spawnItem() {
    const r = Math.random();
    let type = "peach";
    if (r < 0.42) type = "star";
    else if (r < 0.58) type = "feather";
    const air = Math.random() < 0.55;
    items.push({
      type: type,
      x: W + 30,
      y: air ? GROUND_Y - 90 - Math.random() * 110 : GROUND_Y - 36,
      r: type === "star" ? 14 : 16,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function collectItem(item) {
    bumpCombo();
    const mult = comboMult() * (moonlight > 0 ? 2 : 1);
    if (item.type === "peach") {
      const gained = addScore(PEACH_SCORE * mult);
      spawnBurst(item.x, item.y, "#ff8fab", 12);
      spawnFloatText(item.x, item.y - 20, "+" + gained, "#e85a7a");
      addMoon(10);
      sfxPeach();
    } else if (item.type === "star") {
      const gained = addScore(STAR_SCORE * mult);
      spawnBurst(item.x, item.y, "#ffe08a", 14);
      spawnFloatText(item.x, item.y - 20, "+" + gained, "#ffd24a");
      addMoon(22);
      sfxStar();
    } else if (item.type === "feather") {
      if (selectedCharId === "luna") {
        player.diveCharges = 2;
        spawnBurst(item.x, item.y, "#ffd24a", 14);
        spawnFloatText(item.x, item.y - 20, "急降下×2！", "#5a8ad0");
      } else if (selectedCharId === "meteor") {
        player.feather = true;
        const gained = addScore(FEATHER_BONUS * comboMult());
        spawnBurst(item.x, item.y, "#ffd24a", 14);
        spawnFloatText(item.x, item.y - 20, "穴破壊 +" + gained, "#6a6a6a");
      } else {
        player.feather = true;
        const gained = addScore(FEATHER_BONUS * comboMult());
        spawnBurst(item.x, item.y, "#7ec8e8", 10);
        spawnFloatText(item.x, item.y - 20, "3段ジャンプ +" + gained, "#2a7ab0");
      }
      syncStatusHud();
      sfxFeather();
    }
  }

  function spawnBurst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.35 + Math.random() * 0.35,
        color: color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  function spawnFloatText(x, y, text, color) {
    floatTexts.push({ x: x, y: y, text: text, color: color, life: 0.9 });
  }

  function isCometAscending() {
    return selectedCharId === "comet" && !player.onGround && player.vy < 0;
  }

  function obstacleCenter(o) {
    if (o.type === "bat") return { x: o.x + o.w * 0.5, y: (o.drawY != null ? o.drawY : o.y) - o.h * 0.5 };
    if (o.type === "slime") return { x: o.x + o.w * 0.5, y: (o.drawY != null ? o.drawY : o.y) - o.h * 0.5 };
    if (o.type === "beam") return { x: o.x + o.w * 0.5, y: GROUND_Y - o.h * 0.5 };
    return { x: o.x + o.w * 0.5, y: o.y - o.h * 0.5 };
  }

  function destroyObstacle(o, points, color) {
    const c = obstacleCenter(o);
    spawnBurst(c.x, c.y, color || "#ffd24a", 16);
    if (points > 0) {
      bumpCombo();
      const gained = addScore(points * comboMult() * (moonlight > 0 ? 2 : 1));
      sfxPeach();
      spawnFloatText(c.x, c.y - 10, "+" + gained, color || "#e85a7a");
      addMoon(6);
    }
    if (o.type === "hole" || o.type === "beam") {
      const idx = obstacles.indexOf(o);
      if (idx !== -1) obstacles.splice(idx, 1);
      return;
    }
    o.blown = true;
    o.bvx = 420 + Math.random() * 260;
    o.bvy = -320 - Math.random() * 220;
    o.spin = 0;
  }

  function smashHolesUnderPlayer() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.type !== "hole" || o.blown) continue;
      if (player.x + player.r * 0.4 > o.x && player.x - player.r * 0.4 < o.x + o.w) {
        destroyObstacle(o, 0, "#6a6a6a");
      }
    }
  }

  function isPlayerOverHole(dt) {
    if (debugMode || selectedCharId === "luna" || selectedCharId === "star") return false;
    if (moonlight > 0) return false;
    const half = player.r * 0.45;
    const left = player.x - half;
    const right = player.x + half;
    const move = speed * dt;
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (o.blown || o.type !== "hole") continue;
      if (right > o.x && left < o.x + o.w) return true;
      const prevX = o.x + move;
      const sweepLeft = Math.min(o.x, prevX);
      const sweepRight = Math.max(o.x + o.w, prevX + o.w);
      if (right > sweepLeft && left < sweepRight) return true;
    }
    return false;
  }

  function circlesHit(px, py, pr, ox, oy, ow, oh) {
    const cx = Math.max(ox, Math.min(px, ox + ow));
    const cy = Math.max(oy - oh, Math.min(py, oy));
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= pr * pr;
  }

  function playerHitsObstacle(o) {
    const pr = player.r * 0.72;
    const px = player.x;
    const py = player.y - player.r;
    if (o.type === "hole") return false;
    if (o.type === "beam") {
      if (o.phase !== "active") return false;
      return px + pr > o.x && px - pr < o.x + o.w && py + pr > 40;
    }
    const top = o.drawY != null ? o.drawY : o.y;
    return circlesHit(px, py, pr, o.x, top, o.w, o.h);
  }

  function resolveObstacleHit(o) {
    if (player.invuln > 0 || moonlight > 0) return "ok";
    if (isCometAscending() && o.type !== "hole" && o.type !== "beam") {
      destroyObstacle(o, SMASH_SCORE, "#3a9fd0");
      return "ok";
    }
    if (selectedCharId === "meteor" && player.diving && o.type !== "hole") {
      destroyObstacle(o, SMASH_SCORE, "#e07040");
      return "ok";
    }
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = 0.85;
      player.squish = 1.35;
      breakCombo();
      sfxHit();
      spawnBurst(player.x, player.y - player.r, "#c070d0", 14);
      spawnFloatText(player.x, player.y - player.r - 28, "ガード！", "#7a5ab0");
      return "ok";
    }
    return "die";
  }

  function updatePlayer(dt) {
    player.blink += dt;
    player.squish += (1 - player.squish) * Math.min(1, dt * 8);
    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
    if (selectedCharId === "comet" && !player.onGround) player.spinAngle += dt * 14;

    if (player.fallingInHole) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y > H + 80) endGame();
      return;
    }

    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.onGround && isPlayerOverHole(dt)) {
      if (selectedCharId === "meteor" && player.diving && player.feather) {
        smashHolesUnderPlayer();
        player.feather = false;
        player.diving = false;
        player.vy = 0;
        player.y = GROUND_Y;
        player.onGround = true;
        player.jumpsLeft = maxJumps();
        player.squish = 0.7;
        syncStatusHud();
        spawnBurst(player.x, GROUND_Y, "#6a6a6a", 16);
        return;
      }
      player.onGround = false;
      player.fallingInHole = true;
      player.vy = 80;
      return;
    }

    if (player.y >= GROUND_Y) {
      if (isPlayerOverHole(dt)) {
        player.fallingInHole = true;
        player.onGround = false;
        return;
      }
      player.y = GROUND_Y;
      player.vy = 0;
      if (!player.onGround) {
        player.onGround = true;
        player.jumpsLeft = maxJumps();
        player.squish = 0.78;
        if (selectedCharId === "meteor" && player.diving && player.feather) {
          smashHolesUnderPlayer();
        }
      }
      player.diving = false;
    } else {
      player.onGround = false;
    }
  }

  function updateWorld(dt) {
    const dashBoost = moonlight > 0 ? 1.22 : 1;
    const target = (280 + difficultyFactor() * 210) * dashBoost * (selectedMode === "hard" ? 1.08 : selectedMode === "easy" ? 0.92 : 1);
    speed += (target - speed) * Math.min(1, dt * 3);
    distance += speed * dt;
    distScoreAcc += speed * dt * 0.045 * currentChar().distMult * (moonlight > 0 ? 1.5 : 1);
    if (distScoreAcc >= 1) {
      const add = Math.floor(distScoreAcc);
      distScoreAcc -= add;
      setScore(score + add);
    }

    if (combo > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) breakCombo();
    }
    if (moonlight > 0) {
      moonlight -= dt;
      if (moonlight <= 0) {
        moonlight = 0;
        if (player.invuln > 0.2) player.invuln = 0.2;
      }
      trails.push({ x: player.x, y: player.y - player.r, life: 0.28, r: player.r });
    }

    spawnTimer += dt;
    if (spawnTimer >= nextSpawn) {
      spawnTimer = 0;
      nextSpawn = (selectedMode === "easy" ? 1.7 : selectedMode === "hard" ? 0.85 : 1.15) - difficultyFactor() * 0.35;
      nextSpawn = Math.max(0.62, nextSpawn + (Math.random() * 0.3 - 0.1));
      spawnObstacle();
    }
    itemSpawnTimer += dt;
    if (itemSpawnTimer >= nextItemSpawn) {
      itemSpawnTimer = 0;
      nextItemSpawn = 1.35 + Math.random() * 0.9;
      spawnItem();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt;
      if (o.type === "bat") {
        o.t += dt;
        o.drawY = o.baseY + Math.sin(o.t * 4.2) * 28;
      } else if (o.type === "slime") {
        o.t += dt;
        const hop = Math.abs(Math.sin(o.t * 3.2)) * 70;
        o.drawY = GROUND_Y - hop;
      } else if (o.type === "beam") {
        if (o.phase === "warn") {
          o.warn -= dt;
          if (o.warn <= 0) o.phase = "active";
        } else if (o.phase === "active") {
          o.active -= dt;
          if (o.active <= 0) o.phase = "done";
        }
      }
      if (o.blown) {
        o.x += o.bvx * dt;
        o.y += o.bvy * dt;
        o.bvy += GRAVITY * dt;
        o.spin += dt * 8;
        if (o.y > H + 80) obstacles.splice(i, 1);
      } else if (o.x + (o.w || 20) < -60) {
        obstacles.splice(i, 1);
      }
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x -= speed * dt;
      it.bob += dt * 4;
      if (it.x < -40) {
        items.splice(i, 1);
        continue;
      }
      const iy = it.y + Math.sin(it.bob) * 8;
      const dx = player.x - it.x;
      const dy = player.y - player.r - iy;
      if (dx * dx + dy * dy < (player.r + it.r) * (player.r + it.r)) {
        collectItem(it);
        items.splice(i, 1);
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.blown) continue;
      if (!playerHitsObstacle(o)) continue;
      if (resolveObstacleHit(o) === "die") {
        endGame();
        return;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      floatTexts[i].life -= dt;
      floatTexts[i].y -= 40 * dt;
      if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].life -= dt;
      if (trails[i].life <= 0) trails.splice(i, 1);
    }

    for (let i = 0; i < clouds.length; i++) {
      clouds[i].x -= clouds[i].speed * dt;
      if (clouds[i].x < -120) clouds[i].x = W + 40;
    }
    for (let i = 0; i < hills.length; i++) {
      hills[i].x -= speed * 0.18 * dt;
      if (hills[i].x + hills[i].w < 0) hills[i].x += W + 280;
    }
    for (let i = 0; i < buildings.length; i++) {
      buildings[i].x -= speed * 0.22 * dt;
      if (buildings[i].x + buildings[i].w < 0) buildings[i].x += W + 140;
    }
    if (starsEnabled) {
      shootTimer += dt;
      if (shootTimer > 1.8 + Math.random()) {
        shootTimer = 0;
        shootingStars.push({
          x: 200 + Math.random() * 700,
          y: 20 + Math.random() * 80,
          vx: -280 - Math.random() * 120,
          vy: 160 + Math.random() * 80,
          life: 0.7,
        });
      }
    }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) shootingStars.splice(i, 1);
    }
  }

  function skyColors(phase) {
    if (phase === "cosmos") return ["#07061a", "#14104a", "#2a1860"];
    if (phase === "moon") return ["#0c1028", "#243060", "#6a6088"];
    if (phase === "night") return ["#12143a", "#243868", "#4a3878"];
    return ["#2a1848", "#6a3878", "#f0a070"];
  }

  function drawSky() {
    const phase = worldPhase();
    const c = skyColors(phase);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c[0]);
    g.addColorStop(0.55, c[1]);
    g.addColorStop(1, c[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (phase !== "dusk") {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const a = s.bright * (0.45 + 0.55 * Math.sin(animT * 2 + s.tw));
        ctx.fillStyle = "rgba(255,255,255," + a + ")";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const moonY = phase === "cosmos" ? 90 : 70;
    const moonR = phase === "moon" ? 46 : 34;
    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(820, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 220, 140, 0.18)";
    ctx.beginPath();
    ctx.arc(820, moonY, moonR + 18, 0, Math.PI * 2);
    ctx.fill();
    if (phase === "moon" || phase === "cosmos") {
      ctx.fillStyle = "rgba(210, 190, 140, 0.35)";
      ctx.beginPath();
      ctx.arc(808, moonY - 8, 8, 0, Math.PI * 2);
      ctx.arc(832, moonY + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < shootingStars.length; i++) {
      const s = shootingStars[i];
      ctx.strokeStyle = "rgba(255,255,255," + Math.min(1, s.life * 1.4) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
      ctx.stroke();
    }
  }

  function drawCloud(c) {
    ctx.fillStyle = worldPhase() === "dusk" ? "rgba(255, 210, 180, 0.55)" : "rgba(200, 210, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 38 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 22 * c.s, c.y + 4, 28 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x - 20 * c.s, c.y + 4, 24 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground() {
    const phase = worldPhase();
    if (phase === "dusk" || phase === "night") {
      ctx.fillStyle = phase === "dusk" ? "rgba(40, 24, 70, 0.55)" : "rgba(18, 22, 50, 0.7)";
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        ctx.fillRect(b.x, GROUND_Y - b.h, b.w, b.h);
        ctx.fillStyle = phase === "dusk" ? "rgba(255, 200, 120, 0.35)" : "rgba(255, 220, 140, 0.22)";
        for (let wy = GROUND_Y - b.h + 10; wy < GROUND_Y - 12; wy += 16) {
          for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 12) {
            if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 5, 7);
          }
        }
        ctx.fillStyle = phase === "dusk" ? "rgba(40, 24, 70, 0.55)" : "rgba(18, 22, 50, 0.7)";
      }
    }
    for (let i = 0; i < hills.length; i++) {
      const h = hills[i];
      ctx.fillStyle = phase === "moon" || phase === "cosmos" ? "#2a3050" : "#2a4a38";
      ctx.beginPath();
      ctx.moveTo(h.x, GROUND_Y);
      ctx.quadraticCurveTo(h.x + h.w * 0.5, GROUND_Y - h.h, h.x + h.w, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < clouds.length; i++) drawCloud(clouds[i]);
  }

  function drawGround() {
    const phase = worldPhase();
    ctx.fillStyle = phase === "moon" || phase === "cosmos" ? "#6a6a78" : "#3d6a4a";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = phase === "moon" || phase === "cosmos" ? "#8a8490" : "#5a9e4a";
    ctx.fillRect(0, GROUND_Y, W, 14);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    const stripe = ((distance * 0.4) % 70);
    for (let x = -70; x < W + 70; x += 70) {
      ctx.fillRect(x - stripe, GROUND_Y + 22, 36, 6);
    }
  }

  function drawObstacle(o) {
    ctx.save();
    if (o.blown) {
      ctx.translate(o.x + o.w * 0.5, (o.drawY || o.y) - o.h * 0.5);
      ctx.rotate(o.spin || 0);
      ctx.translate(-(o.x + o.w * 0.5), -((o.drawY || o.y) - o.h * 0.5));
    }
    if (o.type === "hole") {
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(o.x, GROUND_Y, o.w, 70);
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(o.x - 6, GROUND_Y, 6, 16);
      ctx.fillRect(o.x + o.w, GROUND_Y, 6, 16);
    } else if (o.type === "rock") {
      ctx.fillStyle = "#6a6570";
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y);
      ctx.lineTo(o.x + o.w * 0.5, o.y - o.h);
      ctx.lineTo(o.x + o.w - 2, o.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(o.x + 16, o.y - 18, 6, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "lantern") {
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(o.x + 10, o.y - o.h, 8, o.h);
      ctx.fillStyle = "#c07040";
      ctx.fillRect(o.x, o.y - o.h - 6, o.w, 22);
      ctx.fillStyle = "rgba(255, 180, 70, 0.85)";
      ctx.beginPath();
      ctx.arc(o.x + o.w * 0.5, o.y - o.h + 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 160, 40, 0.15)";
      ctx.beginPath();
      ctx.arc(o.x + o.w * 0.5, o.y - o.h + 6, 26, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "bat") {
      const y = (o.drawY != null ? o.drawY : o.y);
      const flap = Math.sin(animT * 14) * 8;
      ctx.fillStyle = "#2a2038";
      ctx.beginPath();
      ctx.ellipse(o.x + 18, y - 10, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(o.x + 18, y - 10);
      ctx.quadraticCurveTo(o.x - 6, y - 18 - flap, o.x + 4, y - 4);
      ctx.quadraticCurveTo(o.x + 10, y - 8, o.x + 18, y - 10);
      ctx.moveTo(o.x + 18, y - 10);
      ctx.quadraticCurveTo(o.x + 42, y - 18 + flap, o.x + 32, y - 4);
      ctx.quadraticCurveTo(o.x + 26, y - 8, o.x + 18, y - 10);
      ctx.fill();
      ctx.fillStyle = "#e07070";
      ctx.beginPath();
      ctx.arc(o.x + 14, y - 12, 2, 0, Math.PI * 2);
      ctx.arc(o.x + 22, y - 12, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "slime") {
      const y = o.drawY != null ? o.drawY : o.y;
      const squash = 1 + Math.sin((o.t || 0) * 3.2) * 0.12;
      ctx.fillStyle = "#7dffb0";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w * 0.5, y - 16, 18, 16 * squash, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a4a38";
      ctx.beginPath();
      ctx.arc(o.x + 14, y - 20, 3, 0, Math.PI * 2);
      ctx.arc(o.x + 26, y - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "beam") {
      if (o.phase === "warn") {
        ctx.fillStyle = "rgba(255, 80, 120, " + (0.15 + 0.15 * Math.sin(animT * 16)) + ")";
        ctx.fillRect(o.x - 4, 30, o.w + 8, GROUND_Y - 30);
        ctx.strokeStyle = "rgba(255, 120, 160, 0.8)";
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(o.x, 30, o.w, GROUND_Y - 30);
        ctx.setLineDash([]);
      } else if (o.phase === "active") {
        const glow = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
        glow.addColorStop(0, "rgba(255, 80, 180, 0.15)");
        glow.addColorStop(0.5, "rgba(255, 230, 255, 0.95)");
        glow.addColorStop(1, "rgba(120, 80, 255, 0.15)");
        ctx.fillStyle = glow;
        ctx.fillRect(o.x - 10, 20, o.w + 20, GROUND_Y - 20);
      }
    }
    ctx.restore();
  }

  function drawItem(it) {
    const y = it.y + Math.sin(it.bob) * 8;
    if (it.type === "peach") {
      const g = ctx.createRadialGradient(it.x - 4, y - 4, 2, it.x, y, it.r);
      g.addColorStop(0, "#ffd0e0");
      g.addColorStop(1, "#e85a7a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(it.x, y, it.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.ellipse(it.x - 4, y - it.r + 2, 6, 4, -0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (it.type === "star") {
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        const r1 = it.r;
        const r2 = it.r * 0.42;
        ctx.lineTo(it.x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        ctx.lineTo(it.x + Math.cos(a + Math.PI / 5) * r2, y + Math.sin(a + Math.PI / 5) * r2);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#fff8d0";
      ctx.beginPath();
      ctx.ellipse(it.x, y, 7, 14, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4920a";
      ctx.stroke();
    }
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const r = player.r;
    const sx = player.squish;
    const sy = 2 - player.squish;
    const runBob = player.onGround ? Math.sin(animT * speed * 0.04) * 3 : 0;
    const charId = selectedCharId;
    const palettes = {
      night: { a: "#ffd0ea", b: "#c070d0", c: "#6a3a98", cleft: "rgba(80, 30, 120, 0.4)", leg: "#6a3a98" },
      comet: { a: "#d8f8ff", b: "#6ec8f8", c: "#2a78c8", cleft: "rgba(40, 100, 150, 0.4)", leg: "#2a78c8" },
      meteor: { a: "#ffd0b0", b: "#e07040", c: "#8a3020", cleft: "rgba(80, 20, 10, 0.4)", leg: "#8a3020" },
      luna: { a: "#ffffff", b: "#f4f0ff", c: "#d0c8f0", cleft: "rgba(120, 110, 180, 0.4)", leg: "#b0a8d0" },
      star: { a: "#fff4c0", b: "#ffb0d0", c: "#c070e0", cleft: "rgba(160, 80, 140, 0.4)", leg: "#c070e0" },
    };
    const pal = palettes[charId] || palettes.night;

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = "rgba(255, 220, 120," + (t.life * 0.45) + ")";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y - r + runBob);
    ctx.scale(sx, sy);
    if ((player.invuln > 0 || moonlight > 0) && Math.floor(animT * 20) % 2 === 0 && moonlight <= 0) {
      ctx.globalAlpha = 0.45;
    }
    if (moonlight > 0) {
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "rgba(255, 220, 100, 0.28)";
      ctx.beginPath();
      ctx.arc(0, 0, r + 16 + Math.sin(animT * 10) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, r / sy + 6, r * 0.7, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isCometAscending()) ctx.rotate(player.spinAngle);

    if (charId === "luna" || charId === "star") {
      const flap = Math.sin(animT * (player.onGround ? 10 : 14)) * 0.25;
      ctx.fillStyle = charId === "star" ? "rgba(255, 230, 140, 0.95)" : "rgba(220, 210, 255, 0.95)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.85, -2, 16, 10, -0.5 + flap, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.85, -2, 16, 10, 0.5 - flap, 0, Math.PI * 2);
      ctx.fill();
    }

    if (charId === "comet") {
      ctx.fillStyle = "#2a7aad";
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.75 + (i / 6) * Math.PI * 0.7;
        const x1 = Math.cos(a) * (r - 2);
        const y1 = Math.sin(a) * (r - 2);
        const x2 = Math.cos(a) * (r + 10);
        const y2 = Math.sin(a) * (r + 10);
        const ox = Math.cos(a + Math.PI / 2) * 4;
        const oy = Math.sin(a + Math.PI / 2) * 4;
        ctx.beginPath();
        ctx.moveTo(x1 + ox, y1 + oy);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1 - ox, y1 - oy);
        ctx.closePath();
        ctx.fill();
      }
    }

    const body = ctx.createRadialGradient(-8, -10, 4, 0, 0, r);
    body.addColorStop(0, pal.a);
    body.addColorStop(0.55, pal.b);
    body.addColorStop(1, pal.c);
    ctx.fillStyle = body;
    if (charId === "meteor") {
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, -r * 0.55);
      ctx.lineTo(r * 0.75, -r * 0.55);
      ctx.lineTo(r * 0.95, r * 0.15);
      ctx.lineTo(r * 0.55, r * 0.9);
      ctx.lineTo(-r * 0.55, r * 0.9);
      ctx.lineTo(-r * 0.95, r * 0.15);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = pal.cleft;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r + 4);
    ctx.quadraticCurveTo(-2, -4, 0, 8);
    ctx.stroke();

    ctx.fillStyle = charId === "star" ? "#ffd24a" : "#7dce7a";
    ctx.beginPath();
    ctx.ellipse(-6, -r + 2, 10, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r + 4);
    ctx.lineTo(0, -r - 10);
    ctx.stroke();

    const eyesClosed = player.blink % 3.2 > 3.0;
    if (eyesClosed) {
      ctx.strokeStyle = "#3a2a22";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-5, -4);
      ctx.moveTo(5, -4);
      ctx.lineTo(12, -4);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#3a2a22";
      ctx.beginPath();
      ctx.arc(-8, -4, 3.2, 0, Math.PI * 2);
      ctx.arc(8, -4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-7, -5, 1.2, 0, Math.PI * 2);
      ctx.arc(9, -5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 120, 160, 0.4)";
    ctx.beginPath();
    ctx.ellipse(-14, 4, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(14, 4, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#3a2a22";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 4, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    if (player.onGround && state === "playing") {
      const leg = Math.sin(animT * speed * 0.05) * 8;
      ctx.strokeStyle = pal.leg;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-8, r - 6);
      ctx.lineTo(-8 + leg, r + 8);
      ctx.moveTo(8, r - 6);
      ctx.lineTo(8 - leg, r + 8);
      ctx.stroke();
    }

    if (player.feather || (charId === "luna" && player.diveCharges > 0) || player.shield > 0) {
      ctx.strokeStyle = "rgba(255, 200, 60, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < floatTexts.length; i++) {
      const f = floatTexts[i];
      ctx.globalAlpha = Math.max(0, f.life * 1.4);
      ctx.fillStyle = f.color;
      ctx.font = "800 16px 'M PLUS Rounded 1c', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  function draw() {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawSky();
    drawBackground();
    drawGround();
    for (let i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);
    for (let i = 0; i < items.length; i++) drawItem(items[i]);
    drawPlayer();
    drawParticles();
    if (moonlight > 0 && state === "playing") {
      ctx.fillStyle = "rgba(255, 230, 140, 0.08)";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0.016);
    lastTime = now;
    animT += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 18);
    if (state === "playing") {
      updatePlayer(dt);
      if (state === "playing") updateWorld(dt);
    } else {
      player.blink += dt;
      player.squish += (1 - player.squish) * Math.min(1, dt * 8);
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].x -= clouds[i].speed * dt;
        if (clouds[i].x < -120) clouds[i].x = W + 40;
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = floatTexts.length - 1; i >= 0; i--) {
        floatTexts[i].life -= dt;
        floatTexts[i].y -= 40 * dt;
        if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  function isInteractiveTarget(target) {
    return !!(
      target &&
      target.closest &&
      target.closest(
        "button, a, input, select, label, .panel, .sound-settings, .char-select, .mode-select, .mode-records, .user-row, .name-register-panel, .debug-exit-btn"
      )
    );
  }

  function onPointer(e) {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    if (state === "title") {
      const rect = canvas.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      const pos = canvasCoords(e);
      if (hitTitlePeach(pos.x, pos.y)) handleTitlePeachTap();
      return;
    }
    if (state === "playing") tryAction();
  }

  const app = document.getElementById("app");
  app.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isNameRegisterOpen()) return;
      e.preventDefault();
      tryAction();
    }
  });

  btnStart.addEventListener("click", function (e) {
    e.stopPropagation();
    requestStartGame(false);
  });
  btnRetry.addEventListener("click", function (e) {
    e.stopPropagation();
    requestStartGame(false);
  });
  btnTitle.addEventListener("click", function (e) {
    e.stopPropagation();
    showTitle();
  });
  btnDebugTitle.addEventListener("click", function (e) {
    e.stopPropagation();
    showTitle();
  });

  if (btnDeleteUser) {
    btnDeleteUser.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!userName) return;
      if (window.confirm("本当に削除してもよろしいですか？")) clearUserName();
    });
  }
  if (btnNameOk) {
    btnNameOk.addEventListener("click", function (e) {
      e.stopPropagation();
      confirmNameAndStart();
    });
  }
  if (btnNameCancel) {
    btnNameCancel.addEventListener("click", function (e) {
      e.stopPropagation();
      hideNameRegister();
    });
  }
  if (inputUserName) {
    inputUserName.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        confirmNameAndStart();
      }
    });
    inputUserName.addEventListener("input", function () {
      if (nameRegisterError) nameRegisterError.classList.add("hidden");
    });
    inputUserName.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  toggleSfx.addEventListener("change", function () {
    sfxEnabled = toggleSfx.checked;
    localStorage.setItem(SFX_KEY, sfxEnabled ? "1" : "0");
  });
  toggleStars.addEventListener("change", function () {
    starsEnabled = toggleStars.checked;
    localStorage.setItem(STARS_KEY, starsEnabled ? "1" : "0");
  });
  bgmModeSelect.addEventListener("change", function () {
    bgmMode = bgmModeSelect.value;
    localStorage.setItem(BGM_MODE_KEY, bgmMode);
    if (state === "playing") playBgm(true);
  });
  toggleSfx.addEventListener("click", function (e) { e.stopPropagation(); });
  toggleStars.addEventListener("click", function (e) { e.stopPropagation(); });
  bgmModeSelect.addEventListener("click", function (e) { e.stopPropagation(); });

  for (let i = 0; i < charButtons.length; i++) {
    charButtons[i].addEventListener("click", function (e) {
      e.stopPropagation();
      setSelectedChar(charButtons[i].getAttribute("data-char"));
    });
  }
  for (let i = 0; i < modeButtons.length; i++) {
    modeButtons[i].addEventListener("click", function (e) {
      e.stopPropagation();
      const mode = modeButtons[i].getAttribute("data-mode");
      handleSecretModeTap(mode);
      setSelectedMode(mode);
    });
  }

  toggleSfx.checked = sfxEnabled;
  toggleStars.checked = starsEnabled;
  bgmModeSelect.value = bgmMode;
  syncModeSelectUi();
  syncModeRecordsUi();
  syncCharSelectUi();
  syncBestDisplay();
  syncUserNameUi();
  const versionEl = document.getElementById("app-version");
  if (versionEl) versionEl.textContent = "Ver." + APP_VERSION;
  initDecor();
  showTitle();
  lastTime = performance.now();
  requestAnimationFrame(loop);
})();
