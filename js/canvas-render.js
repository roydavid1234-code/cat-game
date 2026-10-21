import { gameState } from './game-state.js';

let roamAnimId = null;
let sleepInterval = null;
let paradiseAnimId = null;

export function startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback) {
  const canvas = document.getElementById('roam-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 640;
  canvas.height = 480;

  // 避免重複綁定點擊事件
  canvas.onclick = null;
  canvas.onclick = onCanvasClick;

  // 追蹤滑鼠給逗貓棒互動
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.roamState.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    gameState.roamState.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
  };

  if (roamAnimId) cancelAnimationFrame(roamAnimId);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const r = gameState.roamState;
    const c = gameState.currentCat;
    const w = canvas.width;
    const h = canvas.height;

    // 繪製房間背景
    drawHighQualityRoomScene(ctx, w, h);

    if (c) {
      // 物理與行為狀態更新
      if (!gameState.isPaused) {
        updateRoamingPhysics(r, c, w, h, updateStatusUI, spawnFloatingFeedback);
      }

      // 繪製蟲子（若有出現）
      if (gameState.activeBug) {
        drawBug(ctx, gameState.activeBug);
      }

      // 繪製便便
      drawPoops(ctx);

      // 繪製逗貓棒羽毛（逗貓模式時跟隨游標）
      if (gameState.activeInteractionMode === 'toy' && r.mouseX !== undefined) {
        drawToyFeather(ctx, r.mouseX, r.mouseY);
      }

      // 繪製主角貓咪
      drawRoamingCat(ctx, r.x, r.y, r.facing, r.isWalking, r.isSleepingInCage, r.isStarving, c);
    }

    roamAnimId = requestAnimationFrame(loop);
  }

  loop();
}

function updateRoamingPhysics(r, c, w, h, updateStatusUI, spawnFloatingFeedback) {
  // 1. 蟲子隨機生成機制
  if (!gameState.activeBug && Math.random() < 0.003) {
    gameState.activeBug = {
      x: Math.random() * (w - 120) + 60,
      y: Math.random() * (h - 160) + 90,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      appearTime: Date.now(),
      chasedTime: 0
    };
  }

  // 2. 蟲子移動與貓咪追逐 AI
  let isChasingBug = false;
  if (gameState.activeBug) {
    const b = gameState.activeBug;
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 30 || b.x > w - 30) b.vx *= -1;
    if (b.y < 70 || b.y > h - 30) b.vy *= -1;

    const timeAlive = Date.now() - b.appearTime;

    // 出現 3 秒後貓咪開始追捕
    if (timeAlive > 3000 && !r.isSleepingInCage && !r.isStarving && gameState.activeInteractionMode !== 'toy') {
      isChasingBug = true;
      const dx = b.x - r.x;
      const dy = b.y - r.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 25) {
        r.x += (dx / dist) * 2.6;
        r.y += (dy / dist) * 2.6;
        r.facing = dx > 0 ? 1 : -1;
        r.isWalking = true;
      } else {
        r.isWalking = false;
        b.chasedTime += 16;
        // 貓咪抓到停留 5 秒後蟲子消失
        if (b.chasedTime > 5000) {
          gameState.activeBug = null;
        }
      }
    }
  }

  if (isChasingBug) return;

  // 3. 正在睡窩休息
  if (r.isSleepingInCage) return;

  // 4. 逗貓棒追逐判定
  if (gameState.activeInteractionMode === 'toy' && r.mouseX !== undefined && !r.isStarving) {
    const dx = r.mouseX - r.x;
    const dy = r.mouseY - r.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 35 && dist < 320) {
      r.x += (dx / dist) * 2.2;
      r.y += (dy / dist) * 2.2;
      r.facing = dx > 0 ? 1 : -1;
      r.isWalking = true;
      return;
    }
  }

  // 5. 驚嚇逃跑模式
  if (r.isScurrying) {
    r.x += r.facing * 3.5;
    r.y += r.vy || 0;
    r.scurryTimer = (r.scurryTimer || 0) + 1;
    if (r.x < 50 || r.x > w - 160) r.facing *= -1;
    if (r.y < 80 || r.y > h - 50) r.vy = -(r.vy || 1);
    r.isWalking = true;
    if (r.scurryTimer > 45) {
      r.isScurrying = false;
      r.scurryTimer = 0;
    }
    return;
  }

  // 6. 疲勞主動回窩睡覺
  if (c.energy < 25 && Math.random() < 0.02) {
    startSleepingInCage(updateStatusUI, spawnFloatingFeedback);
    return;
  }

  // 7. 日常自由漫步
  if (Math.random() < 0.02) {
    r.isWalking = !r.isWalking;
    if (r.isWalking) {
      r.vx = (Math.random() - 0.5) * 1.8;
      r.vy = (Math.random() - 0.5) * 1.2;
      r.facing = r.vx > 0 ? 1 : -1;
    }
  }

  if (r.isWalking && !r.isStarving) {
    r.x += r.vx;
    r.y += r.vy;

    if (r.x < 50) { r.x = 50; r.vx *= -1; r.facing = 1; }
    if (r.x > w - 160) { r.x = w - 160; r.vx *= -1; r.facing = -1; }
    if (r.y < 80) { r.y = 80; r.vy *= -1; }
    if (r.y > h - 50) { r.y = h - 50; r.vy *= -1; }
  }
}

function startSleepingInCage(updateStatusUI, spawnFloatingFeedback) {
  const r = gameState.roamState;
  const c = gameState.currentCat;
  const canvas = document.getElementById('roam-canvas');
  const w = canvas ? canvas.width : 640;

  r.isSleepingInCage = true;
  r.x = w - 75;
  r.y = 95;
  r.sleepTargetSeconds = Math.floor(Math.random() * 25) + 10;
  r.sleepElapsedSeconds = 0;

  if (sleepInterval) clearInterval(sleepInterval);
  sleepInterval = setInterval(() => {
    if (!r.isSleepingInCage || gameState.isPaused) return;
    r.sleepElapsedSeconds++;
    c.energy = Math.min(100, c.energy + 1.5);
    updateStatusUI();

    if (r.sleepElapsedSeconds >= r.sleepTargetSeconds) {
      clearInterval(sleepInterval);
      r.isSleepingInCage = false;
      r.x = w - 150;
      r.y = 120;
      if (Math.random() < 0.4) {
        c.health = Math.min(100, c.health + 1);
        spawnFloatingFeedback(r.x, r.y - 20, "睡得好香！抵抗力+1 🩺");
      }
      document.getElementById('ui-state-pill').innerText = "🐾 睡飽了，精神滿滿！";
      updateStatusUI();
    }
  }, 1000);
}

function drawBug(ctx, bug) {
  ctx.save();
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(bug.x, bug.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2C3E50';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bug.x, bug.y);
  ctx.lineTo(bug.x - 4, bug.y - 5);
  ctx.moveTo(bug.x, bug.y);
  ctx.lineTo(bug.x + 4, bug.y - 5);
  ctx.stroke();
  ctx.restore();
}

function drawHighQualityRoomScene(ctx, w, h) {
  ctx.fillStyle = '#F4EFE6';
  ctx.fillRect(0, 0, w, h);

  // 柔和圓形地毯
  const rugGrad = ctx.createRadialGradient(w/2, h/2 + 25, 20, w/2, h/2 + 25, w * 0.38);
  rugGrad.addColorStop(0, '#ECE5D8');
  rugGrad.addColorStop(1, '#E1D9CC');
  ctx.fillStyle = rugGrad;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 + 25, w * 0.36, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // 木質地坪刻線
  ctx.strokeStyle = '#E0DAD0';
  ctx.lineWidth = 1.5;
  for (let y = 60; y < h; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 右上角貓窩
  ctx.save();
  ctx.fillStyle = '#C8B9A6';
  ctx.fillRect(w - 130, 45, 115, 80);
  ctx.fillStyle = '#DFD6C9';
  ctx.fillRect(w - 124, 51, 103, 68);
  ctx.fillStyle = '#C0392B';
  ctx.beginPath();
  ctx.roundRect(w - 116, 85, 87, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#6E2C00';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('🐾 貓窩', w - 100, 68);
  ctx.restore();

  // 右下角砂盆
  ctx.save();
  ctx.fillStyle = '#7F8C8D';
  ctx.beginPath();
  ctx.roundRect(w - 130, h - 95, 115, 75, 12);
  ctx.fill();
  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.roundRect(w - 124, h - 89, 103, 63, 10);
  ctx.fill();
  ctx.fillStyle = '#34495E';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('🚽 專用礦砂盆', w - 112, h - 52);
  ctx.restore();

  // 水碗與食碗
  drawFoodAndWater(ctx, w, h);
}

function drawFoodAndWater(ctx, w, h) {
  const waterRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.water / 100)) : 1;
  ctx.fillStyle = '#E5E8E8';
  ctx.beginPath();
  ctx.arc(60, h - 60, 26, 0, Math.PI * 2);
  ctx.fill();
  if (waterRatio > 0.05) {
    ctx.fillStyle = '#5DADE2';
    ctx.beginPath();
    ctx.arc(60, h - 60, 20 * Math.sqrt(waterRatio), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`水盆(${gameState.currentCat ? Math.round(gameState.currentCat.water) : 100}%)`, 36, h - 22);

  const hungerRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.hunger / 100)) : 1;
  ctx.fillStyle = '#EDBB99';
  ctx.beginPath();
  ctx.arc(140, h - 60, 26, 0, Math.PI * 2);
  ctx.fill();
  if (hungerRatio > 0.05) {
    ctx.fillStyle = '#6E2C00';
    ctx.beginPath();
    ctx.arc(140, h - 60, 20 * Math.sqrt(hungerRatio), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`食碗(${gameState.currentCat ? Math.round(gameState.currentCat.hunger) : 100}%)`, 116, h - 22);
}

function drawPoops(ctx) {
  gameState.roomPoops.forEach(p => {
    ctx.font = '22px serif';
    ctx.fillText('💩', p.x - 11, p.y + 8);
  });
}

function drawToyFeather(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#D35400';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 20);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = '#E74C3C';
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F39C12';
  ctx.beginPath();
  ctx.arc(x + 5, y - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRoamingCat(ctx, x, y, facing, isWalking, isSleeping, isStarving, cat) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  const color = cat.breed.color || '#E67E22';
  const stripe = cat.breed.stripe || '#D35400';

  if (isSleeping) {
    // 蜷縮入眠型態
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('💤', 5, -12);
  } else {
    // 身體
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 斑紋
    ctx.fillStyle = stripe;
    ctx.beginPath();
    ctx.ellipse(-4, -4, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -4, 4, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 頭部
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(20, -10, 16, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12, -22); ctx.lineTo(18, -32); ctx.lineTo(24, -22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -22); ctx.lineTo(28, -32); ctx.lineTo(34, -22); ctx.fill();

    // 眼睛
    ctx.fillStyle = '#2C3E50';
    if (isStarving) {
      ctx.font = '12px sans-serif';
      ctx.fillText('X', 18, -8);
      ctx.fillText('X', 26, -8);
    } else {
      ctx.beginPath();
      ctx.arc(20, -10, 2.5, 0, Math.PI * 2);
      ctx.arc(28, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 尾巴
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tailWiggle = isWalking ? Math.sin(Date.now() * 0.008) * 8 : 0;
    ctx.moveTo(-22, 2);
    ctx.quadraticCurveTo(-32, -12 + tailWiggle, -36, -24 + tailWiggle);
    ctx.stroke();

    // 貓腳走動動畫
    ctx.fillStyle = color;
    const legOffset = isWalking ? Math.sin(Date.now() * 0.015) * 6 : 0;
    ctx.fillRect(-14 + legOffset, 14, 6, 8);
    ctx.fillRect(8 - legOffset, 14, 6, 8);
  }

  ctx.restore();
}

// 貓咪花園天堂
export function initParadiseGarden() {
  const canvas = document.getElementById('paradise-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 800;
  canvas.height = 400;

  if (paradiseAnimId) cancelAnimationFrame(paradiseAnimId);

  function renderGarden() {
    ctx.fillStyle = '#E8F5E9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 青翠草坪紋理
    ctx.fillStyle = '#C8E6C9';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 47) % canvas.width, (i * 29) % canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 繪製在天堂漫步的所有毛孩
    const list = gameState.myStarCats || [];
    list.forEach((c, idx) => {
      const px = ((idx * 160 + Date.now() * 0.02) % (canvas.width - 80)) + 40;
      const py = 120 + ((idx * 67) % 200);

      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = c.color || '#E67E22';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(14, -8, 12, 0, Math.PI * 2);
      ctx.fill();

      // 天使光環
      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(14, -24, 10, 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(c.name, -10, 26);
      ctx.restore();
    });

    paradiseAnimId = requestAnimationFrame(renderGarden);
  }

  renderGarden();
}