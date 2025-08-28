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

function playFootstep() {
  initAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120 + Math.random() * 30, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

const attackSounds = [
  { type: 'sawtooth', freq: 300 },
  { type: 'square', freq: 260 },
  { type: 'triangle', freq: 320 }
];

function playAttack() {
  initAudio();
  if (!audioCtx) return;
  const variant = attackSounds[Math.floor(Math.random() * attackSounds.length)];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = variant.type;
  osc.frequency.setValueAtTime(variant.freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

const hitSounds = [
  { type: 'triangle', freq: 180 },
  { type: 'sine', freq: 200 },
  { type: 'square', freq: 150 }
];

function playHit() {
  initAudio();
  if (!audioCtx) return;
  const variant = hitSounds[Math.floor(Math.random() * hitSounds.length)];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = variant.type;
  osc.frequency.setValueAtTime(variant.freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
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
