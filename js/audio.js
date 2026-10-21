let audioCtx = null;
let soundEnabled = true;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleAudio() {
  soundEnabled = !soundEnabled;
  const icon = document.getElementById('sound-icon');
  const text = document.getElementById('sound-text');
  if (icon && text) {
    icon.className = soundEnabled 
      ? 'fa-solid fa-volume-high text-[#9E2A2B]' 
      : 'fa-solid fa-volume-xmark text-[#7F7B75]';
    text.innerText = soundEnabled ? '音效: 開' : '音效: 關';
  }
  if (soundEnabled) playMeowSound();
}

export function playMeowSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.32);
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

export function playPurrSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, audioCtx.currentTime);
    g.gain.setValueAtTime(0.04, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

export function playClickSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.setValueAtTime(320, audioCtx.currentTime);
    g.gain.setValueAtTime(0.04, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch (e) {}
}