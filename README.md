# KorbyKid's Journey

A 2D platformer made with plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (double-click it, or drag it into a browser window).
2. Watch KorbyKid fly in on his scooter and crash land.
3. Click **Play**.

| Action | Keys |
| --- | --- |
| Walk left | Left arrow or A |
| Walk right | Right arrow or D |
| Jump | Space, Up arrow or W |
| Go through a door | Stand in the door and press Up arrow or W |

Jump on top of an enemy to squish it. Touching an enemy from the side, or falling into a pit, restarts the level.

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
| `scooter.png` | KorbyKid's scooter (intro) |
| `korbykid.png` | KorbyKid |
| `enemy.png` | Enemy |
| `platform.png` | Platform and ground tile |
| `door.png` | The door at the end of a level |
| `background1.png` | Level 1 background (The Mysterious Planet) |
| `background2.png` | Level 2 background (The Crystal Caves) |

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
