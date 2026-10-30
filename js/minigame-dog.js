import { gameState, saveMyStarCats } from './game-state.js';
import { generateBreedThumbnail } from './data.js';
import { showCustomAlert, autoSaveCurrentCatProgress, renderHomeRankTab, renderMyMemories } from './ui-handler.js';

let canvas, ctx;
let gameLoopId;
let isPlaying = false;
let startTime = 0;
let survivalSeconds = 0;
let totalScore = 0;
let scoreMultiplier = 1.0;

const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 700;
const TILE_SIZE = 40;

const CAT_BASE_SPEED = 4.2;
const MAX_DOG_SPEED = 4.3;

let dogs = [];
let cats = [];
let pathHistory = [];
let catImages = [];
let activeItems = [];

let catVx = 0;
let catVy = 0;
let joystickVec = { x: 0, y: 0, active: false };

let lastDogSpawnSecond = 0;
let lastItemSpawnSecond = 0;

let buffCatSpeedUntil = 0;
let debuffDogSlowUntil = 0;
let debuffDogFreezeUntil = 0;
let floatingText = null;

const CORNERS = [
  { x: 90, y: 90 },
  { x: CANVAS_WIDTH - 90, y: 90 },
  { x: 90, y: CANVAS_HEIGHT - 90 },
  { x: CANVAS_WIDTH - 90, y: CANVAS_HEIGHT - 90 }
];

window.tempDogCats = [];
let selectedCatOrder = [];
let keys = { up: false, down: false, left: false, right: false };

let activeLeaderCat = null; // 【新增】用來精準儲存真正的隊長

export function openMinigameDogSelect() {
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const dogScoresMap = JSON.parse(localStorage.getItem('cat_dog_scores') || '{}');
  const playableCats = [];

  // 1. 陪伴中的主角貓
  if (gameState.currentCat) {
    const curBest = Math.max(gameState.currentCat.dogScore || 0, dogScoresMap['current'] || 0, dogScoresMap[gameState.currentCat.name] || 0);
    playableCats.push({
      catId: 'current',
      isLiving: true,
      name: gameState.currentCat.name,
      breed: gameState.currentCat.breed?.name || '米克斯貓',
      dogScore: curBest,
      color: gameState.currentCat.breed?.color || '#E67E22',
      stripe: gameState.currentCat.breed?.stripe || '#D35400',
      img: generateBreedThumbnail(gameState.currentCat.breed?.color || '#E67E22', gameState.currentCat.breed?.stripe || '#D35400')
    });
  }

  // 2. 貓星球天使貓
  (gameState.myStarCats || []).forEach(c => {
    if (myOwnedIds.includes(c.catId) || myOwnedIds.includes(c.id)) {
      const catKey = c.catId || c.id || c.name;
      const starBest = Math.max(c.dogScore || 0, c.dog_score || 0, dogScoresMap[catKey] || 0, dogScoresMap[c.name] || 0);
      playableCats.push({
        catId: c.catId || c.id,
        isLiving: false,
        name: c.name,
        breed: c.breed,
        dogScore: starBest,
        color: c.color,
        stripe: c.stripe,
        img: c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400')
      });
    }
  });

  if (playableCats.length < 3) {
    showCustomAlert("貓咪數量不足", `「小狗抓貓咪」需要至少 3 隻貓咪組隊喔！你目前擁有的貓咪共有 ${playableCats.length} 隻。`, "⚠️");
    return;
  }

  window.tempDogCats = playableCats;
  selectedCatOrder = [];
  renderDogSelectUI();
  document.getElementById('modal-minigame-dog-select')?.classList.remove('hidden');
}

export function closeMinigameDogSelect() {
  document.getElementById('modal-minigame-dog-select')?.classList.add('hidden');
}

window.toggleCatSelectDog = function(idx) {
  const existIdx = selectedCatOrder.indexOf(idx);
  if (existIdx > -1) {
    selectedCatOrder.splice(existIdx, 1);
  } else {
    if (selectedCatOrder.length >= 10) {
      showCustomAlert("隊伍已達上限", "每隊最多只能攜帶 10 隻貓咪出場喔！", "⚠️");
      return;
    }
    selectedCatOrder.push(idx);
  }
  renderDogSelectUI();
};

function renderDogSelectUI() {
  const container = document.getElementById('minigame-dog-list');
  const btnStart = document.getElementById('btn-start-dog-game');
  const summaryEl = document.getElementById('dog-select-summary');
  if (!container || !btnStart) return;

  container.innerHTML = '';
  window.tempDogCats.forEach((c, idx) => {
    const orderIndex = selectedCatOrder.indexOf(idx);
    const isSelected = orderIndex > -1;
    const isLeader = orderIndex === 0;
    const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    const borderClass = isSelected ? "border-[#9E2A2B] bg-[#FCE8E8]" : "border-[#E5E0D8] bg-white";
    const livingTag = c.isLiving ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold ml-1 border border-emerald-300">陪伴中</span>' : '';

    let tagHtml = '<div class="w-4 h-4 rounded-full border border-gray-300"></div>';
    let statusText = `最佳生存分: ${c.dogScore || 0} 分`;

    if (isLeader) {
      tagHtml = '<span class="text-[11px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">👑 隊長 (計分)</span>';
      statusText = '先發隊長 · 本局只記錄此貓成績';
    } else if (isSelected) {
      tagHtml = `<span class="text-[10px] bg-[#9E2A2B] text-white px-1.5 py-0.5 rounded-full font-bold">隊員 #${orderIndex + 1}</span>`;
      statusText = '已入隊 (提供同行倍率加成)';
    }

    container.innerHTML += `
      <button onclick="toggleCatSelectDog(${idx})" class="w-full flex items-center justify-between p-2.5 border-2 rounded-xl transition shadow-sm ${borderClass}">
        <div class="flex items-center gap-3">
          <img src="${thumb}" class="w-10 h-10 rounded-lg border border-[#E5E0D8] p-1 bg-[#FAF8F5]">
          <div class="text-left">
            <div class="font-bold text-xs text-[#2C2C2C] flex items-center">
              <span>${c.name}</span>
              ${livingTag}
            </div>
            <div class="text-[10px] text-[#7F7B75]">${statusText}</div>
          </div>
        </div>
        ${tagHtml}
      </button>
    `;
  });

  const count = selectedCatOrder.length;
  if (count >= 3 && count <= 10) {
    const mult = (1.0 + (count - 3) * 0.2).toFixed(1);
    const leaderCat = window.tempDogCats[selectedCatOrder[0]];
    btnStart.disabled = false;
    btnStart.innerText = `出發！開始挑戰 (${count} 隻貓咪)`;
    if (summaryEl) {
      summaryEl.innerHTML = `隊長：<strong class="text-[#9E2A2B]">${leaderCat.name}</strong>｜已選 <strong>${count}</strong> 隻（得分加成：<strong class="text-[#9E2A2B]">${mult} 倍</strong>）`;
    }
  } else {
    btnStart.disabled = true;
    btnStart.innerText = `請選擇 3 ~ 10 隻貓咪 (${count}/10)`;
    if (summaryEl) summaryEl.innerText = `已選擇 ${count} 隻貓咪（至少需要 3 隻才能出發）`;
  }
}

window.startDogGameFromSelect = function() {
  if (selectedCatOrder.length < 3) return;
  closeMinigameDogSelect();
  
  catImages = [];
  const selectedArr = selectedCatOrder.map(idx => window.tempDogCats[idx]);
  scoreMultiplier = 1.0 + (selectedArr.length - 3) * 0.2;

  // 【新增】明確綁定陣列的第 0 項為真正的隊長
  activeLeaderCat = selectedArr[0];

  selectedArr.forEach(c => {
    const img = new Image();
    img.src = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    catImages.push({ img, catData: c });
  });

  document.getElementById('modal-minigame-dog-play')?.classList.remove('hidden');
  document.getElementById('dog-overlay')?.classList.remove('hidden');
  document.getElementById('dog-controls-wrapper')?.classList.add('hidden');
  document.getElementById('dog-multiplier').innerText = scoreMultiplier.toFixed(1);
  
  canvas = document.getElementById('dog-canvas');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  setupJoystickControls();
};

export function closeMinigameDog() {
  isPlaying = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  document.getElementById('dog-controls-wrapper')?.classList.add('hidden');
  document.getElementById('modal-minigame-dog-play')?.classList.add('hidden');
}

window.startDogGameLoop = function() {
  document.getElementById('dog-overlay')?.classList.add('hidden');
  document.getElementById('dog-controls-wrapper')?.classList.remove('hidden');
  
  startTime = Date.now();
  survivalSeconds = 0;
  totalScore = 0;
  lastDogSpawnSecond = 0;
  lastItemSpawnSecond = 0;
  buffCatSpeedUntil = 0;
  debuffDogSlowUntil = 0;
  debuffDogFreezeUntil = 0;
  floatingText = null;
  catVx = 0;
  catVy = 0;
  joystickVec = { x: 0, y: 0, active: false };

  document.getElementById('dog-score').innerText = 0;
  document.getElementById('dog-time').innerText = 0;

  dogs = [{
    x: CANVAS_WIDTH / 2 - 20,
    y: CANVAS_HEIGHT - 80,
    speed: 2.2,
    freezeUntil: 0,
    isSmart: false,
    aiState: 'chase',
    stateUntil: 0,
    targetPos: { x: CANVAS_WIDTH / 2, y: 100 }
  }];

  cats = [];
  pathHistory = [];
  for (let i = 0; i < catImages.length; i++) {
    cats.push({ x: CANVAS_WIDTH / 2 - 20, y: 120 - i * 18 });
  }

  activeItems = [];
  keys = { up: false, down: false, left: false, right: false };
  isPlaying = true;
  
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  requestAnimationFrame(gameLoop);
};

function gameLoop() {
  if (!isPlaying) return;
  update();
  draw();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function update() {
  const now = Date.now();
  survivalSeconds = Math.floor((now - startTime) / 1000);
  
  totalScore = Math.floor(survivalSeconds * scoreMultiplier);
  document.getElementById('dog-score').innerText = totalScore;
  document.getElementById('dog-time').innerText = survivalSeconds;

  if (survivalSeconds > 0 && survivalSeconds % 10 === 0 && lastDogSpawnSecond !== survivalSeconds) {
    lastDogSpawnSecond = survivalSeconds;

    const prevDog = dogs[dogs.length - 1];
    const multiplier = dogs.length === 1 ? 1.2 : 1.3;
    let nextSpeed = prevDog ? Number((prevDog.speed * multiplier).toFixed(2)) : 2.5;
    const calculatedSpeed = Math.min(MAX_DOG_SPEED, nextSpeed);

    const spawnPoints = [
      { x: 60, y: CANVAS_HEIGHT - 90 },
      { x: CANVAS_WIDTH - 90, y: CANVAS_HEIGHT - 90 },
      { x: 60, y: 70 },
      { x: CANVAS_WIDTH - 90, y: 70 }
    ];
    const pt = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    dogs.push({
      x: pt.x,
      y: pt.y,
      speed: calculatedSpeed,
      freezeUntil: now + 2000,
      isSmart: true,
      aiState: 'chase',
      stateUntil: now + 2500,
      targetPos: { x: pt.x, y: pt.y }
    });

    spawnFloatingBanner("有新的狗狗加入");
  }

  if (survivalSeconds > 0 && survivalSeconds % 10 === 0 && lastItemSpawnSecond !== survivalSeconds) {
    lastItemSpawnSecond = survivalSeconds;
    const itemType = Math.floor(Math.random() * 3) + 1;
    activeItems.push({
      x: Math.random() * (CANVAS_WIDTH - 180) + 90,
      y: Math.random() * (CANVAS_HEIGHT - 180) + 90,
      type: itemType
    });
  }

  let baseCatSpeed = CAT_BASE_SPEED;
  if (now < buffCatSpeedUntil) baseCatSpeed = 6.5;

  let moved = false;
  let newX = cats[0].x;
  let newY = cats[0].y;

  if (joystickVec.active) {
    newX += joystickVec.x * baseCatSpeed;
    newY += joystickVec.y * baseCatSpeed;
    catVx = joystickVec.x;
    catVy = joystickVec.y;
    moved = true;
  } else {
    let vx = 0;
    let vy = 0;
    if (keys.up) { newY -= baseCatSpeed; vy -= 1; moved = true; }
    if (keys.down) { newY += baseCatSpeed; vy += 1; moved = true; }
    if (keys.left) { newX -= baseCatSpeed; vx -= 1; moved = true; }
    if (keys.right) { newX += baseCatSpeed; vx += 1; moved = true; }
    catVx = catVx * 0.7 + vx * 0.3;
    catVy = catVy * 0.7 + vy * 0.3;
  }

  if (newX < 0) newX = 0;
  if (newX > CANVAS_WIDTH - TILE_SIZE) newX = CANVAS_WIDTH - TILE_SIZE;
  if (newY < 0) newY = 0;
  if (newY > CANVAS_HEIGHT - TILE_SIZE) newY = CANVAS_HEIGHT - TILE_SIZE;

  cats[0].x = newX;
  cats[0].y = newY;

  if (moved) {
    pathHistory.push({ x: newX, y: newY });
    if (pathHistory.length > 250) pathHistory.shift();
  }

  const spacing = 12;
  for (let i = 1; i < cats.length; i++) {
    const targetIdx = pathHistory.length - (i * spacing);
    if (targetIdx >= 0 && pathHistory[targetIdx]) {
      cats[i].x = pathHistory[targetIdx].x;
      cats[i].y = pathHistory[targetIdx].y;
    }
  }

  for (let i = activeItems.length - 1; i >= 0; i--) {
    const item = activeItems[i];
    let picked = false;
    for (let c of cats) {
      if (Math.hypot(c.x + 20 - item.x, c.y + 20 - item.y) < 32) {
        picked = true;
        break;
      }
    }
    if (picked) {
      applyItemEffect(item.type, now);
      activeItems.splice(i, 1);
    }
  }

  const isAllDogsFrozen = now < debuffDogFreezeUntil;
  const anyDogAmbushing = dogs.some(d => d.aiState === 'ambush');

  dogs.forEach(dog => {
    if (now < dog.freezeUntil || isAllDogsFrozen) return;

    let currentDogSpeed = dog.speed;
    if (now < debuffDogSlowUntil) currentDogSpeed *= 0.5;

    if (dog.isSmart && now > dog.stateUntil) {
      const rand = Math.random();
      if (dogs.length >= 2 && !anyDogAmbushing && rand < 0.3) {
        dog.aiState = 'ambush';
        dog.stateUntil = now + 3500;
        const corner = CORNERS[Math.floor(Math.random() * CORNERS.length)];
        dog.targetPos = { x: corner.x, y: corner.y };
      } else if (rand < 0.48) {
        dog.aiState = 'pause';
        dog.stateUntil = now + 300;
      } else if (rand < 0.82) {
        dog.aiState = 'intercept';
        dog.stateUntil = now + 3000;
        const leadDist = 75;
        const targetPx = cats[0].x + catVx * leadDist;
        const targetPy = cats[0].y + catVy * leadDist;
        dog.targetPos = {
          x: Math.max(40, Math.min(CANVAS_WIDTH - 60, targetPx)),
          y: Math.max(40, Math.min(CANVAS_HEIGHT - 60, targetPy))
        };
      } else {
        dog.aiState = 'chase';
        dog.stateUntil = now + 2500;
      }
    }

    if (dog.aiState === 'pause') {
      // 停下 0.3 秒
    } else if (dog.aiState === 'intercept' || dog.aiState === 'ambush') {
      const angle = Math.atan2((dog.targetPos.y + 20) - (dog.y + 20), (dog.targetPos.x + 20) - (dog.x + 20));
      dog.x += Math.cos(angle) * currentDogSpeed;
      dog.y += Math.sin(angle) * currentDogSpeed;

      if (Math.hypot(dog.x - dog.targetPos.x, dog.y - dog.targetPos.y) < 50) {
        dog.aiState = 'chase';
      }
    } else {
      let targetCat = cats[0];
      let minDist = 9999;
      cats.forEach(c => {
        const d = Math.hypot((c.x + 20) - (dog.x + 20), (c.y + 20) - (dog.y + 20));
        if (d < minDist) {
          minDist = d;
          targetCat = c;
        }
      });
      const angle = Math.atan2((targetCat.y + 20) - (dog.y + 20), (targetCat.x + 20) - (dog.x + 20));
      dog.x += Math.cos(angle) * currentDogSpeed;
      dog.y += Math.sin(angle) * currentDogSpeed;
    }

    cats.forEach(c => {
      if (Math.hypot((c.x + 20) - (dog.x + 20), (c.y + 20) - (dog.y + 20)) < 26) {
        gameOver("有貓咪被小狗抓到了！🐶");
      }
    });
  });
}

function applyItemEffect(type, now) {
  if (type === 1) {
    buffCatSpeedUntil = now + 5000;
    spawnFloatingBanner("⚡ 獲得疾跑！貓咪加速 5 秒！");
  } else if (type === 2) {
    debuffDogSlowUntil = now + 5000;
    spawnFloatingBanner("🐌 狗狗疲憊！全體小狗減速 5 秒！");
  } else if (type === 3) {
    debuffDogFreezeUntil = now + 2000;
    spawnFloatingBanner("❄️ 貓咪使出定身！全體小狗凍結 2 秒！");
  }
}

function spawnFloatingBanner(msg) {
  floatingText = { text: msg, until: Date.now() + 2200 };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();

  const tileSize = 70;
  for (let y = 0; y < canvas.height; y += tileSize) {
    for (let x = 0; x < canvas.width; x += tileSize) {
      const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isEven ? '#8FBF87' : '#9BC894';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  activeItems.forEach(item => {
    ctx.font = "32px sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = item.type === 1 ? "⚡" : (item.type === 2 ? "🐌" : "❄️");
    ctx.fillText(icon, item.x, item.y);
  });

  for (let i = cats.length - 1; i >= 0; i--) {
    const cx = cats[i].x;
    const cy = cats[i].y;

    if (now < buffCatSpeedUntil) {
      ctx.beginPath();
      ctx.arc(cx + 20, cy + 20, 24, 0, Math.PI * 2);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (catImages[i] && catImages[i].img.complete) {
      ctx.drawImage(catImages[i].img, cx - 12, cy - 2, 64, 40);
    }

    if (i === 0) {
      ctx.font = "18px sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText("👑", cx + 20, cy - 6);
    }
  }

  dogs.forEach(dog => {
    ctx.font = "40px sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("🐕", dog.x + 20, dog.y + 20);
  });

  if (floatingText && now < floatingText.until) {
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(CANVAS_WIDTH / 2 - 200, 16, 400, 34, 8);
      ctx.fill();
    } else {
      ctx.fillRect(CANVAS_WIDTH / 2 - 200, 16, 400, 34);
    }
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(floatingText.text, CANVAS_WIDTH / 2, 33);
  }
}

// 結束並更新隊長分數
function gameOver(reason) {
  isPlaying = false;
  document.getElementById('dog-controls-wrapper')?.classList.add('hidden');

  // 【修改】使用明確綁定的隊長，而不是依賴畫布陣列
  const leaderCat = activeLeaderCat; 
  
  if (leaderCat) {
    const prevBest = leaderCat.dogScore || 0;
    if (totalScore > prevBest) {
      leaderCat.dogScore = totalScore;

      // 1. 持久化寫入獨立快取表 (cat_dog_scores)
      const dogScoresMap = JSON.parse(localStorage.getItem('cat_dog_scores') || '{}');
      const catKey = leaderCat.catId || leaderCat.id || leaderCat.name;
      dogScoresMap[catKey] = totalScore;
      if (leaderCat.name) dogScoresMap[leaderCat.name] = totalScore;
      localStorage.setItem('cat_dog_scores', JSON.stringify(dogScoresMap));

      // 2. 若隊長是當前生活中的貓咪
      if (leaderCat.isLiving || leaderCat.catId === 'current') {
        if (gameState.currentCat) {
          gameState.currentCat.dogScore = totalScore;
        }
        if (typeof autoSaveCurrentCatProgress === 'function') {
          autoSaveCurrentCatProgress();
        } else if (window.autoSaveCurrentCatProgress) {
          window.autoSaveCurrentCatProgress();
        }
      } else {
        // 3. 若隊長是貓星球天使貓
        const starCat = (gameState.myStarCats || []).find(sc => 
          (sc.catId && sc.catId === leaderCat.catId) || 
          (sc.id && sc.id === leaderCat.catId) || 
          (sc.name && sc.name === leaderCat.name)
        );
        if (starCat) {
          starCat.dogScore = totalScore;
        }
        if (typeof saveMyStarCats === 'function') {
          saveMyStarCats();
        }
      }
    }
  }

  // 即時重新渲染首頁排行榜與回憶錄
  if (typeof renderHomeRankTab === 'function') {
    renderHomeRankTab(gameState.currentRankTab || 'dogScore');
  } else if (window.renderHomeRankTab) {
    window.renderHomeRankTab(gameState.currentRankTab || 'dogScore');
  }

  if (typeof renderMyMemories === 'function') {
    renderMyMemories();
  } else if (window.renderMyMemories) {
    window.renderMyMemories();
  }

  document.getElementById('dog-overlay')?.classList.remove('hidden');
  document.getElementById('dog-status-title').innerText = "被小狗抓到了！";
  document.getElementById('dog-status-desc').innerText = `${reason}\n\n隊長貓咪: ${leaderCat ? leaderCat.name : '未知'}\n存活時間: ${survivalSeconds} 秒 (${catImages.length} 隻同行)\n倍率加成: ${scoreMultiplier.toFixed(1)}x\n最終得分: ${totalScore} 分 (已計入隊長紀錄)！`;
}

function setupJoystickControls() {
  const base = document.getElementById('dog-joystick-base');
  const knob = document.getElementById('dog-joystick-knob');
  if (!base || !knob) return;

  const handlePointer = (e) => {
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    const maxR = (rect.width / 2) - 15;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxR, dist);
    const angle = Math.atan2(dy, dx);
    
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    
    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    
    const power = clampedDist / maxR;
    joystickVec = {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power,
      active: true
    };
  };

  const resetJoystick = () => {
    knob.style.transform = 'translate(0px, 0px)';
    joystickVec = { x: 0, y: 0, active: false };
  };

  base.onpointerdown = (e) => {
    e.preventDefault();
    try { base.setPointerCapture(e.pointerId); } catch(err) {}
    handlePointer(e);
  };

  base.onpointermove = (e) => {
    if (joystickVec.active) {
      e.preventDefault();
      handlePointer(e);
    }
  };

  base.onpointerup = (e) => {
    e.preventDefault();
    try { base.releasePointerCapture(e.pointerId); } catch(err) {}
    resetJoystick();
  };

  base.onpointercancel = () => {
    resetJoystick();
  };
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

if (typeof window !== 'undefined') {
  Object.assign(window, {
    openMinigameDogSelect,
    closeMinigameDogSelect,
    closeMinigameDog,
    startDogGameLoop
  });
}