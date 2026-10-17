# KorbyKid's Journey

A 2D platformer made with plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (double-click it, or drag it into a browser window).
2. Click **Play**. Mr. Loodle flies KorbyKid in and lands him at the start of the level.

| Action | Keys |
| --- | --- |
| Walk left | Left arrow or A |
| Walk right | Right arrow or D |
| Jump | Space, Up arrow or W |
| Go through a door | Stand in the door and press Up arrow or W |
| Attack (lasts 2 seconds) | Shift |

KorbyKid starts with 3 hearts (shown in the top left). Each hit costs one heart. He is pushed away from the enemy that hit him, and then flashes for a moment so he can't be hit again right away. Landing directly on top of an enemy destroys it and bounces him up; touching one from the side counts as a hit. Falling into a hole costs a heart and sends him back to the start of the level. When he runs out of hearts, the death background shows until you press **Continue**, and then the level restarts with 3 hearts.

Platforms are one-way: jump up through them from below, and land on them when you fall down onto the top.

Press **Shift** to enter attack mode for two seconds. While attack mode is on, touching an enemy destroys it.

Progress is saved in the browser. When you come back, you start on the level you were on, with the hearts you had left.

For attack mode, add a picture named `korbykid_attack.png` to the `assets` folder. Until then, KorbyKid turns a darker orange.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page. Holds the canvas and the Play button. |
| `style.css` | How the page and the Play button look. |
| `game.js` | All the game code: intro, levels, movement, enemies, door. |
| `assets/` | Your PNG pictures (see the list below). |

## Art files

Put these PNG files in the `assets` folder with exactly these names. If a file is missing, the game draws a plain colored box in its place, so you can add art one piece at a time.

| File name | What it is |
| --- | --- |
| `intro_background.png` | Sky behind the intro animation |
| `korbykid.png` | KorbyKid |
| `korbykid-riding.png` | KorbyKid riding on Mr. Loodle while he flies in at the start of level 1 (one picture showing both) |
| `mr-loodle.png` | Mr. Loodle, the friendly flying ride (not an enemy). Used only as a placeholder until `korbykid-riding.png` exists |
| `korbykid_attack.png` | KorbyKid attacking (facing right; the game mirrors it when he faces left on the ground) |
| `korbykid-walking.png` | KorbyKid walking (facing right; the game mirrors it when he walks left) |
| `korbykid-death.png` | KorbyKid's hurt picture, shown for 1.5 seconds after a hit |
| `jeremy.png` | Jeremy, the level 1 enemy |
| `leap-o.png` | Leap-O, the level 2 flying enemy (flies in the air, ignores platforms) |
| `ufi.png` | The third normal enemy, UFI |
| `evil-mr-loodle.png` | Evil Mr. Loodle, the final boss (boss fight comes later) |
| `heart.png` | A full heart (lives left) in the top left corner |
| `heart-empty.png` | An empty heart (lives lost) in the top left corner |
| `grass-platform.png` | Platform and ground tile for level 1 |
| `magma-platform.png` | Platform and ground tile for level 2 |
| `liquid-platform.png` | Platform and ground tile for level 3 (not built yet) |
| `door.png` | The door at the end of a level |
| `background1.png` | Level 1 background (The Mysterious Planet) |
| `background2.png` | Level 2 background (The Crystal Caves) |
| `background3.png` | Level 3 background (not built yet) |
| `death_background.png` | Full-screen picture shown on the death screen |

## Changing or adding levels

Levels are listed in the `LEVELS` array near the top of `game.js`. Each level has:

- `name`: the title shown at the start of the level
- `background`: which background image to use
- `width`: how wide the level is, in pixels (the screen is 960 pixels wide)
- `start`: where KorbyKid starts
- `platforms`: a list of `{ x, y, w, h }` boxes. `y` goes down the screen, so bigger numbers are lower. The ground is at `y: 500`.
- `enemies`: a list of enemies. Each one walks between `minX` and `maxX`.
- `door`: where the door is

To add a level, copy one of the existing levels, change the numbers, and add it to the list.

## Tweaking how the game feels

The settings at the top of `game.js` (gravity, running speed, jump power, enemy speed) can be changed to make the game easier or harder.
