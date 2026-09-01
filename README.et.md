# SYNTH LAB

Veebis töötav süntesaator ja mitmerajaline komponeerimiskeskkond. Puhas HTML/CSS/JS,
heli mängib Web Audio API — **ehitussammu, raamistikke ja sõltuvusi pole**. Ava
`index.html` ja mängi.

*In English: [README.md](README.md)*

## Kiirkäivitus

```bash
cd projektikataloog
python3 -m http.server 8000    # või lihtsalt ava index.html topeltklõpsuga
```

Seejärel mine brauseris `http://localhost:8000`. Töötab Chromiumis, Firefoxis ja
teistes Web Audio't toetavates brauserites.

## Mis sees on

**Süntesaator**

- 2 ostsillaatorit (sine / saw / square / triangle / pulse), sub-ostsillaator, müra
- unison, glide, filter (LP/HP/BP + cutoff, resonance, envelope), 2 ADSR-i, 2 LFO-d
- efektid: drive, chorus, delay, reverb
- rajapõhine arpeggiaator (kiirus, muster, oktavid, gate)
- **41 tehasepatchi** 10 kategoorias: Basic, Keys, Bass, Lead, Pluck, Pad, Bell, Arp, FX, Drums

**Komponeerija**

- mitu rada, pianoroll, 1/16 samm ruudustik, 1–64 takti pikkune loop (120 bpm juures u 2 minutit)
- **16 demot**: Neon Drive, Deep Circuit, Glass Cathedral, Acid Rain, Sunset Boulevard,
  Cathedral Dust, Funk Machine, Pixel Garden, Steel Rain, Lullaby Box, Midnight Groove,
  Hyper Rush, Prelude in Amber, Orbital Pulse, Bossa Sunrise, Epic Dawn
- skaalalukk: 13 skaalat (chromatic, major, minor, harmMinor, melMinor, dorian,
  phrygian, lydian, mixolydian, majPent, minPent, blues, wholeTone) + automaatne snap
- undo/redo ja lõikelaud (kopeeri / lõika / kleebi / duplikeeri / vali kõik)
- klaviatuuri saab mängida hiirega või arvutiklaviatuurilt

**Eksport**

- **MIDI** — type 1, 480 PPQ, rada + juhtiv tempo rada
- **WAV** — 16-bit stereo 44,1 kHz, renderdatakse sama mootoriga mis mängib
- **.song.json** — laulu allalaadimine ja sisselugemine

Liides on **eesti ja inglise** keeles (315 tõlgitud teksti).

## Kiirklahvid

| Klahv | Tegevus |
|---|---|
| `Ctrl`+`S` | salvesta laul |
| `Ctrl`+`Z` / `Ctrl`+`Shift`+`Z` | undo / redo |
| `Ctrl`+`A` | vali kõik noodid |
| `Ctrl`+`C` / `X` / `V` / `D` | kopeeri / lõika / kleebi / duplikeeri |
| `Delete` / `Backspace` | kustuta valik |
| `Alt` + nooled | nihuta valikut |
| `Tühik` | sustain |
| `A W S E D F T G Y H U J K O L P ; ' ]` | mängi klaviatuuri (alates C) |
| `Esc` | pane menüü kinni |

## Kaustad

```
synth-lab/
├── index.html        rakendus
├── *.js, style.css   mootor, patchid, transport, pianoroll, demod, i18n, MIDI
├── json/             laulud (.song.json)   — MCP serveri tööala
├── midi/             MIDI eksport
├── wav/              WAV eksport
└── mcp/              MCP server (31 tööriista)
```

## MCP server

Kaustas `mcp/` on MCP server, millega tehisintellekt saab laule otse luua, muuta ja
renderdada — ilma brauserit avamata.

```bash
cd mcp
npm install
node server.js          # stdio transport
```

Kuidas see töötab:

- laulud elavad kettal `.song.json` failidena kataloogis `json/`
- redigeerimine, arpeggiaator, skaala-snap ja MIDI eksport jooksevad **Node'is**,
  laadides rakenduse enda `synth.js`, `presets.js`, `transport.js`, `examples.js` ja
  `midi.js` — sama kood, mis brauseris, nii et tulemus on identne
- **ainult** `render_wav` käivitab headless Chromiumi (`playwright-core`), sest
  heli süntees eksisteerib ainult lehes

Tööriistad: `list_songs`, `read_song`, `write_song`, `new_song`, `delete_song`,
`song_info`, `list_patches`, `get_patch`, `list_demos`, `use_demo`, `add_track`,
`remove_track`, `set_track_patch`, `get_notes`, `set_notes`, `add_notes`,
`clear_track`, `transpose`, `quantize`, `humanize`, `scale_snap`, `generate_arp`,
`generate_chords`, `generate_drums`, `set_arpeggiator`, `set_scale`, `set_tempo`,
`export_midi`, `render_wav`, `import_song`, `export_song`.

Keskkonnamuutujad (kõik valikulised): `SYNTHLAB_SONGS`, `SYNTHLAB_MIDI_DIR`,
`SYNTHLAB_WAV_DIR`, `SYNTHLAB_DIR`, `SYNTHLAB_CHROMIUM`.

Näidis `opencode.jsonc` jaoks:

```jsonc
"mcp": {
  "synth-lab": {
    "type": "local",
    "command": ["node", "/home/rk/projektid/synth-lab/mcp/server.js"],
    "enabled": true
  }
}
```

## Nõuded

- brauser (Web Audio) — rakenduse kasutamiseks
- Node 18+ — MCP serveri jaoks
- Chromium (`/usr/bin/chromium`) — ainult WAV renderdamiseks MCP kaudu
