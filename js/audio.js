// ==========================================
// 音效管理模組 (Web Audio API 合成音效)
// ==========================================

let isAudioMuted = false;
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 切換音效開關（只顯示單字「開」或「關」，並更換圖示）
export function toggleAudio() {
  isAudioMuted = !isAudioMuted;

  const textEl = document.getElementById('sound-text');
  const iconEl = document.getElementById('sound-icon');

  if (isAudioMuted) {
    if (textEl) textEl.innerText = '關';
    if (iconEl) {
      iconEl.className = 'fa-solid fa-volume-xmark text-[#7F7B75] text-base';
    }
  } else {
    if (textEl) textEl.innerText = '開';
    if (iconEl) {
      iconEl.className = 'fa-solid fa-volume-high text-[#9E2A2B] text-base';
    }
    playClickSound(); // 開啟時給予一聲輕巧點擊回饋
  }
}

// 關鍵：將 toggleAudio 掛載到 window 上，HTML 的 onclick 才能直接觸發
window.toggleAudio = toggleAudio;

// 1. 貓咪喵喵叫聲 (合成頻率滑動音)
export function playMeowSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    // 模擬貓咪「喵～」的音調起伏
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (err) {
    // 忽略特定行動端尚未與使用者互動時的音效阻擋
  }
}

// 2. 呼嚕嚕聲 (低頻振動音)
export function playPurrSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.15);
    osc.frequency.linearRampToValueAtTime(60, now + 0.3);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.31);
  } catch (err) {}
}

// 3. UI 點擊反饋音
export function playClickSound() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (err) {}
}