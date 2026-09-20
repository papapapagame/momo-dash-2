(function () {
  "use strict";

  const W = 540;
  const H = 960;
  const APP_VERSION = "2.14";
  const WALL = 58;
  const PLAYER_Y = 660;
  const PLAYER_R = 24;
  const DASH_DUR = 0.26;
  const LUNA_DASH_DUR = 1.36;
  const PEACH_SCORE = 100;
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
  const FIREWORKS_KEY = "momoDash2Fireworks";
  const CHAR_KEY = "momoDash2Char";
  const USER_KEY = "momoDash2UserName";
  const STAR_UNLOCK_KEY = "momoDash2StarUnlock";
  const YUZU_UNLOCK_KEY = "momoDash2UnlockYuzu";
  const HAKASE_UNLOCK_KEY = "momoDash2UnlockHakase";
  const HAMA_UNLOCK_KEY = "momoDash2UnlockHama";
  const BGM_VOLUME = 0.45;
  const BGM_TRACKS = [
    { file: "sounds/momo-dash.mp3", label: "ももダッシュ！" },
    { file: "sounds/peach-funky-run.mp3", label: "PEACH FUNKY RUN" },
    { file: "sounds/peach-overdrive.mp3", label: "PEACH OVERDRIVE" },
    { file: "sounds/momo-panic.mp3", label: "もももも☆ぱにっく！！" },
  ];
  const CHAR_IDS = ["night", "comet", "meteor", "luna", "star", "yuzu", "hakase", "hama"];
  const SLOT_SECRET = { night: "hama", comet: "yuzu", meteor: "hakase" };
  const CHAR_UNLOCK_SEQ = {
    yuzu: ["night", "night", "night", "meteor", "meteor", "meteor", "meteor", "luna", "luna", "luna", "luna", "luna"],
    hakase: ["night", "night", "night", "comet", "comet", "comet", "comet", "luna", "luna", "luna", "luna", "luna"],
    hama: ["luna", "luna", "luna", "comet", "comet", "comet", "comet", "meteor", "meteor", "meteor", "meteor", "meteor"],
  };
  const MODE_IDS = ["easy", "normal", "hard"];
  const BGM_MODE_VALUES = ["0", "1", "2", "3", "sequence", "random", "off"];
  const CHARACTERS = {
    night: {
      id: "night",
      name: "ノーマル桃",
      desc: "最初から1回無敵。桃3つで無敵1回（先に使う）。羽を取ると引き返しをストック（最大2）し、上から桃が2つ降ってくる。",
      distMult: 1.2,
      moonGain: 1,
      canReverse: false,
    },
    comet: {
      id: "comet",
      name: "コメット桃",
      desc: "ジャンプ中に1回だけ切り返せる。羽を取ると、そのあと1度だけカラスや蝙蝠を倒せる（ストック不可）。羽が無いと倒せない。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: true,
    },
    meteor: {
      id: "meteor",
      name: "メテオ桃",
      desc: "ジャンプ中に1回だけ切り返せる。羽を取るとトゲを1度だけ無効化できる。羽が無いとトゲは通常どおり痛い。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: true,
    },
    luna: {
      id: "luna",
      name: "ルナ桃",
      desc: "ジャンプがとてもゆっくりで、ジャンプ中は何度でも切り返せる。羽を取ったあと、次の切り返しで前方3方向に羽を飛ばして敵を壊す。",
      distMult: 0.85,
      moonGain: 1.2,
      canReverse: true,
    },
    star: {
      id: "star",
      name: "スター桃",
      desc: "夜空の隠しもも。ジャンプ中に1回引き返せて、ムーンゲージが貯まりやすい。羽で引き返しをストック（最大2）。スタート時にムーンジャンプ持ち！",
      distMult: 1.15,
      moonGain: 1.6,
      canReverse: true,
    },
    yuzu: {
      id: "yuzu",
      name: "ゆずりんご",
      desc: "白いねこ。ジャンプ中に1回切り返せる。羽1つでカラス・蝙蝠を2回倒せる（最大2回分）。5体倒すと無敵1回（最大1。桃の無敵より先に使う）。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: true,
    },
    hakase: {
      id: "hakase",
      name: "はかせ",
      desc: "金のティラノ。ジャンプ中に1回切り返せる。羽1つでトゲを2回壊せる（最大2回分）。5個壊すと、張り付いている壁と反対側の前方3方向に火の玉を撃つ。",
      distMult: 0.85,
      moonGain: 1,
      canReverse: true,
    },
    hama: {
      id: "hama",
      name: "はまさん",
      desc: "ノーマル桃と同じ基本性能。桃3つで無敵に加え、自分から広がる衝撃波で画面上の障害物を破壊する。",
      distMult: 1.2,
      moonGain: 1,
      canReverse: false,
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
  const btnBgmPreview = document.getElementById("btn-bgm-preview");
  const toggleSfx = document.getElementById("toggle-sfx");
  const toggleFireworks = document.getElementById("toggle-fireworks");
  const charBtnStar = document.getElementById("char-btn-star");
  const brandTwo = document.getElementById("brand-two");

  let state = "title";
  let debugMode = false;
  let debugTapCount = 0;
  let records = loadRecords();
  let starUnlocked = localStorage.getItem(STAR_UNLOCK_KEY) === "1";
  let unlocks = {
    yuzu: localStorage.getItem(YUZU_UNLOCK_KEY) === "1",
    hakase: localStorage.getItem(HAKASE_UNLOCK_KEY) === "1",
    hama: localStorage.getItem(HAMA_UNLOCK_KEY) === "1",
  };
  let charUnlockProgress = { yuzu: 0, hakase: 0, hama: 0 };
  let bgmMode = loadBgmMode();
  let sfxEnabled = localStorage.getItem(SFX_KEY) !== "0";
  let fireworksEnabled = localStorage.getItem(FIREWORKS_KEY) !== "0";
  let userName = loadUserName();
  let pendingStartAsDebug = false;
  let selectedCharId = loadSelectedChar();
  let selectedMode = loadSelectedMode();
  let secretTap = { count: 0 };
  let slotChoice = {
    night: selectedCharId === "night" ? "night" : (localStorage.getItem(HAMA_UNLOCK_KEY) === "1" ? "hama" : "night"),
    comet: selectedCharId === "comet" ? "comet" : (localStorage.getItem(YUZU_UNLOCK_KEY) === "1" ? "yuzu" : "comet"),
    meteor: selectedCharId === "meteor" ? "meteor" : (localStorage.getItem(HAKASE_UNLOCK_KEY) === "1" ? "hakase" : "meteor"),
  };

  let score = 0;
  let distance = 0;
  let lastDistScore = 0;
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

  let clouds = [];
  let stars = [];
  let shootingStars = [];
  let planets = [];
  let fireworks = [];
  let shootTimer = 0;
  let fireworkTimer = 0;
  let obstacles = [];
  let items = [];
  let particles = [];
  let floatTexts = [];
  let trails = [];
  let shots = [];
  let shockwaves = [];
  let windows = [];

  let audioCtx = null;
  let bgm = null;
  let bgmTrackIndex = 0;
  let bgmEndedBound = false;
  let bgmPreviewing = false;

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
    peachStreak: 0,
    peachGuard: 0,
    laserGuard: 0,
    featherSmash: 0,
    flyerSmash: 0,
    flyerKills: 0,
    killGuard: 0,
    spikeGuard: 0,
    spikeBreak: 0,
    spikeBreaks: 0,
    triShotArmed: false,
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
    if (id === "yuzu" && localStorage.getItem(YUZU_UNLOCK_KEY) !== "1") return "night";
    if (id === "hakase" && localStorage.getItem(HAKASE_UNLOCK_KEY) !== "1") return "night";
    if (id === "hama" && localStorage.getItem(HAMA_UNLOCK_KEY) !== "1") return "night";
    return CHAR_IDS.indexOf(id) >= 0 ? id : "night";
  }

  function loadSelectedMode() {
    const id = localStorage.getItem(MODE_KEY);
    return MODE_IDS.indexOf(id) >= 0 ? id : "normal";
  }

  function loadBgmMode() {
    const id = localStorage.getItem(BGM_MODE_KEY);
    if (id === "moonlight") return "0";
    if (id === "nightdash") return "1";
    return BGM_MODE_VALUES.indexOf(id) >= 0 ? id : "0";
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
    if (id === "yuzu" && !unlocks.yuzu) return;
    if (id === "hakase" && !unlocks.hakase) return;
    if (id === "hama" && !unlocks.hama) return;
    if (CHAR_IDS.indexOf(id) < 0) return;
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

  function displayIdForSlot(baseId) {
    if (baseId === "star") return "star";
    const secret = SLOT_SECRET[baseId];
    if (secret && unlocks[secret]) return slotChoice[baseId] || secret;
    return baseId;
  }

  function handleCharSlotClick(baseId) {
    if (baseId === "star") {
      setSelectedChar("star");
      return;
    }
    const unlockedNow = handleCharSecretTap(baseId);
    if (unlockedNow) {
      let slotBase = baseId;
      if (unlockedNow === "yuzu") slotBase = "comet";
      else if (unlockedNow === "hakase") slotBase = "meteor";
      else if (unlockedNow === "hama") slotBase = "night";
      slotChoice[slotBase] = unlockedNow;
      setSelectedChar(unlockedNow);
      spawnFloatText(W * 0.5, 120, CHARACTERS[unlockedNow].name + " 解除！", "#ffd24a");
      sfxPeach();
      return;
    }
    const secret = SLOT_SECRET[baseId];
    if (secret && unlocks[secret]) {
      const next = displayIdForSlot(baseId) === secret ? baseId : secret;
      slotChoice[baseId] = next;
      setSelectedChar(next);
    } else {
      setSelectedChar(baseId);
    }
  }

  function syncCharSelectUi() {
    if (charBtnStar) charBtnStar.classList.toggle("hidden", !starUnlocked);
    for (let i = 0; i < charButtons.length; i++) {
      const baseId = charButtons[i].getAttribute("data-char");
      if (baseId === "star") {
        charButtons[i].setAttribute("aria-pressed", selectedCharId === "star" ? "true" : "false");
        continue;
      }
      const showId = displayIdForSlot(baseId);
      const ch = CHARACTERS[showId] || CHARACTERS.night;
      charButtons[i].setAttribute("aria-pressed", showId === selectedCharId ? "true" : "false");
      const swatch = charButtons[i].querySelector(".char-swatch");
      const nameEl = charButtons[i].querySelector(".char-name");
      if (swatch) swatch.className = "char-swatch char-swatch-" + showId;
      if (nameEl) nameEl.textContent = ch.name;
    }
    if (charDescEl) charDescEl.textContent = currentChar().desc;
    syncCharRecordsUi();
  }

  function handleCharSecretTap(baseId) {
    let unlockedId = null;
    const keys = ["yuzu", "hakase", "hama"];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (unlocks[key]) continue;
      const seq = CHAR_UNLOCK_SEQ[key];
      const p = charUnlockProgress[key];
      if (seq[p] === baseId) {
        charUnlockProgress[key] = p + 1;
        if (charUnlockProgress[key] >= seq.length) {
          unlocks[key] = true;
          charUnlockProgress[key] = 0;
          const storageKey = key === "yuzu" ? YUZU_UNLOCK_KEY : key === "hakase" ? HAKASE_UNLOCK_KEY : HAMA_UNLOCK_KEY;
          localStorage.setItem(storageKey, "1");
          unlockedId = key;
        }
      } else {
        charUnlockProgress[key] = seq[0] === baseId ? 1 : 0;
      }
    }
    return unlockedId;
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
    if (speedEl) speedEl.textContent = Math.floor(speedPercent()) + "%";
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
    const parts = [];
    if (selectedCharId !== "luna" && player.reverses > 0) parts.push("切り返し×" + player.reverses);
    if (player.featherSmash > 0) parts.push("撃破");
    if (player.flyerSmash > 0) parts.push("撃破×" + player.flyerSmash);
    if (player.spikeGuard > 0) parts.push("トゲ無効");
    if (player.spikeBreak > 0) parts.push("トゲ破壊×" + player.spikeBreak);
    if (player.triShotArmed) parts.push("3方向羽");
    if (player.killGuard > 0) parts.push("撃破無敵");
    if (player.peachGuard > 0) parts.push("無敵×" + player.peachGuard);
    if (player.shield > 0) parts.push("ガード");
    if (label) label.textContent = parts.join(" ");
    if (statusHud) statusHud.classList.toggle("hidden", parts.length === 0 || state !== "playing");
    if (state !== "playing" && statusHud) statusHud.classList.add("hidden");
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
    spawnFloatText(player.x, player.y - 36, "ムーンジャンプ！", "#ffd24a");
  }

  function skyPhase() {
    if (score >= 5000) return "space";
    if (score >= 3000) return "night";
    if (score >= 2000) return "evening";
    return "day";
  }

  function spaceTier() {
    if (score < 5000) return -1;
    return Math.min(5, Math.floor((score - 5000) / 1000));
  }

  function initDecor() {
    clouds = [];
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: WALL + 20 + Math.random() * (W - WALL * 2 - 40),
        y: 40 + Math.random() * 220,
        s: 0.55 + Math.random() * 0.9,
        speed: 16 + Math.random() * 22,
      });
    }
    stars = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
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
    planets = [
      { x: 270, y: 110, r: 36, style: "rose", drift: 8, unlock: 0 },
      { x: 120, y: 70, r: 18, style: "ocean", drift: 12, unlock: 0 },
      { x: 400, y: 180, r: 26, style: "saturn", drift: 6, unlock: 0 },
      { x: 80, y: 240, r: 22, style: "ice", drift: 9, unlock: 1 },
      { x: 460, y: 90, r: 16, style: "mint", drift: 14, unlock: 1 },
      { x: 200, y: 300, r: 32, style: "lava", drift: 7, unlock: 2 },
      { x: 340, y: 50, r: 42, style: "gas", drift: 5, unlock: 3 },
      { x: 150, y: 160, r: 20, style: "peach", drift: 13, unlock: 4 },
    ];
    shootingStars = [];
    fireworks = [];
    shootTimer = 0;
    fireworkTimer = 0;
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

  function sfxScore() {
    if (!sfxEnabled) return;
    playTone(660, 0.06, "sine", 0.08);
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

  function resolveAssetUrl(relativePath) {
    let base = document.baseURI || window.location.href;
    const scripts = document.getElementsByTagName("script");
    for (let i = scripts.length - 1; i >= 0; i--) {
      const raw = scripts[i].getAttribute("src");
      if (!raw) continue;
      if (!/(^|\/)game\.js(\?|#|$)/i.test(raw)) continue;
      const scriptUrl = new URL(raw, document.baseURI || window.location.href);
      base = scriptUrl.href.replace(/game\.js([?#].*)?$/i, "");
      break;
    }
    return new URL(relativePath, base).href;
  }

  function ensureBgm() {
    if (bgm) return bgm;
    bgm = new Audio();
    bgm.preload = "auto";
    bgm.volume = BGM_VOLUME;
    bgm.setAttribute("playsinline", "true");
    bgm.playsInline = true;
    if (!bgmEndedBound) {
      bgmEndedBound = true;
      bgm.addEventListener("ended", function () {
        if (bgmMode !== "sequence") return;
        if (state !== "playing" && !bgmPreviewing) return;
        bgmTrackIndex = (bgmTrackIndex + 1) % BGM_TRACKS.length;
        loadBgmTrack(bgmTrackIndex, true);
        startBgmPlayback(true);
      });
    }
    return bgm;
  }

  function loadBgmTrack(index, shouldLoad) {
    const track = BGM_TRACKS[index];
    if (!track) return;
    const audio = ensureBgm();
    const url = resolveAssetUrl(track.file);
    audio.loop = bgmMode !== "sequence";
    if (audio.src !== url) {
      audio.src = url;
    }
  }

  function pickTrackIndexForMode() {
    if (bgmMode === "off") return -1;
    if (bgmMode === "sequence") return 0;
    if (bgmMode === "random") return (Math.random() * BGM_TRACKS.length) | 0;
    const n = Number(bgmMode);
    if (n >= 0 && n < BGM_TRACKS.length) return n;
    return 0;
  }

  function bgmAllowed() {
    if (bgmMode === "off") return false;
    return state === "playing" || bgmPreviewing;
  }

  function startBgmPlayback(fromStart) {
    const audio = ensureBgm();
    audio.muted = false;
    audio.volume = BGM_VOLUME;
    if (fromStart && audio.readyState > 0) {
      try {
        audio.currentTime = 0;
      } catch (err) {}
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(function () {
        const retry = function () {
          audio.removeEventListener("canplay", retry);
          audio.removeEventListener("loadeddata", retry);
          if (!bgmAllowed()) return;
          audio.play().catch(function () {});
        };
        audio.addEventListener("canplay", retry);
        audio.addEventListener("loadeddata", retry);
      });
    }
  }

  function playBgm(fromStart) {
    if (bgmMode === "off") {
      stopBgm();
      return;
    }
    if (fromStart || bgmTrackIndex < 0) {
      bgmTrackIndex = pickTrackIndexForMode();
    }
    if (bgmTrackIndex < 0) {
      stopBgm();
      return;
    }
    loadBgmTrack(bgmTrackIndex, true);
    startBgmPlayback(!!fromStart);
  }

  function stopBgm() {
    if (!bgm) return;
    bgm.pause();
    try {
      bgm.currentTime = 0;
    } catch (err) {}
  }

  function syncBgmPreviewButton() {
    if (!btnBgmPreview) return;
    btnBgmPreview.disabled = bgmMode === "off";
    btnBgmPreview.textContent = bgmPreviewing ? "再生停止" : "楽曲再生";
    btnBgmPreview.classList.toggle("is-playing", bgmPreviewing);
    btnBgmPreview.setAttribute("aria-pressed", bgmPreviewing ? "true" : "false");
  }

  function stopTitlePreview() {
    bgmPreviewing = false;
    if (state !== "playing") stopBgm();
    syncBgmPreviewButton();
  }

  function playTitlePreview() {
    if (state !== "title" || bgmMode === "off") {
      stopTitlePreview();
      return;
    }
    resumeAudio();
    bgmPreviewing = true;
    bgmTrackIndex = pickTrackIndexForMode();
    if (bgmTrackIndex < 0) {
      stopTitlePreview();
      return;
    }
    loadBgmTrack(bgmTrackIndex, true);
    startBgmPlayback(true);
    syncBgmPreviewButton();
  }

  function toggleTitlePreview() {
    if (bgmPreviewing) stopTitlePreview();
    else playTitlePreview();
  }

  function setBgmMode(mode) {
    if (BGM_MODE_VALUES.indexOf(mode) === -1) mode = "0";
    bgmMode = mode;
    localStorage.setItem(BGM_MODE_KEY, bgmMode);
    if (bgmModeSelect) bgmModeSelect.value = bgmMode;
    if (state === "playing") {
      bgmPreviewing = false;
      if (bgmMode === "off") stopBgm();
      else {
        resumeAudio();
        playBgm(true);
      }
    } else if (state === "title" && bgmPreviewing && bgmMode !== "off") {
      playTitlePreview();
    } else {
      stopTitlePreview();
    }
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
    if (selectedCharId === "luna") return;
    if (selectedCharId === "star" || selectedCharId === "comet" || selectedCharId === "meteor" || selectedCharId === "yuzu" || selectedCharId === "hakase") {
      player.reverses = Math.min(2, Math.max(player.reverses, 1));
    }
  }

  function resetGame() {
    score = 0;
    distance = 0;
    lastDistScore = 0;
    distScoreAcc = 0;
    speed = 280;
    spawnTimer = 0;
    nextSpawn = selectedMode === "easy" ? 2.6 : 1.2;
    itemSpawnTimer = 0;
    nextItemSpawn = 1.4;
    nextSpikeSide = "right";
    obstacles = [];
    items = [];
    particles = [];
    floatTexts = [];
    trails = [];
    shots = [];
    shockwaves = [];
    shootingStars = [];
    fireworks = [];
    shootTimer = 0;
    fireworkTimer = 0;
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
    player.shield = (selectedCharId === "night" || selectedCharId === "hama") ? 1 : 0;
    player.feather = false;
    player.reverses = 0;
    player.peachStreak = 0;
    player.peachGuard = 0;
    player.laserGuard = 0;
    player.featherSmash = 0;
    player.flyerSmash = 0;
    player.flyerKills = 0;
    player.killGuard = 0;
    player.spikeGuard = 0;
    player.spikeBreak = 0;
    player.spikeBreaks = 0;
    player.triShotArmed = false;
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
    stopTitlePreview();
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
    bgmPreviewing = false;
    syncBgmPreviewButton();
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
    if (selectedCharId !== "luna") {
      if (player.reverses <= 0) return;
      player.reverses -= 1;
    }
    player.fromX = player.x;
    player.targetSide = otherSide(player.targetSide);
    player.toX = wallX(player.targetSide);
    player.dashT = 0;
    player.squish = 1.25;
    syncStatusHud();
    sfxDash();
    if (selectedCharId === "luna" && player.triShotArmed) {
      player.triShotArmed = false;
      spawnTriShots("feather", player.targetSide === "right" ? 1 : -1);
      syncStatusHud();
    }
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

  function handleDebugTitleTap() {
    if (state !== "title" || isNameRegisterOpen()) return;
    debugTapCount += 1;
    if (brandTwo) {
      brandTwo.classList.remove("brand-two-pop");
      void brandTwo.offsetWidth;
      brandTwo.classList.add("brand-two-pop");
    }
    if (debugTapCount >= DEBUG_TAPS_NEEDED) requestStartGame(true);
  }

  function difficultyFactor() {
    return Math.min(1, distance / 3500);
  }

  function speedDifficultyFactor() {
    return Math.min(1, distance / 10500);
  }

  function speedPercent() {
    const preCap = selectedMode === "hard" ? 400 : 200;
    const preRange = preCap - 100;
    if (score < 10000) return 100 + speedDifficultyFactor() * preRange;
    if (score < 15000) return preCap + ((score - 10000) / 5000) * 50;
    return preCap + 50 + ((score - 15000) / 10000) * 50;
  }

  function currentSpeed() {
    const pct = speedPercent();
    return 280 + ((pct - 100) / 100) * 320;
  }

  function lateSpawnLevel() {
    if (score < 10000) return 0;
    return 1 + Math.floor((score - 10000) / 1000);
  }

  function nextObstacleSpawnDelay() {
    if (selectedMode === "easy" && score < 2000) {
      return 2.4 + Math.random() * 1.1;
    }
    let base = Math.max(0.55, 1.55 - difficultyFactor() * 0.9) + Math.random() * 0.45;
    const late = lateSpawnLevel();
    if (late > 0) {
      base *= Math.max(0.35, 1 - late * 0.08);
      base = Math.max(0.28, base);
    }
    return base;
  }

  function flyingBaseX() {
    const min = WALL + 28;
    const max = W - WALL - 76;
    return min + Math.random() * (max - min);
  }

  function clampFlyX(x, w) {
    const min = WALL + 8;
    const max = W - WALL - 8 - w;
    return Math.max(min, Math.min(max, x));
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
    let types;
    if (selectedMode === "easy") {
      types = ["spike"];
      if (score >= 2000) types.push("shard");
      if (score >= 4000) types.push("crow");
      if (score >= 6000) types.push("bat");
    } else {
      types = ["spike", "shard"];
      if (d > 0.15) types.push("crow");
      if (d > 0.35) types.push("bat");
      if (d > 0.4) types.push("crow", "spike", "bat");
      if (d > 0.65) types.push("shard", "spike", "crow", "bat");
      if (score >= 3500) types.push("beam");
    }
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "spike") {
      const h = 70 + Math.random() * (50 + d * 30);
      spawnSpike(nextSpikeSide, h);
      nextSpikeSide = otherSide(nextSpikeSide);
      if ((selectedMode === "hard" || score >= 2200) && Math.random() < 0.22 + d * 0.2) {
        const lateH = 50 + Math.random() * 30;
        obstacles.push({
          type: "spike",
          side: nextSpikeSide,
          y: -h - lateH - 100,
          h: lateH,
          w: 26,
          blown: false,
        });
      }
    } else if (type === "crow") {
      const w = 48;
      obstacles.push({
        type: "crow",
        x: flyingBaseX(),
        baseX: 0,
        y: -50,
        w: w,
        h: 34,
        t: Math.random() * 10,
        lrAmp: 52 + Math.random() * 32,
        lrSpeed: 2.2 + Math.random() * 1.6,
        bobAmp: selectedMode === "hard" ? 18 + Math.random() * 16 : 10,
        bobSpeed: selectedMode === "hard" ? 2.4 + Math.random() * 2.2 : 4,
        blown: false,
      });
      obstacles[obstacles.length - 1].baseX = obstacles[obstacles.length - 1].x;
    } else if (type === "bat") {
      const w = 46;
      obstacles.push({
        type: "bat",
        x: flyingBaseX(),
        baseX: 0,
        y: -50,
        w: w,
        h: 34,
        t: Math.random() * 10,
        lrAmp: 48 + Math.random() * 28,
        lrSpeed: 2.4 + Math.random() * 1.8,
        zigAmp: 10 + Math.random() * 86,
        zigSpeed: 5 + Math.random() * 6.5,
        blown: false,
      });
      obstacles[obstacles.length - 1].baseX = obstacles[obstacles.length - 1].x;
    } else if (type === "shard") {
      obstacles.push({
        type: "shard",
        x: W * 0.38 + Math.random() * W * 0.18,
        y: -50,
        w: 46,
        h: 40,
        bob: Math.random() * Math.PI * 2,
        blown: false,
      });
    } else if (type === "beam") {
      obstacles.push({
        type: "beam",
        x: WALL + 42,
        y: -30,
        w: W - WALL * 2 - 84,
        h: 18,
        phase: "warn",
        blown: false,
      });
    }
  }

  function spawnItem() {
    const type = Math.random() < 0.82 ? "peach" : "feather";
    items.push({
      type: type,
      x: W * 0.38 + Math.random() * W * 0.24,
      y: -30,
      r: type === "peach" ? 16 : 22,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function peachesNeeded() {
    return (selectedCharId === "night" || selectedCharId === "hama") ? 3 : 5;
  }

  function spawnFallingPeaches(n) {
    for (let i = 0; i < n; i++) {
      items.push({
        type: "peach",
        x: WALL + 40 + Math.random() * (W - WALL * 2 - 80),
        y: -24 - i * 36,
        r: 16,
        bob: Math.random() * Math.PI * 2,
      });
    }
  }

  function spawnTriShots(kind, dir) {
    const spd = kind === "fire" ? 460 : 420;
    const angs = [-0.5, 0, 0.5];
    for (let i = 0; i < angs.length; i++) {
      shots.push({
        kind: kind,
        x: player.x,
        y: player.y,
        vx: Math.cos(angs[i]) * spd * dir,
        vy: Math.sin(angs[i]) * spd,
        r: kind === "fire" ? 11 : 9,
        life: 1.8,
      });
    }
  }

  function onYuzuKill() {
    player.flyerKills += 1;
    if (player.flyerKills >= 5) {
      if (player.killGuard < 1) {
        player.flyerKills = 0;
        player.killGuard = 1;
        spawnFloatText(player.x, player.y - 40, "撃破無敵！", "#fff4d0");
      } else {
        player.flyerKills = 5;
      }
    }
    syncStatusHud();
  }

  function onHakaseSpikeBreak() {
    player.spikeBreaks += 1;
    if (player.spikeBreaks >= 5) {
      player.spikeBreaks = 0;
      const dir = (player.dashing ? player.targetSide : player.side) === "left" ? 1 : -1;
      spawnTriShots("fire", dir);
      spawnFloatText(player.x, player.y - 40, "火の玉！", "#ff8a3a");
    }
    syncStatusHud();
  }

  function triggerHamaExplosion() {
    shockwaves.push({ x: player.x, y: player.y, r: 12, max: 280, life: 0.45 });
    for (let i = obstacles.length - 1; i >= 0; i--) {
      destroyObstacle(obstacles[i], SMASH_SCORE, "#ffb070");
    }
    spawnBurst(player.x, player.y, "#ff8a3a", 28);
  }

  function collectItem(item) {
    bumpCombo();
    const mult = comboMult() * (moonlight > 0 ? 2 : 1);
    if (item.type === "peach") {
      const gained = addScore(PEACH_SCORE * mult);
      spawnBurst(item.x, item.y, "#ff8fab", 12);
      spawnFloatText(item.x, item.y - 20, "+" + gained, "#e85a7a");
      addMoon(10);
      player.peachStreak += 1;
      if (player.peachStreak >= peachesNeeded()) {
        player.peachStreak = 0;
        player.peachGuard += 1;
        spawnFloatText(item.x, item.y - 42, "無敵！", "#ffe08a");
        if (selectedCharId === "hama") triggerHamaExplosion();
        syncStatusHud();
      }
      sfxPeach();
    } else {
      player.feather = true;
      if (selectedCharId === "luna") {
        player.triShotArmed = true;
      } else if (selectedCharId === "comet") {
        player.featherSmash = 1;
      } else if (selectedCharId === "meteor") {
        player.spikeGuard = 1;
      } else if (selectedCharId === "yuzu") {
        player.flyerSmash = Math.min(2, player.flyerSmash + 2);
      } else if (selectedCharId === "hakase") {
        player.spikeBreak = Math.min(2, player.spikeBreak + 2);
      } else {
        player.reverses = Math.min(2, player.reverses + 1);
        if (selectedCharId === "night" || selectedCharId === "hama") spawnFallingPeaches(2);
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
    if (o.type === "crow" || o.type === "bat") {
      const y = o.drawY != null ? o.drawY : o.y;
      return { x: o.x + o.w * 0.5, y: y + o.h * 0.5 };
    }
    if (o.type === "beam") return { x: W * 0.5, y: o.y + o.h * 0.5 };
    if (o.type === "shard") {
      return { x: o.x + o.w * 0.5, y: o.y + o.h * 0.5 + Math.sin(o.bob || 0) * 5 };
    }
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
    const range = 78;
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
    if (smashed > 0) syncStatusHud();
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
      if (!player.dashing) return false;
      return circleHitsRect(player.x, player.y, pr, o.x, o.y, o.w, o.h);
    }
    if (o.type === "crow" || o.type === "bat") {
      const y = o.drawY != null ? o.drawY : o.y;
      return circleHitsRect(player.x, player.y, pr, o.x, y, o.w, o.h);
    }
    if (o.type === "shard") {
      const bob = Math.sin(o.bob || 0) * 5;
      return circleHitsRect(player.x, player.y, pr, o.x, o.y + bob, o.w, o.h);
    }
    return false;
  }

  function canSmashCenter(o) {
    if (o.type === "spike" || o.type === "beam") return false;
    if (!player.dashing) return false;
    if (moonlight > 0) return true;
    if (o.type !== "crow" && o.type !== "bat") return false;
    if (selectedCharId === "comet") return player.featherSmash > 0;
    if (selectedCharId === "yuzu") return player.flyerSmash > 0;
    return false;
  }

  function triggerGuard(text, color) {
    player.invuln = 0.85;
    player.squish = 1.35;
    breakCombo();
    sfxHit();
    spawnBurst(player.x, player.y, color, 14);
    spawnFloatText(player.x, player.y - 28, text, color);
    syncStatusHud();
  }

  function consumeHitGuard(o) {
    if (o.type === "spike" && selectedCharId === "meteor" && player.spikeGuard > 0) {
      player.spikeGuard -= 1;
      triggerGuard("トゲ無効！", "#e07040");
      destroyObstacle(o, 0, "#e07040");
      return true;
    }
    if (o.type === "spike" && selectedCharId === "hakase" && player.spikeBreak > 0) {
      player.spikeBreak -= 1;
      destroyObstacle(o, SMASH_SCORE, "#e8c040");
      onHakaseSpikeBreak();
      return true;
    }
    if (player.killGuard > 0) {
      player.killGuard -= 1;
      triggerGuard("撃破無敵！", "#fff4d0");
      if (o.type === "beam") destroyObstacle(o, 0, "#fff4d0");
      return true;
    }
    if (player.peachGuard > 0) {
      player.peachGuard -= 1;
      triggerGuard("無敵！", "#ff8fab");
      if (o.type === "beam") destroyObstacle(o, 0, "#ff8fab");
      return true;
    }
    if (player.shield > 0) {
      player.shield -= 1;
      triggerGuard("ガード！", "#7a5ab0");
      if (o.type === "beam") destroyObstacle(o, 0, "#7a5ab0");
      return true;
    }
    return false;
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
      if (selectedCharId === "comet") player.featherSmash = 0;
      if (selectedCharId === "yuzu" && (o.type === "crow" || o.type === "bat")) {
        player.flyerSmash = Math.max(0, player.flyerSmash - 1);
        onYuzuKill();
      }
      syncStatusHud();
      return "ok";
    }
    if (consumeHitGuard(o)) return "ok";
    return "die";
  }

  function updateWorld(dt) {
    speed = currentSpeed() * (moonlight > 0 ? 1.2 : 1);
    distance += speed * dt;
    const distScore = Math.floor(distance / 10);
    if (distScore > lastDistScore) {
      const rawGain = distScore - lastDistScore;
      if (distScore % 50 === 0) sfxScore();
      distScoreAcc += rawGain * currentChar().distMult;
      const whole = Math.floor(distScoreAcc);
      if (whole > 0) {
        addScore(whole);
        distScoreAcc -= whole;
      }
      lastDistScore = distScore;
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
      nextSpawn = nextObstacleSpawnDelay();
      spawnObstacle();
      const late = lateSpawnLevel();
      const doubleChance = 0.28 + late * 0.06;
      if (!(selectedMode === "easy" && score < 2000) &&
          (difficultyFactor() > 0.5 || late > 0) &&
          Math.random() < Math.min(0.7, doubleChance)) {
        setTimeout(function () {
          if (state === "playing") spawnObstacle();
        }, Math.max(90, 220 - late * 12) + Math.random() * Math.max(60, 180 - late * 10));
      }
    }
    itemSpawnTimer += dt;
    if (itemSpawnTimer >= nextItemSpawn) {
      itemSpawnTimer = 0;
      nextItemSpawn = 1.5 + Math.random() * 1.4;
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
      if (o.type === "crow") {
        o.t += dt;
        o.x = clampFlyX(o.baseX + Math.sin(o.t * o.lrSpeed) * o.lrAmp, o.w);
        o.drawY = o.y + Math.sin(o.t * o.bobSpeed) * o.bobAmp;
      } else if (o.type === "bat") {
        o.t += dt;
        o.x = clampFlyX(o.baseX + Math.sin(o.t * o.lrSpeed) * o.lrAmp, o.w);
        o.drawY = o.y + ((2 / Math.PI) * Math.asin(Math.sin(o.t * o.zigSpeed))) * o.zigAmp;
      } else if (o.type === "shard") {
        o.bob = (o.bob || 0) + dt * 2.2;
      } else if (o.type === "beam") {
        if (o.phase === "warn" && o.y + o.h > PLAYER_Y - 230) o.phase = "active";
        if (o.y > PLAYER_Y + 55) o.phase = "done";
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

    for (let i = shots.length - 1; i >= 0; i--) {
      const sh = shots[i];
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
      if (sh.life <= 0 || sh.x < -40 || sh.x > W + 40 || sh.y < -40 || sh.y > H + 40) {
        shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const o = obstacles[j];
        const c = obstacleCenter(o);
        const rr = sh.r + Math.max(o.w || 20, o.h || 20) * 0.35;
        const dxs = sh.x - c.x;
        const dys = sh.y - c.y;
        if (dxs * dxs + dys * dys < rr * rr) {
          destroyObstacle(o, SMASH_SCORE, sh.kind === "fire" ? "#ff8a3a" : "#fff0b0");
          hit = true;
          break;
        }
      }
      if (hit) shots.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      shockwaves[i].r += 520 * dt;
      shockwaves[i].life -= dt;
      if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      const oy = ((o.type === "crow" || o.type === "bat") && o.drawY != null) ? o.drawY : o.y;
      if (canSmashCenter(o) && circleHitsRect(player.x, player.y, player.r * 0.9, o.x, oy, o.w, o.h)) {
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
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].y += clouds[i].speed * dt * (state === "playing" ? 0.35 : 0.15);
      if (clouds[i].y > H + 40) {
        clouds[i].y = -40;
        clouds[i].x = WALL + 20 + Math.random() * (W - WALL * 2 - 40);
      }
    }

    const phase = skyPhase();
    if (phase === "night" || phase === "space") {
      shootTimer += dt;
      const tier = spaceTier();
      const interval = phase === "space" ? Math.max(0.55, 1.1 - Math.max(0, tier) * 0.1) : 1.8;
      if (shootTimer >= interval) {
        shootTimer = 0;
        shootingStars.push({
          x: 40 + Math.random() * (W - 80),
          y: 20 + Math.random() * 80,
          vx: 180 + Math.random() * 120,
          vy: 90 + Math.random() * 80,
          life: 0.7,
        });
        if (tier >= 3 && Math.random() < 0.45) {
          shootingStars.push({
            x: 40 + Math.random() * (W - 80),
            y: 20 + Math.random() * 80,
            vx: 180 + Math.random() * 120,
            vy: 90 + Math.random() * 80,
            life: 0.7,
          });
        }
      }
    }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const s = shootingStars[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0) shootingStars.splice(i, 1);
    }

    if (phase === "space") {
      const tier = spaceTier();
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        if (p.unlock > tier) continue;
        p.x -= p.drift * dt * (state === "playing" ? 1 : 0.3);
        if (p.x + p.r * 2 < -40) p.x = W + p.r + Math.random() * 60;
      }
      if (tier >= 5 && fireworksEnabled) {
        fireworkTimer += dt;
        if (fireworkTimer >= 0.45) {
          fireworkTimer = 0;
          spawnFirework();
          spawnFirework();
          if (Math.random() < 0.55) spawnFirework();
          if (Math.random() < 0.25) spawnFirework();
        }
      }
    }
    updateFireworks(dt);
  }

  function spawnFirework() {
    const palette = [
      ["#ff4d7a", "#ffb3c8", "#ffffff"],
      ["#ffd24a", "#fff0a8", "#ffffff"],
      ["#4db8ff", "#a8e0ff", "#ffffff"],
      ["#7dff6a", "#c8ffb0", "#ffffff"],
      ["#ff8a3a", "#ffd0a0", "#ffffff"],
      ["#d080ff", "#f0c8ff", "#ffffff"],
    ];
    const colors = palette[(Math.random() * palette.length) | 0];
    fireworks.push({
      x: 40 + Math.random() * (W - 80),
      y: H - 20,
      vy: -(520 + Math.random() * 240),
      burstY: 50 + Math.random() * 280,
      phase: "rise",
      age: 0,
      flash: 0,
      color: colors[0],
      colors: colors,
      size: 0.85 + Math.random() * 0.55,
      trail: [],
      sparks: [],
    });
  }

  function spawnFireworkBurst(fw, secondary) {
    const scale = fw.size || 1;
    const layers = secondary
      ? [{ n: 28, sp: 70, life: 0.7 }]
      : [
          { n: 48, sp: 200, life: 1 },
          { n: 36, sp: 130, life: 0.85 },
        ];
    for (let L = 0; L < layers.length; L++) {
      const layer = layers[L];
      const n = Math.floor(layer.n * scale);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.25;
        const sp = (layer.sp * 0.65 + Math.random() * layer.sp * 0.55) * scale;
        fw.sparks.push({
          x: fw.x,
          y: fw.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: (0.9 + Math.random() * 0.7) * layer.life,
          r: (2.4 + Math.random() * 3.2) * scale,
          grav: 180 + Math.random() * 120,
          color: fw.colors[(Math.random() * fw.colors.length) | 0],
          trail: [],
        });
      }
    }
  }

  function updateFireworks(dt) {
    if (!fireworksEnabled) {
      fireworks = [];
      return;
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      fw.age += dt;
      if (fw.phase === "rise") {
        fw.y += fw.vy * dt;
        fw.vy += 90 * dt;
        fw.trail.push({ x: fw.x, y: fw.y, life: 0.35 });
        for (let t = fw.trail.length - 1; t >= 0; t--) {
          fw.trail[t].life -= dt;
          if (fw.trail[t].life <= 0) fw.trail.splice(t, 1);
        }
        if (fw.y <= fw.burstY) {
          fw.phase = "burst";
          fw.age = 0;
          fw.flash = 1;
          spawnFireworkBurst(fw);
        }
      } else {
        if (fw.flash > 0) fw.flash = Math.max(0, fw.flash - dt * 3.5);
        for (let s = 0; s < fw.sparks.length; s++) {
          const spark = fw.sparks[s];
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          spark.vy += spark.grav * dt;
          spark.vx *= 1 - 0.55 * dt;
          spark.life -= dt;
        }
        fw.sparks = fw.sparks.filter(function (s) { return s.life > 0; });
        if (fw.sparks.length === 0 && fw.age > 0.35) fireworks.splice(i, 1);
      }
    }
  }

  function drawFireworks() {
    for (let i = 0; i < fireworks.length; i++) {
      const fw = fireworks[i];
      if (fw.phase === "rise") {
        ctx.fillStyle = "#fff6c8";
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        if (fw.flash > 0) {
          ctx.globalAlpha = fw.flash * 0.45;
          ctx.fillStyle = fw.color;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 30 + fw.flash * 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        for (let s = 0; s < fw.sparks.length; s++) {
          const spark = fw.sparks[s];
          ctx.globalAlpha = Math.max(0, spark.life);
          ctx.fillStyle = spark.color;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawCloud(x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, 38 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 22 * s, y + 4, 28 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 20 * s, y + 4, 24 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStarField(mult) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.bright * (0.45 + 0.55 * Math.sin(animT * 2 + s.tw)) * mult;
      ctx.fillStyle = "rgba(255,255,255," + a + ")";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSky() {
    const phase = skyPhase();
    if (phase === "space") {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#05010f");
      g.addColorStop(0.4, "#120828");
      g.addColorStop(0.75, "#1a0a35");
      g.addColorStop(1, "#0d1528");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const nebula = ctx.createRadialGradient(W * 0.5, 140, 10, W * 0.5, 180, 240);
      nebula.addColorStop(0, "rgba(160, 60, 180, 0.28)");
      nebula.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, W, H);
      const nebula2 = ctx.createRadialGradient(W * 0.78, 220, 8, W * 0.78, 240, 170);
      nebula2.addColorStop(0, "rgba(40, 160, 200, 0.2)");
      nebula2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, W, H);
      drawStarField(1.1 + Math.max(0, spaceTier()) * 0.08);
      const tier = spaceTier();
      for (let i = 0; i < planets.length; i++) {
        const p = planets[i];
        if (p.unlock > tier) continue;
        ctx.fillStyle = p.style === "rose" ? "#e8a0b8" : p.style === "ocean" ? "#6ec8f0" : p.style === "peach" ? "#ffb0a0" : "#c8b890";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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
      if (tier >= 5 && fireworksEnabled) drawFireworks();
      return;
    }
    if (phase === "night") {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0a1028");
      g.addColorStop(0.55, "#1a2450");
      g.addColorStop(1, "#2a3868");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      drawStarField(0.9);
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.arc(W * 0.55, 90, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 224, 138, 0.22)";
      ctx.beginPath();
      ctx.arc(W * 0.55, 90, 52, 0, Math.PI * 2);
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
      for (let i = 0; i < clouds.length; i++) {
        drawCloud(clouds[i].x, clouds[i].y * 0.7 + 20, clouds[i].s * 0.85, "rgba(40, 50, 90, 0.45)");
      }
      return;
    }
    if (phase === "evening") {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#2a3a6a");
      g.addColorStop(0.35, "#c45c6a");
      g.addColorStop(0.65, "#e88850");
      g.addColorStop(1, "#f0c080");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffb040";
      ctx.beginPath();
      ctx.arc(W * 0.62, H * 0.62, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 140, 60, 0.28)";
      ctx.beginPath();
      ctx.arc(W * 0.62, H * 0.62, 72, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < clouds.length; i++) {
        drawCloud(clouds[i].x, clouds[i].y, clouds[i].s, "rgba(255, 200, 180, 0.55)");
      }
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#6eb8dc");
    g.addColorStop(0.45, "#b7dff0");
    g.addColorStop(1, "#ffe2b8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.arc(W * 0.72, 90, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 224, 138, 0.25)";
    ctx.beginPath();
    ctx.arc(W * 0.72, 90, 58, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < clouds.length; i++) {
      drawCloud(clouds[i].x, clouds[i].y, clouds[i].s, "rgba(255,255,255,0.85)");
    }
  }

  function drawWalls() {
    const phase = skyPhase();
    const fill =
      phase === "space" ? "#1a1630" :
      phase === "night" ? "#1e1830" :
      phase === "evening" ? "#4a3040" : "#6a5a4a";
    const edge =
      phase === "day" ? "#8a7a62" :
      phase === "evening" ? "#6a4050" : "#2a2048";
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, WALL, H);
    ctx.fillRect(W - WALL, 0, WALL, H);
    ctx.fillStyle = edge;
    ctx.fillRect(WALL - 8, 0, 8, H);
    ctx.fillRect(W - WALL, 0, 8, H);

    const shift = (distance * 0.4) % 48;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let y = -48; y < H + 48; y += 48) {
      ctx.fillRect(6, y + shift, WALL - 20, 10);
      ctx.fillRect(W - WALL + 14, y + shift + 24, WALL - 20, 10);
    }
    if (phase !== "day") {
      for (let i = 0; i < windows.length; i++) {
        const w = windows[i];
        const x = w.side === "left" ? 16 : W - 38;
        ctx.fillStyle = w.lit ? "rgba(255, 200, 120, 0.55)" : "rgba(20, 16, 40, 0.6)";
        ctx.fillRect(x, w.y, 18, 14);
      }
    }
  }

  function fireworksGlow() {
    return score >= 10000;
  }

  function drawCrow(o) {
    const x = o.x;
    const y = (o.drawY != null ? o.drawY : o.y) + o.h * 0.45;
    const flap = Math.sin(animT * 12 + (o.t || 0)) * 12;
    const needOutline = fireworksGlow();
    if (needOutline) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      ctx.beginPath();
      ctx.ellipse(x + 22, y - 2, 34, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = needOutline ? "#5a6a80" : "#3d4a5c";
    ctx.beginPath();
    ctx.ellipse(x + 22, y, 19, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 17, y);
    ctx.quadraticCurveTo(x + 10, y - 22 - flap, x + 34, y - 5);
    ctx.closePath();
    ctx.fillStyle = needOutline ? "#7a8aa0" : "#55667a";
    ctx.fill();
    ctx.fillStyle = "#f0a040";
    ctx.beginPath();
    ctx.moveTo(x + 38, y);
    ctx.lineTo(x + 50, y + 2);
    ctx.lineTo(x + 38, y + 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + 29, y - 2, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(x + 30, y - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (needOutline) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 22, y, 19, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawBat(o) {
    const x = o.x;
    const y = (o.drawY != null ? o.drawY : o.y) + o.h * 0.5;
    const flap = Math.sin(animT * 16 + (o.t || 0)) * 8;
    const needOutline = fireworksGlow();
    if (needOutline) {
      ctx.fillStyle = "rgba(255, 210, 230, 0.28)";
      ctx.beginPath();
      ctx.ellipse(x + 23, y - 2, 32, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#5a1428";
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 10);
    ctx.lineTo(x + 13, y - 20);
    ctx.lineTo(x + 22, y - 11);
    ctx.closePath();
    ctx.moveTo(x + 28, y - 10);
    ctx.lineTo(x + 33, y - 20);
    ctx.lineTo(x + 24, y - 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = needOutline ? "#b03a58" : "#8a1e3a";
    ctx.beginPath();
    ctx.moveTo(x + 22, y);
    ctx.lineTo(x - 4, y - 16 - flap);
    ctx.lineTo(x + 4, y - 2);
    ctx.lineTo(x + 2, y + 8);
    ctx.lineTo(x + 12, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 24, y);
    ctx.lineTo(x + 50, y - 16 + flap);
    ctx.lineTo(x + 42, y - 2);
    ctx.lineTo(x + 44, y + 8);
    ctx.lineTo(x + 34, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = needOutline ? "#8a2844" : "#6e1630";
    ctx.beginPath();
    ctx.ellipse(x + 23, y + 2, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c45c4a";
    ctx.beginPath();
    ctx.moveTo(x + 32, y + 1);
    ctx.lineTo(x + 42, y + 3);
    ctx.lineTo(x + 32, y + 6);
    ctx.fill();
    ctx.fillStyle = "#ffe8a0";
    ctx.beginPath();
    ctx.arc(x + 27, y - 1, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a0810";
    ctx.beginPath();
    ctx.arc(x + 28, y - 1, 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (needOutline) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 23, y + 2, 12, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawObstacle(o) {
    if (o.type === "spike") {
      ctx.fillStyle = "#d8d0e8";
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
      const lineX = o.side === "left" ? WALL : W - WALL - 4;
      ctx.fillRect(lineX, o.y, 4, o.h);
    } else if (o.type === "crow") {
      drawCrow(o);
    } else if (o.type === "bat") {
      drawBat(o);
    } else if (o.type === "shard") {
      const cx = o.x + o.w * 0.5;
      const cy = o.y + o.h * 0.5 + Math.sin(o.bob || 0) * 5;
      ctx.fillStyle = "rgba(255, 230, 170, 0.22)";
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      const rock = ctx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy, 22);
      rock.addColorStop(0, "#f0e0c8");
      rock.addColorStop(0.45, "#c8b090");
      rock.addColorStop(1, "#8a7060");
      ctx.fillStyle = rock;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 18, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(90, 70, 60, 0.35)";
      ctx.beginPath();
      ctx.arc(cx + 6, cy + 2, 5, 0, Math.PI * 2);
      ctx.arc(cx - 8, cy + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "beam") {
      const insetX = o.x;
      const insetW = o.w;
      if (o.phase === "warn") {
        ctx.fillStyle = "rgba(255, 220, 120, " + (0.12 + 0.14 * Math.sin(animT * 14)) + ")";
        ctx.fillRect(insetX, o.y, insetW, o.h + 6);
        ctx.setLineDash([10, 7]);
        ctx.strokeStyle = "rgba(255, 236, 170, 0.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(insetX, o.y, insetW, o.h);
        ctx.setLineDash([]);
      } else if (o.phase === "active") {
        const glow = ctx.createLinearGradient(insetX, o.y, insetX + insetW, o.y);
        glow.addColorStop(0, "rgba(255, 200, 80, 0.05)");
        glow.addColorStop(0.5, "rgba(255, 248, 210, 0.95)");
        glow.addColorStop(1, "rgba(255, 200, 80, 0.05)");
        ctx.fillStyle = glow;
        ctx.fillRect(insetX - 4, o.y - 8, insetW + 8, o.h + 16);
        ctx.fillStyle = "rgba(255, 240, 180, 0.85)";
        ctx.fillRect(insetX, o.y + 4, insetW, 6);
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
      yuzu: { a: "#ffffff", b: "#f4f0e8", c: "#d8d0c8", cleft: "rgba(120, 110, 100, 0.35)", leg: "#c8c0b8" },
      hakase: { a: "#ffe9a0", b: "#e8c040", c: "#b8860b", cleft: "rgba(120, 80, 10, 0.4)", leg: "#8a6010" },
      hama: { a: "#5a5a62", b: "#2a2a30", c: "#121216", cleft: "rgba(80, 20, 20, 0.4)", leg: "#3a1010" },
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

    if (charId === "yuzu") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.7);
      ctx.lineTo(-r * 0.15, -r * 1.15);
      ctx.lineTo(-r * 0.05, -r * 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.55, -r * 0.7);
      ctx.lineTo(r * 0.15, -r * 1.15);
      ctx.lineTo(r * 0.05, -r * 0.55);
      ctx.fill();
      ctx.strokeStyle = "#e8ddd0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(r * 0.7, 6);
      ctx.quadraticCurveTo(r * 1.4, 16, r * 0.9, 22);
      ctx.stroke();
    }
    if (charId === "hama") {
      ctx.strokeStyle = "#c45c20";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(8, -r - 10, 4, -r - 16);
      ctx.stroke();
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.arc(4, -r - 16, 3, 0, Math.PI * 2);
      ctx.fill();
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
    if (charId === "hakase") {
      ctx.fillStyle = "#e8c040";
      ctx.beginPath();
      ctx.ellipse(r * 0.82, 2, r * 0.72, r * 0.38, 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.moveTo(r * 0.45, 8);
      ctx.lineTo(r * 1.25, 11);
      ctx.lineTo(r * 0.42, 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c9a227";
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.85);
      ctx.lineTo(0, -r * 1.25);
      ctx.lineTo(r * 0.2, -r * 0.7);
      ctx.closePath();
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
    for (let i = 0; i < shots.length; i++) {
      const sh = shots[i];
      ctx.fillStyle = sh.kind === "fire" ? "#ff7a2a" : "#fff6c8";
      ctx.beginPath();
      ctx.ellipse(sh.x, sh.y, sh.kind === "fire" ? 8 : 6, sh.kind === "fire" ? 6 : 12, Math.atan2(sh.vy, sh.vx), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < shockwaves.length; i++) {
      const w = shockwaves[i];
      ctx.strokeStyle = "rgba(255, 140, 70," + Math.max(0, w.life * 2) + ")";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
    }
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
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].y += clouds[i].speed * dt * 0.15;
        if (clouds[i].y > H + 40) {
          clouds[i].y = -40;
          clouds[i].x = WALL + 20 + Math.random() * (W - WALL * 2 - 40);
        }
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  function isInteractiveTarget(target) {
    const el = target && target.nodeType === 1 ? target : (target && target.parentElement);
    return !!(
      el &&
      el.closest &&
      el.closest(
        "button, a, input, select, label, .panel, .sound-settings, .char-select, .mode-select, .mode-records, .user-row, .name-register-panel, .debug-exit-btn"
      )
    );
  }

  function onPointer(e) {
    if (isInteractiveTarget(e.target)) return;
    e.preventDefault();
    if (state === "title") return;
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

  if (brandTwo) {
    brandTwo.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      e.preventDefault();
      handleDebugTitleTap();
    });
  }

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
  toggleFireworks.addEventListener("change", function () {
    fireworksEnabled = toggleFireworks.checked;
    localStorage.setItem(FIREWORKS_KEY, fireworksEnabled ? "1" : "0");
    if (!fireworksEnabled) fireworks = [];
  });
  bgmModeSelect.addEventListener("change", function () {
    setBgmMode(bgmModeSelect.value);
  });
  if (btnBgmPreview) {
    let lastPreviewTap = 0;
    const onPreviewTap = function (e) {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      const now = performance.now();
      if (now - lastPreviewTap < 400) return;
      lastPreviewTap = now;
      toggleTitlePreview();
    };
    btnBgmPreview.addEventListener("pointerdown", onPreviewTap);
    btnBgmPreview.addEventListener("touchstart", onPreviewTap, { passive: false });
  }
  toggleSfx.addEventListener("click", function (e) { e.stopPropagation(); });
  toggleFireworks.addEventListener("click", function (e) { e.stopPropagation(); });
  bgmModeSelect.addEventListener("click", function (e) { e.stopPropagation(); });

  for (let i = 0; i < charButtons.length; i++) {
    charButtons[i].addEventListener("click", function (e) {
      e.stopPropagation();
      handleCharSlotClick(charButtons[i].getAttribute("data-char"));
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
  toggleFireworks.checked = fireworksEnabled;
  bgmModeSelect.value = bgmMode;
  syncBgmPreviewButton();
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
