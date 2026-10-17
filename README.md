# KorbyKid's Journey

A 2D platformer made with plain HTML, CSS and JavaScript.

## How to play

1. Open `index.html` in a web browser (double-click it, or drag it into a browser window). The game fits the window and keeps its shape when you resize it. On a phone or tablet, use the on-screen buttons at the bottom: the arrows walk, **Jump** jumps (and goes through a door), and **Attack** attacks.
2. Click **Play**. Mr. Loodle flies KorbyKid in and lands him at the start of the level. Click **Characters** on the title screen to see every character, with its name and description. The names and descriptions are in the `CHARACTERS` list near the bottom of `game.js`.

| Action | Keys |
| --- | --- |
| Walk left | Left arrow or A |
| Walk right | Right arrow or D |
| Jump | Space, Up arrow or W |
| Go through a door | Stand in the door and press Up arrow or W |
| Drop down through a platform | Down arrow or S, while standing on a platform (not the ground) |
| Attack (lasts 0.8 seconds) | Shift |

KorbyKid starts with 3 hearts (shown in the top left). Each hit costs one heart. He is pushed away from the enemy that hit him, and then flashes for a moment so he can't be hit again right away. Touching an enemy counts as a hit, even from above. Only attack mode destroys enemies. Falling into a hole costs a heart and sends him back to the start of the level. When he runs out of hearts, the death background shows until you press **Continue** (the level restarts with 3 hearts) or **Return to Title** (back to the title screen, starting again from level 1).

Platforms are one-way: jump up through them from below, and land on them when you fall down onto the top.

Press **Shift** to enter attack mode for 0.8 seconds. When an attack connects with an enemy, KorbyKid is pushed back a little, with a small hop, so he can recover. While attack mode is on, touching an enemy destroys it.

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
| `smooley.png` | Smooley, a flying face that follows KorbyKid around and tries to touch him. Attack mode destroys him. In level 2, a random number of them (1 to 5) is placed at random spots each time the level loads. The second half does not appear until 5 seconds after the level starts, and then arrives far to the right, near the end of the level |
| `gun.png` | KorbyKid Journey Gun, the level 3 gun on a platform. Used when it faces and fires right. Can be destroyed in attack mode |
| `gun-flipped.png` | The gun facing left, used when it fires left (drawn as is, not mirrored) |
| `bullet.png` | The gun's bullet. Flies in a straight line aimed at KorbyKid where he was when it was fired, turned to match its direction. It can be dodged, not attacked |
| `cloopy.png` | Cloopy, the level 2 gatekeeper for the portal (one copy, same size as UFI). Takes 5 hits and turns grey with each hit |
| `ufi.png` | UFI, the third normal enemy. Walks on the ground and is 3.3 times as big as the others |
| `evil-mr-loodle.png` | Evil Mr. Loodle, the final boss (boss fight comes later) |
| `heart.png` | A full heart (lives left) in the top left corner |
| `heart-empty.png` | An empty heart (lives lost) in the top left corner |
| `grass-platform.png` | Platform and ground tile for level 1 |
| `magma-platform.png` | Platform and ground tile for level 2 |
| `liquid-platform.png` | Platform and ground tile for level 3 |
| `portal.png` | The portal at the end of a level (KorbyKid goes through it) |
| `background1.png` | Level 1 background (The Mysterious Planet) |
| `background2.png` | Level 2 background (The Crystal Caves) |
| `background3.png` | Level 3 background |
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

## Game controllers

A USB or Bluetooth game controller works in a supported browser (Chrome or Edge work best). Some controllers need you to press a button on them once before the browser can see them.

| Controller | Action |
| --- | --- |
| Left stick or D-pad left/right | Walk |
| Left stick or D-pad up | Go through a door |
| Bottom face button (A on Xbox) | Jump |
| Left face button (X on Xbox) | Attack |
| Left stick or D-pad down | Drop down through a platform |

Controllers are read as the browser's standard layout, so on some controllers (such as the Switch Pro) the buttons may be in a different place. The keyboard and the on-screen buttons still work with a controller connected.

## Music

Each level plays its own music, looping, from the `music` folder: `level1.mp3`, `level2.mp3` and `level3.mp3`. The music starts when the level begins and stops when you return to the title screen. If a music file is missing, the game is simply silent. On the title screen, the **Music volume** slider sets the music level from 0 to 10.

## Sound effects

The `sounds` folder holds sound effects. `gun-shoot.mp3` plays each time the level 3 gun fires. `impact1.mp3` plays each time an enemy is hit, `korbykid-impact.mp3` plays when KorbyKid loses a life but survives, and `korbykid-death.mp3` plays when the death screen appears. The sound effects are controlled by their own slider on the title screen, separate from the music.

## Background darkness

On the title screen, the **Background darkness** slider darkens the level backgrounds (not the title or death screens) to make the characters easier to see. The setting is saved in your browser.

## Jumping straight to a level (for testing)

Add `?level=1`, `?level=2` or `?level=3` to the end of the page address to skip the title screen and start in that level. For example, `index.html?level=2`. Starting this way also saves that level as your progress.

## Tweaking how the game feels

The settings at the top of `game.js` (gravity, running speed, jump power, enemy speed) can be changed to make the game easier or harder.
