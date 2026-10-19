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
const ATTACK_FRAMES = 48;    // attack mode lasts 48 frames, about 0.8 seconds
const MAX_LIVES = 3;         // KorbyKid starts with 3 hearts
const HEART_SIZE = 40;       // width and height of each heart in the top left corner
const INVULNERABLE_FRAMES = 90; // after a hit, KorbyKid flashes and can't be hurt for 1.5 seconds
const HURT_GRAPHIC_FRAMES = 90; // KorbyKid shows his hurt picture for 1.5 seconds after a hit
const ENEMY_DEATH_FRAMES = 30;  // a killed enemy shows its death picture for half a second
const KNOCKBACK_FRAMES = 25;   // after an enemy hit, KorbyKid is pushed away for 25 frames...
const KNOCKBACK_SPEED = 7;      // ...at this speed, which moves him about 175 pixels
const KNOCKBACK_JUMP = -6;      // and gives him a small hop as he is pushed
const DROP_FRAMES = 15;         // pressing Down on a platform lets him fall through it for a quarter second
const WALK_POSE_FRAMES = 15;    // the walking picture stays for a quarter second after he stops
const SAVE_KEY_LEVEL = "korbykid.level";

// Development setting: add ?godmode=true to the page address and KorbyKid can't take any damage.
const godMode = new URLSearchParams(window.location.search).get("godmode") === "true";
const SAVE_KEY_LIVES = "korbykid.lives";
const ENEMY_SPEED = 1.5;     // average walking speed (each enemy gets a random speed near this)
const ENEMY_CHASE_RANGE = 220;   // enemies chase KorbyKid when he is this close sideways...
const ENEMY_CHASE_HEIGHT = 80;   // ...and this close up or down
const ENEMY_CHASE_BOOST = 1.4;   // chasing enemies move this many times faster
const ENEMY_PAUSE_CHANCE = 0.01; // chance per frame that a patrolling enemy stops for a moment
const ENEMY_TURN_CHANCE = 0.005; // chance per frame that a patrolling enemy turns around early
const ENEMY_SPACING = 10;        // the gap kept between enemies, so they never overlap each other
// The red flash shown on KorbyKid and enemies when they are hit
const HIT_FLASH_FILTER = "sepia(1) saturate(6) hue-rotate(-50deg) brightness(0.9)";
const ENEMY_HIT_COOLDOWN = 40;   // after a hit that doesn't destroy an enemy, it waits this many frames before counting another
const GUN_SHOOT_FRAMES = 120;    // the gun fires every 2 seconds
const BULLET_W = 30;             // the size of a bullet, in the game's grid
const BULLET_H = 16;
const BULLET_SPEED = 7;
const GROUND_Y = 500;        // top edge of the ground

const PLAYER_W = 40;
const PLAYER_H = 56;
const ENEMY_W = 40;
const ENEMY_H = 40;
const PLATFORM_CORNER_RADIUS = 4; // how rounded the corners of floating platforms are
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
  cloopy: "assets/cloopy.png",
  gun: "assets/gun.png",
  gunFlipped: "assets/gun-flipped.png",
  sixtySeven: "assets/67.png",
  bossBackground: "assets/boss-background.png",
  bossFloor: "assets/boss-floor.png",
  winBackground: "assets/win_background.png",
  smooley: "assets/smooley.png",
  bullet: "assets/bullet.png",
  evilLoodle: "assets/evil-mr-loodle.png",
  grassPlatform: "assets/grass-platform.png",
  magmaPlatform: "assets/magma-platform.png",
  liquidPlatform: "assets/liquid-platform.png",
  door: "assets/portal.png",
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
  // scale makes a type bigger (1.5 = half as big again as the others)
  jeremy: { image: "jeremy", color: "#ff004d", speedMultiplier: 1, scale: 1 },
  // Leap-O flies: no gravity or platforms, it drifts side to side and bobs up and down
  leapO: { image: "leapO", color: "#00b4ff", speedMultiplier: 1, scale: 1, flies: true, bobHeight: 40, bobSpeed: 0.04 },
  // UFI walks on the ground, and is 3.3 times as big as the others (10% bigger than before)
  ufi: { image: "ufi", color: "#ffa300", speedMultiplier: 1, scale: 3.3 },
  // Cloopy is the level 2 gatekeeper for the portal. He takes 5 hits to destroy.
  // keepProportions: the box takes the picture's own width, so the picture is not squashed
  cloopy: { image: "cloopy", color: "#9b59b6", speedMultiplier: 1, scale: 3.3, hitsToKill: 5, keepProportions: true },
  // KorbyKid Journey Gun stays on the floor and fires a bullet every 2 seconds.
  // It faces the way it fires, and points right at the start.
  // flippedImage is the picture used when it faces left (drawn as is, not mirrored)
  gun: { image: "gun", flippedImage: "gunFlipped", color: "#555555", speedMultiplier: 1, scale: 1.5, keepProportions: true, stationary: true },
  // The final boss: about 4 times KorbyKid's size. Each one takes 7 to 12 hits (picked at random).
  evilLoodle: { image: "evilLoodle", color: "#7e2553", speedMultiplier: 1, scale: 5.6, keepProportions: true, boss: true },
  // Smooley flies and follows KorbyKid around, trying to touch him. Attack mode destroys him.
  smooley: { image: "smooley", color: "#ff77aa", speedMultiplier: 1, scale: 1, follows: true, followSpeed: 1.45 }   // 66% of its old speed of 2.2
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
    music: "music/level1.mp3",
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
    door: { x: 3065, y: GROUND_Y - 90, w: 90, h: 90 }
  },
  {
    name: "Level 2: Scorching Planet",
    background: "background2",
    platformImage: "magmaPlatform",
    music: "music/level2.mp3",
    randomSmooleys: true,   // a random number of Smooleys (1 to 5) is placed each time the level loads
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
      // Cloopy guards the portal at the end of the level. There is only one of him here.
      { type: "cloopy", x: 2090, y: GROUND_Y - 132, minX: 2070, maxX: 2090 },
      // Leap-O fly in the air and bob up and down. Fly around them, or bump into them.
      { type: "leapO", x: 650, y: 230, minX: 600, maxX: 800 },
      { type: "leapO", x: 1050, y: 200, minX: 1000, maxX: 1180 },
      { type: "leapO", x: 1500, y: 230, minX: 1450, maxX: 1570 },
      { type: "leapO", x: 1960, y: 220, minX: 1950, maxX: 2050 }
    ],
    door: { x: 2285, y: GROUND_Y - 90, w: 90, h: 90 }
  },
  {
    name: "Level 3: Bossfight Galaxy",
    background: "background3",
    platformImage: "liquidPlatform",
    music: "music/level3.mp3",
    width: 2800,
    height: HEIGHT,
    start: { x: 60, y: GROUND_Y - PLAYER_H },
    platforms: [
      // Ground pieces (the gaps between them are pits you can fall into)
      { x: 0, y: GROUND_Y, w: 800, h: 40 },
      { x: 880, y: GROUND_Y, w: 700, h: 40 },
      { x: 1660, y: GROUND_Y, w: 1140, h: 40 },
      // Floating platforms
      { x: 300, y: 400, w: 140, h: 20 },
      { x: 520, y: 320, w: 120, h: 20 },
      { x: 720, y: 250, w: 130, h: 20 },
      { x: 1000, y: 380, w: 150, h: 20 },
      { x: 1220, y: 300, w: 130, h: 20 },
      { x: 1420, y: 220, w: 120, h: 20 },
      { x: 1700, y: 360, w: 150, h: 20 },
      { x: 1930, y: 280, w: 130, h: 20 },
      { x: 2150, y: 200, w: 120, h: 20 },
      { x: 2380, y: 300, w: 140, h: 20 },
      { x: 2480, y: 360, w: 120, h: 20 }
    ],
    enemies: [
      { type: "jeremy", x: 600, y: GROUND_Y - ENEMY_H, minX: 500, maxX: 760 },
      { type: "ufi", x: 1000, y: GROUND_Y - 132, minX: 900, maxX: 1400 },
      { type: "leapO", x: 900, y: 200, minX: 850, maxX: 1050 },
      { type: "jeremy", x: 1220, y: 300 - ENEMY_H, minX: 1220, maxX: 1310 },
      { type: "leapO", x: 1700, y: 150, minX: 1650, maxX: 1800 },
      { type: "jeremy", x: 1800, y: GROUND_Y - ENEMY_H, minX: 1700, maxX: 2050 },
      { type: "jeremy", x: 2250, y: GROUND_Y - ENEMY_H, minX: 2200, maxX: 2500 },
      // The gun sits on a platform halfway through the level and fires straight at KorbyKid.
      { type: "gun", x: 1440, y: 160, minX: 1440, maxX: 1440 },
      { type: "leapO", x: 2300, y: 200, minX: 2250, maxX: 2450 },
      { type: "ufi", x: 2000, y: GROUND_Y - 132, minX: 1700, maxX: 2400 }
    ],
    door: { x: 2665, y: GROUND_Y - 90, w: 90, h: 90 }
  },
  {
    // The final level: floor only, with Evil Mr. Loodle. Defeating him ends the game.
    name: "Final Level: Evil Mr. Loodle",
    background: "bossBackground",
    platformImage: "bossFloor",
    music: "music/bossfight.mp3",
    width: WIDTH,   // exactly one screen wide, so the whole fight is on screen and nothing scrolls
    height: HEIGHT,
    start: { x: 60, y: GROUND_Y - PLAYER_H },
    platforms: [
      { x: 0, y: GROUND_Y, w: WIDTH, h: 40 }
    ],
    enemies: [
      { type: "evilLoodle", x: 900, y: 150, minX: 0, maxX: 0 }
    ],
    door: null,  // there is no portal here: the boss fight ends the game
    isBossLevel: true   // KorbyKid falls in from the top of the screen, not on Mr. Loodle
  }
];

// ---------- Music ----------
// Each level has its own music file (see "music" in LEVELS). It starts when the level begins
// and keeps looping. If a file is missing, or the browser blocks sound, the game just stays silent.
const levelMusic = new Audio();
levelMusic.loop = true;

function playLevelMusic(index) {
  const file = LEVELS[index].music;
  if (levelMusic.getAttribute("src") !== file) {
    levelMusic.src = file;
  }
  levelMusic.play().catch(() => {});
}

function stopLevelMusic() {
  levelMusic.pause();
}

// ---------- Volume settings (title screen sliders, 0 to 10) ----------
// The music and sound effect sliders are saved in the browser.
const SAVE_KEY_MUSIC_VOLUME = "korbykid.musicVolume";
const SAVE_KEY_SOUND_VOLUME = "korbykid.soundVolume";
let musicVolume = 4;   // 4 out of 10 is the normal music level
let soundVolume = 6;   // 6 out of 10 is the normal sound effect level

function loadVolumeSettings() {
  try {
    const savedMusic = parseInt(localStorage.getItem(SAVE_KEY_MUSIC_VOLUME), 10);
    const savedSound = parseInt(localStorage.getItem(SAVE_KEY_SOUND_VOLUME), 10);
    if (savedMusic >= 0 && savedMusic <= 10) musicVolume = savedMusic;
    if (savedSound >= 0 && savedSound <= 10) soundVolume = savedSound;
  } catch (err) {
    // Storage is blocked: use the normal levels
  }
}

function saveVolumeSettings() {
  try {
    localStorage.setItem(SAVE_KEY_MUSIC_VOLUME, String(musicVolume));
    localStorage.setItem(SAVE_KEY_SOUND_VOLUME, String(soundVolume));
  } catch (err) {
    // Storage is blocked: the settings still work until the page is closed
  }
}

// Sets every music and sound effect to the level chosen on the sliders
function applyVolumeSettings() {
  const music = musicVolume / 10;
  const sound = soundVolume / 10;
  levelMusic.volume = music;
  deathMusic.volume = music;
  deathSound.volume = sound;
}

// ---------- Sound effects ----------
// The impact sound plays each time an enemy is hit. Each play starts a fresh copy,
// so quick hits can overlap instead of cutting each other off.
const impactSound = new Audio("sounds/impact1.mp3");
impactSound.volume = 0.6;

// Each copy needs its own volume set, because a copy doesn't keep the original's volume
function playImpactSound() {
  const copy = impactSound.cloneNode();
  copy.volume = soundVolume / 10;
  copy.play().catch(() => {});
}

// Played when KorbyKid jumps, and when he lands back on the ground or a platform
const jumpSound = new Audio("sounds/jump.mp3");
const jumpLandSound = new Audio("sounds/jump-land.mp3");

// The jump sound is at 10% of the normal sound effect level. It still follows the sound effects slider.
function playJumpSound() {
  const copy = jumpSound.cloneNode();
  copy.volume = (soundVolume / 10) * 0.1;
  copy.play().catch(() => {});
}

// The landing sound is at 10% of the normal sound effect level. It still follows the sound effects slider.
function playJumpLandSound() {
  const copy = jumpLandSound.cloneNode();
  copy.volume = (soundVolume / 10) * 0.1;
  copy.play().catch(() => {});
}

// Played when KorbyKid loses a life but is still alive (not when he runs out of hearts)
const korbyImpactSound = new Audio("sounds/korbykid-impact.mp3");
korbyImpactSound.volume = 0.6;

function playKorbyImpactSound() {
  const copy = korbyImpactSound.cloneNode();
  copy.volume = soundVolume / 10;
  copy.play().catch(() => {});
}

// Played once when KorbyKid runs out of hearts and the death screen appears
const deathSound = new Audio("sounds/korbykid-death.mp3");
deathSound.volume = 0.6;

// Music that keeps looping on the death screen until Continue or Return to Title is pressed
const deathMusic = new Audio("sounds/korbykid-death-music.mp3");
deathMusic.loop = true;
deathMusic.volume = 0.4;

function playDeathSound() {
  stopLevelMusic();   // the level music stops as the death screen comes up
  deathSound.currentTime = 0;
  deathSound.play().catch(() => {});
  deathMusic.currentTime = 0;
  deathMusic.play().catch(() => {});
}

function stopDeathMusic() {
  deathMusic.pause();
}

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

const keys = { left: false, right: false, up: false, jump: false, down: false };

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

// The Continue and Return to Title buttons on the death screen
function setDeathButtonsVisible(isVisible) {
  document.getElementById("continue-button").hidden = !isVisible;
  document.getElementById("title-button").hidden = !isVisible;
}

// Back to the title screen, starting the whole game again from level 1 with full hearts
function returnToTitle() {
  setDeathButtonsVisible(false);
  stopLevelMusic();
  stopDeathMusic();
  deathTimer = 0;
  lives = MAX_LIVES;
  currentLevelIndex = 0;
  saveProgress();
  gameState = "intro";
  resetIntro();
  setMenuVisible(false);   // the Play button fades in again after a moment
}

// Continue after the death screen: start the same level again with full hearts
function continueAfterDeath() {
  setDeathButtonsVisible(false);
  lives = MAX_LIVES;
  stopDeathMusic();
  loadLevel(currentLevelIndex);
  playLevelMusic(currentLevelIndex);
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
  startShadow();
  drawPlatforms();
  drawDoor();

  if (!introCrashed) {
    // While flying, KorbyKid and Mr. Loodle are drawn as one picture
    const ridingY = introY - PLAYER_H + 10;
    const ridingH = MR_LOODLE_H + PLAYER_H - 10;
    if (imageReady("korbykidRiding")) {
      drawRidingPicture(introX + MR_LOODLE_W / 2, introY + MR_LOODLE_H, ridingH);
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
// levelIndex is only given by the ?level=N shortcut (see the end of this file)
function startGame(levelIndex) {
  setMenuVisible(false);
  loadProgress();                 // resume at the saved level with the saved hearts
  if (levelIndex !== undefined) currentLevelIndex = levelIndex;
  loadLevel(currentLevelIndex);
  playLevelMusic(currentLevelIndex);
  if (level.isBossLevel) {
    gameState = "playing";   // the final level has no Mr. Loodle fly-in: KorbyKid falls in instead
  } else {
    resetFlyIn();
    gameState = "flyin";
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// The enemies to place in a level. Levels marked randomSmooleys get a random number of
// Smooleys (1 to 5) at random places, re-rolled every time the level loads.
function getLevelEnemySpawns(lvl) {
  const spawns = lvl.enemies.slice();
  if (lvl.randomSmooleys) {
    const count = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      // The second half arrives 5 seconds (300 frames) in, far to the right near the end of the level
      const isLateArrival = i >= Math.floor(count / 2);
      const x = isLateArrival
        ? randomBetween(lvl.width - 400, lvl.width - 200)
        : randomBetween(300, lvl.width - 200);
      spawns.push({ type: "smooley", x: x, y: randomBetween(50, 450), minX: x, maxX: x, delay: isLateArrival ? 300 : 0 });
    }
  }
  return spawns;
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
    walkPoseTimer: 0,    // frames left to keep showing the walking picture after he stops
    standingOn: null,    // the platform he is standing on, if any
    dropTimer: 0         // frames left while he falls through a platform he dropped through
  };

  // Copy the enemies so the level data stays unchanged when enemies die
  enemies = getLevelEnemySpawns(level).map(e => ({
    type: e.type,                 // key into ENEMY_TYPES (jeremy, leapO, ...)
    x: e.x,
    y: e.y,
    w: enemyWidth(e.type),
    h: ENEMY_H * ENEMY_TYPES[e.type].scale,
    minX: e.minX,
    maxX: e.maxX,
    dir: ENEMY_TYPES[e.type].stationary ? 1 : (Math.random() < 0.5 ? -1 : 1),   // 1 = right, -1 = left
    speed: ENEMY_SPEED * ENEMY_TYPES[e.type].speedMultiplier * (0.7 + Math.random() * 0.8),
    pauseTimer: 0,                                    // frames left to stand still
    shootTimer: GUN_SHOOT_FRAMES,                     // frames until the gun fires again
    hitsToKill: ENEMY_TYPES[e.type].boss ? 7 + Math.floor(Math.random() * 6) : undefined,   // the boss takes 7 to 12 hits
    homeX: e.x,                                       // the boss drifts around this spot
    bossAttacking: false,                             // the boss alternates between drifting and diving at KorbyKid
    modeTimer: BOSS_PATTERN_FRAMES,                   // frames left in the current boss mode
    appearTimer: e.delay || 0,                        // frames before this enemy appears (0 = from the start)
    hits: 0,                                          // hits taken so far (Cloopy needs 5)
    flashTimer: 0,                                    // frames left showing the red hit flash
    hitCooldown: 0,                                   // frames before another hit counts
    baseY: e.y,                                       // flying enemies bob around this height
    bobTime: Math.random() * Math.PI * 2,             // where in its bob cycle the enemy starts
    dying: false,                                     // true after he is destroyed
    deathTimer: 0,                                    // frames left showing the death picture
    vy: 0                                             // falling speed after the death picture
  }));

  // Enemies with an appearTimer wait off to the side until their time comes
  pendingEnemies = enemies.filter(e => e.appearTimer > 0);
  enemies = enemies.filter(e => e.appearTimer === 0);

  // In the final level, KorbyKid starts above the screen and falls down onto the floor
  if (level.isBossLevel) {
    player.y = -PLAYER_H - 60;
  }

  cameraX = 0;
  bullets = [];
  heartPickups = [];
  holeStreak = 0;
  easterEgg = null;
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
  if (!fallingIntoHole) holeStreak = 0;   // any other damage breaks a run of holes
  if (godMode || deathTimer > 0 || gameState !== "playing") return;

  lives--;
  triggerDamageFlash();
  saveProgress();

  if (lives <= 0) {
    // Out of hearts: show the death background, then restart the level
    deathTimer = 1;               // any value above 0 means the death screen is showing
    playDeathSound();
    setDeathButtonsVisible(true);
  } else {
    // Still alive: he stays where he is, shows his hurt picture, and can't be hurt again for a moment
    invulnerableTimer = INVULNERABLE_FRAMES;
    shakeTimer = 12;   // shake the screen a little
    playKorbyImpactSound();
    hurtGraphicTimer = HURT_GRAPHIC_FRAMES;
  }
}

// Push KorbyKid away from the enemy that hit him, with a small hop
function knockBackPlayer(enemy) {
  if (godMode) return;   // no damage means no push-back either
  const playerCenter = player.x + player.w / 2;
  const enemyCenter = enemy.x + enemy.w / 2;
  player.knockbackDir = playerCenter < enemyCenter ? -1 : 1;
  player.knockbackTimer = KNOCKBACK_FRAMES;
  player.vy = KNOCKBACK_JUMP;
}

// Falling into a hole costs a heart, then KorbyKid goes back to the start of the level
function fallIntoHole() {
  fallingIntoHole = true;
  loseHeart();
  fallingIntoHole = false;

  // Count the hole. Three in a row brings 67 down from the sky.
  if (deathTimer === 0) {
    holeStreak++;
    if (holeStreak >= EASTER_EGG_HOLES && !easterEgg) {
      holeStreak = 0;
      spawnEasterEgg();
    }
  }

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
  playLevelMusic(nextIndex);
}

// ---------- Player movement ----------
function updatePlayer() {
  const wasOnGround = player.onGround;   // remembered so a landing can be detected

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
    playJumpSound();
  }

  // Press Down while standing on a floating platform to fall through it.
  // (The ground can't be dropped through.)
  if (player.dropTimer > 0) player.dropTimer--;
  if (keys.down && player.onGround && player.standingOn && player.standingOn.y < GROUND_Y && player.dropTimer === 0) {
    player.dropTimer = DROP_FRAMES;
    player.onGround = false;
    player.standingOn = null;
    player.y += 2;   // step off the platform so his feet are below its top
  }

  // 3. Gravity pulls him down
  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

  // 4. Move sideways, fix any overlap, then move up or down and fix again
  player.x += player.vx;
  handleHorizontalCollisions();
  const previousBottom = player.y + player.h;   // where his feet were before this frame
  player.y += player.vy;
  handleVerticalCollisions(previousBottom);

  // Landing: he was in the air last frame and is on the ground or a platform now
  if (!wasOnGround && player.onGround) {
    playJumpLandSound();
  }

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
  player.standingOn = null;
  for (const p of level.platforms) {
    // While dropping through, floating platforms are ignored (the ground is never ignored)
    const droppingThrough = player.dropTimer > 0 && p.y < GROUND_Y;
    if (!droppingThrough && rectsOverlap(player, p) && player.vy > 0 && previousBottom <= p.y) {
      // Landed on top of a platform
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.standingOn = p;
    }
  }
}

// ---------- Enemies ----------
function updateEnemies() {
  for (const e of enemies) {
    if (e.hitCooldown > 0) e.hitCooldown--;
    if (e.flashTimer > 0) e.flashTimer--;

    if (e.dying) {
      updateDyingEnemy(e);
      continue;
    }

    // The final boss alternates between a drifting pattern and diving at KorbyKid
    if (ENEMY_TYPES[e.type].boss) {
      updateBoss(e, ENEMY_TYPES[e.type]);
      continue;
    }

    // Stationary enemies (the gun) stay where they are and fire on a timer
    if (ENEMY_TYPES[e.type].stationary) {
      updateGun(e);
      continue;
    }

    // Following enemies (Smooley) fly straight at KorbyKid all the time
    if (ENEMY_TYPES[e.type].follows) {
      updateFollowingEnemy(e, ENEMY_TYPES[e.type]);
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

// Smooleys push away from any other Smooley that is too close, so they spread out around
// KorbyKid instead of stacking up on top of each other
const SMOOLEY_SPACING = 70;   // how close two Smooleys can get, in the game's grid

function separateFromOtherSmooleys(e) {
  for (const other of enemies) {
    if (other === e || other.dying || !ENEMY_TYPES[other.type].follows) continue;

    const dx = (e.x + e.w / 2) - (other.x + other.w / 2);
    const dy = (e.y + e.h / 2) - (other.y + other.h / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > 0 && distance < SMOOLEY_SPACING) {
      const push = (SMOOLEY_SPACING - distance) / SMOOLEY_SPACING * 0.5;
      e.x += dx / distance * push;
      e.y += dy / distance * push;
    }
  }
}

// Moves a following enemy straight toward KorbyKid's centre, at its own steady speed
function updateFollowingEnemy(e, type) {
  if (deathTimer > 0) return;


  const dx = (player.x + player.w / 2) - (e.x + e.w / 2);
  const dy = (player.y + player.h / 2) - (e.y + e.h / 2);
  const distance = Math.hypot(dx, dy);
  if (distance > 0) {
    const step = Math.min(type.followSpeed, distance);
    e.x += dx / distance * step;
    e.y += dy / distance * step;
  }
  e.dir = dx < 0 ? -1 : 1;

  separateFromOtherSmooleys(e);

  // Stay inside the level
  e.x = clamp(e.x, 0, level.width - e.w);
}

// Flying enemies drift side to side and bob up and down around their starting height
function updateFlyingEnemy(e, type) {
  e.bobTime += type.bobSpeed;
  const newY = e.baseY + Math.sin(e.bobTime) * type.bobHeight;

  // If bobbing up or down would bump into another enemy, wait until it is clear
  // (an enemy that already touches another one may move, so it can pull apart)
  const alreadyTouching = overlapsAnotherEnemy(e, e.x, e.y);
  if (alreadyTouching || !overlapsAnotherEnemy(e, e.x, newY)) {
    e.y = newY;
  }
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

// Hits an enemy. Most enemies are destroyed by one hit. Cloopy takes several hits, and after
// each one he has a short pause before he can be hit again (so one touch counts only once).
// Returns true if the hit counted, false if it was ignored (the enemy was still recovering)
function hitEnemy(e) {
  if (e.hitCooldown > 0) return false;

  playImpactSound();
  e.hits++;
  e.flashTimer = 12;   // flash red for a fifth of a second
  if (ENEMY_TYPES[e.type].boss) rollHeartDrop(e);   // the boss can drop a heart on any hit
  if (e.hits >= (e.hitsToKill || ENEMY_TYPES[e.type].hitsToKill || 1)) {
    if (ENEMY_TYPES[e.type].boss) {
      startVictory();   // defeating the boss ends the game
    } else {
      startEnemyDeath(e);
    }
  } else {
    e.hitCooldown = ENEMY_HIT_COOLDOWN;
  }
  return true;
}

function startEnemyDeath(e) {
  rollHeartDrop(e);
  e.flashTimer = 12;
  spawnSparks(e.x + e.w / 2, e.y + e.h / 2, ENEMY_TYPES[e.type].color, 14);
  e.dying = true;
  e.deathTimer = ENEMY_DEATH_FRAMES;
  e.vy = 0;
}

// Move an enemy, but keep it between its minX and maxX so it doesn't walk off its platform
function moveEnemy(e, speed) {
  const oldX = e.x;
  e.x += e.dir * speed;
  if (e.x < e.minX) {
    e.x = e.minX;
    e.dir = 1;
  }
  if (e.x > e.maxX) {
    e.x = e.maxX;
    e.dir = -1;
  }

  // Don't run into another enemy: step back and turn around. An enemy that already touches
  // another one (for example, one that spawned too close) is allowed to move so it can pull apart.
  if (!overlapsAnotherEnemy(e, oldX, e.y) && overlapsAnotherEnemy(e, e.x, e.y)) {
    e.x = oldX;
    e.dir = -e.dir;
  }
}

// The width of an enemy's box. Enemies marked keepProportions use their picture's own
// shape (so a wide picture is not squashed); the others use the normal width.
function enemyWidth(typeName) {
  const type = ENEMY_TYPES[typeName];
  const height = ENEMY_H * type.scale;
  const picture = images[type.image];
  if (type.keepProportions && imageReady(type.image)) {
    return height * picture.naturalWidth / picture.naturalHeight;
  }
  return ENEMY_W * type.scale;
}

// True if an enemy at (x, y) would be too close to another enemy.
// Each enemy keeps a gap of ENEMY_SPACING pixels from the others.
function overlapsAnotherEnemy(e, x, y) {
  for (const other of enemies) {
    if (other === e || other.dying) continue;
    const touchesX = x < other.x + other.w + ENEMY_SPACING && x + e.w + ENEMY_SPACING > other.x;
    const touchesY = y < other.y + other.h + ENEMY_SPACING && y + e.h + ENEMY_SPACING > other.y;
    if (touchesX && touchesY) return true;
  }
  return false;
}

function checkEnemyCollisions() {
  for (const e of enemies) {
    // Enemies that are already dying can't hurt him
    if (e.dying || !rectsOverlap(player, e)) continue;

    if (attackTimer > 0) {
      // In attack mode, touching an enemy hits it. When the attack connects, he is pushed back.
      if (hitEnemy(e)) knockBackPlayer(e);
      continue;
    }

    // Otherwise any touch costs a heart (unless he just got hit)
    if (invulnerableTimer === 0) {
      loseHeart();
      if (deathTimer === 0) knockBackPlayer(e);
    }
  }
}

// ---------- Confetti for the win screen ----------
let confetti = [];

function spawnConfetti() {
  const colors = ["#ffcc00", "#ff4d7a", "#29adff", "#00e436", "#ffffff"];
  confetti = [];
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * WIDTH,
      y: -Math.random() * HEIGHT,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1 + Math.random() * 2.5,
      size: 6 + Math.random() * 5,
      color: colors[i % colors.length],
      spin: Math.random() * Math.PI * 2
    });
  }
}

function updateConfetti() {
  for (const c of confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.spin += 0.1;
    // Confetti that falls off the bottom comes back in at the top
    if (c.y > HEIGHT + 10) {
      c.y = -10;
      c.x = Math.random() * WIDTH;
    }
  }
}

function drawConfetti() {
  for (const c of confetti) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
    ctx.restore();
  }
}

// ---------- The final boss, the victory, and the win screen ----------
const BOSS_PATTERN_FRAMES = 240;   // the boss drifts for 4 seconds...
const BOSS_ATTACK_FRAMES = 150;    // ...then dives at KorbyKid for 2.5 seconds
const BOSS_ATTACK_SPEED = 3.4;
const VICTORY_LOOP_FRAMES = 240;   // KorbyKid loops for 4 seconds after the boss is defeated
const VICTORY_LOOP_RADIUS = 150;   // big loops, so they fill the sky
const WIN_FRAMES = 300;            // the win screen shows for 5 seconds

// Victory and win screen state
let victoryTimer = 0;
let victoryBaseX = 0;
let victoryBaseY = 0;
let victoryX = 0;
let victoryY = 0;
let winTimer = 0;
let winPreview = false;   // true when the win screen was opened for testing (?level=win), so it stays up

const successSound = new Audio("sounds/success.mp3");

// The win music replaces the boss fight music once Evil Mr. Loodle is defeated.
// It keeps looping through the victory and the win screen, until the game returns to the title.
function playWinMusic() {
  levelMusic.src = "music/win.mp3";
  levelMusic.play().catch(() => {});
}

function playSuccessSound() {
  const copy = successSound.cloneNode();
  copy.volume = soundVolume / 10;
  copy.play().catch(() => {});
}

// Moves the boss: it drifts in a figure-eight, then dives at KorbyKid, then drifts again
function updateBoss(e, type) {
  if (deathTimer > 0) return;

  e.modeTimer--;
  if (e.modeTimer <= 0) {
    e.bossAttacking = !e.bossAttacking;
    e.modeTimer = e.bossAttacking ? BOSS_ATTACK_FRAMES : BOSS_PATTERN_FRAMES;
  }

  if (e.bossAttacking) {
    const dx = (player.x + player.w / 2) - (e.x + e.w / 2);
    const dy = (player.y + player.h / 2) - (e.y + e.h / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      const step = Math.min(BOSS_ATTACK_SPEED, distance);
      e.x += dx / distance * step;
      e.y += dy / distance * step;
    }
    e.dir = dx < 0 ? -1 : 1;
  } else {
    // Drift towards a point on a figure-eight, easing so the boss never jumps
    e.bobTime += 0.02;
    // Drift on the right side of the screen, so the boss never sits in the middle of the floor
    // where KorbyKid walks, and never drifts off screen.
    const targetX = clamp(
      cameraX + WIDTH * 0.85 + Math.sin(e.bobTime) * 130,
      cameraX + 20,
      cameraX + WIDTH - e.w - 20
    );
    const targetY = e.baseY + Math.sin(e.bobTime * 2) * 70;
    e.dir = targetX < e.x ? -1 : 1;
    e.x += (targetX - e.x) * 0.08;
    e.y += (targetY - e.y) * 0.08;
  }

  // Stay inside the level, above the floor
  e.x = clamp(e.x, 0, level.width - e.w);
  // Keep his lowest point above head height, so KorbyKid can always walk underneath him
  e.y = clamp(e.y, 0, GROUND_Y - PLAYER_H - 30 - e.h);
}

// Defeating the boss: the boss is gone, and KorbyKid rides Mr. Loodle off screen
function startVictory() {
  gameState = "victory";
  victoryTimer = 0;
  victoryBaseX = player.x;
  victoryBaseY = player.y;
  victoryX = player.x;
  victoryY = player.y;
  attackTimer = 0;
  playSuccessSound();
  playWinMusic();
}

function updateVictory() {
  victoryTimer++;
  if (victoryTimer === 1) {
    enemies = [];
    pendingEnemies = [];
    bullets = [];
  }

  if (victoryTimer <= VICTORY_LOOP_FRAMES) {
    // Loop-de-loops: a circle that also travels forward
    const angle = victoryTimer * 0.12;
    victoryX = victoryBaseX + victoryTimer * 3 + VICTORY_LOOP_RADIUS * Math.sin(angle);
    // The loops rise slowly, so they travel up into the sky as they go
victoryY = victoryBaseY - VICTORY_LOOP_RADIUS - victoryTimer * 0.4 + VICTORY_LOOP_RADIUS * Math.cos(angle);
  } else {
    // Then they fly off to the right
    victoryX += 3;   // half the speed of before, so the fly-off lasts about twice as long
  }

  cameraX = clamp(victoryX + PLAYER_W / 2 - WIDTH / 2, 0, level.width - WIDTH);

  // Once they have flown off screen, show the win screen
  if (victoryX - cameraX > WIDTH + 100) {
    gameState = "win";
    spawnConfetti();
    setWinButtonVisible(true);
  }
}

// The win screen: after 5 seconds, everything restarts from the intro
// The win screen stays up until the player presses Return to Title
function updateWin() {
  updateConfetti();
}

function setWinButtonVisible(isVisible) {
  document.getElementById("win-title-button").hidden = !isVisible;
}

// Draws a picture at a set height, with its own width, so it is never squashed.
// centerX and bottomY say where the bottom middle of the picture goes.
function drawAtHeight(img, centerX, bottomY, height, flip) {
  const width = height * img.naturalWidth / img.naturalHeight;
  drawFlippedImage(img, centerX - width / 2, bottomY - height, width, height, flip);
}

// KorbyKid riding Mr. Loodle, drawn as one picture at its own proportions
function drawRidingPicture(centerX, bottomY, height) {
  drawAtHeight(images.korbykidRiding, centerX, bottomY, height, false);
}

// KorbyKid riding Mr. Loodle, drawn as one picture (the same as the level start)
function drawRiding(x, y) {
  if (imageReady("korbykidRiding")) {
    drawRidingPicture(x + MR_LOODLE_W / 2, y + MR_LOODLE_H, MR_LOODLE_H + PLAYER_H - 10);
  } else {
    drawKorbyKid(x, y, PLAYER_W, PLAYER_H, false, false);
  }
}

function drawVictory() {
  drawBackground();
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawRiding(victoryX, victoryY);
  ctx.restore();
}

function drawWin() {
  if (imageReady("winBackground")) {
    ctx.drawImage(images.winBackground, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "#101840";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawConfetti();

  // Temporary win message (to be replaced later)
  drawMessage("You saved Mr. Loodle from evil!", HEIGHT - 120);
}

// ---------- The 67 easter egg ----------
// Falling into 3 holes in a row (with no other damage in between) makes 67 fall from the sky.
// He is only company: he can't be hurt, can't hurt KorbyKid, and can't be collided with.
const EASTER_EGG_HOLES = 2;
const EGG_SIZE = 60;

let holeStreak = 0;          // holes fallen into in a row
let fallingIntoHole = false; // true while a hole's damage is being counted
let easterEgg = null;        // the 67 companion, once he has appeared

// 67.mp3 plays five times in a row when he arrives
const sixtySevenSound = new Audio("sounds/67.mp3");
let sixtySevenPlays = 0;

sixtySevenSound.addEventListener("ended", () => {
  sixtySevenPlays++;
  if (sixtySevenPlays < 5) {
    sixtySevenSound.play().catch(() => {});
  }
});

function playSixtySevenSound() {
  sixtySevenPlays = 1;
  sixtySevenSound.currentTime = 0;
  sixtySevenSound.volume = soundVolume / 10;
  sixtySevenSound.play().catch(() => {});
}

function spawnEasterEgg() {
  playSixtySevenSound();
  easterEgg = {
    x: player.x,
    y: -EGG_SIZE - 20,      // starts above the top of the screen
    w: EGG_SIZE,
    h: EGG_SIZE,
    vy: 0,
    falling: true,
    t: 0                    // counts time, for the bobbing
  };
}

// 67 falls down, then floats a KorbyKid's width away from him, bobbing up and down
function updateEasterEgg() {
  if (!easterEgg) return;
  const egg = easterEgg;
  egg.t++;

  // Stay one KorbyKid's width away, on the side he is not facing
  const targetX = player.facing === 1
    ? player.x - PLAYER_W - egg.w
    : player.x + player.w + PLAYER_W;
  const targetY = GROUND_Y - egg.h;   // 67 stays on the ground

  // Is there ground under him? If he walks over a hole, he falls in and is gone
  const centerX = egg.x + egg.w / 2;
  const overGround = level.platforms.some(p => p.y === GROUND_Y && centerX > p.x && centerX < p.x + p.w);

  if (egg.falling) {
    // Dropping down from the sky onto the ground
    egg.vy += GRAVITY;
    egg.y += egg.vy;
    if (egg.y >= targetY) {
      egg.y = targetY;
      egg.vy = 0;
      egg.falling = false;
    }
    egg.x = targetX;
  } else if (!overGround) {
    egg.vy += GRAVITY;
    egg.y += egg.vy;
    if (egg.y > level.height) {
      easterEgg = null;   // he fell in the hole, so he is no more
      return;
    }
  } else {
    // Walk along the ground beside him
    egg.x += (targetX - egg.x) * 0.1;
    egg.y = targetY;
    egg.vy = 0;
  }

  egg.x = clamp(egg.x, 0, level.width - egg.w);
}

function drawEasterEgg() {
  if (!easterEgg) return;
  if (imageReady("sixtySeven")) {
    ctx.drawImage(images.sixtySeven, easterEgg.x, easterEgg.y, easterEgg.w, easterEgg.h);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("67", easterEgg.x + easterEgg.w / 2, easterEgg.y + easterEgg.h);
  }
}

// ---------- Sparks and screen shake (polish) ----------
let sparks = [];
let shakeTimer = 0;   // frames left of screen shake after KorbyKid is hurt

// A little burst of sparks, for when an enemy is destroyed or a heart is collected
function spawnSparks(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    sparks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 24,
      color: color,
      size: 2 + Math.random() * 3
    });
  }
}

function updateSparks() {
  for (const s of sparks) {
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.15;   // a little gravity, so the sparks arc down
    s.life--;
  }
  sparks = sparks.filter(s => s.life > 0);
}

function drawSparks() {
  for (const s of sparks) {
    ctx.globalAlpha = s.life / 24;   // fade out as they die
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- Hearts that enemies leave behind ----------
// The chance an enemy drops a heart when it is destroyed. A range means a random chance
// is picked each time one is destroyed. The final boss is in the table too: it rolls each time it is hit.
const HEART_DROP_CHANCES = {
  jeremy: [0.10, 0.10],
  leapO: [0.30, 0.30],
  smooley: [0.5, 0.5],
  cloopy: [1, 1],
  ufi: [0.7, 0.7],
  evilLoodle: [0.15, 0.15],
  gun: [1, 1]
};

const HEART_APPEAR_FRAMES = 30;   // a heart waits half a second before it appears, so he is knocked back first

let heartPickups = [];

const heartSound = new Audio("sounds/heartcollected.mp3");

function playHeartSound() {
  const copy = heartSound.cloneNode();
  copy.volume = soundVolume / 10;
  copy.play().catch(() => {});
}

// Rolls for a heart drop. If it succeeds, a heart appears where the enemy was.
function rollHeartDrop(e) {
  const range = HEART_DROP_CHANCES[e.type];
  if (!range) return;
  const chance = range[0] + Math.random() * (range[1] - range[0]);
  if (Math.random() < chance) {
    heartPickups.push({
      x: e.x + e.w / 2 - HEART_SIZE / 2,
      y: e.y + e.h / 2 - HEART_SIZE / 2,
      w: HEART_SIZE,
      h: HEART_SIZE,
      vy: 0,
      landed: false,
      collected: false,
      appearTimer: HEART_APPEAR_FRAMES
    });
  }
}

// Hearts fall until they land on the platform or floor beneath them, then wait to be collected
function updateHeartPickups() {
  for (const h of heartPickups) {
    // Hidden for a moment after the enemy dies, so KorbyKid can be knocked back before it appears
    if (h.appearTimer > 0) {
      h.appearTimer--;
      continue;
    }

    if (!h.landed) {
      const previousBottom = h.y + h.h;
      h.vy = Math.min(h.vy + GRAVITY, MAX_FALL_SPEED);
      h.y += h.vy;

      // Find the highest platform below the heart that it has come down onto
      let landingOn = null;
      for (const p of level.platforms) {
        const overlapsX = h.x < p.x + p.w && h.x + h.w > p.x;
        const comesDownOnto = previousBottom <= p.y && h.y + h.h >= p.y;
        if (overlapsX && comesDownOnto && (!landingOn || p.y < landingOn.y)) {
          landingOn = p;
        }
      }
      if (landingOn) {
        h.y = landingOn.y - h.h;
        h.vy = 0;
        h.landed = true;
      }
    }

    // Collecting a heart restores one life (up to the most lives KorbyKid can have)
    if (rectsOverlap(player, h)) {
      h.collected = true;
      lives = Math.min(MAX_LIVES, lives + 1);
      playHeartSound();
      spawnSparks(h.x + h.w / 2, h.y + h.h / 2, "#ff4d7a", 16);
      saveProgress();
    }
  }

  heartPickups = heartPickups.filter(h => !h.collected && h.y <= level.height);
}

function drawHeartPickups() {
  for (const h of heartPickups) {
    if (h.appearTimer > 0) continue;   // not visible yet
    if (imageReady("heart")) {
      ctx.drawImage(images.heart, h.x, h.y, h.w, h.h);
    } else {
      ctx.fillStyle = "#ff004d";
      ctx.beginPath();
      ctx.arc(h.x + h.w / 2, h.y + h.h / 2, h.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- Enemies that arrive later ----------
// Some enemies (the second half of the Smooleys) are not in the level at the start.
// They join the level when their timer runs out.
let pendingEnemies = [];

function updatePendingEnemies() {
  for (const e of pendingEnemies) {
    e.appearTimer--;
  }
  enemies.push(...pendingEnemies.filter(e => e.appearTimer <= 0));
  pendingEnemies = pendingEnemies.filter(e => e.appearTimer > 0);
}

// ---------- The gun and its bullets ----------
// Bullets fly along the floor. They can't be attacked: they can only be avoided.
let bullets = [];

const gunShootSound = new Audio("sounds/gun-shoot.mp3");

// The gun's shot is 30% quieter than the other sound effects. It still follows the sound effects slider.
function playGunShootSound() {
  const copy = gunShootSound.cloneNode();
  copy.volume = (soundVolume / 10) * 0.7;
  copy.play().catch(() => {});
}

// Counts down to the next shot, then fires a bullet at KorbyKid's side
function updateGun(gun) {
  gun.shootTimer--;
  if (gun.shootTimer <= 0) {
    gun.shootTimer = GUN_SHOOT_FRAMES;
    fireBullet(gun);
  }
}

// Fires one bullet at KorbyKid's position right now. The bullet then flies in a straight
// line; it does not steer toward him, so he can dodge by moving.
function fireBullet(gun) {
  const fromX = gun.x + gun.w / 2;
  const fromY = gun.y + gun.h * 0.3;   // the barrel: 20% higher than the middle of the gun
  const toX = player.x + player.w / 2;
  const toY = player.y + player.h / 2;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy) || 1;
  const vx = dx / distance * BULLET_SPEED;
  const vy = dy / distance * BULLET_SPEED;

  gun.dir = vx < 0 ? -1 : 1;   // the gun turns to face the way it fires
  bullets.push({
    x: fromX - BULLET_W / 2,
    y: fromY - BULLET_H / 2,
    w: BULLET_W,
    h: BULLET_H,
    vx: vx,
    vy: vy
  });
  playGunShootSound();
}

// Moves the bullets, and hurts KorbyKid if one touches him
function updateBullets() {
  for (const b of bullets) {
    b.x += b.vx;
    b.y += b.vy;
  }

  for (const b of bullets) {
    if (rectsOverlap(player, b)) {
      b.hit = true;
      if (invulnerableTimer === 0) {
        loseHeart();
        if (deathTimer === 0) knockBackPlayer(b);
      }
    }
  }

  // Remove bullets that hit him, and bullets that have flown well past the edges of the level
  const margin = 100;
  bullets = bullets.filter(b =>
    !b.hit &&
    b.x > -margin && b.x < level.width + margin &&
    b.y > -margin && b.y < HEIGHT + margin
  );
}

// Draws a bullet turned to point the way it is flying. Bullets flying left are mirrored,
// so they are never upside down.
function drawBullet(b) {
  const angle = Math.atan2(b.vy, b.vx);
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
  if (b.vx < 0) {
    ctx.scale(-1, 1);
    ctx.rotate(Math.PI - angle);
  } else {
    ctx.rotate(angle);
  }

  if (imageReady("bullet")) {
    ctx.drawImage(images.bullet, -b.w / 2, -b.h / 2, b.w, b.h);
  } else {
    ctx.fillStyle = "#ffe600";
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
  }
  ctx.restore();
}

function drawBullets() {
  for (const b of bullets) {
    drawBullet(b);
  }
}

// ---------- Door and camera ----------
// Played when KorbyKid goes through a portal to the next level
const portalSound = new Audio("sounds/portal.mp3");

function playPortalSound() {
  const copy = portalSound.cloneNode();
  copy.volume = soundVolume / 10;
  copy.play().catch(() => {});
}

function checkDoor() {
  // Walk into the door and press Up (or W) to go through it
  if (level.door && keys.up && rectsOverlap(player, level.door)) {
    finishTimer = 60;
    playPortalSound();
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

  if (gameState === "victory") {
    updateVictory();
    return;
  }

  if (gameState === "win") {
    updateWin();
    return;
  }

  if (levelTitleTimer > 0) levelTitleTimer--;
  if (invulnerableTimer > 0) invulnerableTimer--;
  if (hurtGraphicTimer > 0) hurtGraphicTimer--;
  if (shakeTimer > 0) shakeTimer--;

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
  updateBullets();
  updatePendingEnemies();
  updateHeartPickups();
  updateSparks();
  updateEasterEgg();
  if (deathTimer === 0) checkDoor();
  updateCamera();
}

// ---------- Drawing ----------
function draw() {
  // Scale the 960 x 540 game grid to fill the whole canvas
  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);

  // A small shake of the whole picture after KorbyKid is hurt
  if (shakeTimer > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }

  if (gameState === "intro") {
    drawIntro();
    return;
  }

  if (gameState === "flyin") {
    drawFlyIn();
    return;
  }

  if (gameState === "victory") {
    drawVictory();
    return;
  }

  if (gameState === "win") {
    drawWin();
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
  startShadow();
  drawPlatforms();
  drawDoor();
  drawEnemies();
  drawBullets();
  drawHeartPickups();
  drawSparks();
  drawEasterEgg();
  // Flash on and off while he is protected after a hit
  // After a hit, KorbyKid flashes red on and off (instead of blinking out of sight)
  const redFlashOn = invulnerableTimer > 0 && Math.floor(invulnerableTimer / 6) % 2 === 0;
  const blinkOff = false;
  ctx.filter = redFlashOn ? HIT_FLASH_FILTER : "none";
  if (hurtGraphicTimer > 0 && imageReady("korbykidDeath")) {
    // Show his hurt picture for a moment after a hit
    // Keep the picture's own proportions: the lying-down pose is wider than he is standing
    const hurtHeight = PLAYER_H * 0.5267025;   // four steps of smaller (15%, 10%, 10%, 10%): about 47% smaller than standing
    const hurtWidth = hurtHeight * images.korbykidDeath.naturalWidth / images.korbykidDeath.naturalHeight;
    ctx.drawImage(
      images.korbykidDeath,
      player.x + player.w / 2 - hurtWidth / 2,
      player.y + player.h - hurtHeight,
      hurtWidth,
      hurtHeight
    );
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
  stopShadow();
  ctx.filter = "none";
  ctx.restore();

  drawMessages();
  startShadow();
  drawHearts();
  stopShadow();
}

// Dark drop shadow behind the foreground pictures (platforms, enemies, KorbyKid, door)
// so they stand out from the background. The sizes scale with the window, so the
// shadow looks the same at every screen size.
function startShadow() {
  const scale = canvas.width / WIDTH;
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetX = 4 * scale;
  ctx.shadowOffsetY = 4 * scale;
}

function stopShadow() {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
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

  // The darkness setting: a see-through black layer over the level picture only
  if (backgroundDarkness > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${backgroundDarkness})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawPlatforms() {
  for (const p of level.platforms) {
    // Floating platforms get rounded corners. The ground pieces stay square.
    const isFloating = p.y < GROUND_Y;
    if (isFloating) {
      // Clipping hides the drop shadow, so a solid rounded shape is drawn first to cast the
      // shadow. The picture is then drawn clipped to the same rounded shape on top of it.
      roundedRectPath(p.x, p.y, p.w, p.h, PLATFORM_CORNER_RADIUS);
      ctx.fillStyle = "#000";
      ctx.fill();

      ctx.save();
      roundedRectPath(p.x, p.y, p.w, p.h, PLATFORM_CORNER_RADIUS);
      ctx.clip();
    }

    if (imageReady(level.platformImage)) {
      ctx.drawImage(images[level.platformImage], p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = "#7e5aa8";
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    if (isFloating) ctx.restore();
  }
}

// Sets up a path for a rectangle with rounded corners (radius r)
function roundedRectPath(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawDoor() {
  const d = level.door;
  if (!d) return;   // the final level has no portal
  if (imageReady("door")) {
    ctx.drawImage(images.door, d.x, d.y, d.w, d.h);
  } else {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(d.x + d.w - 12, d.y + d.h / 2, 6, 6);
  }
}

// Draws an enemy's picture. Enemies with keepProportions are drawn at their picture's own shape
// (centred in their box), so they are never squashed.
function drawEnemyPicture(e, type, picture) {
  const img = images[picture];
  if (type.keepProportions && img && img.naturalHeight > 0) {
    drawAtHeight(img, e.x + e.w / 2, e.y + e.h, e.h, e.dir === -1);
  } else {
    const walking = !type.flies && !type.follows && !type.stationary && !e.dying;
    if (walking) {
      // A little squash and stretch, so walking enemies bounce as they go
      const squash = Math.sin(performance.now() / 110 + e.x * 0.05) * 0.05;
      const sw = e.w * (1 - squash);
      const sh = e.h * (1 + squash);
      drawFlippedImage(img, e.x + (e.w - sw) / 2, e.y + e.h - sh, sw, sh, e.dir === -1);
    } else {
      drawFlippedImage(img, e.x, e.y, e.w, e.h, e.dir === -1);
    }
  }
}

function drawEnemies() {
  for (const e of enemies) {
    const type = ENEMY_TYPES[e.type];
    const picture = type.image;
    if (imageReady(picture)) {
      // Mirror the picture when the enemy is moving left
      // Cloopy goes greyer with each hit, reaching full grey just before his last hit
      const hitsToKill = e.hitsToKill || ENEMY_TYPES[e.type].hitsToKill || 1;
      const greyness = Math.min(1, e.hits / Math.max(1, hitsToKill - 1));
      ctx.filter = `grayscale(${greyness}) ${e.flashTimer > 0 ? HIT_FLASH_FILTER : ""}`;
      if (e.dir === -1 && type.flippedImage && imageReady(type.flippedImage)) {
        // This type has its own picture for facing left, so it is drawn as is
        ctx.drawImage(images[type.flippedImage], e.x, e.y, e.w, e.h);
      } else {
        drawEnemyPicture(e, type, picture);
      }
      ctx.filter = "none";
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
  ctx.lineJoin = "round";   // rounded corners on the outline, so sharp letters like M don't grow spikes
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

// Space or Enter presses the main button on screen: Play on the title screen,
// and Continue on the death screen. Returns true if it pressed one.
function pressPrimaryButton() {
  const menuShown = document.getElementById("menu").classList.contains("visible");
  if (gameState === "intro" && menuShown) {
    document.getElementById("play-button").click();
    return true;
  }

  const continueButton = document.getElementById("continue-button");
  if (deathTimer > 0 && !continueButton.hidden) {
    continueButton.click();
    return true;
  }

  const winButton = document.getElementById("win-title-button");
  if (gameState === "win" && !winButton.hidden) {
    winButton.click();
    return true;
  }

  return false;
}

function setKey(code, isDown) {
  if (code === "ArrowLeft" || code === "KeyA") keys.left = isDown;
  if (code === "ArrowRight" || code === "KeyD") keys.right = isDown;
  if (code === "ArrowUp" || code === "KeyW") {
    keys.up = isDown;
    keys.jump = isDown;
  }
  if (code === "Space") keys.jump = isDown;
  if (code === "ArrowDown" || code === "KeyS") keys.down = isDown;
}

document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "Enter") && pressPrimaryButton()) {
    e.preventDefault();   // so the same key press doesn't also click the button again
    return;
  }
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

document.getElementById("play-button").addEventListener("click", () => startGame());
document.getElementById("continue-button").addEventListener("click", continueAfterDeath);
document.getElementById("title-button").addEventListener("click", returnToTitle);
document.getElementById("win-title-button").addEventListener("click", () => {
  setWinButtonVisible(false);
  returnToTitle();
});

// ---------- Game controllers (USB or Bluetooth, read by the browser) ----------
// The controller uses the browser's "standard" button layout:
// bottom face button (A on Xbox) = jump, left face button (X on Xbox) = attack,
// D-pad or left stick = walk, up = door, down = drop through a platform.
const padHeld = { left: false, right: false, up: false, down: false, jump: false };
let padAttackWasDown = false;

// The first controller the browser can see, or null
function findGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (pad && pad.connected) return pad;
  }
  return null;
}

// Turns off any keys the controller was holding (for example, when it is unplugged)
function releasePadKeys() {
  for (const action in padHeld) {
    if (padHeld[action]) {
      padHeld[action] = false;
      keys[action] = false;
    }
  }
}

// Reads the controller once per game step. Only changes are written to the keys,
// so the keyboard and touch controls keep working alongside it.
function pollGamepad() {
  const pad = findGamepad();
  if (!pad) {
    releasePadKeys();
    padAttackWasDown = false;
    return;
  }

  const pressed = (index) => Boolean(pad.buttons[index] && pad.buttons[index].pressed);
  const stickX = pad.axes[0] || 0;
  const stickY = pad.axes[1] || 0;
  const wanted = {
    left: stickX < -0.5 || pressed(14),
    right: stickX > 0.5 || pressed(15),
    up: stickY < -0.5 || pressed(12),
    down: stickY > 0.5 || pressed(13),
    jump: pressed(0)
  };

  for (const action in wanted) {
    if (wanted[action] !== padHeld[action]) {
      padHeld[action] = wanted[action];
      keys[action] = wanted[action];
    }
  }

  // Attack starts when the button goes down, not while it is held
  const attackDown = pressed(2);
  if (attackDown && !padAttackWasDown) {
    startAttack();
  }
  padAttackWasDown = attackDown;
}

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

  pollGamepad();

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

// ---------- Characters screen (opened from the title screen) ----------
// Add or change characters here. Use "Description coming soon." for placeholders.
const CHARACTERS = [
  {
    name: "KorbyKid",
    image: "assets/korbykid.png",
    description: "A little green square guy with a hat with a star on it. He is also the dude u play as. Wait, he kinda looks familiar, doesn't he?"
  },
  {
    name: "Jeremy",
    image: "assets/jeremy.png",
    description: "A little red octopus that doesn't do much. If u die to one, u suck at gaming."
  },
  {
    name: "Leap-O",
    image: "assets/leap-o.png",
    description: "A little tad-pole with wings. He likes to fly around biting people, that includes u."
  },
  {
    name: "Unidentified Flying I (UFI)",
    image: "assets/ufi.png",
    description: "A knockoff UFO :)"
  },
  {
    name: "Cloopy",
    image: "assets/cloopy.png",
    description: "A little orange lobster with a top-hat. He's pretty big, so be careful if u spot him."
  },
  {
    name: "KorbyKid Journey Gun",
    image: "assets/gun.png",
    description: "A gun :)"
  },
  {
    name: "Smooley",
    image: "assets/smooley.png",
    description: "A little face that flies and follows you around. Make sure to run away and stay near your device at all times otherwise you're dead."
  },
  {
    name: "Mr. Loodle",
    image: "assets/mr-loodle.png",
    description: "A little sun friend that just sits in the background. Hopefully he doesn't turn evil. (Foreshadowing)"
  },
  {
    name: "Evil Mr. Loodle",
    image: "assets/evil-mr-loodle.png",
    description: "Nah, i'm not giving u dis description. :)"
  },
  {
    name: "67",
    image: "assets/67.png",
    description: "Yells 67 in your ear constantly and annoys you, he can fall in holes. He doesn't kill you though. Jump in a hole twice in a row without taking damage to spawn him in."
  }
];

// ---------- Background darkness setting ----------
// 0 is normal brightness, 0.8 is very dark. Only the level backgrounds are darkened
// (not the title screen or the death screen). The choice is saved in the browser.
const SAVE_KEY_DARKNESS = "korbykid.backgroundDarkness";
const MAX_BACKGROUND_DARKNESS = 0.8;
let backgroundDarkness = 0;

function loadBackgroundDarkness() {
  try {
    const saved = parseFloat(localStorage.getItem(SAVE_KEY_DARKNESS));
    if (saved >= 0 && saved <= MAX_BACKGROUND_DARKNESS) backgroundDarkness = saved;
  } catch (err) {
    // Storage is blocked: just use the normal brightness
  }
}

function saveBackgroundDarkness() {
  try {
    localStorage.setItem(SAVE_KEY_DARKNESS, String(backgroundDarkness));
  } catch (err) {
    // Storage is blocked: the setting still works until the page is closed
  }
}

const darknessSlider = document.getElementById("darkness-slider");
darknessSlider.addEventListener("input", () => {
  backgroundDarkness = darknessSlider.value / 100;
  saveBackgroundDarkness();
});

// Builds the grid of character cards the first time the screen is opened
function renderCharacters() {
  const grid = document.getElementById("characters-grid");
  if (grid.childElementCount > 0) return;

  for (const character of CHARACTERS) {
    const card = document.createElement("div");
    card.className = "character-card";

    const picture = document.createElement("img");
    picture.src = character.image;
    picture.alt = character.name;
    // If the picture file is missing, leave a blank space instead of a broken picture
    picture.onerror = () => {
      picture.style.visibility = "hidden";
    };

    const name = document.createElement("h3");
    name.textContent = character.name;

    const description = document.createElement("p");
    description.textContent = character.description;

    card.append(picture, name, description);
    grid.appendChild(card);
  }
}

function openCharacters() {
  renderCharacters();
  document.getElementById("characters-screen").hidden = false;
}

function closeCharacters() {
  document.getElementById("characters-screen").hidden = true;
}

document.getElementById("characters-button").addEventListener("click", openCharacters);
const musicSlider = document.getElementById("music-slider");
const soundSlider = document.getElementById("sound-slider");
musicSlider.addEventListener("input", () => {
  musicVolume = Number(musicSlider.value);
  saveVolumeSettings();
  applyVolumeSettings();
});
soundSlider.addEventListener("input", () => {
  soundVolume = Number(soundSlider.value);
  saveVolumeSettings();
  applyVolumeSettings();
});
document.getElementById("characters-back-button").addEventListener("click", closeCharacters);

loadBackgroundDarkness();
darknessSlider.value = Math.round(backgroundDarkness * 100);

loadVolumeSettings();
musicSlider.value = musicVolume;
soundSlider.value = soundVolume;
applyVolumeSettings();

loadImages();
resetIntro();
resizeCanvas();
requestAnimationFrame(gameLoop);

// Development shortcut: add ?level=1, ?level=2 or ?level=3 to the page address
// to skip the title screen and start straight in that level.
// ?level=win jumps straight to the win screen (for testing). It stays up until the page is reloaded.
if (new URLSearchParams(window.location.search).get("level") === "win") {
  gameState = "win";
  winTimer = WIN_FRAMES;
  spawnConfetti();
  setMenuVisible(false);
  setWinButtonVisible(true);
  winPreview = true;
}

// ?level=0 (or leaving it out) shows the title screen as normal.
const levelParam = parseInt(new URLSearchParams(window.location.search).get("level"), 10);
if (levelParam >= 1 && levelParam <= LEVELS.length) {
  startGame(levelParam - 1);
}
