# Fingerstyle Trainer

A browser app for learning fingerstyle guitar songs. Load a tab, press play, and an animated
fretboard shows every note as it sounds: where each fretting finger goes, which picking finger
(p, i, m, a) plucks it, and which chord shape you are still holding.

## Features

- **Song view**: tab and standard notation scroll with playback, with the fretboard on top.
- **Fingering**: finger numbers and p-i-m-a marks come from the file when it has them. When it
  doesn't, the app suggests them (shown with a dashed outline). Click any note to change it, and
  your edits are saved per song.
- **Practice tools**: 25% to 150% speed, bar loops you can name and save, click track, count-in.
- **Listen while I play** (microphone):
  - *Check me* marks every note on time, late or missed, with a colour per bar (click a bar to loop it).
  - *Wait for me* pauses on each note until you play it.
  - The song is muted while listening so the mic hears only you (untick it if you use headphones).
- **Speed trainer**: loops your bars from 60% and adds 5% after each pass with 90% of notes right.
- **Capo and tunings**: the fretboard draws the capo and shows where your hand really goes.
- **Note finder**: the app names a note (or plays one for ear training), you play it, and the
  microphone checks it. Notes you miss come up more often.
- **Tuner and metronome**.
- **Library**: import Guitar Pro (.gp, .gpx, .gp5, .gp4, .gp3), MusicXML or a plain text tab.
  Songs are stored in your browser (IndexedDB) and never uploaded. The app ships only with
  original exercises; bring tabs you own for copyrighted songs.

## Running it

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # production build in dist/
```

The microphone features need a secure page: `localhost` or HTTPS.

## How it fits together

| Part | Where |
| --- | --- |
| Score rendering and playback | [alphaTab](https://www.alphatab.net/) in `src/components/Practice.tsx` |
| Fretboard | `src/components/Fretboard.tsx` (SVG) |
| Fingering suggestions | `src/music/fingering.ts` |
| Text tab importer | `src/import/asciiTab.ts` (converts to alphaTex) |
| Pitch detection | `src/audio/pitch.ts` (pitchy, McLeod pitch method) |
| Note checking while playing | `src/check/` (spectrum onsets, works with several strings ringing) |
| Note finder quiz | `src/quiz/` |
| Library storage | `src/library/db.ts` (Dexie) |
| Built-in studies | `src/studies/studies.ts` |
