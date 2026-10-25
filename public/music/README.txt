LODESTONE music slots
=====================

Drop your tracks in this folder with these exact names:

  town.mp3     loops while you explore Steamhaven (starts after "press enter")
  finale.mp3   starts the moment the Lodestone lights up, keeps playing through the credits

The game checks for them on load. If a file is missing it just plays without music, no errors.
Players can press M to mute.

Tips:
- keep them loopable (no long silence at the end)
- -14 LUFS-ish is plenty loud; the game plays them at 45% volume
- .ogg works too if you change the file names in src/main.js (search for MUSIC)
