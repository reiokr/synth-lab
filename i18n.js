/* SYNTH LAB — translations (English / Eesti) */
(function (global) {
  'use strict';

  const LANGS = ['en', 'et'];

  /* ------------------------------------------- short labels (rack panels) */
  const LBL = {
    pOsc1: { en: 'OSC 1', et: 'OSC 1' },
    pOsc2: { en: 'OSC 2', et: 'OSC 2' },
    pMix: { en: 'MIX', et: 'MIKS' },
    pUnison: { en: 'UNISON', et: 'UNISON' },
    pFilter: { en: 'FILTER', et: 'FILTER' },
    pFiltEnv: { en: 'FILTER ENV', et: 'FILTRI ÜMBRIK' },
    pAmpEnv: { en: 'AMP ENV', et: 'VALJUSE ÜMBRIK' },
    pLfo1: { en: 'LFO 1', et: 'LFO 1' },
    pLfo2: { en: 'LFO 2', et: 'LFO 2' },
    pDrive: { en: 'DRIVE', et: 'MOONUTUS' },
    pChorus: { en: 'CHORUS', et: 'CHORUS' },
    pDelay: { en: 'DELAY', et: 'KAJA' },
    pReverb: { en: 'REVERB', et: 'JÄRELKÕLA' },
    pArp: { en: 'ARPEGGIATOR', et: 'ARPEGGIAATOR' },
    pMaster: { en: 'MASTER', et: 'MASTER' },

    wave: { en: 'Wave', et: 'Laine' },
    octave: { en: 'Octave', et: 'Oktav' },
    semi: { en: 'Semi', et: 'Poolt.' },
    detune: { en: 'Detune', et: 'Häälestus' },
    level: { en: 'Level', et: 'Tase' },
    subLevel: { en: 'Sub', et: 'Sub' },
    subOctave: { en: 'Sub Oct', et: 'Sub okt' },
    noise: { en: 'Noise', et: 'Müra' },
    glide: { en: 'Glide', et: 'Glide' },
    unisonVoices: { en: 'Voices', et: 'Hääli' },
    width: { en: 'Width', et: 'Laius' },
    filterType: { en: 'Type', et: 'Tüüp' },
    cutoff: { en: 'Cutoff', et: 'Piirsag.' },
    reso: { en: 'Reso', et: 'Resonants' },
    keytrack: { en: 'Key Trk', et: 'Noodijälg' },
    envAmt: { en: 'Env Amt', et: 'Ümbrik' },
    attack: { en: 'Attack', et: 'Attack' },
    decay: { en: 'Decay', et: 'Decay' },
    sustain: { en: 'Sustain', et: 'Sustain' },
    release: { en: 'Release', et: 'Release' },
    target: { en: 'Target', et: 'Sihtmärk' },
    rate: { en: 'Rate', et: 'Kiirus' },
    depth: { en: 'Depth', et: 'Sügavus' },
    amount: { en: 'Amount', et: 'Hulk' },
    tone: { en: 'Tone', et: 'Toon' },
    mix: { en: 'Mix', et: 'Tasakaal' },
    time: { en: 'Time', et: 'Aeg' },
    feedback: { en: 'Fdbk', et: 'Tagasid.' },
    size: { en: 'Size', et: 'Suurus' },
    arpOn: { en: 'Arp', et: 'Arp' },
    pattern: { en: 'Pattern', et: 'Muster' },
    octaves: { en: 'Octaves', et: 'Oktavid' },
    gate: { en: 'Gate', et: 'Gate' },
    volume: { en: 'Volume', et: 'Valjus' },
    poly: { en: 'Poly', et: 'Polüfoonia' }
  };

  /* ---------------------------------------------------------------- chrome */
  const UI = {
    appName: { en: 'SYNTH LAB', et: 'SYNTH LAB' },
    appTagline: { en: 'patch & composition environment', et: 'heli ja kompositsiooni keskkond' },

    tabCompose: { en: 'Compose', et: 'Loo' },
    tabPatch: { en: 'Patch', et: 'Heli' },
    tabHelp: { en: 'Help', et: 'Abi' },

    new: { en: 'New', et: 'Uus' },
    open: { en: 'Open', et: 'Ava' },
    save: { en: 'Save', et: 'Salvesta' },
    saveAs: { en: 'Save As', et: 'Salvesta kui' },
    exportWav: { en: '▶ WAV', et: '▶ WAV' },
    exportJson: { en: 'JSON', et: 'JSON' },
    exportMidi: { en: 'MIDI', et: 'MIDI' },
    import: { en: 'Import', et: 'Too sisse' },
    panic: { en: 'PANIC', et: 'PANIC' },

    play: { en: 'Play', et: 'Mängi' },
    stop: { en: 'Stop', et: 'Peata' },
    record: { en: 'Record', et: 'Salvesta' },
    bpm: { en: 'BPM', et: 'BPM' },
    swing: { en: 'Swing', et: 'Swing' },
    bars: { en: 'Bars', et: 'Takti' },
    master: { en: 'Master', et: 'Master' },
    key: { en: 'Key', et: 'Helistik' },
    snap: { en: 'snap', et: 'haagi' },
    addTrack: { en: '+ Track', et: '+ Rada' },
    zoomOut: { en: 'Zoom out', et: 'Vähenda' },
    zoomIn: { en: 'Zoom in', et: 'Suurenda' },
    shortcuts: { en: 'Shortcuts', et: 'Kiirklahvid' },

    selAll: { en: 'Select all', et: 'Vali kõik' },
    copy: { en: 'Copy', et: 'Kopeeri' },
    cut: { en: 'Cut', et: 'Lõika' },
    paste: { en: 'Paste', et: 'Kleebi' },
    pasteHere: { en: 'Paste here', et: 'Kleebi siia' },
    duplicate: { en: 'Duplicate', et: 'Duplikaat' },
    delete: { en: 'Delete', et: 'Kustuta' },
    clear: { en: 'Clear', et: 'Puhasta' },
    undo: { en: '↶ Undo', et: '↶ Tagasi' },
    redo: { en: '↷ Redo', et: '↷ Edasi' },
    draw: { en: 'Draw', et: 'Joonista' },
    select: { en: 'Select', et: 'Vali' },

    tracks: { en: 'Tracks', et: 'Rajad' },
    showAll: { en: 'All', et: 'Kõik' },
    showSel: { en: 'Sel', et: 'Valik' },
    tracksHint: {
      en: 'checkbox = draw on the roll · click a row to edit it · right-click the roll for Paste here',
      et: 'märkeruut = joonista rullile · klõpsi rida, et seda muuta · paremklõps rullil = Kleebi siia'
    },
    noTracks: { en: 'no tracks — press "+ Track"', et: 'radu pole — vajuta "+ Rada"' },
    rename: { en: 'Rename', et: 'Nimeta ümber' },
    del: { en: 'Del', et: 'Kust' },
    sustain: { en: 'Sustain', et: 'Pedaaal' },
    editing: { en: 'editing: ', et: 'muudan: ' },

    voices: { en: 'voices', et: 'häält' },
    voice: { en: 'voice', et: 'hääl' },
    noSelection: { en: 'no selection', et: 'valik puudub' },
    notes: { en: 'notes', et: 'nooti' },
    note: { en: 'note', et: 'noot' },
    steps: { en: 'steps', et: 'sammu' },
    pasteAt: { en: 'paste @ ', et: 'kleebi @ ' },

    projectsTitle: { en: 'Projects', et: 'Projektid' },
    saved: { en: 'Saved', et: 'Salvestatud' },
    examples: { en: 'Examples', et: 'Näidised' },
    openAction: { en: 'Open', et: 'Ava' },
    renameAction: { en: 'Rename', et: 'Nimeta ümber' },
    dupAction: { en: 'Duplicate', et: 'Duplikaat' },
    delAction: { en: 'Delete', et: 'Kustuta' },
    newNamePh: { en: 'New project name', et: 'Uue projekti nimi' },
    tplBlank: { en: 'Blank — 1 empty track', et: 'Tühi — 1 tühi rada' },
    tplEmpty: { en: 'Empty — no tracks', et: 'Tühi — radu pole' },
    tplCopy: { en: 'Copy of current project', et: 'Koopia praegusest projektist' },
    create: { en: 'Create', et: 'Loo' },
    importJsonBtn: { en: 'Import JSON…', et: 'Too JSON…' },
    close: { en: 'Close', et: 'Sulge' },

    patchBank: { en: '— bank', et: '— pank' },
    random: { en: 'Random', et: 'Juhuslik' },
    init: { en: 'Init', et: 'Algus' },
    export: { en: 'Export', et: 'Ekspordi' },
    store: { en: 'Store', et: 'Salvesta' },

    signalPath: { en: 'Signal path', et: 'Signaalitee' },
    zoom: { en: 'Zoom', et: 'Suum' },
    semiUp: { en: 'Up a semitone', et: 'Pooltoon üles' },
    semiDown: { en: 'Down a semitone', et: 'Pooltoon alla' },
    octUp: { en: 'Up an octave', et: 'Oktav üles' },
    octDown: { en: 'Down an octave', et: 'Oktav alla' },
    playTip: { en: 'Play / Stop', et: 'Mängi / Peata' },
    language: { en: 'Language', et: 'Keel' },

    showInRoll: { en: 'Show in roll', et: 'Näita rullil' },
    showInRollTip: { en: "Draw this track's notes on the piano roll. Any number of tracks can be shown at once.", et: 'Joonista selle raja noodid rullile. Korraga võib näha suvalist arvu radu.' },
    trackRowTip: { en: 'Click the row to select it — its patch then loads in the Patch tab, and its notes become editable in the roll.', et: 'Rida klõpsates valid selle — selle heli laetakse Heli vahekaardile ja noodid muutuvad rullil muudetavaks.' },
    trackNameTip: { en: 'Rename this track.', et: 'Nimeta see rada ümber.' },
    patchTip: { en: 'Swap the sound on this track without touching its notes.', et: 'Vaheta selle raja kõla ilma noote puudutamata.' },
    muteTip: { en: 'Silence this track. Handy for auditioning a part.', et: 'Vaigista see rada. Hea üksiku partiid kuulamiseks.' },
    soloTip: { en: 'Play only the soloed tracks.', et: 'Mängib ainult soolatud radu.' },
    volTip: { en: 'Level of this track into the song master fader.', et: 'Selle raja tase laulu master-nupuni.' },
    delTrackTip: { en: 'Remove this track and all of its notes.', et: 'Eemalda see rada ja kõik selle noodid.' },

    tabComposeTip: { en: 'Tracks, piano roll and transport. Write and arrange here.', et: 'Rajad, noodirull ja transport. Siin sa kirjutad ja sead.' },
    tabPatchTip: { en: 'The sound-design rack for the selected track: oscillators, filter, envelopes, LFOs, arpeggiator and effects.', et: 'Valitud raja heli töölaud: ostsillaatorid, filter, ümbrikud, LFO-d, arpeggiaator ja efektid.' },
    tabHelpTip: { en: 'How everything works, plus every keyboard shortcut.', et: 'Kuidas kõik töötab, koos kõigi kiirklahvidega.' },
    btnNewTip: { en: 'Start a blank project: 120 bpm, 2 bars, one empty track. Unsaved changes are confirmed first.', et: 'Alusta tühja projekti: 120 bpm, 2 takti, üks tühi rada. Salvestamata muudatused küsitakse esmalt üle.' },
    btnOpenTip: { en: 'Saved projects and the built-in demos, with rename, duplicate and delete.', et: 'Salvestatud projektid ja sisseehitatud näidised, koos ümbernimetamise, dubleerimise ja kustutamisega.' },
    dirtyDotTip: { en: 'This project has been edited since it was last saved. Press Save or Ctrl+S.', et: 'Seda projekti on pärast viimast salvestamist muudetud. Vajuta Salvesta või Ctrl+S.' },
    btnSongSaveTip: { en: 'Save under the current name. Shortcut: Ctrl/Cmd+S.', et: 'Salvesta praeguse nime all. Kiirklahv: Ctrl/Cmd+S.' },
    btnSongSaveAsTip: { en: 'Save a copy under a different name.', et: 'Salvesta koopia teise nime all.' },
    btnWavTip: { en: 'Render the whole loop offline, tails included, and download it as a 16-bit stereo WAV.', et: 'Renderda kogu loop (ka sabad) ja laadi alla 16-bitine stereo WAV.' },
    btnSongJsonTip: { en: 'Save the project (notes, patches and mixer) as a .song.json file you can re-import or share.', et: 'Salvesta projekt (noodid, helid ja mikser) .song.json failina, mida saad uuesti sisse lugeda või jagada.' },
    btnSongMidiTip: { en: 'Write a standard .mid file: one MIDI track per project track, with tempo, time signature and track names. Drag it into any DAW.', et: 'Kirjuta .mid fail: iga projektirada on oma MIDI-rada, kaasas tempo, taktimõõt ja rajanimed. Lohista see ükskõik millisesse DAW-sse.' },
    btnSongImportTip: { en: 'Load a project from a .song.json file.', et: 'Laadi projekt .song.json failist.' },
    btnPanicTip: { en: 'Silence every sounding voice immediately.', et: 'Vaigista kohe kõik kõlavad hääled.' },
    btnRecTip: { en: 'While playing, notes you hit on the keyboard or MIDI are written into the selected track at the playhead.', et: 'Mängimise ajal kirjutatakse klaviatuuril või MIDI-s mängitud noodid mängupea juures valitud rajale.' },
    stepReadoutTip: { en: 'Current position, shown as bar:beat within the loop.', et: 'Praegune positsioon, kujul takt:löök.' },
    bpmTip: { en: 'Speed in beats per minute. Takes effect immediately, even while playing.', et: 'Kiirus lööki minutis. Mõjub kohe, ka mängimise ajal.' },
    swingTip: { en: 'Pushes every second 16th note late, for a shuffle feel. 0 is perfectly even.', et: 'Lükkab iga teist 16-ndikku hiljaks, et saada shuffle-tunnetus. 0 on täiesti ühtlane.' },
    barsTip: { en: 'How many bars the loop runs before repeating. One bar is 16 steps.', et: 'Mitu takti loop enne kordamist jookseb. Üks takt on 16 sammu.' },
    keyTip: { en: 'Lock notes to a key. Scale rows are shaded on the roll; with Snap on, anything you draw or play is pulled to the nearest note in the scale.', et: 'Lukusta noodid helistikku. Helistiku read on rullil varjutatud; snap sees tõmmatakse kõik, mida joonistad või mängid, lähimasse helistikunooti.' },
    masterTip: { en: 'Song output level, after every track fader. Also what the WAV export uses.', et: 'Laulu väljundi tase pärast kõiki raja faudereid. Sama kasutab WAV-eksport.' },
    btnAddTrackTip: { en: 'Create another track with its own patch, so parts can be layered.', et: 'Loo veel üks rada oma heliga, et saaksid osasid kihistada.' },
    zoomOutTip: { en: 'Make the piano roll steps narrower.', et: 'Tee noodirulli sammud kitsamaks.' },
    zoomInTip: { en: 'Make the piano roll steps wider, for precise editing.', et: 'Tee noodirulli sammud laiemaks, täpseks muutmiseks.' },
    patchTrackTip: { en: 'Which track these controls are editing. Select a different track in the Compose tab.', et: 'Millist rada need nupud parajasti muudavad. Vali teine rada Loo vahekaardil.' },
    btnSaveTip: { en: 'Save this sound to the patch bank, so other tracks can load it.', et: 'Salvesta see heli panka, et teised rajad saaksid seda laadida.' },
    btnSaveAsTip2: { en: 'Save this sound under a new name.', et: 'Salvesta see heli uue nime all.' },
    btnDeleteTip: { en: 'Remove the saved patch with this name from the bank.', et: 'Eemalda selle nimega salvestatud heli pangast.' },
    slotTip: { en: 'Compare slot: click to recall, Store to capture the sound you are hearing now.', et: 'Võrdluspesa: klõps meenutab, Salvesta püüab praegu kõlava heli.' },
    btnRandomTip: { en: 'Generate a random patch within musical bounds. A fast way to find something new.', et: 'Tekita juhuslik heli, mis on musikaalselt mõistlik. Kiireim viis uue kõla leidmiseks.' },
    btnInitTip: { en: "Reset this track's patch to the neutral starting sound.", et: 'Taasta selle raja heli algseadetele.' },
    btnExportTip: { en: 'Download this patch on its own as a .synthlab.json file.', et: 'Laadi see heli eraldi alla .synthlab.json failina.' },
    btnImportTip: { en: 'Load a patch file onto the selected track. A file holding several patches adds them all to the bank.', et: 'Laadi helifail valitud rajale. Mitut heli sisaldav fail lisab kõik panka.' },
    showAllTip: { en: 'Draw every track\'s notes on the roll at once.', et: 'Joonista kõigi rade noodid korraga rullile.' },
    showSelTip: { en: 'Hide every track except the one you are editing.', et: 'Peida kõik rajad peale selle, mida parajasti muudad.' },
    btnUndoTip: { en: 'Undo the last note edit: a paste, delete, move, resize or transpose. Shortcut: Ctrl+Z.', et: 'Võta viimane noodimuudatus tagasi: kleepimine, kustutamine, liigutamine, suuruse muutmine või transponeerimine. Kiirklahv: Ctrl+Z.' },
    btnRedoTip: { en: 'Redo what you just undid. Shortcut: Ctrl+Shift+Z or Ctrl+Y.', et: 'Võta tagasivõtt uuesti edasi. Kiirklahv: Ctrl+Shift+Z või Ctrl+Y.' },
    btnClearTip: { en: 'Finish the copy step: clears the selection, the amber paste cursor and the copied notes, then returns to Draw mode. Shortcut: Esc.', et: 'Lõpeta kopeerimine: tühista valik, merevaigu kursor ja kopeeritud noodid ning naase Joonista režiimi. Kiirklahv: Esc.' },
    drawTip: { en: 'Pencil: click empty space to write a note, drag to set its length.', et: 'Pliiats: klõps tühjal kohal kirjutab noodi, lohistamine määrab pikkuse.' },
    selectTip: { en: 'Drag to select, click empty space to move the paste cursor. Click Draw again to write notes.', et: 'Lohistamine valib, klõps tühjal kohal liigutab kleepimiskursorit. Joonistamiseks klõpsa uuesti Joonista.' },
    pdNewNameTip: { en: 'Name for the project you are about to create.', et: 'Selle projekti nimi, mida looma hakkad.' },
    pdTemplateTip: { en: 'What the new project starts with: one empty track, no tracks at all, or a copy of what is open.', et: 'Millega uus projekt algab: üks tühi rada, üldse radu pole või koopia avatud projektist.' },
    pdCreateTip: { en: 'Create the project and start editing it.', et: 'Loo projekt ja alusta muutmist.' },
    langTip: { en: 'Switch the interface language.', et: 'Vaheta liidese keelt.' },
    helpChipTip: {
      en: 'Piano roll: click to add a note · drag its right edge to resize · drag the body to move · alt-click or right-click to delete · Delete removes the hovered note\nKnobs: drag to change · shift-drag is fine · wheel nudges · double-click resets\nPlay: a w s e d f t g y h u j k · space holds sustain\nMouse: drag across the keyboard for glissando · MIDI in plays the selected track\nProject: Ctrl/Cmd+S saves · Esc closes dialogs',
      et: 'Noodirull: klõps lisab noodi · lohista paremat serva pikkuseks · lohista keha liigutamiseks · Alt- või paremklõps kustutab · Delete kustutab noodi kursori all\nNupud: lohistamine muudab · shift on täpne · ratas nihutab · topeltklõps taastab\nMäng: a w s e d f t g y h u j k · tühik hoiab pedaali\nHiir: lohista üle klaviatuuri, et saada glissando · MIDI mängib valitud rada\nProjekt: Ctrl/Cmd+S salvestab · Esc sulgeb dialoogid'
    },

    canvasDrawTip: { en: 'Draw mode: click empty space to write a note, drag to set its length. Right-click or alt-click a note to delete it; right-click empty space for the menu.', et: 'Joonista režiim: klõps tühjal kohal lisab noodi, lohistamine määrab pikkuse. Paremklõps või Alt-klõps kustutab noodi; paremklõps tühjal kohal avab menüü.' },
    canvasSelectTip: { en: 'Select mode: drag to select, click empty space to move the paste cursor. Click Draw to write notes.', et: 'Vali režiim: lohistamine valib, klõps tühjal kohal liigutab kleepimiskursorit. Joonistamiseks klõpsa Joonista.' },
    midiTip: { en: 'Web MIDI input status. Notes play the selected track, CC1 is the mod wheel, pitch bend is ±2 semitones.', et: 'Veebi-MIDI sisendi olek. Noodid mängivad valitud rada, CC1 on mod-ratas, pitch bend on ±2 pooltooni.' },
    voicesTip: { en: 'Notes currently sounding across every track.', et: 'Noodid, mis praegu kõlavad kõigil radadel.' },
    patchNameTip: { en: 'Name of the sound on the selected track. Save it to reuse it on other tracks.', et: 'Valitud raja heli nimi. Salvesta see, et kasutada teistel radadel.' },
    bankTip: { en: 'Load a factory or saved patch onto the selected track. Its notes are untouched.', et: 'Laadi tehase või salvestatud heli valitud rajale. Noodid jäävad puutumata.' },
    storeTip: { en: 'Capture the current sound into the active A/B slot, so you can flip back to it.', et: 'Salvesta praegune kõla aktiivsesse A/B pessa, et saaksid selle juurde tagasi pöörduda.' },
    projectNameTip: { en: 'Name of the project you are editing. An amber dot means it has unsaved changes.', et: 'Muudetava projekti nimi. Merevaigu täpp tähendab salvestamata muudatusi.' }
  };

  /* -------------------------------------------------------------- messages */
  const MSG = {
    savedProject: { en: 'saved project "', et: 'projekt salvestatud: "' },
    loaded: { en: 'loaded "', et: 'laetud: "' },
    newProject: { en: 'new project "', et: 'uus projekt: "' },
    exportedWav: { en: 'exported ', et: 'eksporditud ' },
    exportedJson: { en: 'exported song JSON', et: 'laulu JSON eksporditud' },
    exportedMidi: { en: 'exported MIDI — ', et: 'MIDI eksporditud — ' },
    tracksWord: { en: ' tracks, ', et: ' rada, ' },
    bpmWord: { en: ' bpm', et: ' bpm' },
    copied: { en: 'copied ', et: 'kopeeritud ' },
    cutMsg: { en: 'cut ', et: 'lõigatud ' },
    pasteHint: { en: ' notes — click the roll to choose a spot, then Paste', et: ' nooti — klõpsi rullil kohta, siis Kleebi' },
    pastedAt: { en: 'pasted ', et: 'kleepitud ' },
    nextPaste: { en: ' — next Paste lands at ', et: ' — järgmine Kleebi läheb ' },
    duplicatedAt: { en: 'duplicated ', et: 'dubleeritud ' },
    deleted: { en: 'deleted ', et: 'kustutatud ' },
    clipboardEmpty: { en: 'clipboard is empty — select notes and press Copy first', et: 'lõikelaud on tühi — vali noodid ja vajuta Kopeeri' },
    nothingSelected: { en: 'nothing selected — drag with shift, or press Ctrl+A', et: 'midagi pole valitud — lohista shiftiga või vajuta Ctrl+A' },
    noNotes: { en: 'this track has no notes', et: 'sel rajal pole noote' },
    nothingUndo: { en: 'nothing to undo', et: 'pole midagi tagasi võtta' },
    nothingRedo: { en: 'nothing to redo', et: 'pole midagi edasi võtta' },
    undoLeft: { en: 'undo — ', et: 'tagasi — ' },
    redoLeft: { en: 'redo — ', et: 'edasi — ' },
    moreLeft: { en: ' more', et: ' veel' },
    cleared: { en: 'cleared selection, paste cursor and clipboard — Draw mode', et: 'valik, kursor ja lõikelaud puhastatud — Joonista režiim' },
    allNotesOff: { en: 'all notes off', et: 'kõik noodid maha' },
    atLeastOneTrack: { en: 'at least one track must be shown', et: 'vähemalt üks rada peab näha olema' },
    showingAll: { en: 'showing all ', et: 'näitan kõiki: ' },
    showingSelOnly: { en: 'showing the selected track only', et: 'näitan ainult valitud rada' },
    importFailed: { en: 'import failed: bad JSON', et: 'sissevedu ebaõnnestus: vigane JSON' },
    importedPatches: { en: 'imported ', et: 'sisse toodud ' },
    patchesWord: { en: ' patches', et: ' heli' },
    renderFailed: { en: 'render failed: ', et: 'renderdamine ebaõnnestus: ' },
    noUserPatch: { en: 'no user patch named "', et: 'selle nimega salvestatud heli pole: "' },
    noSavedSong: { en: 'no saved song named "', et: 'selle nimega salvestatud laulu pole: "' },
    nameExists: { en: 'a project named "', et: 'projekt nimega "' },
    nameExists2: { en: '" already exists', et: '" on juba olemas' },
    deleteTrackQ: { en: 'Delete track "', et: 'Kustuta rada "' },
    deleteProjectQ: { en: 'Delete project "', et: 'Kustuta projekt "' },
    deletePatchQ: { en: 'Delete "', et: 'Kustuta "' },
    overwriteSongQ: { en: 'Overwrite project "', et: 'Kirjuta projekt üle: "' },
    overwritePatchQ: { en: 'Overwrite "', et: 'Kirjuta üle: "' },
    discardQ: { en: 'Discard unsaved changes to "', et: 'Kas jätan salvestamata muudatused projektis "' },
    andOpen: { en: '" and open "', et: '" ja avan "' },
    andNew: { en: '" and start a new project?', et: '" ning alustan uut projekti?' },
    questionMark: { en: '"?', et: '"?' },
    savedPatch: { en: 'saved "', et: 'salvestatud: "' },
    deletedWord: { en: 'deleted "', et: 'kustutatud: "' },
    renamedTo: { en: 'renamed to "', et: 'uus nimi: "' },
    duplicatedAs: { en: 'duplicated as "', et: 'duplikaat nimega "' },
    loadedPatch: { en: 'loaded ', et: 'laetud ' },
    patchToTrack: { en: ' → ', et: ' → ' },
    voicesFmt: { en: ' voices', et: ' häält' }
  };

  /* ------------------------------------- tooltips for parameters, by path */
  const TIPS = {
    'osc1.type': { en: 'Waveform: sine is pure, triangle soft, sawtooth bright, square hollow.', et: 'Lainekuju: sine on puhas, triangle pehme, sawtooth ere, square õõnes.' },
    'osc1.octave': { en: 'Transposes oscillator 1 up or down in whole octaves.', et: 'Nihutab ostsillaatorit 1 terves oktavites üles või alla.' },
    'osc1.semi': { en: 'Transposition in semitones. Stack a fifth (+7) for a power chord.', et: 'Nihe pooltoonides. Lisa kvint (+7), et saada kvindikõla.' },
    'osc1.detune': { en: 'Offset in cents (100 cents = 1 semitone). Detune against osc 2 for width.', et: 'Nihe sentides (100 senti = 1 pooltoon). Häälesta osc 2 suhtes valesti, et saada laiust.' },
    'osc1.level': { en: 'How much oscillator 1 feeds the filter.', et: 'Kui palju ostsillaator 1 filtrisse annab.' },
    'osc2.type': { en: 'Waveform: sine is pure, triangle soft, sawtooth bright, square hollow.', et: 'Lainekuju: sine on puhas, triangle pehme, sawtooth ere, square õõnes.' },
    'osc2.octave': { en: 'Transposes oscillator 2 up or down in whole octaves.', et: 'Nihutab ostsillaatorit 2 terves oktavites üles või alla.' },
    'osc2.semi': { en: 'Transposition in semitones. Stack a fifth (+7) for a power chord.', et: 'Nihe pooltoonides. Lisa kvint (+7), et saada kvindikõla.' },
    'osc2.detune': { en: 'Offset in cents (100 cents = 1 semitone). Detune against osc 1 for width.', et: 'Nihe sentides (100 senti = 1 pooltoon). Häälesta osc 1 suhtes valesti, et saada laiust.' },
    'osc2.level': { en: 'How much oscillator 2 feeds the filter.', et: 'Kui palju ostsillaator 2 filtrisse annab.' },
    'sub.level': { en: 'A sine below the played note. Adds weight without muddying the mids.', et: 'Siinus mängitavast noodist allpool. Lisab raskust ilma keskosasid segamata.' },
    'sub.octave': { en: 'How many octaves below the played note the sub sine sits.', et: 'Mitu oktavit allpool mängitavat nooti sub-siinus asub.' },
    'noise.level': { en: 'Band-passed white noise: air, breath, hats and percussion.', et: 'Ribafiltriga valge müra: õhk, hingeõhk, taldrikud ja löökpillid.' },
    'glide': { en: 'Portamento: the pitch slides from the previous note into the new one.', et: 'Portamento: helikõrgus libiseb eelmisest noodist uude.' },
    'unison.voices': { en: 'Detuned copies per oscillator. More is fatter, and costs more CPU.', et: 'Koopiaid ostsillaatori kohta. Rohkem on paksem ja nõuab rohkem protsessorit.' },
    'unison.detune': { en: 'Spread between the unison voices, in cents.', et: 'Unison-häälte vaheline hajuvus sentides.' },
    'unison.width': { en: 'How far the unison voices spread across the stereo field.', et: 'Kui laialt unison-hääled stereopildis laiali lähevad.' },
    'filter.type': { en: 'LP removes highs, HP removes lows, BP keeps a band, NT cuts a band out.', et: 'LP eemaldab kõrged, HP madalad, BP jätab riba, NT lõikab riba välja.' },
    'filter.cutoff': { en: 'Corner frequency of the filter. Lower is darker, higher is brighter.', et: 'Filtri piirsagedus. Madalam on tume, kõrgem on ere.' },
    'filter.reso': { en: 'Peak at the cutoff. High values ring out and can self-oscillate.', et: 'Tipp piirsagedusel. Kõrged väärtused hakkavad laulma ja võivad ennast võnkuma panna.' },
    'filter.keytrack': { en: 'How much the cutoff follows the played pitch, so timbre stays even.', et: 'Kui palju piirsagedus mängitavat nooti järgib, et tämber püsiks ühtlane.' },
    'filter.envAmt': { en: 'How far the filter envelope opens the cutoff, up to +12 kHz.', et: 'Kui palju filtriümbrik piirsagedust avab, kuni +12 kHz.' },
    'filtEnv.a': { en: 'How fast the cutoff sweeps up to its peak.', et: 'Kui kiiresti piirsagedus oma tippu jõuab.' },
    'filtEnv.d': { en: 'How fast the cutoff falls back to its sustain level.', et: 'Kui kiiresti piirsagedus tagasi püsitasemele langeb.' },
    'filtEnv.s': { en: 'Cutoff offset held while the key is down.', et: 'Piirsageduse nihe, mida hoitakse klahvi all hoides.' },
    'ampEnv.a': { en: 'Fade-in time. Slow attacks make pads, fast ones make plucks.', et: 'Sissehääletumise aeg. Aeglane annab padid, kiire näppe.' },
    'ampEnv.d': { en: 'Time to fall from the peak down to the sustain level.', et: 'Aeg tipust püsitasemele langemiseks.' },
    'ampEnv.s': { en: 'Level held while the key is down. Zero gives a percussive hit.', et: 'Tase, mida klahvi all hoides hoitakse. Null annab löögi.' },
    'ampEnv.r': { en: 'Fade-out after you release the key.', et: 'Väljahääletumine pärast klahvi vabastamist.' },
    'lfo1.wave': { en: 'Shape of the modulation cycle.', et: 'Modulatsioonitsükli kuju.' },
    'lfo1.target': { en: 'What gets modulated: cutoff, pitch (vibrato), amp (tremolo) or resonance.', et: 'Mida moduleeritakse: piirsagedus, helikõrgus (vibrato), valjus (tremolo) või resonants.' },
    'lfo1.rate': { en: 'Cycles per second. Below ~20 Hz you hear it, above that it becomes FM.', et: 'Tsüklit sekundis. Alla ~20 Hz on kuulda, üle selle muutub FM-iks.' },
    'lfo1.depth': { en: 'Modulation amount. A MIDI mod wheel (CC1) adds to LFO 1.', et: 'Modulatsiooni hulk. MIDI mod-ratas (CC1) lisab LFO 1-le.' },
    'lfo2.wave': { en: 'Shape of the modulation cycle.', et: 'Modulatsioonitsükli kuju.' },
    'lfo2.target': { en: 'What gets modulated: cutoff, pitch (vibrato), amp (tremolo) or resonance.', et: 'Mida moduleeritakse: piirsagedus, helikõrgus (vibrato), valjus (tremolo) või resonants.' },
    'lfo2.rate': { en: 'Cycles per second. Below ~20 Hz you hear it, above that it becomes FM.', et: 'Tsüklit sekundis. Alla ~20 Hz on kuulda, üle selle muutub FM-iks.' },
    'lfo2.depth': { en: 'Modulation amount, independent of LFO 1.', et: 'Modulatsiooni hulk, LFO 1-st sõltumatult.' },
    'drive.amount': { en: 'Soft saturation before the effects. Adds harmonics, warmth and glue.', et: 'Pehme küllastus enne efekte. Lisab ülemhelisid, soojust ja liimi.' },
    'drive.tone': { en: 'Lowpass after the distortion, to tame fizz.', et: 'Madalpääsfilter pärast moonutust, et taltsutada sisinat.' },
    'chorus.rate': { en: 'How fast the chorus delay lines wobble.', et: 'Kui kiiresti chorus-e viiteliinid võnguvad.' },
    'chorus.depth': { en: 'How far they wobble. More detune, more shimmer.', et: 'Kui palju nad võnguvad. Rohkem valesti häälestust, rohkem sära.' },
    'chorus.mix': { en: 'Balance between the dry signal and the chorus.', et: 'Tasakaal kuiva signaali ja choruse vahel.' },
    'delay.time': { en: 'Echo spacing. Dotted eighths (a beat and a half) sit well under most parts.', et: 'Kaja vahe. Punktiiriga kaheksandikud (poolteist lööki) sobivad enamiku partiidega.' },
    'delay.feedback': { en: 'How much echo returns. High values build long, decaying tails.', et: 'Kui palju kaja tagasi tuleb. Kõrged väärtused ehitavad pikki hääbuvaid sabasid.' },
    'delay.mix': { en: 'Echo loudness against the dry signal.', et: 'Kaja valjus kuiva signaali suhtes.' },
    'reverb.size': { en: 'Length of the generated reverb tail, in seconds.', et: 'Kaja järelkõla pikkus sekundites.' },
    'reverb.mix': { en: 'Reverb loudness against the dry signal.', et: 'Kaja valjus kuiva signaali suhtes.' },
    'arp.on': { en: 'Arp on — written notes become the chord, the arp plays the rhythm.', et: 'Arp sees — kirjutatud noodid on akord, arp mängib rütmi.' },
    'arp.off': { en: 'Arp off — the track plays exactly what is written.', et: 'Arp väljas — rada mängib täpselt seda, mis kirjas.' },
    'arp.pattern': { en: 'Which way the arpeggio walks through the chord.', et: 'Kuidas arpedžo akordist läbi käib.' },
    'arp.rate': { en: 'How often a new note fires, in steps. 1 = every 16th, 2 = every 8th, 4 = every beat.', et: 'Kui tihti uus noot kõlab, sammudes. 1 = iga 16-ndik, 2 = 8-ndik, 4 = iga löök.' },
    'arp.octaves': { en: 'How many octaves the pattern climbs through before repeating.', et: 'Mitu oktavit muster läbib, enne kui kordub.' },
    'arp.gate': { en: 'Note length as a share of one arp step. Short is staccato, long is legato.', et: 'Noodi pikkus ühest arp-sammust. Lühike on staccato, pikk on legato.' },
    'master.volume': { en: "This patch's level, before the song master fader.", et: 'Selle heli tase enne laulu master-nuppu.' },
    'master.poly': { en: 'Maximum simultaneous voices for this patch.', et: 'Maksimaalne üheaegsete häälte arv sellel helil.' },

    'opt.sine': { en: 'Sine — one harmonic, pure and hollow. Good for subs.', et: 'Sine — üks ülemheli, puhas ja õõnes. Hea bassidele.' },
    'opt.triangle': { en: 'Triangle — soft odd harmonics, like a mellow flute.', et: 'Triangle — pehmed paaritud ülemhelid, nagu mahe flööt.' },
    'opt.sawtooth': { en: 'Sawtooth — all harmonics, bright. The default synth tone.', et: 'Sawtooth — kõik ülemhelid, ere. Süntesaatori põhitämber.' },
    'opt.square': { en: 'Square — odd harmonics only, hollow and reedy.', et: 'Square — ainult paaritud ülemhelid, õõnes ja torukujuline.' },
    'opt.lowpass': { en: 'Low pass — keeps lows, rolls off highs.', et: 'Madalpääs — jätab madalad, lõikab kõrged.' },
    'opt.highpass': { en: 'High pass — keeps highs, removes lows. Thins things out.', et: 'Kõrgpääs — jätab kõrged, eemaldab madalad. Muudab hõredaks.' },
    'opt.bandpass': { en: 'Band pass — keeps a narrow band around the cutoff.', et: 'Ribapääs — jätab kitsa riba piirsageduse ümber.' },
    'opt.notch': { en: 'Notch — removes a narrow band around the cutoff.', et: 'Notch — eemaldab kitsa riba piirsageduse ümber.' },
    'opt.filter': { en: 'Cutoff — sweeps the filter (the classic wobble).', et: 'Piirsagedus — pühkib filtrit (klassikaline võnkumine).' },
    'opt.pitch': { en: 'Pitch — vibrato, up to ±12 semitones.', et: 'Helikõrgus — vibrato, kuni ±12 pooltooni.' },
    'opt.amp': { en: 'Amp — tremolo, volume pulsing.', et: 'Valjus — tremolo, helitugevuse pulseerimine.' },
    'opt.reso': { en: 'Resonance — animates the filter peak (up to +20 Q).', et: 'Resonants — paneb filtri tipu liikuma (kuni +20 Q).' },
    'opt.up': { en: 'Up — lowest note to highest.', et: 'Üles — madalaimast noodist kõrgeimani.' },
    'opt.down': { en: 'Down — highest note to lowest.', et: 'Alla — kõrgeimast noodist madalaimani.' },
    'opt.updown': { en: 'Bounce — up then back down, without repeating the ends.', et: 'Põrkamine — üles ja tagasi alla, otspunkte dubleerimata.' },
    'opt.random': { en: 'Random — pseudo-random, but identical every loop.', et: 'Juhuslik — näiliselt juhuslik, aga igal kordusel sama.' },
    'opt.as': { en: 'As is — the order you wrote the notes in.', et: 'Nii nagu on — sinu kirjutatud järjekord.' }
  };

  /* ------------------------------------------------------------ help text */
  /* items: string = bullet, { k, v } = table row, { h } = sub-heading      */
  function helpEn() {
    return [
      { title: 'Quick start', type: 'ol', items: [
        'Pick a sound. Press Open and load a demo such as Neon Drive to see how a finished project is put together.',
        'Press play (▶ in the transport bar). The loop repeats and the playhead shows where you are.',
        'Select a track on the left. The piano roll on the right shows its notes.',
        'Edit notes: click empty space to add one, drag its right edge to lengthen it, drag its body to move it, right-click to delete.',
        'Change the sound: switch to the Patch tab — those controls edit the selected track only.',
        'Save and export: Ctrl+S stores the project, ▶ WAV renders audio, MIDI writes a standard .mid file.'
      ] },
      { title: 'The three tabs', type: 'table', items: [
        { k: 'Compose', v: 'Tracks, piano roll and transport. Where you write music.' },
        { k: 'Patch', v: 'The synth rack for the currently selected track — oscillators, filter, envelopes, LFOs, arpeggiator and effects.' },
        { k: 'Help', v: 'This page.' }
      ], note: 'A project is a set of tracks. Each track owns one patch plus its own notes, volume, pan, mute and arpeggiator settings.' },

      { title: 'Arpeggiator', type: 'list', items: [
        'Turns a chord into a running pattern: you write the chord, the arp plays the notes one at a time.',
        'Found in the Patch tab (ARPEGGIATOR panel), so it is per track and rides along with the patch.',
        'Chord = several notes starting on the same step. Write a new chord later in the loop and the pattern follows it.',
        'Patterns: up, down, bounce (up-then-down), random (identical every loop), as is (the order you wrote).',
        'Rate is in steps: 1 = every 16th, 2 = every 8th, 4 = every beat. Octaves 1–4. Gate is note length as a share of one step.',
        'Example: C major (60/64/67), rate 2, up → 60, 64, 67, 60, 64, 67… With 2 octaves: 60, 64, 67, 72, 76, 79.'
      ], note: 'Tip: one chord is enough. Change the chord and the whole pattern changes with it — far easier than writing 64 notes by hand.' },

      { title: 'Key / scale lock', type: 'list', items: [
        'Locks notes to a chosen key so nothing you play or draw can be wrong.',
        'In the transport bar: Key [root] [scale] [snap]. 12 roots and 13 scales, from major and the minors to pentatonic and blues.',
        'Scale highlight: out-of-scale rows are shaded on the roll and the root row is tinted, so you see at a glance what fits.',
        'Snap on: anything you draw, move, play on the computer keyboard or play from MIDI is pulled to the nearest note in the scale.',
        'Snap off: only the shading — nothing is forced.',
        'Chromatic = lock off, all twelve notes allowed.'
      ], note: 'Example: choose A minor pentatonic and you can hammer away on the keyboard; every note lands in key.' },

      { title: 'Signal path', type: 'signal', items: [], note: 'One full chain per track. All tracks then sum into the song master fader, a limiter and the analyser.' },

      { title: 'Piano roll — editing', type: 'table', items: [
        { k: 'Click empty space', v: 'Add a note' },
        { k: 'Drag on empty space', v: 'Add and set the length in one go' },
        { k: 'Drag a note body', v: 'Move it in time and pitch' },
        { k: 'Drag its right edge', v: 'Resize (lengthen / shorten)' },
        { k: 'Right-click a note', v: 'Delete it there and then — the menu stays shut' },
        { k: 'Alt-click a note', v: 'Delete it (same, via the keyboard)' },
        { k: 'Right-click empty space', v: 'Opens the edit menu' },
        { k: 'Shift + drag', v: 'Marquee-select a region (works in any mode)' }
      ], note: 'Rows are pitches, columns are 16th-note steps. Bar lines are bright, beats fainter. Selected notes get a white outline.' },

      { title: 'Selection & clipboard', type: 'table', items: [
        { k: 'Ctrl+A', v: 'Select every note on the track' },
        { k: 'Ctrl+C', v: 'Copy the selection' },
        { k: 'Ctrl+X', v: 'Cut the selection' },
        { k: 'Ctrl+V', v: 'Drop it at the selection, the amber cursor, or the playhead' },
        { k: 'Ctrl+D', v: 'Duplicate — copy placed straight after the selection' },
        { k: 'Delete', v: 'Delete the selection' },
        { k: 'Alt + ↑ / ↓', v: 'Transpose the selection by a semitone' },
        { k: 'Alt + ← / →', v: 'Nudge the selection one step in time' },
        { k: 'Esc', v: 'Clear the selection, then the paste cursor' },
        { k: 'Right-click → Paste here', v: 'Paste straight at the spot you clicked' }
      ], note: 'The cursor marks the block\'s top-left corner: its highest note lands on the row you clicked and the rest hang below. Pasting at a selection or the playhead keeps the original pitches.' },

      { title: 'Keybinds', type: 'table', items: [
        { k: 'a w s e d f t g y h u j k', v: 'Play notes (two octaves, like a piano)' },
        { k: 'Space (hold)', v: 'Sustain pedal' },
        { k: '◀ ▶', v: 'Shift the keyboard by an octave' },
        { k: 'Ctrl+S', v: 'Save project' },
        { k: 'Ctrl+Z', v: 'Undo the last note edit' },
        { k: 'Ctrl+Shift+Z', v: 'Redo' },
        { k: 'Esc', v: 'Close a dialog, or clear the selection and cursor' },
        { k: 'Double-click a knob', v: 'Reset it to its default' },
        { k: 'Shift + drag a knob', v: 'Fine adjustment' },
        { k: 'Mouse wheel over a knob', v: 'Nudge' }
      ] },

      { title: 'Tracks', type: 'list', items: [
        '+ Track adds one with its own patch.',
        'Click a row to select it. Its patch then loads in the Patch tab.',
        'The patch dropdown swaps the sound without touching the notes — great for auditioning.',
        'M mutes, S solos. Soloing any track overrides the mutes.',
        'The checkbox controls whether the track is drawn on the roll. Any number can be shown; only the selected one is editable.',
        'All / Sel above the list show every track, or only the one you are editing.',
        'The fader is the track\'s level into the song master. ✕ deletes the track and its notes.'
      ], note: 'Clicking a faded note of another visible track switches to it — but never while a copy is waiting to be placed, so it cannot steal your click.' },

      { title: 'Projects & export', type: 'list', items: [
        'New — blank project: 120 bpm, 2 bars, one empty track.',
        'Open — saved projects and the demos, with rename, duplicate and delete.',
        'Save / Save As store it in the browser. An amber dot means unsaved changes.',
        '▶ WAV renders the whole loop offline (effect tails included) as 16-bit stereo audio.',
        'MIDI writes a standard .mid file: one MIDI track per project track, with tempo and track names.',
        'JSON exports the project so you can back it up or share it; Import reads it back.'
      ], note: 'Your work also autosaves to the browser every few hundred milliseconds, so reloading the page puts you back where you were.' },

      { title: 'MIDI & live playing', type: 'list', items: [
        'A MIDI keyboard is picked up automatically — the MIDI indicator lights up.',
        'Notes play the selected track; CC1 (mod wheel) adds to LFO 1 depth; pitch bend is ±2 semitones.',
        'Press ● (record) and play: your notes are written into the selected track at the playhead, live.',
        'PANIC silences everything if a note gets stuck.',
        'Scale snap applies to the computer keyboard and MIDI input too, so you can hammer away and stay in key.'
      ] },

      { title: 'Tips & gotchas', type: 'list', items: [
        'Hover anything for a plain-English explanation of what it does.',
        'Use the A/B slots in the Patch tab to park a sound you like before twisting more knobs.',
        'Random is the fastest way to find a new timbre; edit from there.',
        'Swing only affects every second 16th, so it works on hats and arps, not long pads.',
        'After pasting the cursor jumps a whole block forward, so pressing Paste again tiles the parts side by side.',
        'Drum patches are voiced for a note: Kick C2 (36), Tom C3 (48), everything else C4 (60).',
        'Need a riser or a hit? The FX patches (Noise Riser, Impact Hit) are one long note each.',
        'With an arp track, write one chord instead of a long run — change the chord and the pattern follows.',
        'Undo covers note edits only — adding or deleting a track is not undoable, so keep a JSON export of anything precious.',
        'Unison above 3 voices multiplies the oscillator count — watch the CPU on busy songs.'
      ] }
    ];
  }

  function helpEt() {
    return [
      { title: 'Kiire algus', type: 'ol', items: [
        'Vali heli. Vajuta Ava ja laadi mõni näidis, näiteks Neon Drive, et näha, kuidas valmis projekt on kokku pandud.',
        'Vajuta mängima (▶ transports-ribal). Loop kordub ja mängupeal näitab, kus sa oled.',
        'Vali vasakul rida. Paremal rullil on selle raja noodid.',
        'Muuda noote: klõpsi tühja kohta, et lisada; lohista paremat serva pikendamiseks; lohista keha liigutamiseks; paremklõps kustutab.',
        'Muuda heli: mine Heli (Patch) vahekaardile — need nupud muudavad ainult valitud rada.',
        'Salvesta ja ekspordi: Ctrl+S salvestab projekti, ▶ WAV teeb helifaili, MIDI kirjutab .mid faili.'
      ] },
      { title: 'Kolm vahekaarti', type: 'table', items: [
        { k: 'Loo', v: 'Rajad, noodirull ja transport. Siin sa kirjutad muusikat.' },
        { k: 'Heli', v: 'Valitud raja süntesaator: ostsillaatorid, filter, ümbrikud, LFO-d, arpeggiaator ja efektid.' },
        { k: 'Abi', v: 'See leht.' }
      ], note: 'Projekt on ridade kogum. Igal rajal on oma heli ning oma noodid, valjus, panoraam, tummutus ja arpeggiaator.' },

      { title: 'Arpeggiaator', type: 'list', items: [
        'Muudab akordi jooksva mustrina: sina kirjutad akordi, arp mängib noodid ükshaaval.',
        'Asub Heli vahekaardil (ARPEGGIATOR paneel), seega on see rajapõhine ja liigub heliga kaasa.',
        'Akord = mitu nooti samal sammul. Kirjuta loopis uus akord ja muster läheb sellele üle.',
        'Mustrid: up (üles), down (alla), bounce (üles-alla), random (igal kordusel sama), as is (sinu kirjutatud järjekord).',
        'Rate on sammudes: 1 = iga 16-ndik, 2 = 8-ndik, 4 = iga löök. Octaves 1–4. Gate on noodipikkus ühest sammust.',
        'Näide: C-duur (60/64/67), rate 2, up → 60, 64, 67, 60, 64, 67… Kahe oktaviga: 60, 64, 67, 72, 76, 79.'
      ], note: 'Nipp: ühest akordist piisab. Muuda akordi ja kogu muster tuleb kaasa — palju lihtsam kui 64 nooti käsitsi kirjutada.' },

      { title: 'Helistikupiirang', type: 'list', items: [
        'Lukustab noodid valitud helistikku, nii et ükski noot ei saa olla vale.',
        'Transpordi-real: Key [alusnoot] [laad] [snap]. 12 alusnooti ja 13 laadi — mažoorist ja minooridest pentatoonika ja bluusini.',
        'Laadi esiletõst: helistikku mittekuuluvad read on rullil varjutatud ja alusnoodi rida on toonitud.',
        'Snap sees: kõik, mida sa joonistad, liigutad, arvutiklaviatuuril mängid või MIDI-st sisse mängid, tõmmatakse lähimasse helistikunooti.',
        'Snap väljas: ainult varjutus — midagi ei sunnita.',
        'Chromatic = piirang väljas, kõik kaksteist nooti lubatud.'
      ], note: 'Näide: vali A-minoorne pentatoonika ja võid klaviatuuril palju taguda — iga noot on õiges helistikus.' },

      { title: 'Signaalitee', type: 'signal', items: [], note: 'Igal rajal on oma täielik ahel. Kõik rajad summeeruvad laulu master-nupus, piirajas ja analüsaatoris.' },

      { title: 'Noodirull — muutmine', type: 'table', items: [
        { k: 'Klõps tühjal kohal', v: 'Lisab noodi' },
        { k: 'Lohistamine tühjal kohal', v: 'Lisab ja määrab pikkuse ühe korraga' },
        { k: 'Noodi keha lohistamine', v: 'Liigutab ajas ja helikõrguses' },
        { k: 'Parema serva lohistamine', v: 'Muudab pikkust' },
        { k: 'Paremklõps noodil', v: 'Kustutab kohe — menüüd ei tule' },
        { k: 'Alt + klõps noodil', v: 'Kustutab (sama, klaviatuuriga)' },
        { k: 'Paremklõps tühjal kohal', v: 'Avab muutmismenüü' },
        { k: 'Shift + lohista', v: 'Valib ala (töötab mõlemas režiimis)' }
      ], note: 'Read on helikõrgused, veerud on 16-ndiku sammud. Taktijooned on eredad, löögid nõrgemad. Valitud noodid saavad valge äärise.' },

      { title: 'Valik ja lõikelaud', type: 'table', items: [
        { k: 'Ctrl+A', v: 'Valib kõik selle raja noodid' },
        { k: 'Ctrl+C', v: 'Kopeerib valiku' },
        { k: 'Ctrl+X', v: 'Lõikab valiku' },
        { k: 'Ctrl+V', v: 'Paneb valiku, merevaigu kursori või mängupea juurde' },
        { k: 'Ctrl+D', v: 'Duplikaat — koopia otse valiku järele' },
        { k: 'Delete', v: 'Kustutab valiku' },
        { k: 'Alt + ↑ / ↓', v: 'Transponeerib valikut pooltooni kaupa' },
        { k: 'Alt + ← / →', v: 'Nihutab valikut ühe sammu võrra' },
        { k: 'Esc', v: 'Tühistab valiku, siis kleepimiskursori' },
        { k: 'Paremklõps → Kleebi siia', v: 'Kleebib otse klõpsatud kohta' }
      ], note: 'Kursor märgib ploki vasakut ülanurka: selle kõrgeim noot maandub klõpsatud reale ja ülejäänud ripuvad allpool. Valiku või mängupea juurde kleepimine jätab originaalkõrgused alles.' },

      { title: 'Kiirklahvid', type: 'table', items: [
        { k: 'a w s e d f t g y h u j k', v: 'Mängib noote (kaks oktavit, nagu klaveril)' },
        { k: 'Tühik (hoia)', v: 'Sustain-pedaal' },
        { k: '◀ ▶', v: 'Nihutab klaviatuuri oktavi võrra' },
        { k: 'Ctrl+S', v: 'Salvestab projekti' },
        { k: 'Ctrl+Z', v: 'Võtab viimase noodimuudatuse tagasi' },
        { k: 'Ctrl+Shift+Z', v: 'Võtab tagasivõtu edasi' },
        { k: 'Esc', v: 'Sulgeb dialoogi või tühistab valiku ja kursori' },
        { k: 'Topeltklõps nupul', v: 'Taastab algväärtuse' },
        { k: 'Shift + lohista nuppu', v: 'Täpne häälestus' },
        { k: 'Hiire ratas nupu kohal', v: 'Väike nihe' }
      ] },

      { title: 'Rajad', type: 'list', items: [
        '+ Rada lisab uue koos oma heliga.',
        'Rida klõpsates valid selle. Selle heli laetakse siis Heli vahekaardile.',
        'Heli rippmenüü vahetab kõla ilma noote puudutamata — hea võrdlemiseks.',
        'M tummutab, S soolob. Ükskõik millise raja soolamine tühistab tummutused.',
        'Märkeruut määrab, kas rada rullile joonistatakse. Näha võib olla mitu; muuta saab ainult valitud rada.',
        'Kõik / Valik nuppudega näitad kõiki rada või ainult seda, mida parajasti muudad.',
        'Fader on raja tase laulu masteris. ✕ kustutab raja ja selle noodid.'
      ], note: 'Teise nähtava raja tuhmil noodil klõpsates lülitub rakendus sellele rajale — aga mitte siis, kui ootab kleepimist kopeeritud lõik, nii et klõpsu ei saa varastada.' },

      { title: 'Projektid ja eksport', type: 'list', items: [
        'Uus — tühi projekt: 120 bpm, 2 takti, üks tühi rada.',
        'Ava — salvestatud projektid ja näidised, koos ümbernimetamise, dubleerimise ja kustutamisega.',
        'Salvesta / Salvesta kui panevad projekti brauserisse kirja. Merevaigu täpp tähendab salvestamata muudatusi.',
        '▶ WAV renderdab kogu loopi (ka efektide sabad) 16-bitiseks stereoheliks.',
        'MIDI kirjutab .mid faili: iga projektirada on oma MIDI-rada, kaasas tempo ja rajanimed.',
        'JSON ekspordib projekti varukoopiaks või jagamiseks; Too sisse loeb selle tagasi.'
      ], note: 'Töö salvestub brauserisse automaatselt iga paarisaja millisekundi järel, nii et lehe värskendamisel jätkad sealt, kus pooleli jäid.' },

      { title: 'MIDI ja elav mängimine', type: 'list', items: [
        'MIDI-klaviatuur võetakse automaatselt kasutusele — MIDI-indikaator süttib.',
        'Noodid mängivad valitud rada; CC1 (mod-ratas) lisab LFO 1 sügavust; pitch bend on ±2 pooltooni.',
        'Vajuta ● (salvesta) ja mängi: sinu noodid kirjutatakse elavalt mängupea juures valitud rajale.',
        'PANIC vaigistab kõik, kui mõni noot kinni jääb.',
        'Helistiku snap kehtib ka arvutiklaviatuurile ja MIDI-sisendile, nii et võid palju taguda ja jääda helistikku.'
      ] },

      { title: 'Nõuanded ja omapärad', type: 'list', items: [
        'Keri hiirega ükskõik mille kohale — saad lühikese selgituse, mida see teeb.',
        'Kasuta Heli vahekaardi A/B pesi, et pargida meelepärane kõla enne uute nuppude keeramist.',
        'Juhuslik (Random) on kiireim viis uue tämbri leidmiseks; hakka sealt edasi tuunima.',
        'Swing mõjutab ainult iga teist 16-ndikku, seega sobib see taldrikutele ja arpidele, mitte pikkadele padidele.',
        'Pärast kleepimist hüppab kursor terve ploki võrra edasi, nii et uus Kleebi ladub osad kõrvuti.',
        'Trummide helid on häälestatud kindlale noodile: Kick C2 (36), Tom C3 (48), kõik ülejäänud C4 (60).',
        'Kasuta tõusu või lööki? FX helid (Noise Riser, Impact Hit) on üks pikk noot kumbki.',
        'Arp-rajal kirjuta üks akord, mitte pikk rida — muuda akordi ja muster tuleb kaasa.',
        'Undo katab ainult noodimuudatused — raja lisamist või kustutamist ei saa tagasi võtta, nii et tee kallist asjast JSON-koopia.',
        'Unison üle 3 hääle korrutab ostsillaatorite arvu — jälgi protsessorit tihedatel lugudel.'
      ] }
    ];
  }

  const HELP = { en: helpEn(), et: helpEt() };

  /* ------------------------------------------------------------------ api */
  let current = 'en';

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    current = l;
    try { localStorage.setItem('synthlab.lang', l); } catch (e) { /* ignore */ }
  }

  function getLang() { return current; }

  function t(key, fallback) {
    if (!key) return fallback === undefined ? '' : fallback;
    const entry = UI[key] || MSG[key] || LBL[key];
    if (!entry) return fallback === undefined ? key : fallback;
    const v = entry[current];
    if (v === undefined || v === null || v === '') return entry.en || fallback || key;
    return v;
  }

  /* tooltip for a parameter path, falling back to the authored English */
  function tip(key, fallback) {
    const e = TIPS[key];
    if (!e) return fallback === undefined ? '' : fallback;
    return e[current] || e.en || (fallback === undefined ? '' : fallback);
  }

  global.SynthLab.i18n = {
    LANGS: LANGS,
    UI: UI,
    MSG: MSG,
    LBL: LBL,
    TIPS: TIPS,
    HELP: HELP,
    setLang: setLang,
    getLang: getLang,
    t: t,
    tip: tip
  };
})(window);
