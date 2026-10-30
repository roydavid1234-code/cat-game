import { gameState, saveMyStarCats } from './game-state.js';
import { generateBreedThumbnail } from './data.js';
import { openNameModal, showCustomAlert, togglePlayPause, autoSaveCurrentCatProgress } from './ui-handler.js';

let canvas, ctx;
let gameLoopId;
let isPlaying = false;
let score = 0;
let maxRowReached = 0;

const TILE_SIZE = 50;
const ROWS = 14; // 700 / 50 = 14 排
const COLS = 21; // 1050 / 50 = 21 行

let cat = { gridX: 10, y: 11, realX: 10 * TILE_SIZE };
let cameraY = 0;
let mapRows = []; 
let activeCatImg = new Image();

window.tempCrossyCats = [];
let selectedCrossyCatIndex = null;
let activePlayingCatObj = null;
let isLivingCatMode = false;

const spriteCache = {};
function getPixelEmoji(emoji, size = 26) {
  if (spriteCache[emoji]) return spriteCache[emoji];
  const c = document.createElement('canvas');
  c.width = size * 2; c.height = size * 2;
  const t = c.getContext('2d');
  t.imageSmoothingEnabled = false; t.font = `${size}px sans-serif`;
  t.textBaseline = 'middle'; t.textAlign = 'center';
  t.fillText(emoji, size, size);
  spriteCache[emoji] = c; return c;
}

// 1. 點擊貓咪過街：檢查是否有貓咪，若無跳出提示
export function openMinigameSelect() {
  const playableCats = [];

  // 若有正在飼養中的活著的主角貓
  if (gameState.currentCat) {
    playableCats.push({
      ...gameState.currentCat,
      isLiving: true,
      catId: 'current',
      img: generateBreedThumbnail(gameState.currentCat.breed?.color || '#E67E22', gameState.currentCat.breed?.stripe || '#D35400')
    });
  }

  // 玩家所擁有的天使貓咪
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const myStarCats = (gameState.myStarCats || []).filter(c => myOwnedIds.includes(c.catId));
  myStarCats.forEach(c => {
    playableCats.push({
      ...c,
      isLiving: false
    });
  });

  // 如果完全沒有貓咪，彈出提示彈窗
  if (playableCats.length === 0) {
    showCustomAlert(
      "尚未有貓咪 🐾", 
      "你目前尚未有可以出戰的貓咪喔！讓我們先誕生一隻主角貓咪，開啟你們的陪伴旅程吧！", 
      "⚠️"
    );
    return;
  }

  window.tempCrossyCats = playableCats;
  selectedCrossyCatIndex = null; // 重置選擇狀態
  renderCrossySelectUI();
  document.getElementById('modal-minigame-select')?.classList.remove('hidden');
}

export function closeMinigameSelect() {
  document.getElementById('modal-minigame-select')?.classList.add('hidden');
}

// 點選貓咪單選切換
window.toggleCatSelectCrossy = function(idx) {
  if (selectedCrossyCatIndex === idx) {
    selectedCrossyCatIndex = null;
  } else {
    selectedCrossyCatIndex = idx;
  }
  renderCrossySelectUI();
};

function renderCrossySelectUI() {
  const container = document.getElementById('minigame-cat-list');
  const btnStart = document.getElementById('btn-start-crossy-game');
  const summaryEl = document.getElementById('crossy-select-summary');
  if (!container || !btnStart) return;

  container.innerHTML = '';
  window.tempCrossyCats.forEach((c, idx) => {
    const isSelected = (selectedCrossyCatIndex === idx);
    const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    const borderClass = isSelected ? "border-[#9E2A2B] bg-[#FCE8E8]" : "border-[#E5E0D8] bg-white";
    const statusBadge = c.isLiving 
      ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">進行中貓咪</span>' 
      : '<span class="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">天使貓咪</span>';

    container.innerHTML += `
      <button onclick="toggleCatSelectCrossy(${idx})" class="w-full flex items-center justify-between p-2.5 border-2 rounded-xl transition shadow-sm ${borderClass}">
        <div class="flex items-center gap-3">
          <img src="${thumb}" class="w-10 h-10 rounded-lg border border-[#E5E0D8] p-1 bg-[#FAF8F5]">
          <div class="text-left">
            <div class="font-bold text-xs text-[#2C2C2C] flex items-center gap-1.5">
              <span>${c.name}</span>
              ${statusBadge}
            </div>
            <div class="text-[10px] text-[#7F7B75] mt-0.5">${isSelected ? '🐾 已選擇此貓咪' : '點擊選擇此貓咪'}</div>
          </div>
        </div>
        ${isSelected ? '<i class="fa-solid fa-circle-check text-[#9E2A2B] text-base"></i>' : '<div class="w-4 h-4 rounded-full border border-gray-300"></div>'}
      </button>
    `;
  });

  if (selectedCrossyCatIndex !== null) {
    const selectedCat = window.tempCrossyCats[selectedCrossyCatIndex];
    btnStart.disabled = false;
    btnStart.innerText = `出發！由 ${selectedCat.name} 挑戰 🚀`;
    if (summaryEl) {
      summaryEl.innerHTML = `已選擇：<strong class="text-[#9E2A2B]">${selectedCat.name}</strong> 🐾 準備過街！`;
    }
  } else {
    btnStart.disabled = true;
    btnStart.innerText = "請選擇 1 隻貓咪 (0/1)";
    if (summaryEl) {
      summaryEl.innerText = "請至少選擇 1 隻貓咪出戰";
    }
  }
}

// 確認選擇並開始遊戲
window.startCrossyFromSelect = function() {
  if (selectedCrossyCatIndex === null || !window.tempCrossyCats[selectedCrossyCatIndex]) {
    showCustomAlert("請選擇貓咪 🐾", "請至少選擇 1 隻貓咪才能出發喔！", "⚠️");
    return;
  }
  const c = window.tempCrossyCats[selectedCrossyCatIndex];
  const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
  
  if (c.isLiving && !gameState.isPaused && window.togglePlayPause) {
    togglePlayPause();
  }
  
  initMinigame(c, thumb, c.isLiving);
};

window.initMinigame = function(catObj, imgUrl, isLiving = false) {
  closeMinigameSelect();
  activePlayingCatObj = catObj;
  isLivingCatMode = isLiving;

  document.getElementById('modal-minigame-play')?.classList.remove('hidden');
  document.getElementById('crossy-overlay')?.classList.remove('hidden');
  document.getElementById('crossy-controls-wrapper')?.classList.add('hidden'); // 【新增】
  document.getElementById('crossy-status-title').innerText = `主角：${catObj.name}`;
  
  canvas = document.getElementById('crossy-canvas');
  ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  activeCatImg = new Image(); activeCatImg.src = imgUrl;
};

function getSpeedMultiplier() {
  if (score < 10) return 0.45 + (score / 10) * 0.25;
  if (score < 20) return 0.70 + ((score - 10) / 10) * 0.25;
  if (score < 30) return 0.95 + ((score - 20) / 10) * 0.25;
  return 1.20 + ((score - 30) * 0.02);
}

window.startCrossyGame = function() {
  document.getElementById('crossy-overlay')?.classList.add('hidden');
  document.getElementById('crossy-controls-wrapper')?.classList.remove('hidden'); // 【新增：進入遊戲才顯示】
  score = 0; maxRowReached = 0;
  cameraY = 0; cat = { gridX: 10, y: 11, realX: 10 * TILE_SIZE }; mapRows = [];
  for (let i = -2; i <= 14; i++) generateRow(i, i >= 10);
  isPlaying = true; if(gameLoopId) cancelAnimationFrame(gameLoopId);
  requestAnimationFrame(gameLoop);
};

export function closeMinigame() {
  isPlaying = false; if(gameLoopId) cancelAnimationFrame(gameLoopId);
  document.getElementById('crossy-controls-wrapper')?.classList.add('hidden'); // 【新增】
  document.getElementById('modal-minigame-play')?.classList.add('hidden');
}

function generateRow(rowIndex, isSafe = false) {
  const types = ['grass', 'road', 'road', 'river', 'river'];
  const type = isSafe ? 'grass' : types[Math.floor(Math.random() * types.length)];
  const speed = 1.4 + Math.random() * 0.8;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const objects = [];
  
  if (type === 'road') {
    const numCars = 2 + Math.floor(Math.random() * 2);
    for(let i=0; i<numCars; i++) objects.push({ x: i * 360 * dir, w: 70, dir: dir });
  } else if (type === 'river') {
    const numLogs = 2 + Math.floor(Math.random() * 2);
    for(let i=0; i<numLogs; i++) objects.push({ x: (i * 380 + Math.random() * 100), w: 120, dir: dir });
  } else if (type === 'grass' && !isSafe) {
    if(Math.random() > 0.25) objects.push({ x: Math.floor(Math.random() * COLS) * TILE_SIZE, w: TILE_SIZE });
  }
  mapRows.push({ y: rowIndex, type, speed, dir, objects });
}

function gameLoop() {
  if (!isPlaying) return;
  update(); draw();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function update() {
  const currentSpeedMult = getSpeedMultiplier();

  mapRows.forEach(row => {
    if (row.type === 'road') {
      row.objects.forEach(obj => {
        obj.x += row.speed * obj.dir * currentSpeedMult;
        if (obj.dir === 1 && obj.x > 1150) obj.x = -obj.w;
        if (obj.dir === -1 && obj.x < -obj.w) obj.x = 1150;
      });
    } else if (row.type === 'river') {
      row.objects.forEach(obj => {
        obj.x += row.speed * obj.dir * currentSpeedMult;
        if (obj.x + obj.w > 1050) { obj.x = 1050 - obj.w; obj.dir = -1; }
        if (obj.x < 0) { obj.x = 0; obj.dir = 1; }
      });
    }
  });

  if (cat.y < cameraY + 7) cameraY -= 0.1;
  const minRow = Math.min(...mapRows.map(r => r.y));
  if (minRow > cameraY - 4) generateRow(minRow - 1);
  
  const currentRow = mapRows.find(r => r.y === cat.y);
  if (!currentRow) return;

  if (currentRow.type === 'grass') {
    currentRow.objects.forEach(tree => {
      const catCenterX = cat.realX + TILE_SIZE / 2;
      const treeCenterX = tree.x + TILE_SIZE / 2;
      if (Math.abs(catCenterX - treeCenterX) < 30) gameOver("撞到大樹暈倒了！🌲");
    });
  }

  let onLog = false;
  if (currentRow.type === 'river') {
    currentRow.objects.forEach(log => {
      const catCenterX = cat.realX + TILE_SIZE / 2;
      if (catCenterX > log.x && catCenterX < log.x + log.w) {
        onLog = true;
        cat.realX += currentRow.speed * log.dir * currentSpeedMult;
        if (cat.realX < 0) cat.realX = 0;
        if (cat.realX > (COLS - 1) * TILE_SIZE) cat.realX = (COLS - 1) * TILE_SIZE;
        cat.gridX = Math.round(cat.realX / TILE_SIZE);
      }
    });
    if (!onLog) gameOver("掉進河裡了！💦");
  } else {
    cat.realX += (cat.gridX * TILE_SIZE - cat.realX) * 0.3; 
  }

  if (currentRow.type === 'road') {
    currentRow.objects.forEach(car => {
      const catCenterX = cat.realX + TILE_SIZE / 2;
      if (catCenterX > car.x && catCenterX < car.x + car.w) gameOver("被車子撞到了！🚗");
    });
  }
  
  if (cat.y > Math.floor(cameraY) + ROWS + 1) gameOver("動作太慢，被畫面吞噬了！");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false; 
  
  mapRows.forEach(row => {
    const drawY = (row.y - cameraY) * TILE_SIZE;
    if (drawY < -TILE_SIZE || drawY > canvas.height) return;

    if (row.type === 'grass') {
      ctx.fillStyle = '#A8D5BA'; ctx.fillRect(0, drawY, canvas.width, TILE_SIZE);
      ctx.fillStyle = '#9BC8AC'; ctx.fillRect(0, drawY + TILE_SIZE - 2, canvas.width, 2);
    } else if (row.type === 'road') {
      ctx.fillStyle = '#D0C9BF'; ctx.fillRect(0, drawY, canvas.width, TILE_SIZE);
      ctx.fillStyle = '#FAF8F5'; for(let x = 15; x < canvas.width; x += 45) ctx.fillRect(x, drawY + TILE_SIZE / 2 - 1.5, 22, 3);
    } else if (row.type === 'river') {
      ctx.fillStyle = '#A2D5F2'; ctx.fillRect(0, drawY, canvas.width, TILE_SIZE);
    }
    
    row.objects.forEach(obj => {
      if (row.type === 'road') {
        const carSprite = getPixelEmoji(obj.dir > 0 ? "🚙" : "🚕", 22);
        ctx.drawImage(carSprite, obj.x, drawY + 3, 44, 44);
      } else if (row.type === 'river') {
        ctx.fillStyle = '#D7B080'; ctx.strokeStyle = '#B88E5C'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.roundRect(obj.x, drawY + 8, obj.w, TILE_SIZE - 16, 7); ctx.fill(); ctx.stroke();
      } else if (row.type === 'grass') {
        const treeSprite = getPixelEmoji("🌳", 22);
        ctx.drawImage(treeSprite, obj.x + 3, drawY + 3, 44, 44);
      }
    });
  });

  const catDrawY = (cat.y - cameraY) * TILE_SIZE;
  ctx.beginPath(); ctx.ellipse(cat.realX + TILE_SIZE / 2, catDrawY + TILE_SIZE - 5, 20, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fill();

  if (activeCatImg && activeCatImg.src) {
    const catW = 72; const catH = 45;
    const offsetX = (TILE_SIZE - catW) / 2; const offsetY = TILE_SIZE - catH;
    ctx.drawImage(activeCatImg, cat.realX + offsetX, catDrawY + offsetY - 2, catW, catH);
  }
}

window.moveCrossyCat = function(dir) {
  if (!isPlaying) return;
  if (dir === 'up') cat.y--;
  if (dir === 'down' && cat.y < Math.floor(cameraY) + ROWS - 2) cat.y++;
  if (dir === 'left' && cat.gridX > 0) cat.gridX--;
  if (dir === 'right' && cat.gridX < COLS - 1) cat.gridX++;
  
  if (11 - cat.y > maxRowReached) {
    maxRowReached = 11 - cat.y; score = maxRowReached;
    document.getElementById('crossy-score').innerText = score;
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') moveCrossyCat('up');
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') moveCrossyCat('down');
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveCrossyCat('left');
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveCrossyCat('right');
});

function gameOver(reason) {
  isPlaying = false;
  document.getElementById('crossy-controls-wrapper')?.classList.add('hidden');

  if (activePlayingCatObj) {
    const prevBest = activePlayingCatObj.crossyScore || 0;
    if (score > prevBest) {
      activePlayingCatObj.crossyScore = score;

      // 1. 持久化寫入獨立快取表 (cat_crossy_scores)
      const crossyScoresMap = JSON.parse(localStorage.getItem('cat_crossy_scores') || '{}');
      const catKey = activePlayingCatObj.catId || activePlayingCatObj.id || activePlayingCatObj.name;
      crossyScoresMap[catKey] = score;
      if (activePlayingCatObj.name) crossyScoresMap[activePlayingCatObj.name] = score;
      localStorage.setItem('cat_crossy_scores', JSON.stringify(crossyScoresMap));

      // 2. 同步回活著的貓咪或星空貓
      if (isLivingCatMode && gameState.currentCat) {
        gameState.currentCat.crossyScore = score;
        if (window.autoSaveCurrentCatProgress) window.autoSaveCurrentCatProgress();
      } else {
        const starCat = (gameState.myStarCats || []).find(sc => 
          (sc.catId && sc.catId === activePlayingCatObj.catId) || 
          (sc.id && sc.id === activePlayingCatObj.catId) || 
          (sc.name && sc.name === activePlayingCatObj.name)
        );
        if (starCat) starCat.crossyScore = score;
        if (window.saveMyStarCats) window.saveMyStarCats();
      }
    }
  }

  // 即時重新渲染首頁排行榜與回憶錄
  if (window.renderHomeRankTab) {
    window.renderHomeRankTab(gameState.currentRankTab || 'crossyScore');
  }
  if (window.renderMyMemories) {
    window.renderMyMemories();
  }

  document.getElementById('crossy-overlay')?.classList.remove('hidden');
  document.getElementById('crossy-status-title').innerText = "GAME OVER";
  document.getElementById('crossy-status-desc').innerText = `${reason}\n\n出戰貓咪: ${activePlayingCatObj ? activePlayingCatObj.name : '未知'}\n最終得分: ${score} 分！`;
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    openMinigameSelect,
    closeMinigameSelect,
    closeMinigame
  });
}