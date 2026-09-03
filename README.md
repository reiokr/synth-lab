# SYNTH LAB

A synthesizer and multitrack composition environment that runs in the browser.
Plain HTML/CSS/JS with sound from the Web Audio API — **no build step, no
frameworks, no dependencies**. Open `index.html` and play.

*Eesti keeles: [README.et.md](README.et.md)*

## Quick start

```bash
cd project-directory
node serve.js    # app + a tiny save API — songs land in json/ as .song.json
```

Then open `http://localhost:8000`. With this server, creating a project and
pressing Save (Ctrl+S) writes the `.song.json` file into `json/` on its own —
no export/import and no folder permissions. The app also works from any static
server (`python3 -m http.server 8000`) or straight from `index.html`; then
projects are kept in the browser unless you link a folder with the Folder
button (Chromium). Works in Chromium, Firefox and any other browser that
supports Web Audio.

## What's inside

**Synthesizer**

- 2 oscillators (sine / saw / square / triangle / pulse), sub oscillator, noise
- unison, glide, filter (LP/HP/BP with cutoff, resonance, envelope), 2 ADSRs, 2 LFOs
- effects: drive, chorus, delay, reverb
- per-track arpeggiator (rate, pattern, octaves, gate)
- **41 factory patches** in 10 categories: Basic, Keys, Bass, Lead, Pluck, Pad,
  Bell, Arp, FX, Drums

**Composer**

- multiple tracks, piano roll, 1/16 step grid, 1–64 bar loop (about two minutes at 120 bpm)
- **16 demos**: Neon Drive, Deep Circuit, Glass Cathedral, Acid Rain,
  Sunset Boulevard, Cathedral Dust, Funk Machine, Pixel Garden, Steel Rain,
  Lullaby Box, Midnight Groove, Hyper Rush, Prelude in Amber, Orbital Pulse,
  Bossa Sunrise, Epic Dawn
- scale lock: 13 scales (chromatic, major, minor, harmMinor, melMinor, dorian,
  phrygian, lydian, mixolydian, majPent, minPent, blues, wholeTone) with auto-snap
- undo/redo and clipboard (copy / cut / paste / duplicate / select all)
- play the keyboard with the mouse or the computer keyboard

**Export**

- **MIDI** — type 1, 480 PPQ, one track per part plus a leading tempo track
- **WAV** — 16-bit stereo, 44.1 kHz, rendered by the same engine that plays
- **.song.json** — download and re-load a song

**Projects**

- creating a project saves it right away — `Save` / `Ctrl`+`S` then just keeps
  the current one up to date
- **node serve.js** — run the app through `node serve.js` and every save
  writes the project's `.song.json` into the project's `json/` folder by
  itself (the songs in it appear under Open, and rename / duplicate / delete
  keep the files in sync). No permissions needed, works in every browser.
- **Folder** — alternatively link any folder on disk with the Folder button
  (Chromium): saving then writes the `.song.json` there. Without a server or a
  linked folder projects live in the browser's local storage, and the JSON
  export / import buttons still work.

The interface is in **English and Estonian** (330 translated strings).

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl`+`S` | save song |
| `Ctrl`+`Z` / `Ctrl`+`Shift`+`Z` | undo / redo |
| `Ctrl`+`A` | select all notes |
| `Ctrl`+`C` / `X` / `V` / `D` | copy / cut / paste / duplicate |
| `Delete` / `Backspace` | delete selection |
| `Alt` + arrows | nudge selection |
| `Space` | sustain |
| `A W S E D F T G Y H U J K O L P ; ' ]` | play the keyboard (from C) |
| `Esc` | close menu |

## Layout

```
synth-lab/
├── index.html        the app
├── *.js, style.css   engine, patches, transport, piano roll, demos, i18n, MIDI
├── json/             songs (.song.json)   — the MCP server's workspace
├── midi/             MIDI export
├── wav/              WAV export
└── mcp/              MCP server (31 tools)
```

## MCP server

The `mcp/` folder holds an MCP server that lets an AI create, edit and render
songs directly — without opening a browser.

```bash
cd mcp
npm install
node server.js          # stdio transport
```

How it works:

- songs live on disk as `.song.json` files in `json/`
- editing, the arpeggiator, scale snapping and MIDI export run in **Node**,
  loading the app's own `synth.js`, `presets.js`, `transport.js`, `examples.js`
  and `midi.js` — the same code the browser runs, so results are identical
- **only** `render_wav` starts headless Chromium (`playwright-core`), because
  audio synthesis exists inside the page

Tools: `list_songs`, `read_song`, `write_song`, `new_song`, `delete_song`,
`song_info`, `list_patches`, `get_patch`, `list_demos`, `use_demo`, `add_track`,
`remove_track`, `set_track_patch`, `get_notes`, `set_notes`, `add_notes`,
`clear_track`, `transpose`, `quantize`, `humanize`, `scale_snap`, `generate_arp`,
`generate_chords`, `generate_drums`, `set_arpeggiator`, `set_scale`, `set_tempo`,
`export_midi`, `render_wav`, `import_song`, `export_song`.

Environment variables (all optional): `SYNTHLAB_SONGS`, `SYNTHLAB_MIDI_DIR`,
`SYNTHLAB_WAV_DIR`, `SYNTHLAB_DIR`, `SYNTHLAB_CHROMIUM`.

Example for `opencode.jsonc`:

```jsonc
"mcp": {
  "synth-lab": {
    "type": "local",
    "command": ["node", "/home/rk/projektid/synth-lab/mcp/server.js"],
    "enabled": true
  }
}
```

## Requirements

- a browser with Web Audio — to use the app
- Node 18+ — for the MCP server
- Chromium (`/usr/bin/chromium`) — only for WAV rendering through MCP
