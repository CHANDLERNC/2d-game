let audioCtx, musicTimer, musicOsc, currentMusic = -1;

const musicPacks = [
  { type: 'sine', notes: [130.81, 146.83, 155.56, 174.61, 196, 207.65, 233.08] },
  { type: 'square', notes: [196, 220, 246.94, 261.63, 293.66, 329.63, 349.23] },
  { type: 'triangle', notes: [233.08, 261.63, 277.18, 311.13, 349.23, 392, 415.3] }
];

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(type, freq, { attack = 0.01, decay = 0.3, volume = 0.2 } = {}) {
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + decay);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + decay);
}

function playFootstep() {
  const freq = 120 + Math.random() * 30;
  playTone('sine', freq, { attack: 0.01, decay: 0.25, volume: 0.15 });
}

const attackSounds = [
  { type: 'sawtooth', freq: 300 },
  { type: 'square', freq: 260 },
  { type: 'triangle', freq: 320 }
];

function playAttack() {
  const variant = attackSounds[Math.floor(Math.random() * attackSounds.length)];
  playTone(variant.type, variant.freq, { attack: 0, decay: 0.15, volume: 0.2 });
}

const hitSounds = [
  { type: 'triangle', freq: 180 },
  { type: 'sine', freq: 200 },
  { type: 'square', freq: 150 }
];

function playHit() {
  const variant = hitSounds[Math.floor(Math.random() * hitSounds.length)];
  playTone(variant.type, variant.freq, { attack: 0, decay: 0.2, volume: 0.25 });
}

function startMusic(packIdx) {
  initAudio();
  if (!audioCtx) return;
  if (musicTimer) clearInterval(musicTimer);
  if (musicOsc) {
    try {
      musicOsc.stop();
    } catch (e) {
      /* noop */
    }
  }
  const pack = musicPacks[packIdx];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.04;
  osc.type = pack.type;
  osc.connect(gain).connect(audioCtx.destination);
  let i = 0;
  function next() {
    osc.frequency.setValueAtTime(pack.notes[i % pack.notes.length], audioCtx.currentTime);
    i++;
  }
  next();
  musicTimer = setInterval(next, 2000);
  osc.start();
  musicOsc = osc;
  currentMusic = packIdx;
}

function nextMusic() {
  let idx;
  do {
    idx = Math.floor(Math.random() * musicPacks.length);
  } while (idx === currentMusic && musicPacks.length > 1);
  startMusic(idx);
}

export { initAudio, playFootstep, playAttack, playHit, startMusic, nextMusic };
