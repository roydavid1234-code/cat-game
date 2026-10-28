import { gameState } from './game-state.js';

let roamingAnimId = null;
let paradiseAnimId = null;

// ==========================================
// 輔助繪圖：安全圓角矩形
// ==========================================
function safeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ==========================================
// 房間背景、貓砂盆與食水盆繪製
// ==========================================
function drawRoomBackground(ctx, w, h) {
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, w, h * 0.45);
  ctx.fillStyle = '#E5E0D8';
  ctx.fillRect(0, h * 0.45 - 6, w, 6);

  ctx.fillStyle = '#F0ECE1';
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  ctx.strokeStyle = '#E2DDD4';
  ctx.lineWidth = 1;
  for (let y = h * 0.45 + 24; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 中央棉質地毯
  ctx.fillStyle = '#EBE5D8';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2 + 35, 170, 75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#DDD6C7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 貓窩
  ctx.save();
  ctx.translate(90, h * 0.45 - 20);
  ctx.fillStyle = '#D7CCC8';
  ctx.beginPath();
  ctx.ellipse(0, 10, 48, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFE0B2';
  ctx.beginPath();
  ctx.ellipse(0, 8, 38, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLitterBox(ctx, w, h) {
  const boxX = w - 95;
  const boxY = h - 60;
  const boxW = 86;
  const boxH = 44;

  ctx.save();
  ctx.translate(boxX, boxY);

  ctx.fillStyle = '#D5D8DC';
  safeRoundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 8);
  ctx.fill();
  ctx.strokeStyle = '#BDC3C7';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#BDC3C7';
  safeRoundRect(ctx, -boxW / 2 + 5, -boxH / 2 + 4, boxW - 10, boxH - 18, 5);
  ctx.fill();

  ctx.fillStyle = '#95A5A6';
  for (let i = -boxW / 2 + 10; i < boxW / 2 - 8; i += 11) {
    ctx.fillRect(i, -boxH / 2 + 9, 3, 2);
  }

  ctx.fillStyle = '#2C3E50';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('貓砂盆', 0, boxH / 2 - 7);
  ctx.restore();
}

function drawFoodAndWater(ctx, w, h) {
  const isAutoWater = gameState.shopInventory?.autoWater;
  const isAutoFeeder = gameState.shopInventory?.autoFeeder;

  const waterRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.water / 100)) : 1;
  ctx.save();
  ctx.translate(65, h - 55);
  if (isAutoWater) {
    ctx.fillStyle = '#FFFFFF';
    safeRoundRect(ctx, -24, -20, 48, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#5DADE2';
    ctx.beginPath();
    ctx.ellipse(0, 3, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = waterRatio > 0.3 ? '#2ECC71' : '#E74C3C';
    ctx.beginPath();
    ctx.arc(0, 14, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A5276';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`活水機(${Math.round(waterRatio * 100)}%)`, 0, 32);
  } else {
    ctx.fillStyle = '#E5E8E8';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    if (waterRatio > 0.05) {
      ctx.fillStyle = '#5DADE2';
      ctx.beginPath();
      ctx.arc(0, 0, 17 * Math.sqrt(waterRatio), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`水盆(${Math.round(waterRatio * 100)}%)`, 0, 32);
  }
  ctx.restore();

  const hungerRatio = gameState.currentCat ? Math.max(0, Math.min(1, gameState.currentCat.hunger / 100)) : 1;
  ctx.save();
  ctx.translate(145, h - 55);
  if (isAutoFeeder) {
    ctx.fillStyle = '#BDC3C7';
    safeRoundRect(ctx, -16, -32, 32, 28, 5);
    ctx.fill();
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-14, -30, 28, 5);

    ctx.fillStyle = '#FFFFFF';
    safeRoundRect(ctx, -22, 0, 44, 20, 7);
    ctx.fill();
    ctx.strokeStyle = '#E67E22';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    if (hungerRatio > 0.05) {
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(0, 9, 12 * Math.sqrt(hungerRatio), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#6E2C00';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`餵食器(${Math.round(hungerRatio * 100)}%)`, 0, 32);
  } else {
    ctx.fillStyle = '#EDBB99';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    if (hungerRatio > 0.05) {
      ctx.fillStyle = '#6E2C00';
      ctx.beginPath();
      ctx.arc(0, 0, 17 * Math.sqrt(hungerRatio), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`食盆(${Math.round(hungerRatio * 100)}%)`, 0, 32);
  }
  ctx.restore();
}

function drawPoops(ctx) {
  const poops = gameState.roomPoops || [];
  poops.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#6D4C41';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBug(ctx) {
  const b = gameState.activeBug;
  if (!b) return;

  ctx.save();
  ctx.translate(b.x, b.y);

  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#34495E';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, -2); ctx.lineTo(8, -6);
  ctx.moveTo(4, 2); ctx.lineTo(8, 6);
  ctx.stroke();

  const legWiggle = Math.sin(Date.now() * 0.02) * 2;
  ctx.beginPath();
  ctx.moveTo(-2, -4); ctx.lineTo(-4 + legWiggle, -7);
  ctx.moveTo(0, -4); ctx.lineTo(0, -7);
  ctx.moveTo(2, -4); ctx.lineTo(4 - legWiggle, -7);
  ctx.moveTo(-2, 4); ctx.lineTo(-4 - legWiggle, 7);
  ctx.moveTo(0, 4); ctx.lineTo(0, 7);
  ctx.moveTo(2, 4); ctx.lineTo(4 + legWiggle, 7);
  ctx.stroke();

  ctx.restore();
}

function drawToyFeather(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = '#D35400';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-28, -28);
  ctx.lineTo(0, 0);
  ctx.stroke();

  ctx.strokeStyle = '#BDC3C7';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, 12, 14, 8);
  ctx.stroke();

  ctx.fillStyle = '#F1C40F';
  ctx.beginPath();
  ctx.arc(14, 8, 4, 0, Math.PI * 2);
  ctx.fill();

  const wag = Math.sin(Date.now() * 0.015) * 4;
  ctx.fillStyle = '#E91E63';
  ctx.beginPath();
  ctx.ellipse(22 + wag, 12, 10, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00BCD4';
  ctx.beginPath();
  ctx.ellipse(20, 16 + wag, 9, 3.5, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFEB3B';
  ctx.beginPath();
  ctx.ellipse(24, 6 - wag, 8, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// 掃地機器人 AI
// ==========================================
let robotState = {
  x: 230,
  y: 210,
  vx: 1.1,
  vy: 0.8,
  targetPoop: null,
  cleanTimer: 0
};

function updateAndDrawSweeperRobot(ctx, w, h, spawnFloatingFeedback, updateStatusUI) {
  if (gameState.isPaused) {
    drawRobotGraphic(ctx, robotState.x, robotState.y, false);
    return;
  }

  const poops = gameState.roomPoops || [];
  if (poops.length > 0) {
    if (!robotState.targetPoop || !poops.includes(robotState.targetPoop)) {
      robotState.targetPoop = poops[0];
      robotState.cleanTimer = 0;
    }

    const dx = robotState.targetPoop.x - robotState.x;
    const dy = robotState.targetPoop.y - robotState.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      robotState.x += (dx / dist) * 1.8;
      robotState.y += (dy / dist) * 1.8;
      robotState.cleanTimer = 0;
    } else {
      robotState.cleanTimer++;
      if (robotState.cleanTimer >= 180) {
        const pIndex = poops.indexOf(robotState.targetPoop);
        if (pIndex !== -1) {
          poops.splice(pIndex, 1);
        }
        gameState.userCoins += 1;
        if (typeof spawnFloatingFeedback === 'function') {
          spawnFloatingFeedback(robotState.x, robotState.y - 15, "+1 貓幣 (清潔完成) 🤖✨");
        }
        if (typeof updateStatusUI === 'function') {
          updateStatusUI();
        }
        robotState.targetPoop = null;
        robotState.cleanTimer = 0;
      }
    }
  } else {
    robotState.cleanTimer = 0;
    robotState.targetPoop = null;
    robotState.x += robotState.vx;
    robotState.y += robotState.vy;

    if (robotState.x < 70 || robotState.x > w - 140) robotState.vx *= -1;
    if (robotState.y < 120 || robotState.y > h - 70) robotState.vy *= -1;
  }

  drawRobotGraphic(ctx, robotState.x, robotState.y, robotState.cleanTimer > 0);
}

function drawRobotGraphic(ctx, x, y, isCleaning) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 17, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#34495E';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ECF0F1';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#BDC3C7';
  ctx.beginPath();
  ctx.arc(-2, -3, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isCleaning ? '#E74C3C' : '#2ECC71';
  ctx.beginPath();
  ctx.arc(3, 3, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (isCleaning) {
    ctx.fillStyle = '#C0392B';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧹清潔中(3s)', 0, -18);
  }

  ctx.restore();
}

// ==========================================
// 實體貓咪繪製
// ==========================================
export function drawRoamingCat(ctx, x, y, facing, isWalking, isSleeping, isStarving, cat) {
  const posX = (isNaN(x) || x === undefined) ? 320 : x;
  const posY = (isNaN(y) || y === undefined) ? 250 : y;
  const dir = facing === -1 ? -1 : 1;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.scale(dir, 1);

  const color = (cat && cat.breed && cat.breed.color) || (cat && cat.color) || '#E67E22';
  const stripe = (cat && cat.breed && cat.breed.stripe) || (cat && cat.stripe) || '#D35400';

  if (isSleeping) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 8, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(14, 2, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stripe;
    ctx.beginPath();
    ctx.moveTo(11, -7); ctx.lineTo(15, -14); ctx.lineTo(19, -6);
    ctx.fill();

    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(18, 2, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#8E44AD';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Zzz..', 22, -10);
    ctx.restore();
    return;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const tailWag = Math.sin(Date.now() * 0.006) * 6;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.quadraticCurveTo(-26, -4 + tailWag, -22, -16 + tailWag);
  ctx.stroke();

  const legOffset = isWalking ? Math.sin(Date.now() * 0.012) * 5 : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, 10); ctx.lineTo(-10 + legOffset, 17);
  ctx.moveTo(8, 10); ctx.lineTo(8 - legOffset, 17);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 4, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = stripe;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-4, -6); ctx.lineTo(-4, 2);
  ctx.moveTo(4, -7); ctx.lineTo(4, 1);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(16, -4, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stripe;
  ctx.beginPath();
  ctx.moveTo(10, -12); ctx.lineTo(14, -22); ctx.lineTo(18, -12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, -12); ctx.lineTo(22, -21); ctx.lineTo(26, -11);
  ctx.fill();

  if (isStarving) {
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(17, -6); ctx.lineTo(21, -2);
    ctx.moveTo(21, -6); ctx.lineTo(17, -2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(20, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#7F8C8D';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, -2); ctx.lineTo(30, -4);
  ctx.moveTo(22, 0); ctx.lineTo(31, 2);
  ctx.stroke();

  ctx.restore();
}

// ==========================================
// 房間漫步主迴圈（逗貓棒 15 秒 CD 數值增加）
// ==========================================
export function startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback) {
  let stageEl = document.getElementById('roaming-stage');
  let canvas = null;

  if (stageEl) {
    if (stageEl.tagName && stageEl.tagName.toLowerCase() === 'canvas') {
      canvas = stageEl;
    } else {
      canvas = stageEl.querySelector('canvas');
    }
  }

  if (!canvas) {
    canvas = document.getElementById('living-canvas') ||
             document.getElementById('cat-canvas') ||
             document.getElementById('room-canvas') ||
             document.getElementById('roaming-canvas') ||
             document.querySelector('#phase-game canvas') ||
             document.querySelector('canvas');
  }

  if (!canvas || typeof canvas.getContext !== 'function') {
    console.error('startRoamingLoop: 找不到有效的 canvas 繪圖節點');
    return;
  }

  const ctx = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 360;

  if (roamingAnimId) cancelAnimationFrame(roamingAnimId);

  canvas.onclick = onCanvasClick;
  if (stageEl && stageEl !== canvas) {
    stageEl.onclick = onCanvasClick;
  }

  const r = gameState.roamState || {
    x: 320, y: 250, vx: 0.8, vy: 0.5, facing: 1, isWalking: true, hitRadius: 40
  };

  const updateMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    r.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    r.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    r.isMouseOver = true;
  };
  const onMouseLeave = () => { r.isMouseOver = false; };

  canvas.onmousemove = updateMousePos;
  canvas.onmouseleave = onMouseLeave;
  if (stageEl && stageEl !== canvas) {
    stageEl.onmousemove = updateMousePos;
    stageEl.onmouseleave = onMouseLeave;
  }

  function loop() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    drawRoomBackground(ctx, w, h);
    drawFoodAndWater(ctx, w, h);
    drawLitterBox(ctx, w, h);
    drawPoops(ctx);

    // js/canvas-render.js (startRoamingLoop 函式內)

// 1. 蟲子生成頻率調低至約 10 秒一次 (約 0.0016 概率)
if (!gameState.activeBug && !gameState.isPaused && Math.random() < 0.0016) {
  gameState.activeBug = {
    x: Math.random() * 400 + 120,
    y: Math.random() * 140 + 170,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.2,
    spawnTime: Date.now() // 記錄出現時間
  };
}

// 2. 蟲子不論移動或停止，只要出現滿 5 秒就被吃掉
if (gameState.activeBug) {
  const bug = gameState.activeBug;
  
  if (Date.now() - bug.spawnTime >= 5000) {
    // 滿 5 秒自動吃掉消失
    gameState.activeBug = null;
    const c = gameState.currentCat;
    if (c) {
      c.health = Math.max(0, c.health - 1);
      c.energy = Math.max(0, c.energy - 1);
      spawnFloatingFeedback(r.x, r.y - 20, "蟲子被吃掉了！抵抗-1 活力-1 🤢", true);
      updateStatusUI();
    }
  } else {
    // 5 秒內正常移動與繪製
    if (!gameState.isPaused) {
      bug.x += bug.vx;
      bug.y += bug.vy;
      if (bug.x < 110 || bug.x > w - 120) bug.vx *= -1;
      if (bug.y < h * 0.45 + 15 || bug.y > h - 50) bug.vy *= -1;
    }
    drawBug(ctx);
  }
}

    if (gameState.activeBug) {
      const bug = gameState.activeBug;
      if (!gameState.isPaused) {
        bug.x += bug.vx;
        bug.y += bug.vy;
        if (bug.x < 110 || bug.x > w - 120) bug.vx *= -1;
        if (bug.y < h * 0.45 + 15 || bug.y > h - 50) bug.vy *= -1;
      }
      drawBug(ctx);

      if (!gameState.isPaused && !r.isSleepingInCage && !r.isScurrying) {
        const dx = bug.x - r.x;
        const dy = bug.y - r.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 20) {
          r.x += (dx / dist) * 1.5;
          r.y += (dy / dist) * 1.5;
          r.facing = dx >= 0 ? 1 : -1;
          r.isWalking = true;
          bug.chasedTime = 0;
        } else {
          r.isWalking = false;
          bug.chasedTime += 16;
          if (bug.chasedTime > 4000) {
            gameState.activeBug = null;
            const c = gameState.currentCat;
            if (c) {
              c.health = Math.max(0, c.health - 1);
              c.energy = Math.max(0, c.energy - 1);
              c.happiness = Math.max(0, c.happiness - 1);
              spawnFloatingFeedback(r.x, r.y - 20, "把蟲子吃掉了！抵抗-1 活力-1 心情-1 🤢", true);
              updateStatusUI();
            }
          }
        }
      }
    }

    if (gameState.shopInventory?.autoCleaner) {
      try {
        updateAndDrawSweeperRobot(ctx, w, h, spawnFloatingFeedback, updateStatusUI);
      } catch (e) {
        console.error('Robot error:', e);
      }
    }

    if (!gameState.isPaused && !r.isSleepingInCage) {
      if (r.isScurrying) {
        r.x += r.vx;
        r.y += r.vy;
        r.scurryTimer--;
        if (r.scurryTimer <= 0) r.isScurrying = false;
      }
      // 逗貓棒吸引機制
      else if (gameState.activeInteractionMode === 'toy' && r.isMouseOver && r.mouseX !== undefined) {
        const dx = r.mouseX - r.x;
        const dy = r.mouseY - r.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 30) {
          r.x += (dx / dist) * 1.6;
          r.y += (dy / dist) * 1.6;
          r.facing = dx >= 0 ? 1 : -1;
          r.isWalking = true;
        } else {
          r.isWalking = false;
          if (Math.random() < 0.05) {
            const c = gameState.currentCat;
            if (c) {
              const now = Date.now();
              // 【修改處】逗貓棒觸發能力值增加冷卻時間改為 15 秒 (15000 ms)
              if (!gameState.lastToyStatTime || (now - gameState.lastToyStatTime >= 10000)) {
                gameState.lastToyStatTime = now;
                c.happiness = Math.min(100, c.happiness + 3);
                c.agility = (c.agility || 0) + 1; // 靈巧無上限
                spawnFloatingFeedback(r.x, r.y - 20, "撲到了！好玩 心情+3 靈巧+1 🪶✨");
                updateStatusUI();
              } else {
                // CD 冷卻中撲到只顯示動作反饋，不增長能力值
                spawnFloatingFeedback(r.x, r.y - 20, "撲到了！好玩 🪶");
              }
            }
          }
        }
      }
      else if (!gameState.activeBug) {
        r.x += r.vx;
        r.y += r.vy;

        if (r.x < 110) { r.x = 110; r.vx = Math.abs(r.vx); r.facing = 1; }
        if (r.x > w - 120) { r.x = w - 120; r.vx = -Math.abs(r.vx); r.facing = -1; }
        if (r.y < h * 0.45 + 15) { r.y = h * 0.45 + 15; r.vy = Math.abs(r.vy); }
        if (r.y > h - 50) { r.y = h - 50; r.vy = -Math.abs(r.vy); }

        if (Math.random() < 0.015) {
          r.vx = (Math.random() - 0.5) * 1.6;
          r.vy = (Math.random() - 0.5) * 1.2;
          r.facing = r.vx >= 0 ? 1 : -1;
        }
      }
    }

    try {
      drawRoamingCat(ctx, r.x, r.y, r.facing, r.isWalking, r.isSleepingInCage, r.isStarving, gameState.currentCat);
    } catch (err) {
      console.error('Cat draw error:', err);
    }

    if (gameState.activeInteractionMode === 'toy' && r.isMouseOver && r.mouseX !== undefined) {
      drawToyFeather(ctx, r.mouseX, r.mouseY);
    }

    roamingAnimId = requestAnimationFrame(loop);
  }

  loop();
}

// ==========================================
// 貓咪花園天堂：20 種療癒物件庫
// ==========================================
const ALL_20_OBJECTS = [
  { id: 1, type: 'tree', x: 120, y: 210, text: '🐾 爬上貓跳台' },
  { id: 2, type: 'cans', x: 670, y: 310, text: '🥫 大吃罐頭！' },
  { id: 3, type: 'yarn', x: 250, y: 330, text: '🧶 玩滾滾毛線球' },
  { id: 4, type: 'box', x: 400, y: 320, text: '📦 鑽進紙箱～' },
  { id: 5, type: 'cushion', x: 530, y: 330, text: '🌻 花朵軟墊曬太陽' },
  { id: 6, type: 'catnip', x: 190, y: 230, text: '🌿 狂吸貓草好嗨！' },
  { id: 7, type: 'fountain', x: 600, y: 200, text: '💧 咕嚕喝甘泉' },
  { id: 8, type: 'fish_plate', x: 470, y: 210, text: '🐟 嚼嚼香噴噴魚乾' },
  { id: 9, type: 'feather', x: 720, y: 230, text: '🪶 跳躍撲羽毛' },
  { id: 10, type: 'cloud_bed', x: 330, y: 190, text: '☁️ 雲朵床做美夢' },
  { id: 11, type: 'scratching_post', x: 80, y: 320, text: '🐾 磨磨小爪爪' },
  { id: 12, type: 'aquarium', x: 700, y: 170, text: '🐠 盯著小魚游呀游' },
  { id: 13, type: 'teepee', x: 150, y: 335, text: '⛺ 鑽進小帳篷打盹' },
  { id: 14, type: 'icecream_cart', x: 380, y: 240, text: '🍦 貓草冰淇淋甜滋滋' },
  { id: 15, type: 'windchime', x: 640, y: 255, text: '🎐 聽風鈴叮叮噹噹' },
  { id: 16, type: 'onsen_tub', x: 560, y: 260, text: '♨️ 泡在溫泉裡呼嚕嚕' },
  { id: 17, type: 'cheese_tunnel', x: 220, y: 280, text: '🧀 穿過起司大隧道' },
  { id: 18, type: 'milk_pail', x: 460, y: 270, text: '🥛 舔舔香濃鮮牛奶' },
  { id: 19, type: 'flower_patch', x: 300, y: 260, text: '🌸 在花叢裡捉迷藏' },
  { id: 20, type: 'sun_terrace', x: 80, y: 240, text: '☀️ 暖洋洋曬太陽' }
];

function getOrUpdateParadiseObjects() {
  const catCount = (gameState.myStarCats || []).length;
  const neededCount = Math.min(20, 3 + Math.floor(catCount / 5));

  let savedIds = JSON.parse(localStorage.getItem('unlocked_paradise_object_ids') || '[]');

  if (savedIds.length < neededCount) {
    const availablePool = ALL_20_OBJECTS.map(o => o.id).filter(id => !savedIds.includes(id));
    for (let i = availablePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
    }

    while (savedIds.length < neededCount && availablePool.length > 0) {
      savedIds.push(availablePool.pop());
    }

    localStorage.setItem('unlocked_paradise_object_ids', JSON.stringify(savedIds));
  }

  return ALL_20_OBJECTS.filter(o => savedIds.includes(o.id));
}

let paradiseAgents = [];

export function initParadiseGarden() {
  const canvas = document.getElementById('paradise-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 800;
  canvas.height = 400;

  if (paradiseAnimId) cancelAnimationFrame(paradiseAnimId);

  const activeObjects = getOrUpdateParadiseObjects();

  const sourceCats = (gameState.myStarCats && gameState.myStarCats.length > 0)
    ? gameState.myStarCats
    : [
        { name: '天使小橘', color: '#E67E22', stripe: '#D35400' },
        { name: '守護三花', color: '#F39C12', stripe: '#2C3E50' }
      ];

  paradiseAgents = sourceCats.map((c, idx) => ({
    id: idx,
    name: c.name,
    color: c.color || '#E67E22',
    stripe: c.stripe || '#D35400',
    x: 80 + (idx * 130) % 640,
    y: 190 + (idx * 35) % 150,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.2,
    speed: 1.3,
    facing: 1,
    isWalking: true,
    state: 'wander',
    timer: Math.floor(Math.random() * 80) + 40,
    outsideTimer: 0,
    targetObj: null,
    targetCat: null,
    bubbleText: ''
  }));

  function renderGarden() {
    ctx.fillStyle = '#E8F5E9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#C8E6C9';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc((i * 47) % canvas.width, (i * 29) % canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    activeObjects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.x, obj.y);

      switch (obj.type) {
        case 'tree':
          ctx.fillStyle = '#D7CCC8'; ctx.fillRect(-8, -40, 16, 90);
          ctx.fillStyle = '#A1887F';
          ctx.fillRect(-35, -40, 70, 10); ctx.fillRect(-50, 0, 50, 10); ctx.fillRect(5, 20, 50, 10);
          ctx.fillStyle = '#8D6E63'; ctx.fillRect(-25, -75, 50, 35);
          ctx.fillStyle = '#3E2723'; ctx.beginPath(); ctx.arc(0, -57, 12, 0, Math.PI * 2); ctx.fill();
          break;

        case 'cans':
          ctx.fillStyle = '#90A4AE';
          ctx.fillRect(-18, 0, 32, 18); ctx.fillRect(16, 0, 32, 18);
          ctx.fillStyle = '#CFD8DC'; ctx.fillRect(-1, -18, 32, 18);
          ctx.fillStyle = '#E57373';
          ctx.fillRect(-18, 5, 32, 8); ctx.fillRect(16, 5, 32, 8); ctx.fillRect(-1, -13, 32, 8);
          break;

        case 'yarn':
          ctx.fillStyle = '#BA68C8'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#9C27B0'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(8, 5); ctx.moveTo(0, -10); ctx.lineTo(-5, 9); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(10, 5); ctx.quadraticCurveTo(24, 20, 42, 12); ctx.stroke();
          break;

        case 'box':
          ctx.fillStyle = '#D4AC0D'; safeRoundRect(ctx, -22, -15, 44, 30, 4); ctx.fill();
          ctx.fillStyle = '#B7950B'; ctx.fillRect(-22, -15, 44, 6);
          ctx.fillStyle = '#7D6608'; ctx.beginPath(); ctx.arc(0, 2, 4, 0, Math.PI * 2); ctx.fill();
          break;

        case 'cushion':
          ctx.fillStyle = '#F4D03F';
          for (let a = 0; a < 8; a++) {
            const rad = (a * Math.PI) / 4;
            ctx.beginPath(); ctx.arc(Math.cos(rad) * 16, Math.sin(rad) * 12, 8, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = '#E67E22'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
          break;

        case 'catnip':
          ctx.fillStyle = '#E59866'; ctx.beginPath();
          ctx.moveTo(-12, 12); ctx.lineTo(12, 12); ctx.lineTo(15, -4); ctx.lineTo(-15, -4); ctx.fill();
          ctx.strokeStyle = '#27AE60'; ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-12, -22, -6, -26);
          ctx.moveTo(0, -4); ctx.lineTo(0, -28);
          ctx.moveTo(6, -4); ctx.quadraticCurveTo(12, -20, 8, -25);
          ctx.stroke();
          break;

        case 'fountain':
          ctx.fillStyle = '#AED6F1'; ctx.beginPath(); ctx.ellipse(0, 6, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5DADE2'; ctx.beginPath(); ctx.arc(0, 2, 6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#3498DB'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -14, -10, -6);
          ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -14, 10, -6); ctx.stroke();
          break;

        case 'fish_plate':
          ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(0, 4, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#F39C12';
          ctx.beginPath(); ctx.ellipse(-6, 3, 9, 4, 0.2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(7, 4, 8, 3.5, -0.2, 0, Math.PI * 2); ctx.fill();
          break;

        case 'feather':
          ctx.fillStyle = '#BDC3C7'; ctx.fillRect(-3, -25, 6, 35);
          ctx.fillStyle = '#E74C3C'; ctx.beginPath(); ctx.arc(-5, -28, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#F1C40F'; ctx.beginPath(); ctx.arc(4, -30, 6, 0, Math.PI * 2); ctx.fill();
          break;

        case 'cloud_bed':
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-14, 0, 14, 0, Math.PI * 2);
          ctx.arc(14, 0, 14, 0, Math.PI * 2);
          ctx.arc(0, -6, 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#F39C12'; ctx.fillText('★', -2, -1);
          break;

        case 'scratching_post':
          ctx.fillStyle = '#8D6E63'; ctx.fillRect(-16, 14, 32, 6);
          ctx.fillStyle = '#D7CCC8'; ctx.fillRect(-7, -24, 14, 38);
          ctx.strokeStyle = '#BCAAA4'; ctx.lineWidth = 1.5;
          for (let sy = -20; sy <= 10; sy += 5) {
            ctx.beginPath(); ctx.moveTo(-7, sy); ctx.lineTo(7, sy); ctx.stroke();
          }
          break;

        case 'aquarium':
          ctx.fillStyle = 'rgba(129, 212, 250, 0.7)';
          safeRoundRect(ctx, -18, -16, 36, 26, 6); ctx.fill();
          ctx.strokeStyle = '#4FC3F7'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#FF7043'; ctx.beginPath(); ctx.ellipse(2, -3, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
          break;

        case 'teepee':
          ctx.fillStyle = '#FFF8E1';
          ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(-20, 16); ctx.lineTo(20, 16); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#D7CCC8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-3, -32); ctx.lineTo(-18, 16); ctx.moveTo(3, -32); ctx.lineTo(18, 16); ctx.stroke();
          ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(0, 16, 8, Math.PI, 0); ctx.fill();
          break;

        case 'icecream_cart':
          ctx.fillStyle = '#FFCCBC'; safeRoundRect(ctx, -16, -10, 32, 22, 4); ctx.fill();
          ctx.fillStyle = '#42A5F5'; ctx.fillRect(-18, -16, 36, 6);
          ctx.fillStyle = '#26A69A'; ctx.beginPath(); ctx.arc(0, -20, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.arc(-10, 12, 5, 0, Math.PI * 2); ctx.arc(10, 12, 5, 0, Math.PI * 2); ctx.fill();
          break;

        case 'windchime':
          ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -22); ctx.lineTo(14, -22); ctx.stroke();
          ctx.fillStyle = '#AB47BC'; ctx.beginPath(); ctx.ellipse(14, -14, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#CE93D8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -7); ctx.lineTo(14, 0); ctx.stroke();
          break;

        case 'onsen_tub':
          ctx.fillStyle = '#D7CCC8'; safeRoundRect(ctx, -18, -6, 36, 20, 6); ctx.fill();
          ctx.strokeStyle = '#8D6E63'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#81D4FA'; ctx.beginPath(); ctx.ellipse(0, -4, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-4, -10); ctx.quadraticCurveTo(-2, -16, -4, -20); ctx.moveTo(4, -10); ctx.quadraticCurveTo(6, -16, 4, -20); ctx.stroke();
          break;

        case 'cheese_tunnel':
          ctx.fillStyle = '#FDD835';
          ctx.beginPath(); ctx.arc(0, 10, 20, Math.PI, 0); ctx.lineTo(20, 14); ctx.lineTo(-20, 14); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#F57F17';
          ctx.beginPath(); ctx.arc(-8, -2, 4, 0, Math.PI * 2); ctx.arc(7, 3, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3E2723'; ctx.beginPath(); ctx.arc(0, 14, 12, Math.PI, 0); ctx.fill();
          break;

        case 'milk_pail':
          ctx.fillStyle = '#CFD8DC'; ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(-14, -6); ctx.lineTo(14, -6); ctx.lineTo(10, 14); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(0, -6, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#90A4AE'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -10, 12, Math.PI, 0); ctx.stroke();
          break;

        case 'flower_patch':
          ctx.fillStyle = '#81C784'; ctx.beginPath(); ctx.ellipse(0, 6, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
          const fColors = ['#F48FB1', '#FFF59D', '#90CAF9'];
          [-10, 0, 10].forEach((fx, i) => {
            ctx.fillStyle = fColors[i];
            ctx.beginPath(); ctx.arc(fx, 3, 4, 0, Math.PI * 2); ctx.fill();
          });
          break;

        case 'sun_terrace':
          ctx.fillStyle = '#FFE082'; safeRoundRect(ctx, -20, 0, 40, 12, 4); ctx.fill();
          ctx.strokeStyle = '#FFB300'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#FF7043'; ctx.beginPath(); ctx.arc(-10, -8, 6, 0, Math.PI * 2); ctx.fill();
          break;
      }
      ctx.restore();
    });

    paradiseAgents.forEach(cat => {
      cat.timer--;
      cat.x += cat.vx;
      cat.y += cat.vy;
      if (cat.vx !== 0) cat.facing = cat.vx > 0 ? 1 : -1;

      const isOut = (cat.x < 10 || cat.x > 790 || cat.y < 140 || cat.y > 380);
      if (isOut) {
        cat.outsideTimer++;
        if (cat.outsideTimer > 180 || cat.x < -70 || cat.x > 870 || cat.y > 420 || cat.y < 110) {
          const targetX = 300 + Math.random() * 200;
          const targetY = 220 + Math.random() * 100;
          const dx = targetX - cat.x;
          const dy = targetY - cat.y;
          const dist = Math.hypot(dx, dy) || 1;
          cat.vx = (dx / dist) * (cat.speed * 1.3);
          cat.vy = (dy / dist) * (cat.speed * 1.3);
          cat.facing = cat.vx >= 0 ? 1 : -1;
          cat.outsideTimer = 0;
          cat.state = 'wander';
        }
      } else {
        cat.outsideTimer = 0;
      }

      if (!isOut) {
        if (cat.state === 'wander' && cat.timer <= 0) {
          const roll = Math.random();
          if (roll < 0.4 && activeObjects.length > 0) {
            cat.state = 'to_obj';
            cat.targetObj = activeObjects[Math.floor(Math.random() * activeObjects.length)];
            cat.timer = 180;
          } else if (roll < 0.7 && paradiseAgents.length > 1) {
            const others = paradiseAgents.filter(o => o.id !== cat.id);
            cat.targetCat = others[Math.floor(Math.random() * others.length)];
            cat.state = 'to_cat';
            cat.timer = 160;
          } else if (roll < 0.85) {
            cat.vx = (Math.random() > 0.5 ? 1 : -1) * (cat.speed * 1.2);
            cat.vy = (Math.random() - 0.5) * 1.2;
            cat.timer = 140;
          } else {
            cat.vx = (Math.random() - 0.5) * 1.6;
            cat.vy = (Math.random() - 0.5) * 1.2;
            cat.timer = 80;
          }
        } else if (cat.state === 'to_obj' && cat.targetObj) {
          const dx = cat.targetObj.x - cat.x;
          const dy = cat.targetObj.y - cat.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 25) {
            cat.x += (dx / dist) * cat.speed;
            cat.y += (dy / dist) * cat.speed;
            cat.facing = dx >= 0 ? 1 : -1;
          } else {
            cat.state = 'at_obj';
            cat.bubbleText = cat.targetObj.text;
            cat.timer = 110;
          }
        } else if (cat.state === 'at_obj' && cat.timer <= 0) {
          cat.bubbleText = '';
          cat.state = 'wander';
          cat.timer = 70;
        } else if (cat.state === 'to_cat' && cat.targetCat) {
          const dx = cat.targetCat.x - cat.x;
          const dy = cat.targetCat.y - cat.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 30) {
            cat.x += (dx / dist) * cat.speed;
            cat.y += (dy / dist) * cat.speed;
            cat.facing = dx >= 0 ? 1 : -1;
          } else {
            cat.bubbleText = '💕 蹭蹭玩耍';
            cat.timer = 90;
            cat.state = 'at_obj';
          }
        }
      }
    });

    const sorted = [...paradiseAgents].sort((a, b) => a.y - b.y);

    sorted.forEach(cat => {
      const mockCat = { breed: { color: cat.color, stripe: cat.stripe } };
      drawRoamingCat(ctx, cat.x, cat.y, cat.facing, cat.isWalking, false, false, mockCat);

      ctx.save();
      ctx.translate(cat.x, cat.y);

      ctx.strokeStyle = '#F1C40F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cat.facing * 18, -30, 11, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cat.name, 0, 30);

      if (cat.bubbleText) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        safeRoundRect(ctx, -55, -56, 110, 20, 8);
        ctx.fill();
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#9E2A2B';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(cat.bubbleText, 0, -42);
      }
      ctx.restore();
    });

    paradiseAnimId = requestAnimationFrame(renderGarden);
  }

  renderGarden();
}