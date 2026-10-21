import { gameState } from './game-state.js';
import { playMeowSound, playPurrSound } from './audio.js';

let animFrameId = null;
let sleepInterval = null;
let paradiseAnimId = null;
let paradiseCats = [];

// 天堂公園基礎 10 個物件
const BASE_PARADISE_OBJECTS = [
  { type: 'yarn', x: 110, y: 220, label: '七彩毛線球 🧶' },
  { type: 'box', x: 260, y: 190, label: '無限大紙箱 📦' },
  { type: 'can', x: 420, y: 250, label: '頂級鮮魚罐 🥫' },
  { type: 'fish', x: 580, y: 220, label: '香脆小魚乾 🐟' },
  { type: 'sunflower', x: 740, y: 190, label: '向日葵花叢 🌻' },
  { type: 'tree', x: 860, y: 240, label: '天堂小櫻樹 🌸' },
  { type: 'pillow', x: 180, y: 280, label: '雲朵軟軟墊 ☁️' },
  { type: 'bowl', x: 340, y: 310, label: '永恆鮮奶盆 🥛' },
  { type: 'scratcher', x: 500, y: 290, label: '黃金貓抓柱 🪵' },
  { type: 'butterflies', x: 670, y: 270, label: '追逐小彩蝶 🦋' }
];

// 額外解鎖物件庫 (每多5隻解鎖1個)
const BONUS_PARADISE_OBJECTS = [
  { type: 'tunnel', x: 200, y: 150, label: '彩虹貓隧道 🌈' },
  { type: 'spring', x: 610, y: 160, label: '搖搖羽毛棒 🪶' },
  { type: 'hammock', x: 380, y: 140, label: '微風小吊床 🍃' },
  { type: 'castle', x: 820, y: 160, label: '貓爬架城堡 🏰' }
];

// 花園貓咪療癒語錄
const HEALING_CAT_WORDS = [
  "這裡天天都有吃不完的小魚乾喵～🐟",
  "好舒服～陽光暖洋洋的🌸",
  "不要難過喔，我一直都在身邊守護你🐾",
  "我在這裡交了好多新朋友喵！✨",
  "微風吹過來的時候，是我在蹭你喔💖",
  "今天也最喜歡主人了！🌟"
];

export function startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback) {
  const canvas = document.getElementById('roam-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.addEventListener('mousemove', (e) => {
    const rect = e.target.getBoundingClientRect();
    gameState.mousePos.x = (e.clientX - rect.left) * (e.target.width / rect.width);
    gameState.mousePos.y = (e.clientY - rect.top) * (e.target.height / rect.height);
    gameState.mousePos.onStage = true;
  });

  canvas.addEventListener('mouseleave', () => { 
    gameState.mousePos.onStage = false; 
  });

  canvas.addEventListener('click', onCanvasClick);

  function renderFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHighQualityRoomScene(ctx, canvas.width, canvas.height);
    drawRoomPoops(ctx);
    updateRoamingPhysics(canvas.width, canvas.height, updateStatusUI, spawnFloatingFeedback);
    drawCatEntity(ctx, gameState.roamState.x, gameState.roamState.y, gameState.roamState.facing, gameState.currentCat);

    if (gameState.mousePos.onStage && !gameState.isPaused) {
      ctx.save();
      ctx.font = '24px sans-serif';
      if (gameState.activeInteractionMode === 'toy') {
        ctx.fillText('🪶', gameState.mousePos.x - 12, gameState.mousePos.y + 8);
      } else if (gameState.activeInteractionMode === 'snack') {
        ctx.fillText('🐟', gameState.mousePos.x - 12, gameState.mousePos.y + 8);
      }
      ctx.restore();
    }

    animFrameId = requestAnimationFrame(renderFrame);
  }

  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(renderFrame);
}

function drawHighQualityRoomScene(ctx, w, h) {
  ctx.fillStyle = '#F4EFE6';
  ctx.fillRect(0, 0, w, h);

  const rugGrad = ctx.createRadialGradient(w/2 - 20, h/2 + 20, 40, w/2 - 20, h/2 + 20, 270);
  rugGrad.addColorStop(0, '#ECE5D8');
  rugGrad.addColorStop(1, '#E1D9CC');
  ctx.fillStyle = rugGrad;
  ctx.beginPath();
  ctx.ellipse(w / 2 - 20, h / 2 + 20, 270, 105, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#E0DAD0';
  ctx.lineWidth = 1.5;
  for (let y = 50; y < h; y += 65) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 貓窩
  ctx.save();
  ctx.fillStyle = '#C8B9A6';
  ctx.fillRect(740, 55, 120, 85);
  ctx.fillStyle = '#DFD6C9';
  ctx.fillRect(746, 61, 108, 73);
  ctx.fillStyle = '#C0392B';
  ctx.beginPath();
  ctx.roundRect(755, 95, 90, 32, 10);
  ctx.fill();
  ctx.fillStyle = '#6E2C00';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('🐾 溫暖貓窩', 768, 78);
  ctx.restore();

  // 貓砂盆
  ctx.save();
  ctx.fillStyle = '#7F8C8D';
  ctx.beginPath();
  ctx.roundRect(740, 255, 120, 75, 14);
  ctx.fill();
  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.roundRect(746, 261, 108, 63, 10);
  ctx.fill();
  ctx.fillStyle = '#34495E';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('🚽 專用礦砂盆', 758, 298);
  ctx.restore();

  drawFoodAndWater(ctx);
}

function drawFoodAndWater(ctx) {
  const waterRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.water / 100)) : 1;
  ctx.fillStyle = '#E5E8E8';
  ctx.beginPath();
  ctx.arc(80, 310, 28, 0, Math.PI * 2);
  ctx.fill();
  if (waterRatio > 0.05) {
    ctx.fillStyle = '#5DADE2';
    ctx.beginPath();
    ctx.arc(80, 310, 21 * Math.sqrt(waterRatio), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`水盆(${gameState.currentCat ? Math.round(gameState.currentCat.water) : 100}%)`, 52, 350);

  const hungerRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.hunger / 100)) : 1;
  ctx.fillStyle = '#EDBB99';
  ctx.beginPath();
  ctx.arc(175, 310, 28, 0, Math.PI * 2);
  ctx.fill();
  if (hungerRatio > 0.05) {
    ctx.fillStyle = '#6E2C00';
    ctx.beginPath();
    ctx.arc(175, 310, 21 * Math.sqrt(hungerRatio), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`食碗(${gameState.currentCat ? Math.round(gameState.currentCat.hunger) : 100}%)`, 147, 350);
}

function drawRoomPoops(ctx) {
  gameState.roomPoops.forEach(p => {
    ctx.fillStyle = '#5A3825';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px sans-serif';
    ctx.fillText('💩', p.x - 7, p.y + 4);
  });
}

function updateRoamingPhysics(w, h, updateStatusUI, spawnFloatingFeedback) {
  const r = gameState.roamState;
  const c = gameState.currentCat;
  if (gameState.isPaused || !c) return;

  if (r.isStarving) {
    document.getElementById('ui-state-pill').innerText = "⚠️ 飢餓無力停滯中";
    return;
  }
  if (r.isSleepingInCage) {
    document.getElementById('ui-state-pill').innerText = `💤 貓窩熟睡中 (${r.sleepElapsedSeconds}/${r.sleepTargetSeconds}s)...`;
    return;
  }

  // 逗貓棒追逐判定：不一定追（有傲嬌機率）
  if (gameState.activeInteractionMode === 'toy' && gameState.mousePos.onStage) {
    gameState.toyInterestCheckTimer++;
    if (gameState.toyInterestCheckTimer > 120) {
      gameState.toyInterestCheckTimer = 0;
      gameState.isToyInterested = Math.random() < 0.65;
    }

    if (!gameState.isToyInterested) {
      document.getElementById('ui-state-pill').innerText = "🐾 貓咪高冷地瞥了逗貓棒一眼，懶得動... (傲嬌中)";
    } else {
      const dx = gameState.mousePos.x - r.x;
      const dy = gameState.mousePos.y - r.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 30) {
        r.x += (dx / dist) * 2.8;
        r.y += (dy / dist) * 2.8;
        r.facing = dx >= 0 ? 1 : -1;
        r.isWalking = true;
        document.getElementById('ui-state-pill').innerText = "🪶 貓咪眼睛發亮，正撲向逗貓棒！";
        return;
      } else {
        r.isWalking = false;
        document.getElementById('ui-state-pill').innerText = "🪶 貓咪抓到逗貓棒了！撲騰玩耍～";

        // 碰到時增加親密、降低活力（15秒內不重複觸發）
        const now = Date.now();
        if (now - (gameState.lastToyRewardTime || 0) >= 15000) {
          gameState.lastToyRewardTime = now;
          c.affection = Math.min(100, c.affection + 2); // 增加親密
          c.energy = Math.max(0, c.energy - 6);        // 降低活力
          c.agility += 1;
          spawnFloatingFeedback(r.x, r.y, "抓到羽毛！親密+2 活力-6 🪶✨");
          playMeowSound();
          updateStatusUI();
        }
        return;
      }
    }
  }

  // 餵零食吸引
  if (gameState.activeInteractionMode === 'snack' && gameState.mousePos.onStage) {
    const dx = gameState.mousePos.x - r.x;
    const dy = gameState.mousePos.y - r.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 25) {
      r.x += (dx / dist) * 2.4;
      r.y += (dy / dist) * 2.4;
      r.facing = dx >= 0 ? 1 : -1;
      r.isWalking = true;
      document.getElementById('ui-state-pill').innerText = "🐟 貓咪聞到香氣小跑過來！";
      return;
    } else {
      r.isWalking = false;
      document.getElementById('ui-state-pill').innerText = "🐟 貓咪眼巴巴等著你放下零食！";
      return;
    }
  }

  // 一般漫步邏輯
  if (r.isScurrying) {
    r.scurryTimer++;
    r.x += r.vx * r.facing * 3.5;
    r.y += r.vy * 2.5;
    if (r.x > w - 80) r.facing = -1; else if (r.x < 80) r.facing = 1;
    if (r.y > h - 70 || r.y < 80) r.vy *= -1;
    if (r.scurryTimer > 45) { r.isScurrying = false; r.scurryTimer = 0; r.vx = 1.0; }
    return;
  }

  if (r.isWalking) {
    r.x += r.vx * r.facing;
    r.y += r.vy;
    if (r.x > w - 80) { r.facing = -1; r.vx = Math.random() * 0.8 + 0.6; }
    else if (r.x < 80) { r.facing = 1; r.vx = Math.random() * 0.8 + 0.6; }
    if (r.y > h - 70) r.vy = -(Math.random() * 0.8 + 0.4);
    else if (r.y < 80) r.vy = Math.random() * 0.8 + 0.4;

    if (Math.random() < 0.003 && c.energy < 75) {
      startSleepingInCage(updateStatusUI, spawnFloatingFeedback);
      return;
    }

    r.walkTimer++;
    if (r.walkTimer > 180 + Math.random() * 100) {
      r.isWalking = false;
      r.walkTimer = 0;
      document.getElementById('ui-state-pill').innerText = "🐾 坐下伸懶腰歇息...";
    }
  } else {
    r.idleTimer++;
    if (r.idleTimer > 80 + Math.random() * 70) {
      r.isWalking = true;
      r.idleTimer = 0;
      r.facing = Math.random() > 0.5 ? 1 : -1;
      r.vy = (Math.random() - 0.5) * 1.2;
      document.getElementById('ui-state-pill').innerText = "🐾 正在自由散步探索...";
    }
  }
}

function startSleepingInCage(updateStatusUI, spawnFloatingFeedback) {
  const r = gameState.roamState;
  const c = gameState.currentCat;
  r.isSleepingInCage = true;
  r.x = 790;
  r.y = 110;
  r.sleepTargetSeconds = Math.floor(Math.random() * 30) + 1;
  r.sleepElapsedSeconds = 0;

  if (sleepInterval) clearInterval(sleepInterval);
  sleepInterval = setInterval(() => {
    if (!r.isSleepingInCage || gameState.isPaused) return;
    r.sleepElapsedSeconds++;
    c.energy = Math.min(100, c.energy + 1);
    updateStatusUI();

    if (r.sleepElapsedSeconds >= r.sleepTargetSeconds) {
      clearInterval(sleepInterval);
      r.isSleepingInCage = false;
      r.x = 720;
      r.y = 120;
      if (Math.random() < 0.4) {
        c.health = Math.min(100, c.health + 1);
        spawnFloatingFeedback(720, 100, "睡得好香！抵抗力+1 🩺");
      }
      document.getElementById('ui-state-pill').innerText = "🐾 睡飽了，精神滿滿！";
      updateStatusUI();
    }
  }, 1000);
}

function drawCatEntity(ctx, x, y, facing, cat) {
  if (!cat) return;
  const r = gameState.roamState;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const bob = (r.isWalking && !r.isSleepingInCage && !gameState.isPaused) ? Math.sin(Date.now() / 140) * 3 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cat.breed.color;
  ctx.fillRect(-22, -10 + bob, 44, 28);
  ctx.fillRect(-12, -28 + bob, 30, 24);

  ctx.fillStyle = cat.breed.stripe;
  ctx.fillRect(-10, -36 + bob, 8, 10);
  ctx.fillRect(8, -36 + bob, 8, 10);

  if (r.isSleepingInCage || r.isStarving) {
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -18 + bob); ctx.lineTo(6, -18 + bob);
    ctx.moveTo(12, -18 + bob); ctx.lineTo(18, -18 + bob);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, -20 + bob, 6, 6);
    ctx.fillRect(12, -20 + bob, 6, 6);
  }

  const legOff = (r.isWalking && !r.isSleepingInCage && !gameState.isPaused) ? Math.sin(Date.now() / 110) * 6 : 0;
  ctx.fillStyle = cat.breed.stripe;
  ctx.fillRect(-16 - legOff, 18, 8, 8);
  ctx.fillRect(10 + legOff, 18, 8, 8);

  const tailWiggle = Math.sin(Date.now() / 180) * 5;
  ctx.fillRect(-30, -5 + tailWiggle + bob, 10, 6);
  ctx.fillRect(-36, -12 + tailWiggle + bob, 8, 9);
  ctx.restore();
}

/* ===================================================================
   貓咪花園天堂公園引擎 (修復：Emoji清晰呈現、大圖示、公園互動)
   =================================================================== */
export function initParadiseGarden() {
  const deadCats = gameState.myStarCats;
  
  const bonusCount = Math.floor(deadCats.length / 5);
  const activeObjects = [
    ...BASE_PARADISE_OBJECTS,
    ...BONUS_PARADISE_OBJECTS.slice(0, bonusCount)
  ];

  paradiseCats = deadCats.map((c, i) => ({
    name: c.name,
    color: c.color || '#E67E22',
    stripe: c.stripe || '#D35400',
    x: 100 + (i * 90) % 750,
    y: 180 + ((i * 45) % 140),
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.3,
    facing: Math.random() > 0.5 ? 1 : -1,
    actionTimer: Math.floor(Math.random() * 100),
    interactingObj: null,
    speechText: "",
    speechTimer: 0,
    heartAnimTimer: 0
  }));

  if (paradiseAnimId) cancelAnimationFrame(paradiseAnimId);
  renderParadiseFrame(activeObjects);
}

function renderParadiseFrame(activeObjects) {
  const canvas = document.getElementById('paradise-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // 天堂公園柔和綠意背景
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#D4EFDF');
  grad.addColorStop(0.5, '#E8F8F5');
  grad.addColorStop(1, '#FEF9E7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawParadiseFlora(ctx, w, h);

  // 繪製公園物件 (清晰不透明顯示)
  activeObjects.forEach(obj => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 物件地面投影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y + 12, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 關鍵修復：重設為純色 100% 不透明，並放大到 32px
    ctx.fillStyle = '#000000';
    ctx.font = '32px sans-serif';

    if (obj.type === 'yarn') ctx.fillText('🧶', obj.x, obj.y);
    else if (obj.type === 'box') ctx.fillText('📦', obj.x, obj.y);
    else if (obj.type === 'can') ctx.fillText('🥫', obj.x, obj.y);
    else if (obj.type === 'fish') ctx.fillText('🐟', obj.x, obj.y);
    else if (obj.type === 'sunflower') ctx.fillText('🌻', obj.x, obj.y);
    else if (obj.type === 'tree') ctx.fillText('🌸', obj.x, obj.y);
    else if (obj.type === 'pillow') ctx.fillText('☁️', obj.x, obj.y);
    else if (obj.type === 'bowl') ctx.fillText('🥛', obj.x, obj.y);
    else if (obj.type === 'scratcher') ctx.fillText('🪵', obj.x, obj.y);
    else if (obj.type === 'butterflies') {
      const bBob = Math.sin(Date.now() / 300) * 8;
      ctx.fillText('🦋', obj.x, obj.y + bBob);
    } else if (obj.type === 'tunnel') ctx.fillText('🌈', obj.x, obj.y);
    else if (obj.type === 'spring') ctx.fillText('🪶', obj.x, obj.y);
    else if (obj.type === 'hammock') ctx.fillText('🍃', obj.x, obj.y);
    else if (obj.type === 'castle') ctx.fillText('🏰', obj.x, obj.y);
    else {
      ctx.fillText('✨', obj.x, obj.y);
    }

    ctx.fillStyle = '#2D6A4F';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(obj.label, obj.x, obj.y + 24);
    ctx.restore();
  });

  // 更新並繪製花園貓咪
  paradiseCats.forEach((c, idx) => {
    c.x += c.vx;
    c.y += c.vy;

    if (c.x > w + 70) {
      c.x = w + 69;
      c.vx = -Math.abs(c.vx);
      c.facing = -1;
    } else if (c.x < -70) {
      c.x = -69;
      c.vx = Math.abs(c.vx);
      c.facing = 1;
    }

    if (c.y > h - 45) { c.y = h - 45; c.vy *= -1; }
    else if (c.y < 120) { c.y = 120; c.vy *= -1; }

    if (Math.random() < 0.008) {
      c.vx = (Math.random() - 0.5) * 0.8;
      c.facing = c.vx >= 0 ? 1 : -1;
    }

    activeObjects.forEach(obj => {
      const dist = Math.hypot(c.x - obj.x, c.y - obj.y);
      if (dist < 32 && Math.random() < 0.02) {
        c.vx = 0;
        c.speechText = `正在聞聞 ${obj.label.slice(0, 4)} 🐾`;
        c.speechTimer = 80;
      }
    });

    for (let j = idx + 1; j < paradiseCats.length; j++) {
      const other = paradiseCats[j];
      const dist = Math.hypot(c.x - other.x, c.y - other.y);
      if (dist < 36) {
        c.heartAnimTimer = 60;
        other.heartAnimTimer = 60;
        if (Math.random() < 0.03 && !c.speechText) {
          c.speechText = `跟 ${other.name} 蹭蹭玩耍～💖`;
          c.speechTimer = 90;
        }
      }
    }

    if (c.speechTimer > 0) {
      c.speechTimer--;
      if (c.speechTimer === 0) c.speechText = "";
    } else if (Math.random() < 0.0008) {
      c.speechText = HEALING_CAT_WORDS[Math.floor(Math.random() * HEALING_CAT_WORDS.length)];
      c.speechTimer = 160;
      if (Math.random() < 0.3) playMeowSound();
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.facing, 1);

    ctx.fillStyle = c.color;
    ctx.fillRect(-13, -7, 26, 17);
    ctx.fillRect(-7, -18, 18, 15);
    ctx.fillStyle = c.stripe;
    ctx.fillRect(-7, -24, 6, 7);
    ctx.fillRect(5, -24, 6, 7);
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-2, -13, 3, 3);
    ctx.fillRect(5, -13, 3, 3);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const txtW = ctx.measureText(c.name).width;
    ctx.fillStyle = 'rgba(45, 106, 79, 0.85)';
    ctx.beginPath();
    ctx.roundRect(c.x - txtW/2 - 4, c.y - 36, txtW + 8, 15, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(c.name, c.x, c.y - 25);

    if (c.heartAnimTimer > 0) {
      c.heartAnimTimer--;
      ctx.font = '14px sans-serif';
      ctx.fillText('💖', c.x, c.y - 42);
    }

    if (c.speechText) {
      ctx.font = '10px sans-serif';
      const bubbleW = ctx.measureText(c.speechText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#2D6A4F';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(c.x - bubbleW/2 - 6, c.y - 62, bubbleW + 12, 18, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2C3E50';
      ctx.fillText(c.speechText, c.x, c.y - 50);
    }
    ctx.restore();
  });

  paradiseAnimId = requestAnimationFrame(() => renderParadiseFrame(activeObjects));
}

function drawParadiseFlora(ctx, w, h) {
  ctx.fillStyle = '#A3E4D7';
  for (let x = 30; x < w; x += 110) {
    ctx.beginPath();
    ctx.arc(x, h - 25, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FADBD8';
  for (let x = 70; x < w; x += 130) {
    ctx.beginPath();
    ctx.arc(x, h - 18, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}