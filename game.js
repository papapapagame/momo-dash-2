(function () {
  "use strict";

  const W = 540;
  const H = 960;
  const APP_VERSION = "2.02";
  const WALL = 58;
  const PLAYER_Y = 660;
  const PLAYER_R = 24;
  const DASH_DUR = 0.26;
  const LUNA_DASH_DUR = 0.34;
  const PEACH_SCORE = 100;
  const STAR_SCORE = 50;
  const FEATHER_BONUS = 150;
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
      desc: "夜のもも。1度だけ障害物への接触を我慢できる。距離スコアが少し多め。羽を取ると引き返しを1回ストック（最大2）。",
      distMult: 1.2,
      moonGain: 1,
      canReverse: false,
    },
    comet: {
      id: "comet",
      name: "コメット桃",
      desc: "ダッシュ中に通路の敵やランタンを彗星のように吹き飛ばしてスコアにする！羽を取ると引き返しを1回ストック（最大2）。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: false,
    },
    meteor: {
      id: "meteor",
      name: "メテオ桃",
      desc: "着壁の衝撃で、その壁の近くのトゲを破壊してスコアにする！羽があると破壊範囲が広がるぞ。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: false,
    },
    luna: {
      id: "luna",
      name: "ルナ桃",
      desc: "ダッシュがゆっくりで、途中でもう1回タップすると反対の壁へ引き返せる。スコアの伸びは遅め。",
      distMult: 0.65,
      moonGain: 1.2,
      canReverse: true,
    },
    star: {
      id: "star",
      name: "スター桃",
      desc: "夜空の隠しもも。ダッシュ中に1回引き返せて、ムーンゲージが貯まりやすい。羽で引き返しをストック（最大2）。スタート時にムーンダッシュ持ち！",
      distMult: 1.15,
      moonGain: 1.6,
      canReverse: true,
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
  let secretTap = { count: 0 };

  let score = 0;
  let distance = 0;
  let distScoreAcc = 0;
  let speed = 280;
  let spawnTimer = 0;
  let nextSpawn = 1.2;
  let itemSpawnTimer = 0;
  let nextItemSpawn = 1.6;
  let nextSpikeSide = "right";
  let lastTime = 0;
  let animT = 0;
  let shake = 0;
  let combo = 0;
  let comboTimer = 0;
  let maxCombo = 0;
  let moonGauge = 0;
  let moonlight = 0;

  let stars = [];
  let shootingStars = [];
  let shootTimer = 0;
  let obstacles = [];
  let items = [];
  let particles = [];
  let floatTexts = [];
  let trails = [];
  let windows = [];

  let audioCtx = null;
  let bgmTimer = null;
  let bgmTrackIndex = 0;
  let bgmPlaying = false;
  let bgmStep = 0;

  const player = {
    side: "left",
    x: WALL + PLAYER_R,
    y: PLAYER_Y,
    r: PLAYER_R,
    dashing: false,
    dashT: 0,
    fromX: 0,
    toX: 0,
    targetSide: "right",
    squish: 1,
    blink: 0,
    shield: 0,
    feather: false,
    reverses: 0,
    invuln: 0,
    spinAngle: 0,
  };

  function emptyRecords() {
    const rec = {};
    for (let i = 0; i < MODE_IDS.length; i++) rec[MODE_IDS[i]] = { score: 0, char: "" };
    rec.chars = {};
    for (let i = 0; i < CHAR_IDS.length; i++) rec.chars[CHAR_IDS[i]] = { easy: 0, normal: 0, hard: 0 };
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
        spawnFloatText(W * 0.5, 120, "スター桃 解除！", "#ffd24a");
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
    if (player.reverses > 0) {
      if (label) label.textContent = "引き返し×" + player.reverses;
      statusHud.classList.toggle("hidden", false);
    } else if (selectedCharId === "meteor") {
      if (label) label.textContent = player.feather ? "壁破壊+" : "着壁破壊";
      statusHud.classList.toggle("hidden", false);
    } else if (selectedCharId === "night") {
      if (label) label.textContent = "ガード";
      statusHud.classList.toggle("hidden", player.shield <= 0);
    } else {
      if (label) label.textContent = "引き返し×0";
      statusHud.classList.toggle("hidden", true);
    }
    if (state !== "playing") statusHud.classList.add("hidden");
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
    spawnBurst(player.x, player.y, "#ffe08a", 22);
    spawnFloatText(player.x, player.y - 36, "ムーンダッシュ！", "#ffd24a");
  }

  function worldPhase() {
    if (score >= 7000) return "cosmos";
    if (score >= 4000) return "moon";
    if (score >= 1800) return "night";
    return "dusk";
  }

  function initDecor() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: WALL + 10 + Math.random() * (W - WALL * 2 - 20),
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.7,
        tw: Math.random() * Math.PI * 2,
        bright: 0.4 + Math.random() * 0.6,
      });
    }
    windows = [];
    for (let i = 0; i < 14; i++) {
      windows.push({
        side: i % 2 === 0 ? "left" : "right",
        y: (i * 90) % H,
        lit: Math.random() > 0.35,
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

  function sfxDash() {
    if (!sfxEnabled) return;
    playTone(480, 0.1, "triangle", 0.16, 820);
    playTone(720, 0.08, "sine", 0.1, 1100);
  }

  function sfxLand() {
    if (!sfxEnabled) return;
    playTone(240, 0.08, "triangle", 0.12, 140);
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
    moonlight: [392, 494, 587, 659, 587, 494, 392, 330, 349, 440, 523, 587, 523, 440, 349, 294],
    nightdash: [330, 392, 494, 392, 523, 392, 494, 330, 294, 349, 440, 349, 494, 349, 440, 294],
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
    bgmTimer = setInterval(function () {
      if (!bgmPlaying || !audioCtx || state !== "playing") return;
      const notes = BGM_PATTERNS[currentBgmTrack()];
      const freq = notes[bgmStep % notes.length];
      playTone(freq, 0.18, bgmStep % 4 === 0 ? "triangle" : "sine", 0.045);
      if (bgmStep % 2 === 0) playTone(freq / 2, 0.2, "sine", 0.03);
      bgmStep += 1;
      if (bgmMode === "sequence" && bgmStep % notes.length === 0 && bgmStep > 0) {
        bgmTrackIndex = (bgmTrackIndex + 1) % 2;
      }
    }, 220);
  }

  function wallX(side) {
    return side === "left" ? WALL + player.r : W - WALL - player.r;
  }

  function otherSide(side) {
    return side === "left" ? "right" : "left";
  }

  function dashDuration() {
    return selectedCharId === "luna" ? LUNA_DASH_DUR : DASH_DUR;
  }

  function resetReverses() {
    if (selectedCharId === "luna") {
      player.reverses = player.feather ? 2 : 1;
    } else if (selectedCharId === "star") {
      player.reverses = Math.min(2, Math.max(player.reverses, 1));
    }
  }

  function resetGame() {
    score = 0;
    distance = 0;
    distScoreAcc = 0;
    speed = 280;
    spawnTimer = 0;
    nextSpawn = selectedMode === "easy" ? 1.8 : selectedMode === "hard" ? 0.85 : 1.15;
    itemSpawnTimer = 0;
    nextItemSpawn = 1.4;
    nextSpikeSide = "right";
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
    player.side = "left";
    player.x = wallX("left");
    player.y = PLAYER_Y;
    player.dashing = false;
    player.dashT = 0;
    player.squish = 1;
    player.blink = 0;
    player.shield = selectedCharId === "night" ? 1 : 0;
    player.feather = false;
    player.invuln = 0;
    player.spinAngle = 0;
    resetReverses();
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
    syncStatusHud();
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
    syncStatusHud();
    if (selectedCharId === "star") startMoonlight();
    playBgm(true);
    lastTime = performance.now();
  }

  function endGame() {
    if (state !== "playing") return;
    if (debugMode) return;
    state = "gameover";
    stopBgm();
    sfxHit();
    shake = 12;
    spawnBurst(player.x, player.y, "#ff8fab", 18);
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

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function startDash(toSide) {
    player.dashing = true;
    player.dashT = 0;
    player.fromX = player.x;
    player.toX = wallX(toSide);
    player.targetSide = toSide;
    player.squish = 1.35;
    sfxDash();
    spawnBurst(player.x, player.y, "#ffd0ea", 8);
  }

  function reverseDash() {
    if (player.reverses <= 0) return;
    player.reverses -= 1;
    player.fromX = player.x;
    player.targetSide = otherSide(player.targetSide);
    player.toX = wallX(player.targetSide);
    player.dashT = 0;
    player.squish = 1.25;
    syncStatusHud();
    sfxDash();
    spawnFloatText(player.x, player.y - 28, "引き返し！", "#c49cff");
  }

  function land() {
    player.dashing = false;
    player.side = player.targetSide;
    player.x = wallX(player.side);
    player.y = PLAYER_Y;
    player.squish = 0.72;
    sfxLand();
    bumpCombo();
    addMoon(2);
    resetReverses();
    syncStatusHud();
    if (selectedCharId === "meteor") smashSpikesNearLanding();
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
    if (player.dashing) {
      reverseDash();
      return;
    }
    startDash(otherSide(player.side));
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
    const dy = y - player.y;
    return dx * dx + dy * dy <= (player.r * 1.8) * (player.r * 1.8);
  }

  function handleTitlePeachTap() {
    if (isNameRegisterOpen()) return;
    debugTapCount += 1;
    player.squish = 1.3;
    spawnBurst(player.x, player.y, "#ff8fab", 5);
    if (debugTapCount >= DEBUG_TAPS_NEEDED) requestStartGame(true);
  }

  function difficultyFactor() {
    return Math.min(1, distance / 4200);
  }

  function spawnSpike(side, h) {
    obstacles.push({
      type: "spike",
      side: side,
      y: -h - 10,
      h: h,
      w: 26,
      blown: false,
    });
  }

  function spawnObstacle() {
    const d = difficultyFactor();
    const types = ["spike"];
    if (selectedMode !== "easy" && d > 0.08) types.push("bat");
    if (score >= 900) types.push("lantern");
    if (score >= 2800) types.push("beam");
    if (selectedMode === "hard") types.push("bat", "spike");
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "spike") {
      const h = 70 + Math.random() * 50;
      spawnSpike(nextSpikeSide, h);
      nextSpikeSide = otherSide(nextSpikeSide);
      if (selectedMode === "hard" && Math.random() < 0.28) {
        const lateH = 50 + Math.random() * 30;
        obstacles.push({
          type: "spike",
          side: nextSpikeSide,
          y: -h - lateH - 90,
          h: lateH,
          w: 26,
          blown: false,
        });
      }
    } else if (type === "bat") {
      obstacles.push({
        type: "bat",
        x: W * 0.35 + Math.random() * W * 0.3,
        y: -40,
        w: 36,
        h: 24,
        t: Math.random() * 10,
        blown: false,
      });
    } else if (type === "lantern") {
      obstacles.push({
        type: "lantern",
        x: W * 0.5 - 14,
        y: -90,
        w: 28,
        h: 70,
        blown: false,
      });
    } else if (type === "beam") {
      obstacles.push({
        type: "beam",
        x: WALL,
        y: -24,
        w: W - WALL * 2,
        h: 18,
        warn: 0.7,
        active: 0.38,
        phase: "warn",
        blown: false,
      });
    }
  }

  function spawnItem() {
    const r = Math.random();
    let type = "peach";
    if (r < 0.45) type = "star";
    else if (r < 0.6) type = "feather";
    items.push({
      type: type,
      x: W * 0.38 + Math.random() * W * 0.24,
      y: -30,
      r: type === "star" ? 13 : 15,
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
    } else {
      player.feather = true;
      if (selectedCharId === "luna") {
        player.reverses = Math.max(player.reverses, 2);
      } else if (selectedCharId !== "meteor") {
        player.reverses = Math.min(2, player.reverses + 1);
      }
      const gained = addScore(FEATHER_BONUS * comboMult());
      spawnBurst(item.x, item.y, "#fff8d0", 12);
      spawnFloatText(item.x, item.y - 20, "羽 +" + gained, "#9a6a00");
      syncStatusHud();
      sfxFeather();
    }
  }

  function spawnBurst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 220;
      particles.push({
        x: x, y: y,
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

  function obstacleCenter(o) {
    if (o.type === "spike") {
      const x = o.side === "left" ? WALL + o.w * 0.5 : W - WALL - o.w * 0.5;
      return { x: x, y: o.y + o.h * 0.5 };
    }
    if (o.type === "bat") return { x: o.x + o.w * 0.5, y: o.y + o.h * 0.5 };
    if (o.type === "beam") return { x: W * 0.5, y: o.y + o.h * 0.5 };
    return { x: o.x + o.w * 0.5, y: o.y + o.h * 0.5 };
  }

  function destroyObstacle(o, points, color) {
    const c = obstacleCenter(o);
    spawnBurst(c.x, c.y, color || "#ffd24a", 14);
    if (points > 0) {
      bumpCombo();
      const gained = addScore(points * comboMult() * (moonlight > 0 ? 2 : 1));
      sfxPeach();
      spawnFloatText(c.x, c.y - 10, "+" + gained, color || "#e85a7a");
      addMoon(6);
    }
    const idx = obstacles.indexOf(o);
    if (idx !== -1) obstacles.splice(idx, 1);
  }

  function smashSpikesNearLanding() {
    const range = player.feather ? 130 : 78;
    let smashed = 0;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.type !== "spike" || o.side !== player.side) continue;
      const cy = o.y + o.h * 0.5;
      if (Math.abs(cy - player.y) <= range) {
        destroyObstacle(o, SMASH_SCORE, "#e07040");
        smashed += 1;
      }
    }
    if (smashed > 0 && player.feather) {
      player.feather = false;
      syncStatusHud();
    }
  }

  function spikeRect(o) {
    if (o.side === "left") return { x: WALL, y: o.y, w: o.w, h: o.h };
    return { x: W - WALL - o.w, y: o.y, w: o.w, h: o.h };
  }

  function circleHitsRect(px, py, pr, rx, ry, rw, rh) {
    const cx = Math.max(rx, Math.min(px, rx + rw));
    const cy = Math.max(ry, Math.min(py, ry + rh));
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= pr * pr;
  }

  function hitsObstacle(o) {
    const pr = player.r * 0.78;
    if (o.type === "spike") {
      if (player.dashing) return false;
      if (o.side !== player.side) return false;
      const r = spikeRect(o);
      return circleHitsRect(player.x, player.y, pr, r.x, r.y, r.w, r.h);
    }
    if (o.type === "beam") {
      if (o.phase !== "active") return false;
      return circleHitsRect(player.x, player.y, pr, o.x, o.y, o.w, o.h);
    }
    if (o.type === "bat") {
      return circleHitsRect(player.x, player.y, pr, o.x, o.y, o.w, o.h);
    }
    if (o.type === "lantern") {
      return circleHitsRect(player.x, player.y, pr, o.x, o.y, o.w, o.h);
    }
    return false;
  }

  function canSmashCenter(o) {
    if (o.type === "spike" || o.type === "beam") return false;
    return player.dashing && (selectedCharId === "comet" || moonlight > 0);
  }

  function resolveHit(o) {
    if (player.invuln > 0 || moonlight > 0) {
      if (o.type !== "beam" || moonlight > 0) {
        destroyObstacle(o, SMASH_SCORE, "#ffe08a");
        return "ok";
      }
    }
    if (canSmashCenter(o)) {
      destroyObstacle(o, SMASH_SCORE, "#3a9fd0");
      return "ok";
    }
    if (player.shield > 0) {
      player.shield -= 1;
      player.invuln = 0.85;
      player.squish = 1.35;
      breakCombo();
      sfxHit();
      spawnBurst(player.x, player.y, "#c070d0", 14);
      spawnFloatText(player.x, player.y - 28, "ガード！", "#7a5ab0");
      syncStatusHud();
      return "ok";
    }
    return "die";
  }

  function updateWorld(dt) {
    const dashBoost = moonlight > 0 ? 1.2 : 1;
    const target =
      (280 + difficultyFactor() * 200) *
      dashBoost *
      (selectedMode === "hard" ? 1.1 : selectedMode === "easy" ? 0.88 : 1);
    speed += (target - speed) * Math.min(1, dt * 3);
    distance += speed * dt;
    distScoreAcc += speed * dt * 0.05 * currentChar().distMult * (moonlight > 0 ? 1.5 : 1);
    if (distScoreAcc >= 1) {
      const add = Math.floor(distScoreAcc);
      distScoreAcc -= add;
      setScore(score + add);
    }
    syncSpeedDisplay();

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
      trails.push({ x: player.x, y: player.y, life: 0.28, r: player.r });
    }

    spawnTimer += dt;
    if (spawnTimer >= nextSpawn) {
      spawnTimer = 0;
      nextSpawn = (selectedMode === "easy" ? 1.35 : selectedMode === "hard" ? 0.72 : 0.95) - difficultyFactor() * 0.28;
      nextSpawn = Math.max(0.55, nextSpawn + Math.random() * 0.25);
      spawnObstacle();
    }
    itemSpawnTimer += dt;
    if (itemSpawnTimer >= nextItemSpawn) {
      itemSpawnTimer = 0;
      nextItemSpawn = 1.4 + Math.random() * 0.9;
      spawnItem();
    }

    if (player.dashing) {
      player.dashT += dt / dashDuration();
      const t = Math.min(1, player.dashT);
      player.x = player.fromX + (player.toX - player.fromX) * easeInOut(t);
      player.y = PLAYER_Y - Math.sin(t * Math.PI) * 42;
      if (selectedCharId === "comet") player.spinAngle += dt * 16;
      if (t >= 1) land();
    } else {
      player.y = PLAYER_Y;
    }

    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
    player.blink += dt;
    player.squish += (1 - player.squish) * Math.min(1, dt * 8);

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += speed * dt;
      if (o.type === "bat") {
        o.t += dt;
        o.x += Math.sin(o.t * 3.4) * 40 * dt;
      } else if (o.type === "beam") {
        if (o.phase === "warn") {
          o.warn -= dt;
          if (o.warn <= 0) o.phase = "active";
        } else if (o.phase === "active") {
          o.active -= dt;
          if (o.active <= 0) o.phase = "done";
        }
      }
      if (o.y > H + 80) obstacles.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += speed * dt;
      it.bob += dt * 4;
      if (it.y > H + 40) {
        items.splice(i, 1);
        continue;
      }
      const iy = it.y + Math.sin(it.bob) * 6;
      const dx = player.x - it.x;
      const dy = player.y - iy;
      if (dx * dx + dy * dy < (player.r + it.r) * (player.r + it.r)) {
        collectItem(it);
        items.splice(i, 1);
      }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (canSmashCenter(o) && circleHitsRect(player.x, player.y, player.r * 0.9, o.x, o.y, o.w, o.h)) {
        if (resolveHit(o) === "die") {
          endGame();
          return;
        }
        continue;
      }
      if (!hitsObstacle(o)) continue;
      if (resolveHit(o) === "die") {
        endGame();
        return;
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt;
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

    for (let i = 0; i < windows.length; i++) {
      windows[i].y += speed * 0.35 * dt;
      if (windows[i].y > H + 20) {
        windows[i].y = -40;
        windows[i].lit = Math.random() > 0.35;
      }
    }
    if (starsEnabled) {
      shootTimer += dt;
      if (shootTimer > 2.1) {
        shootTimer = 0;
        shootingStars.push({
          x: WALL + 40 + Math.random() * (W - WALL * 2 - 80),
          y: 40,
          vx: -40 + Math.random() * 80,
          vy: 180 + Math.random() * 80,
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

    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(W * 0.5, 88, phase === "moon" ? 42 : 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 220, 140, 0.16)";
    ctx.beginPath();
    ctx.arc(W * 0.5, 88, 52, 0, Math.PI * 2);
    ctx.fill();

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

  function drawWalls() {
    const phase = worldPhase();
    ctx.fillStyle = phase === "moon" || phase === "cosmos" ? "#2a2840" : "#1e1830";
    ctx.fillRect(0, 0, WALL, H);
    ctx.fillRect(W - WALL, 0, WALL, H);
    ctx.fillStyle = phase === "dusk" ? "#3a2458" : "#2a2048";
    ctx.fillRect(WALL - 8, 0, 8, H);
    ctx.fillRect(W - WALL, 0, 8, H);

    const shift = (distance * 0.4) % 48;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let y = -48; y < H + 48; y += 48) {
      ctx.fillRect(6, y + shift, WALL - 20, 10);
      ctx.fillRect(W - WALL + 14, y + shift + 24, WALL - 20, 10);
    }
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const x = w.side === "left" ? 16 : W - 38;
      ctx.fillStyle = w.lit ? "rgba(255, 200, 120, 0.55)" : "rgba(20, 16, 40, 0.6)";
      ctx.fillRect(x, w.y, 18, 14);
    }
  }

  function drawObstacle(o) {
    if (o.type === "spike") {
      const r = spikeRect(o);
      ctx.fillStyle = "#d8d0e8";
      const dir = o.side === "left" ? 1 : -1;
      const baseX = o.side === "left" ? WALL : W - WALL;
      const tipX = o.side === "left" ? WALL + o.w : W - WALL - o.w;
      const n = Math.max(2, Math.floor(o.h / 22));
      for (let i = 0; i < n; i++) {
        const y0 = o.y + (i / n) * o.h;
        const y1 = o.y + ((i + 1) / n) * o.h;
        ctx.beginPath();
        ctx.moveTo(baseX, y0);
        ctx.lineTo(tipX, (y0 + y1) / 2);
        ctx.lineTo(baseX, y1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#ff6b9a";
      ctx.fillRect(r.x, r.y, 4 * dir * dir, r.h);
    } else if (o.type === "bat") {
      const flap = Math.sin(animT * 14) * 8;
      ctx.fillStyle = "#2a2038";
      ctx.beginPath();
      ctx.ellipse(o.x + 18, o.y + 12, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(o.x + 18, o.y + 12);
      ctx.quadraticCurveTo(o.x - 4, o.y + 2 - flap, o.x + 6, o.y + 16);
      ctx.quadraticCurveTo(o.x + 12, o.y + 12, o.x + 18, o.y + 12);
      ctx.moveTo(o.x + 18, o.y + 12);
      ctx.quadraticCurveTo(o.x + 40, o.y + 2 + flap, o.x + 30, o.y + 16);
      ctx.quadraticCurveTo(o.x + 24, o.y + 12, o.x + 18, o.y + 12);
      ctx.fill();
    } else if (o.type === "lantern") {
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(o.x + 10, o.y, 8, o.h);
      ctx.fillStyle = "#c07040";
      ctx.fillRect(o.x, o.y + o.h - 22, o.w, 22);
      ctx.fillStyle = "rgba(255, 180, 70, 0.9)";
      ctx.beginPath();
      ctx.arc(o.x + o.w * 0.5, o.y + o.h - 10, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "beam") {
      if (o.phase === "warn") {
        ctx.fillStyle = "rgba(255, 80, 120, " + (0.12 + 0.14 * Math.sin(animT * 16)) + ")";
        ctx.fillRect(o.x, o.y, o.w, o.h + 8);
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = "rgba(255, 120, 160, 0.85)";
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.setLineDash([]);
      } else if (o.phase === "active") {
        const glow = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
        glow.addColorStop(0, "rgba(255, 80, 180, 0.15)");
        glow.addColorStop(0.5, "rgba(255, 230, 255, 0.95)");
        glow.addColorStop(1, "rgba(120, 80, 255, 0.15)");
        ctx.fillStyle = glow;
        ctx.fillRect(o.x, o.y - 6, o.w, o.h + 12);
      }
    }
  }

  function drawItem(it) {
    const y = it.y + Math.sin(it.bob) * 6;
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
        const a = -Math.PI / 2 + i * ((Math.PI * 2) / 5);
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
    }
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const r = player.r;
    const sx = player.squish;
    const sy = 2 - player.squish;
    const cling = player.dashing ? 0 : Math.sin(animT * 8) * 2;
    const palettes = {
      night: { a: "#ffd0ea", b: "#c070d0", c: "#6a3a98", cleft: "rgba(80, 30, 120, 0.4)", leg: "#6a3a98" },
      comet: { a: "#d8f8ff", b: "#6ec8f8", c: "#2a78c8", cleft: "rgba(40, 100, 150, 0.4)", leg: "#2a78c8" },
      meteor: { a: "#ffd0b0", b: "#e07040", c: "#8a3020", cleft: "rgba(80, 20, 10, 0.4)", leg: "#8a3020" },
      luna: { a: "#ffffff", b: "#f4f0ff", c: "#d0c8f0", cleft: "rgba(120, 110, 180, 0.4)", leg: "#b0a8d0" },
      star: { a: "#fff4c0", b: "#ffb0d0", c: "#c070e0", cleft: "rgba(160, 80, 140, 0.4)", leg: "#c070e0" },
    };
    const pal = palettes[selectedCharId] || palettes.night;
    const charId = selectedCharId;

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = "rgba(255, 220, 120," + t.life * 0.45 + ")";
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(x, y + cling);
    const face = player.side === "left" ? 1 : -1;
    ctx.scale(face * sx, sy);
    if (player.dashing && charId === "comet") ctx.rotate(player.spinAngle);
    if ((player.invuln > 0 || moonlight > 0) && moonlight <= 0 && Math.floor(animT * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    if (moonlight > 0) {
      ctx.fillStyle = "rgba(255, 220, 100, 0.28)";
      ctx.beginPath();
      ctx.arc(0, 0, r + 16 + Math.sin(animT * 10) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (charId === "luna" || charId === "star") {
      const flap = Math.sin(animT * 12) * 0.25;
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
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
        ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
        ctx.lineTo(Math.cos(a - 0.2) * (r - 2), Math.sin(a - 0.2) * (r - 2));
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
    ctx.textAlign = "center";
    ctx.font = "800 16px 'M PLUS Rounded 1c', sans-serif";
    for (let i = 0; i < floatTexts.length; i++) {
      const f = floatTexts[i];
      ctx.globalAlpha = Math.max(0, f.life * 1.4);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawSky();
    drawWalls();
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
      updateWorld(dt);
    } else {
      player.blink += dt;
      player.squish += (1 - player.squish) * Math.min(1, dt * 8);
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
