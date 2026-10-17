// =====================================================
//  KorbyKid's Journey
//  A simple platformer written with plain functions.
// =====================================================

// ---------- Canvas setup ----------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
// The game is always laid out on a 960 x 540 grid. The canvas itself
// is resized to fill the browser window, and draw() scales the grid to match.
const WIDTH = 960;
const HEIGHT = 540;

// ---------- Settings (change these to change how the game feels) ----------
const GRAVITY = 0.6;
const MAX_FALL_SPEED = 14;
const RUN_SPEED = 5.5;       // 10% faster than the old 5
const JUMP_POWER = -14.95;   // 15% stronger than the original -13
const ATTACK_FRAMES = 120;   // attack mode lasts 120 frames, about 2 seconds
const MAX_LIVES = 3;         // KorbyKid starts with 3 hearts
const HEART_SIZE = 40;       // width and height of each heart in the top left corner
const INVULNERABLE_FRAMES = 90; // after a hit, KorbyKid flashes and can't be hurt for 1.5 seconds
const HURT_GRAPHIC_FRAMES = 90; // KorbyKid shows his hurt picture for 1.5 seconds after a hit
const ENEMY_DEATH_FRAMES = 30;  // a killed enemy shows its death picture for half a second
const KNOCKBACK_FRAMES = 25;   // after an enemy hit, KorbyKid is pushed away for 25 frames...
const KNOCKBACK_SPEED = 7;      // ...at this speed, which moves him about 175 pixels
const KNOCKBACK_JUMP = -6;      // and gives him a small hop as he is pushed
const STOMP_BOUNCE = -8;        // how high KorbyKid bounces after landing on an enemy
const STOMP_TOLERANCE = 10;     // how far his feet can be below an enemy's top and still count as landing on it
const WALK_POSE_FRAMES = 15;    // the walking picture stays for a quarter second after he stops
const SAVE_KEY_LEVEL = "korbykid.level";
const SAVE_KEY_LIVES = "korbykid.lives";
const ENEMY_SPEED = 1.5;     // average walking speed (each enemy gets a random speed near this)
const ENEMY_CHASE_RANGE = 220;   // enemies chase KorbyKid when he is this close sideways...
const ENEMY_CHASE_HEIGHT = 80;   // ...and this close up or down
const ENEMY_CHASE_BOOST = 1.4;   // chasing enemies move this many times faster
const ENEMY_PAUSE_CHANCE = 0.01; // chance per frame that a patrolling enemy stops for a moment
const ENEMY_TURN_CHANCE = 0.005; // chance per frame that a patrolling enemy turns around early
const GROUND_Y = 500;        // top edge of the ground

const PLAYER_W = 40;
const PLAYER_H = 56;
const ENEMY_W = 40;
const ENEMY_H = 40;
const MR_LOODLE_W = 120;     // the friendly flying ride that brings KorbyKid into level 1
const MR_LOODLE_H = 70;

// ---------- Image files ----------
// Put your PNG files in the "assets" folder using these names.
// If a file is missing, the game draws a simple colored shape instead.
const IMAGE_FILES = {
  introBackground: "assets/intro_background.png",
  korbykid: "assets/korbykid.png",
  korbykidAttack: "assets/korbykid_attack.png",
  korbykidDeath: "assets/korbykid-death.png",
  jeremy: "assets/jeremy.png",
  leapO: "assets/leap-o.png",
  ufi: "assets/ufi.png",
  evilLoodle: "assets/evil-mr-loodle.png",
  grassPlatform: "assets/grass-platform.png",
  magmaPlatform: "assets/magma-platform.png",
  liquidPlatform: "assets/liquid-platform.png",
  door: "assets/door.png",
  deathBackground: "assets/death_background.png",
  background1: "assets/background1.png",
  background2: "assets/background2.png",
  background3: "assets/background3.png",
  korbykidWalking: "assets/korbykid-walking.png",
  mrLoodle: "assets/mr-loodle.png",
  korbykidRiding: "assets/korbykid-riding.png",
  heart: "assets/heart.png",
  heartEmpty: "assets/heart-empty.png"
};

// ---------- Enemy types ----------
// Each enemy type has its own pictures and its own properties.
// image = the enemy picture. Destroyed enemies just fall away; they have no death picture.
// speedMultiplier makes a type faster (above 1) or slower (below 1).
// UFI is the third normal enemy.
// Evil Mr. Loodle is the final boss; his boss fight comes later.
const ENEMY_TYPES = {
  jeremy: { image: "jeremy", color: "#ff004d", speedMultiplier: 1 },
  // Leap-O flies: no gravity or platforms, it drifts side to side and bobs up and down
  leapO: { image: "leapO", color: "#00b4ff", speedMultiplier: 1, flies: true, bobHeight: 40, bobSpeed: 0.04 },
  ufi: { image: "ufi", color: "#ffa300", speedMultiplier: 1 },
  evilLoodle: { image: "evilLoodle", color: "#7e2553", speedMultiplier: 1 }
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
    name: "Level 1: Mysterious Earth",
    background: "background1",
    platformImage: "grassPlatform",
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
      { type: "jeremy", x: 600, y: GROUND_Y - ENEMY_H, minX: 520, maxX: 800 },
      { type: "jeremy", x: 260, y: 400 - ENEMY_H, minX: 250, maxX: 360 },
      { type: "jeremy", x: 1100, y: GROUND_Y - ENEMY_H, minX: 990, maxX: 1200 },
      { type: "jeremy", x: 1230, y: 300 - ENEMY_H, minX: 1220, maxX: 1320 },
      { type: "jeremy", x: 2000, y: GROUND_Y - ENEMY_H, minX: 1900, maxX: 2100 },
      { type: "jeremy", x: 2530, y: 340 - ENEMY_H, minX: 2520, maxX: 2640 }
    ],
    door: { x: 3080, y: GROUND_Y - 90, w: 60, h: 90 }
  },
  {
    name: "Level 2: Scorching Planet",
    background: "background2",
    platformImage: "magmaPlatform",
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
      { type: "jeremy", x: 900, y: GROUND_Y - ENEMY_H, minX: 800, maxX: 1100 },
      // Leap-O fly in the air and bob up and down. Fly around them, or bump into them.
      { type: "leapO", x: 650, y: 230, minX: 600, maxX: 800 },
      { type: "leapO", x: 1050, y: 200, minX: 1000, maxX: 1180 },
      { type: "leapO", x: 1500, y: 230, minX: 1450, maxX: 1570 },
      { type: "leapO", x: 1960, y: 220, minX: 1950, maxX: 2050 }
    ],
    door: { x: 2300, y: GROUND_Y - 90, w: 60, h: 90 }
  }
];

// ---------- Game state ----------
let gameState = "intro";     // "intro" (title screen), "flyin" (Mr. Loodle brings KorbyKid in), or "playing"
let currentLevelIndex = 0;
let level = null;            // the level data currently being played
let player = null;           // KorbyKid
let enemies = [];            // enemies alive in the current level
let cameraX = 0;
let levelTitleTimer = 0;     // counts down while the level name shows
let deathTimer = 0;          // counts down after KorbyKid dies
let finishTimer = 0;         // counts down after KorbyKid enters the door
let attackTimer = 0;         // counts down while KorbyKid is in attack mode
let lives = MAX_LIVES;       // hearts left (saved in browser storage)
let invulnerableTimer = 0;   // counts down after a hit, so he isn't hurt again right away
let hurtGraphicTimer = 0;    // counts down while he shows his hurt picture

const keys = { left: false, right: false, up: false, jump: false };

// Title screen and level-start fly-in state (Mr. Loodle's position while he flies in)
let introX = 0;
let introY = 0;
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

// The Continue button on the death screen
function setContinueVisible(isVisible) {
  document.getElementById("continue-button").hidden = !isVisible;
}

// Continue after the death screen: start the same level again with full hearts
function continueAfterDeath() {
  setContinueVisible(false);
  lives = MAX_LIVES;
  loadLevel(currentLevelIndex);
}

function setMenuVisible(isVisible) {
  const menu = document.getElementById("menu");
  menu.classList.toggle("visible", isVisible);
  menu.classList.toggle("hidden", !isVisible);
}

// ---------- Title screen (intro) ----------
// Just the sky and ground. The title and Play button appear after a moment.
function resetIntro() {
  introCrashTimer = 0;
  introMenuShown = false;
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
  introCrashTimer++;

  // Show the Play button a moment after the title screen appears
  if (introCrashTimer > 60 && !introMenuShown) {
    introMenuShown = true;
    setMenuVisible(true);
  }
}

// Clicking or pressing Space/Enter on the title screen shows the Play button right away
function skipIntro() {
  introCrashTimer = 999;
}

function drawIntro() {
  // Sky and ground (drawing is in the 960 x 540 game grid, see draw())
  if (imageReady("introBackground")) {
    ctx.drawImage(images.introBackground, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#1d2b53";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.fillStyle = "#4a3b2a";
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
}

// ---------- Level start: Mr. Loodle flies KorbyKid in ----------
// Mr. Loodle is a friendly flying ride, not an enemy. He flies in with KorbyKid
// riding on top, lands at the start of the level, and then the level begins.
function resetFlyIn() {
  introX = -MR_LOODLE_W;
  introY = 120;
  introCrashed = false;
  introCrashTimer = 0;
  introShake = 0;
  introDust = [];
}

function updateFlyIn() {
  const targetX = level.start.x;
  const targetY = GROUND_Y - MR_LOODLE_H;

  if (!introCrashed) {
    // Fly right, and ease down towards the ground
    introX = Math.min(targetX, introX + 4);
    introY += (targetY - introY) * 0.04;

    if (introX >= targetX && introY > targetY - 2) {
      introY = targetY;
      introCrashed = true;
      introShake = 20;
      spawnDust(introX + MR_LOODLE_W / 2, GROUND_Y);
    }
  } else {
    introCrashTimer++;
    if (introShake > 0) introShake--;
    updateDust();

    // Mr. Loodle leaves, and KorbyKid starts playing
    if (introCrashTimer > 60) {
      gameState = "playing";
    }
  }
}

function drawFlyIn() {
  // Level background and platforms, with Mr. Loodle and KorbyKid flying in
  drawBackground();

  const shakeX = introShake > 0 ? (Math.random() - 0.5) * 10 : 0;
  const shakeY = introShake > 0 ? (Math.random() - 0.5) * 10 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawPlatforms();
  drawDoor();

  if (!introCrashed) {
    // While flying, KorbyKid and Mr. Loodle are drawn as one picture
    const ridingY = introY - PLAYER_H + 10;
    const ridingH = MR_LOODLE_H + PLAYER_H - 10;
    if (imageReady("korbykidRiding")) {
      ctx.drawImage(images.korbykidRiding, introX, ridingY, MR_LOODLE_W, ridingH);
    } else {
      // Placeholder until korbykid-riding.png exists: Mr. Loodle with KorbyKid on top
      ctx.fillStyle = "#8fd14f";
      ctx.fillRect(introX, introY, MR_LOODLE_W, MR_LOODLE_H);
      drawKorbyKid(introX + (MR_LOODLE_W - PLAYER_W) / 2, ridingY, PLAYER_W, PLAYER_H, false, false);
    }
  } else {
    // After landing, KorbyKid shows as normal
    drawKorbyKid(introX, GROUND_Y - PLAYER_H, PLAYER_W, PLAYER_H, false, false);
  }

  // Dust puffs after the landing
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
  loadProgress();                 // resume at the saved level with the saved hearts
  loadLevel(currentLevelIndex);
  resetFlyIn();
  gameState = "flyin";
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
    onGround: false,
    knockbackTimer: 0,   // frames left while being pushed away after a hit
    knockbackDir: 0,     // -1 = pushed left, 1 = pushed right
    facing: 1,           // -1 = facing left, 1 = facing right (the way he last walked)
    walkPoseTimer: 0     // frames left to keep showing the walking picture after he stops
  };

  // Copy the enemies so the level data stays unchanged when enemies die
  enemies = level.enemies.map(e => ({
    type: e.type,                 // key into ENEMY_TYPES (jeremy, leapO, ...)
    x: e.x,
    y: e.y,
    w: ENEMY_W,
    h: ENEMY_H,
    minX: e.minX,
    maxX: e.maxX,
    dir: Math.random() < 0.5 ? -1 : 1,                // 1 = right, -1 = left
    speed: ENEMY_SPEED * ENEMY_TYPES[e.type].speedMultiplier * (0.7 + Math.random() * 0.8),
    pauseTimer: 0,                                    // frames left to stand still
    baseY: e.y,                                       // flying enemies bob around this height
    bobTime: Math.random() * Math.PI * 2,             // where in its bob cycle the enemy starts
    dying: false,                                     // true after he is destroyed
    deathTimer: 0,                                    // frames left showing the death picture
    vy: 0                                             // falling speed after the death picture
  }));

  cameraX = 0;
  deathTimer = 0;
  finishTimer = 0;
  attackTimer = 0;
  invulnerableTimer = 0;
  hurtGraphicTimer = 0;
  levelTitleTimer = 180;
  saveProgress();
}

// Called whenever KorbyKid takes damage. Each hit costs one heart.
function loseHeart() {
  if (deathTimer > 0) return;

  lives--;
  triggerDamageFlash();
  saveProgress();

  if (lives <= 0) {
    // Out of hearts: show the death background, then restart the level
    deathTimer = 1;               // any value above 0 means the death screen is showing
    setContinueVisible(true);
  } else {
    // Still alive: he stays where he is, shows his hurt picture, and can't be hurt again for a moment
    invulnerableTimer = INVULNERABLE_FRAMES;
    hurtGraphicTimer = HURT_GRAPHIC_FRAMES;
  }
}

// Push KorbyKid away from the enemy that hit him, with a small hop
function knockBackPlayer(enemy) {
  const playerCenter = player.x + player.w / 2;
  const enemyCenter = enemy.x + enemy.w / 2;
  player.knockbackDir = playerCenter < enemyCenter ? -1 : 1;
  player.knockbackTimer = KNOCKBACK_FRAMES;
  player.vy = KNOCKBACK_JUMP;
}

// Falling into a hole costs a heart, then KorbyKid goes back to the start of the level
function fallIntoHole() {
  loseHeart();
  if (deathTimer === 0) {
    player.x = level.start.x;
    player.y = level.start.y;
    player.vx = 0;
    player.vy = 0;
  }
}

// Red border flash around the whole browser window
function triggerDamageFlash() {
  const flash = document.getElementById("damage-flash");
  flash.classList.add("show");
  setTimeout(() => flash.classList.remove("show"), 300);
}

// ---------- Saving progress in browser storage ----------
// Storage can be blocked (for example in private windows), so errors are ignored
// and the game still runs.
function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY_LEVEL, String(currentLevelIndex));
    localStorage.setItem(SAVE_KEY_LIVES, String(lives));
  } catch (err) {
    // Nothing to do: progress just won't be remembered
  }
}

function loadProgress() {
  try {
    const savedLevel = parseInt(localStorage.getItem(SAVE_KEY_LEVEL), 10);
    const savedLives = parseInt(localStorage.getItem(SAVE_KEY_LIVES), 10);
    currentLevelIndex = savedLevel >= 0 && savedLevel < LEVELS.length ? savedLevel : 0;
    lives = savedLives > 0 && savedLives <= MAX_LIVES ? savedLives : MAX_LIVES;
  } catch (err) {
    currentLevelIndex = 0;
    lives = MAX_LIVES;
  }
}

function goToNextLevel() {
  // After the last level, loop back to the first one
  const nextIndex = currentLevelIndex + 1 < LEVELS.length ? currentLevelIndex + 1 : 0;
  loadLevel(nextIndex);
}

// ---------- Player movement ----------
function updatePlayer() {
  // 1. Left and right (while being knocked back, the controls are ignored)
  player.vx = 0;
  if (player.knockbackTimer > 0) {
    player.knockbackTimer--;
    player.vx = player.knockbackDir * KNOCKBACK_SPEED;
  } else {
    if (keys.left) {
      player.vx = -RUN_SPEED;
      player.facing = -1;
    }
    if (keys.right) {
      player.vx = RUN_SPEED;
      player.facing = 1;
    }
  }

  // 2. Jump (only from the ground)
  if (keys.jump && player.onGround) {
    player.vy = JUMP_POWER;
  }

  // 3. Gravity pulls him down
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

  // 4. Move sideways, fix any overlap, then move up or down and fix again
  player.x += player.vx;
  handleHorizontalCollisions();
  const previousBottom = player.y + player.h;   // where his feet were before this frame
  player.previousBottom = previousBottom;       // remembered for stomping enemies
  player.y += player.vy;
  handleVerticalCollisions(previousBottom);

  // Stay inside the level from left to right
  player.x = clamp(player.x, 0, level.width - player.w);

  // Keep the walking picture on for a moment after he stops walking
  if (player.onGround && player.vx !== 0) {
    player.walkPoseTimer = WALK_POSE_FRAMES;
  } else if (player.walkPoseTimer > 0) {
    player.walkPoseTimer--;
  }

  // Falling below the screen means a pit
  if (player.y > level.height) {
    fallIntoHole();
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

// Platforms are "one-way": KorbyKid can jump up through them from below,
// and he only lands when he is falling and his feet were above the top edge.
function handleVerticalCollisions(previousBottom) {
  player.onGround = false;
  for (const p of level.platforms) {
    if (rectsOverlap(player, p) && player.vy > 0 && previousBottom <= p.y) {
      // Landed on top of a platform
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
}

// ---------- Enemies ----------
function updateEnemies() {
  for (const e of enemies) {
    if (e.dying) {
      updateDyingEnemy(e);
      continue;
    }

    // Flying enemies don't chase or walk on the ground
    if (ENEMY_TYPES[e.type].flies) {
      updateFlyingEnemy(e, ENEMY_TYPES[e.type]);
      continue;
    }

    const playerIsClose = deathTimer === 0 &&
      Math.abs(player.x - e.x) < ENEMY_CHASE_RANGE &&
      Math.abs(player.y - e.y) < ENEMY_CHASE_HEIGHT;

    if (playerIsClose) {
      // Chase KorbyKid: face him and move faster than usual
      e.pauseTimer = 0;
      e.dir = player.x < e.x ? -1 : 1;
      moveEnemy(e, e.speed * ENEMY_CHASE_BOOST);
    } else if (e.pauseTimer > 0) {
      // Standing still for a moment
      e.pauseTimer--;
    } else {
      // Patrol with random pauses and random early turns
      if (Math.random() < ENEMY_PAUSE_CHANCE) {
        e.pauseTimer = 30 + Math.floor(Math.random() * 60);
      } else {
        if (Math.random() < ENEMY_TURN_CHANCE) e.dir = -e.dir;
        moveEnemy(e, e.speed);
      }
    }
  }
  checkEnemyCollisions();

  // Remove enemies that have fallen off the bottom of the level
  enemies = enemies.filter(e => !(e.dying && e.y > level.height));
}

// Flying enemies drift side to side and bob up and down around their starting height
function updateFlyingEnemy(e, type) {
  e.bobTime += type.bobSpeed;
  e.y = e.baseY + Math.sin(e.bobTime) * type.bobHeight;
  moveEnemy(e, e.speed);
}

// A killed enemy shows its death picture for a moment, then falls off the map
function updateDyingEnemy(e) {
  if (e.deathTimer > 0) {
    e.deathTimer--;
  } else {
    e.vy = Math.min(e.vy + GRAVITY, MAX_FALL_SPEED);
    e.y += e.vy;
  }
}

function startEnemyDeath(e) {
  e.dying = true;
  e.deathTimer = ENEMY_DEATH_FRAMES;
  e.vy = 0;
}

// Move an enemy, but keep it between its minX and maxX so it doesn't walk off its platform
function moveEnemy(e, speed) {
  e.x += e.dir * speed;
  if (e.x < e.minX) {
    e.x = e.minX;
    e.dir = 1;
  }
  if (e.x > e.maxX) {
    e.x = e.maxX;
    e.dir = -1;
  }
}

function checkEnemyCollisions() {
  for (const e of enemies) {
    // Enemies that are already dying can't hurt him
    if (e.dying || !rectsOverlap(player, e)) continue;

    if (attackTimer > 0) {
      // In attack mode, touching an enemy destroys it
      startEnemyDeath(e);
      continue;
    }

    // Landing directly on top of an enemy destroys it and bounces KorbyKid back up
    if (player.vy > 0 && player.previousBottom <= e.y + STOMP_TOLERANCE) {
      startEnemyDeath(e);
      player.y = e.y - player.h;
      player.vy = STOMP_BOUNCE;
      continue;
    }

    // Otherwise any touch costs a heart (unless he just got hit)
    if (invulnerableTimer === 0) {
      loseHeart();
      if (deathTimer === 0) knockBackPlayer(e);
    }
  }
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

  if (gameState === "flyin") {
    updateFlyIn();
    return;
  }

  if (levelTitleTimer > 0) levelTitleTimer--;
  if (invulnerableTimer > 0) invulnerableTimer--;
  if (hurtGraphicTimer > 0) hurtGraphicTimer--;

  // After losing his last heart, the death screen waits for the Continue button
  if (deathTimer > 0) {
    return;
  }

  // After going through the door, wait and then load the next level
  if (finishTimer > 0) {
    finishTimer--;
    if (finishTimer === 0) goToNextLevel();
    return;
  }

  if (attackTimer > 0) attackTimer--;

  updatePlayer();
  updateEnemies();
  if (deathTimer === 0) checkDoor();
  updateCamera();
}

// ---------- Drawing ----------
function draw() {
  // Scale the 960 x 540 game grid to fill the whole canvas
  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);

  if (gameState === "intro") {
    drawIntro();
    return;
  }

  if (gameState === "flyin") {
    drawFlyIn();
    return;
  }

  // The death screen covers the whole frame
  if (deathTimer > 0) {
    drawDeathScreen();
    return;
  }

  drawBackground();

  // Everything in the world is drawn shifted by the camera
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawDoor();
  drawEnemies();
  // Flash on and off while he is protected after a hit
  const blinkOff = invulnerableTimer > 0 && Math.floor(invulnerableTimer / 6) % 2 === 1;
  if (hurtGraphicTimer > 0 && imageReady("korbykidDeath")) {
    // Show his hurt picture for a moment after a hit
    ctx.drawImage(images.korbykidDeath, player.x, player.y, player.w, player.h);
  } else if (!blinkOff) {
    // Walking picture while running on the ground (flipped when running left).
    // Standing still, jumping, and attacking use the other pictures.
    const isWalking = player.onGround && (player.vx !== 0 || player.walkPoseTimer > 0) &&
      attackTimer === 0 && imageReady("korbykidWalking");
    if (isWalking) {
      drawFlippedImage(images.korbykidWalking, player.x, player.y, player.w, player.h, player.facing === -1);
    } else {
      // Flip the attack picture only when walking/standing on the ground facing left.
      // Jump-attacks always use the right-facing picture.
      const flipAttack = player.facing === -1 && player.onGround;
      drawKorbyKid(player.x, player.y, player.w, player.h, attackTimer > 0, flipAttack);
    }
  }
  ctx.restore();

  drawMessages();
  drawHearts();
}

// Hearts in the top left: full hearts for lives left, empty hearts for lives lost
function drawHearts() {
  for (let i = 0; i < MAX_LIVES; i++) {
    const x = 20 + i * 48;
    const y = 16;
    const isFull = i < lives;

    if (isFull && imageReady("heart")) {
      ctx.drawImage(images.heart, x, y, HEART_SIZE, HEART_SIZE);
    } else if (!isFull && imageReady("heartEmpty")) {
      ctx.drawImage(images.heartEmpty, x, y, HEART_SIZE, HEART_SIZE);
    } else {
      // Text heart until heart.png and heart-empty.png exist
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "left";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "black";
      ctx.fillStyle = isFull ? "#ff004d" : "#555";
      ctx.strokeText("♥", x, y + 34);
      ctx.fillText("♥", x, y + 34);
    }
  }
}

function drawBackground() {
  if (imageReady(level.background)) {
    // Blur the level picture a little so the platforms and characters stand out.
    // (Browsers that don't support canvas filters just show the sharp picture.)
    ctx.filter = "blur(3px)";
    ctx.drawImage(images[level.background], 0, 0, WIDTH, HEIGHT);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#2b0f54";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawPlatforms() {
  for (const p of level.platforms) {
    if (imageReady(level.platformImage)) {
      ctx.drawImage(images[level.platformImage], p.x, p.y, p.w, p.h);
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
    const type = ENEMY_TYPES[e.type];
    const picture = type.image;
    if (imageReady(picture)) {
      ctx.drawImage(images[picture], e.x, e.y, e.w, e.h);
    } else {
      ctx.fillStyle = type.color;
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }
  }
}

// Draw a picture, mirrored left-to-right when flip is true
function drawFlippedImage(img, x, y, w, h, flip) {
  if (!flip) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  ctx.save();
  ctx.translate(x + w, y);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();
}

function drawKorbyKid(x, y, w, h, attacking, flipAttack) {
  if (attacking && imageReady("korbykidAttack")) {
    if (flipAttack) {
      // Mirror the attack picture so he faces left
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(images.korbykidAttack, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(images.korbykidAttack, x, y, w, h);
    }
  } else if (imageReady("korbykid")) {
    ctx.drawImage(images.korbykid, x, y, w, h);
  } else {
    // Placeholder square: darker orange while attacking
    ctx.fillStyle = attacking ? "#b35a00" : "#ff8c00";
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
  if (finishTimer > 0) {
    drawMessage("Level Complete!", HEIGHT / 2);
  }
}

function drawDeathScreen() {
  if (imageReady("deathBackground")) {
    ctx.drawImage(images.deathBackground, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#1a0000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

// ---------- Keyboard and mouse input ----------
// Start attack mode for ATTACK_FRAMES (ignored while already attacking)
function startAttack() {
  if (gameState === "playing" && attackTimer === 0 && deathTimer === 0) {
    attackTimer = ATTACK_FRAMES;
  }
}

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

  // Shift starts attack mode (ignores key repeat)
  const isShift = e.code === "ShiftLeft" || e.code === "ShiftRight";
  if (isShift && !e.repeat) startAttack();

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
document.getElementById("continue-button").addEventListener("click", continueAfterDeath);

// ---------- Main loop ----------
// The game logic runs at a fixed 60 steps per second, no matter how fast the screen refreshes.
// (Otherwise a 120 Hz screen would run the whole game twice as fast.)
const STEP_TIME = 1000 / 60;   // milliseconds per game step
let lastFrameTime = null;
let timeBank = 0;              // time not yet used up by game steps

function gameLoop(now) {
  if (lastFrameTime === null) lastFrameTime = now;

  // Long pauses (like a hidden tab) are capped so the game doesn't rush ahead
  timeBank += Math.min(now - lastFrameTime, 250);
  lastFrameTime = now;

  while (timeBank >= STEP_TIME) {
    update();
    timeBank -= STEP_TIME;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// ---------- Fitting the game to the screen ----------
const gameContainer = document.getElementById("game-container");
const touchControls = document.getElementById("touch-controls");

// Fit the game picture inside the window with its proportions kept (no stretching).
// On touch screens, the touch controls take up the space below it.
function resizeCanvas() {
  const controlsHeight = document.body.classList.contains("touch-device") ? touchControls.offsetHeight : 0;

  // The biggest size that fits, using the same shape as the 960 x 540 game grid
  const scale = Math.min(window.innerWidth / WIDTH, (window.innerHeight - controlsHeight) / HEIGHT);
  const cssWidth = Math.floor(WIDTH * scale);
  const cssHeight = Math.floor(HEIGHT * scale);

  // Draw at the screen's sharpness (phones are often 2 or 3 times sharper)
  const sharpness = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * sharpness);
  canvas.height = Math.round(cssHeight * sharpness);
  gameContainer.style.width = cssWidth + "px";
  gameContainer.style.height = cssHeight + "px";
}

window.addEventListener("resize", resizeCanvas);

// ---------- Touch controls (phones and tablets) ----------
if (window.matchMedia("(pointer: coarse)").matches) {
  document.body.classList.add("touch-device");
}

// Setting a touch control on or off, like holding the matching key
function setTouchControl(control, isDown) {
  if (control === "left") keys.left = isDown;
  if (control === "right") keys.right = isDown;
  // Jump also counts as Up, so pressing jump while standing in the door goes through it
  if (control === "jump") {
    keys.jump = isDown;
    keys.up = isDown;
  }
}

// Each on-screen button works while it is held down
document.querySelectorAll(".touch-button").forEach((button) => {
  const control = button.dataset.control;

  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.classList.add("pressed");
    if (control === "attack") {
      startAttack();
    } else {
      setTouchControl(control, true);
    }
  });

  const release = () => {
    button.classList.remove("pressed");
    setTouchControl(control, false);
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

loadImages();
resetIntro();
resizeCanvas();
requestAnimationFrame(gameLoop);
