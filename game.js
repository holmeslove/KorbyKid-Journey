// =====================================================
//  KorbyKid's Journey
//  A simple platformer written with plain functions.
// =====================================================

// ---------- Canvas setup ----------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ---------- Settings (change these to change how the game feels) ----------
const GRAVITY = 0.6;
const MAX_FALL_SPEED = 14;
const RUN_SPEED = 5;
const JUMP_POWER = -13;
const STOMP_BOUNCE = -8;     // how high KorbyKid bounces after squishing an enemy
const ENEMY_SPEED = 1.5;
const GROUND_Y = 500;        // top edge of the ground

const PLAYER_W = 40;
const PLAYER_H = 56;
const ENEMY_W = 40;
const ENEMY_H = 40;
const SCOOTER_W = 120;
const SCOOTER_H = 70;

// ---------- Image files ----------
// Put your PNG files in the "assets" folder using these names.
// If a file is missing, the game draws a simple colored shape instead.
const IMAGE_FILES = {
  introBackground: "assets/intro_background.png",
  scooter: "assets/scooter.png",
  korbykid: "assets/korbykid.png",
  enemy: "assets/enemy.png",
  platform: "assets/platform.png",
  door: "assets/door.png",
  background1: "assets/background1.png",
  background2: "assets/background2.png"
};

const images = {};

function loadImages() {
  for (const name in IMAGE_FILES) {
    const img = new Image();
    img.src = IMAGE_FILES[name];
    images[name] = img;
  }
}

// True only if the PNG file was found and loaded
function imageReady(name) {
  const img = images[name];
  return img && img.complete && img.naturalWidth > 0;
}

// ---------- Levels ----------
// Each level is just data: platforms, enemies and a door.
// Platforms are {x, y, w, h}. Enemies walk between minX and maxX.
const LEVELS = [
  {
    name: "Level 1: The Mysterious Planet",
    background: "background1",
    width: 3200,
    height: HEIGHT,
    start: { x: 60, y: GROUND_Y - PLAYER_H },
    platforms: [
      // Ground pieces (the gaps between them are pits you can fall into)
      { x: 0, y: GROUND_Y, w: 900, h: 40 },
      { x: 980, y: GROUND_Y, w: 820, h: 40 },
      { x: 1860, y: GROUND_Y, w: 1340, h: 40 },
      // Floating platforms
      { x: 250, y: 400, w: 150, h: 20 },
      { x: 480, y: 330, w: 120, h: 20 },
      { x: 1000, y: 380, w: 160, h: 20 },
      { x: 1220, y: 300, w: 140, h: 20 },
      { x: 1420, y: 220, w: 120, h: 20 },
      { x: 1600, y: 340, w: 150, h: 20 },
      { x: 1900, y: 400, w: 150, h: 20 },
      { x: 2100, y: 320, w: 140, h: 20 },
      { x: 2330, y: 240, w: 120, h: 20 },
      { x: 2520, y: 340, w: 160, h: 20 },
      { x: 2760, y: 280, w: 140, h: 20 }
    ],
    enemies: [
      { x: 600, y: GROUND_Y - ENEMY_H, minX: 520, maxX: 800 },
      { x: 260, y: 400 - ENEMY_H, minX: 250, maxX: 360 },
      { x: 1100, y: GROUND_Y - ENEMY_H, minX: 990, maxX: 1200 },
      { x: 1230, y: 300 - ENEMY_H, minX: 1220, maxX: 1320 },
      { x: 2000, y: GROUND_Y - ENEMY_H, minX: 1900, maxX: 2100 },
      { x: 2530, y: 340 - ENEMY_H, minX: 2520, maxX: 2640 }
    ],
    door: { x: 3080, y: GROUND_Y - 90, w: 60, h: 90 }
  },
  {
    name: "Level 2: The Crystal Caves",
    background: "background2",
    width: 2400,
    height: HEIGHT,
    start: { x: 60, y: GROUND_Y - PLAYER_H },
    platforms: [
      { x: 0, y: GROUND_Y, w: 700, h: 40 },
      { x: 780, y: GROUND_Y, w: 1620, h: 40 },
      { x: 300, y: 400, w: 140, h: 20 },
      { x: 500, y: 320, w: 120, h: 20 },
      { x: 1000, y: 360, w: 140, h: 20 },
      { x: 1200, y: 260, w: 120, h: 20 },
      { x: 1450, y: 340, w: 160, h: 20 },
      { x: 1700, y: 260, w: 140, h: 20 },
      { x: 1950, y: 340, w: 140, h: 20 }
    ],
    enemies: [
      { x: 900, y: GROUND_Y - ENEMY_H, minX: 800, maxX: 1100 },
      { x: 1500, y: 340 - ENEMY_H, minX: 1450, maxX: 1570 },
      { x: 1960, y: 340 - ENEMY_H, minX: 1950, maxX: 2050 }
    ],
    door: { x: 2300, y: GROUND_Y - 90, w: 60, h: 90 }
  }
];

// ---------- Game state ----------
let gameState = "intro";     // "intro" or "playing"
let currentLevelIndex = 0;
let level = null;            // the level data currently being played
let player = null;           // KorbyKid
let enemies = [];            // enemies alive in the current level
let cameraX = 0;
let levelTitleTimer = 0;     // counts down while the level name shows
let deathTimer = 0;          // counts down after KorbyKid dies
let finishTimer = 0;         // counts down after KorbyKid enters the door

const keys = { left: false, right: false, up: false, jump: false };

// Intro animation state
let introScooterX = 0;
let introScooterY = 0;
let introScooterVY = 0;
let introCrashed = false;
let introCrashTimer = 0;
let introShake = 0;
let introDust = [];
let introMenuShown = false;

// ---------- Helpers ----------
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// True if two rectangles overlap ({x, y, w, h} objects)
function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function setMenuVisible(isVisible) {
  const menu = document.getElementById("menu");
  menu.classList.toggle("visible", isVisible);
  menu.classList.toggle("hidden", !isVisible);
}

// ---------- Intro animation ----------
// KorbyKid flies in on his scooter, crash lands, then the title and Play button appear.
function resetIntro() {
  introScooterX = -SCOOTER_W;
  introScooterY = 120;
  introScooterVY = 0;
  introCrashed = false;
  introCrashTimer = 0;
  introShake = 0;
  introDust = [];
  introMenuShown = false;
}

function crashScooter() {
  introCrashed = true;
  introScooterY = GROUND_Y - SCOOTER_H;
  introShake = 20;
  spawnDust(introScooterX + SCOOTER_W / 2, GROUND_Y);
}

function spawnDust(x, y) {
  for (let i = 0; i < 14; i++) {
    introDust.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 4,
      life: 40
    });
  }
}

function updateDust() {
  for (const d of introDust) {
    d.x += d.vx;
    d.y += d.vy;
    d.life--;
  }
  introDust = introDust.filter(d => d.life > 0);
}

function updateIntro() {
  if (!introCrashed) {
    // Fly right, and start diving after the first part of the screen
    introScooterX += 4;
    if (introScooterX > WIDTH * 0.3) {
      introScooterVY += 0.12;
    }
    introScooterY += introScooterVY;

    if (introScooterY + SCOOTER_H >= GROUND_Y) {
      crashScooter();
    }
  } else {
    introCrashTimer++;
    if (introShake > 0) introShake--;
    updateDust();
  }

  // Show the title and Play button a moment after the crash
  if (introCrashed && introCrashTimer > 60 && !introMenuShown) {
    introMenuShown = true;
    setMenuVisible(true);
  }
}

// Clicking or pressing Space/Enter during the intro jumps to the title
function skipIntro() {
  if (!introCrashed) crashScooter();
  introCrashTimer = 999;
}

function drawIntro() {
  // Screen shake after the crash
  const shakeX = introShake > 0 ? (Math.random() - 0.5) * 10 : 0;
  const shakeY = introShake > 0 ? (Math.random() - 0.5) * 10 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Sky and ground
  if (imageReady("introBackground")) {
    ctx.drawImage(images.introBackground, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#1d2b53";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.fillStyle = "#4a3b2a";
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

  // Scooter
  if (imageReady("scooter")) {
    ctx.drawImage(images.scooter, introScooterX, introScooterY, SCOOTER_W, SCOOTER_H);
  } else {
    ctx.fillStyle = "#29adff";
    ctx.fillRect(introScooterX, introScooterY + 40, SCOOTER_W, 20);
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(introScooterX + 20, introScooterY + SCOOTER_H, 10, 0, Math.PI * 2);
    ctx.arc(introScooterX + SCOOTER_W - 20, introScooterY + SCOOTER_H, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // KorbyKid riding the scooter
  drawKorbyKid(introScooterX + 35, introScooterY - 30, PLAYER_W, PLAYER_H);

  // Dust puffs
  ctx.fillStyle = "#ddd";
  for (const d of introDust) {
    ctx.globalAlpha = d.life / 40;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ---------- Starting and loading levels ----------
function startGame() {
  setMenuVisible(false);
  gameState = "playing";
  loadLevel(0);
}

function loadLevel(index) {
  currentLevelIndex = index;
  level = LEVELS[index];

  player = {
    x: level.start.x,
    y: level.start.y,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    onGround: false
  };

  // Copy the enemies so the level data stays unchanged when enemies die
  enemies = level.enemies.map(e => ({
    x: e.x,
    y: e.y,
    w: ENEMY_W,
    h: ENEMY_H,
    minX: e.minX,
    maxX: e.maxX,
    vx: ENEMY_SPEED
  }));

  cameraX = 0;
  deathTimer = 0;
  finishTimer = 0;
  levelTitleTimer = 180;
}

function killPlayer() {
  if (deathTimer > 0) return;
  deathTimer = 90;   // about 1.5 seconds before the level restarts
}

function goToNextLevel() {
  // After the last level, loop back to the first one
  const nextIndex = currentLevelIndex + 1 < LEVELS.length ? currentLevelIndex + 1 : 0;
  loadLevel(nextIndex);
}

// ---------- Player movement ----------
function updatePlayer() {
  // 1. Left and right
  player.vx = 0;
  if (keys.left) player.vx = -RUN_SPEED;
  if (keys.right) player.vx = RUN_SPEED;

  // 2. Jump (only from the ground)
  if (keys.jump && player.onGround) {
    player.vy = JUMP_POWER;
  }

  // 3. Gravity pulls him down
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

  // 4. Move sideways, fix any overlap, then move up or down and fix again
  player.x += player.vx;
  handleHorizontalCollisions();
  player.y += player.vy;
  handleVerticalCollisions();

  // Stay inside the level from left to right
  player.x = clamp(player.x, 0, level.width - player.w);

  // Falling below the screen means a pit
  if (player.y > level.height) {
    killPlayer();
  }
}

function handleHorizontalCollisions() {
  for (const p of level.platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vx > 0) {
        player.x = p.x - player.w;   // hit the left side of a platform
      } else if (player.vx < 0) {
        player.x = p.x + p.w;        // hit the right side of a platform
      }
    }
  }
}

function handleVerticalCollisions() {
  player.onGround = false;
  for (const p of level.platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vy > 0) {
        // Landed on top of a platform
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        // Bumped his head on the bottom of a platform
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }
}

// ---------- Enemies ----------
function updateEnemies() {
  for (const e of enemies) {
    // Walk back and forth between minX and maxX
    e.x += e.vx;
    if (e.x < e.minX) {
      e.x = e.minX;
      e.vx = Math.abs(e.vx);
    }
    if (e.x > e.maxX) {
      e.x = e.maxX;
      e.vx = -Math.abs(e.vx);
    }
  }
  checkEnemyCollisions();
}

function checkEnemyCollisions() {
  const survivors = [];

  for (const e of enemies) {
    if (!rectsOverlap(player, e)) {
      survivors.push(e);
      continue;
    }

    // Falling onto the top of an enemy squishes it (it is not kept)
    const feetY = player.y + player.h;
    const landedOnTop = player.vy > 0 && feetY - e.y < 20;

    if (landedOnTop) {
      player.vy = STOMP_BOUNCE;
    } else {
      killPlayer();
      survivors.push(e);
    }
  }

  enemies = survivors;
}

// ---------- Door and camera ----------
function checkDoor() {
  // Walk into the door and press Up (or W) to go through it
  if (keys.up && rectsOverlap(player, level.door)) {
    finishTimer = 60;
  }
}

function updateCamera() {
  // Keep KorbyKid in the middle of the screen, but not past the level edges
  cameraX = player.x + player.w / 2 - WIDTH / 2;
  cameraX = clamp(cameraX, 0, level.width - WIDTH);
}

// ---------- Update (runs 60 times per second) ----------
function update() {
  if (gameState === "intro") {
    updateIntro();
    return;
  }

  if (levelTitleTimer > 0) levelTitleTimer--;

  // After dying, wait and then restart the same level
  if (deathTimer > 0) {
    deathTimer--;
    if (deathTimer === 0) loadLevel(currentLevelIndex);
    return;
  }

  // After going through the door, wait and then load the next level
  if (finishTimer > 0) {
    finishTimer--;
    if (finishTimer === 0) goToNextLevel();
    return;
  }

  updatePlayer();
  updateEnemies();
  if (deathTimer === 0) checkDoor();
  updateCamera();
}

// ---------- Drawing ----------
function draw() {
  if (gameState === "intro") {
    drawIntro();
    return;
  }

  drawBackground();

  // Everything in the world is drawn shifted by the camera
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawDoor();
  drawEnemies();
  drawKorbyKid(player.x, player.y, player.w, player.h);
  ctx.restore();

  drawMessages();
}

function drawBackground() {
  if (imageReady(level.background)) {
    ctx.drawImage(images[level.background], 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#2b0f54";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawPlatforms() {
  for (const p of level.platforms) {
    if (imageReady("platform")) {
      ctx.drawImage(images.platform, p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = "#7e5aa8";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  }
}

function drawDoor() {
  const d = level.door;
  if (imageReady("door")) {
    ctx.drawImage(images.door, d.x, d.y, d.w, d.h);
  } else {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(d.x + d.w - 12, d.y + d.h / 2, 6, 6);
  }
}

function drawEnemies() {
  for (const e of enemies) {
    if (imageReady("enemy")) {
      ctx.drawImage(images.enemy, e.x, e.y, e.w, e.h);
    } else {
      ctx.fillStyle = "#ff004d";
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  }
}

function drawKorbyKid(x, y, w, h) {
  if (imageReady("korbykid")) {
    ctx.drawImage(images.korbykid, x, y, w, h);
  } else {
    ctx.fillStyle = "#ff8c00";
    ctx.fillRect(x, y, w, h);
  }
}

function drawMessage(text, y) {
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";
  ctx.strokeText(text, WIDTH / 2, y);
  ctx.fillText(text, WIDTH / 2, y);
}

function drawMessages() {
  if (levelTitleTimer > 0) {
    drawMessage(level.name, 60);
  }
  if (deathTimer > 0) {
    drawMessage("Oops! Try again", HEIGHT / 2);
  }
  if (finishTimer > 0) {
    drawMessage("Level Complete!", HEIGHT / 2);
  }
}

// ---------- Keyboard and mouse input ----------
function setKey(code, isDown) {
  if (code === "ArrowLeft" || code === "KeyA") keys.left = isDown;
  if (code === "ArrowRight" || code === "KeyD") keys.right = isDown;
  if (code === "ArrowUp" || code === "KeyW") {
    keys.up = isDown;
    keys.jump = isDown;
  }
  if (code === "Space") keys.jump = isDown;
}

document.addEventListener("keydown", (e) => {
  if (gameState === "intro" && (e.code === "Space" || e.code === "Enter")) {
    skipIntro();
    return;
  }
  setKey(e.code, true);

  // Stop the arrow keys and space from scrolling the page
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
});

document.addEventListener("keyup", (e) => {
  setKey(e.code, false);
});

canvas.addEventListener("click", () => {
  if (gameState === "intro") skipIntro();
});

document.getElementById("play-button").addEventListener("click", startGame);

// ---------- Main loop ----------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

loadImages();
resetIntro();
gameLoop();
