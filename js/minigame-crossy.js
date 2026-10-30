import { gameState, saveMyStarCats } from './game-state.js';
import { generateBreedThumbnail } from './data.js';
import { openNameModal, showCustomAlert, togglePlayPause, autoSaveCurrentCatProgress } from './ui-handler.js';

let canvas, ctx;
let gameLoopId;
let isPlaying = false;
let score = 0;
let maxRowReached = 0;

const TILE_SIZE = 40;
const ROWS = 12; // 畫面高度 (480 / 40)
const COLS = 9;  // 畫面寬度 (360 / 40)

let cat = { gridX: 4, y: 10, realX: 4 * TILE_SIZE };
let cameraY = 0;
let mapRows = []; 
let activeCatImg = new Image();

window.tempMinigameCats = [];

let activePlayingCatObj = null;
let isLivingCatMode = false;

const spriteCache = {};
function getPixelEmoji(emoji, size = 24) {
  if (spriteCache[emoji]) return spriteCache[emoji];
  const c = document.createElement('canvas');
  c.width = size * 2; c.height = size * 2;
  const t = c.getContext('2d');
  t.imageSmoothingEnabled = false; t.font = `${size}px sans-serif`;
  t.textBaseline = 'middle'; t.textAlign = 'center';
  t.fillText(emoji, size, size);
  spriteCache[emoji] = c; return c;
}

export function openMinigameSelect() {
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const myCats = (gameState.myStarCats || []).filter(c => myOwnedIds.includes(c.catId));

  if (myCats.length === 0) {
    showCustomAlert("尚未有天使貓咪 🐾", "你目前尚未有回到貓星球的天使貓咪喔！讓我們先誕生一隻主角貓咪，開啟你們的陪伴旅程吧！", "⚠️");
    setTimeout(() => { openNameModal(); }, 1200); return;
  }
  window.tempMinigameCats = myCats;
  const container = document.getElementById('minigame-cat-list'); if (!container) return;
  container.innerHTML = '';
  
  myCats.forEach((c, idx) => {
    const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    container.innerHTML += `
      <button onclick="selectMinigameCat(${idx})" class="w-full flex items-center gap-3 p-2.5 bg-white border border-[#E5E0D8] rounded-xl hover:border-[#9E2A2B] transition text-left shadow-sm">
        <img src="${thumb}" class="w-10 h-10 rounded-lg border border-[#E5E0D8] p-1 bg-[#FAF8F5]">
        <div>
          <div class="font-bold text-xs text-[#2C2C2C]">${c.name}</div>
          <div class="text-[10px] text-[#7F7B75]">選擇這隻天使貓咪出發 🐾</div>
        </div>
      </button>
    `;
  });
  document.getElementById('modal-minigame-select')?.classList.remove('hidden');
}

export function closeMinigameSelect() { document.getElementById('modal-minigame-select')?.classList.add('hidden'); }

window.selectMinigameCat = function(idx) {
  const c = window.tempMinigameCats[idx];
  const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
  initMinigame(c, thumb, false);
};

export function startMinigameWithCurrentCat() {
  if (!gameState.currentCat) { alert("目前沒有正在進行中的貓咪！"); return; }
  
  // 啟動小遊戲時，自動暫停主遊戲
  if (!gameState.isPaused && window.togglePlayPause) togglePlayPause();

  const c = gameState.currentCat;
  const thumb = generateBreedThumbnail(c.breed?.color || '#E67E22', c.breed?.stripe || '#D35400');
  initMinigame(c, thumb, true);
}

window.initMinigame = function(catObj, imgUrl, isLiving = false) {
  closeMinigameSelect();
  activePlayingCatObj = catObj;
  isLivingCatMode = isLiving;

  document.getElementById('modal-minigame-play')?.classList.remove('hidden');
  document.getElementById('crossy-overlay')?.classList.remove('hidden');
  document.getElementById('crossy-status-title').innerText = `主角：${catObj.name}`;
  document.getElementById('crossy-status-desc').innerText = "用鍵盤 WASD 或方向鍵，或點擊下方按鈕出發！🐾";
  
  canvas = document.getElementById('crossy-canvas');
  ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  activeCatImg = new Image(); activeCatImg.src = imgUrl;
};

function getSpeedMultiplier() {
  if (score < 10) return 0.40 + (score / 10) * 0.25;
  if (score < 20) return 0.65 + ((score - 10) / 10) * 0.25;
  if (score < 30) return 0.90 + ((score - 20) / 10) * 0.25;
  return 1.15 + ((score - 30) * 0.02);
}

window.startCrossyGame = function() {
  document.getElementById('crossy-overlay')?.classList.add('hidden');
  score = 0; maxRowReached = 0; document.getElementById('crossy-score').innerText = score;
  cameraY = 0; cat = { gridX: 4, y: 10, realX: 4 * TILE_SIZE }; mapRows = [];
  for (let i = -2; i <= 12; i++) generateRow(i, i >= 9);
  isPlaying = true; if(gameLoopId) cancelAnimationFrame(gameLoopId);
  requestAnimationFrame(gameLoop);
};

export function closeMinigame() {
  isPlaying = false; if(gameLoopId) cancelAnimationFrame(gameLoopId);
  document.getElementById('modal-minigame-play')?.classList.add('hidden');
}

function generateRow(rowIndex, isSafe = false) {
  const types = ['grass', 'road', 'road', 'river', 'river'];
  const type = isSafe ? 'grass' : types[Math.floor(Math.random() * types.length)];
  const speed = 1.2 + Math.random() * 0.6;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const objects = [];
  
  if (type === 'road') {
    const numCars = 1 + Math.floor(Math.random() * 2);
    for(let i=0; i<numCars; i++) objects.push({ x: i * 200 * dir, w: 50, dir: dir });
  } else if (type === 'river') {
    // 水上的橋 (長度 80)，賦予隨機移動方向
    objects.push({ x: Math.random() * 200, w: 80, dir: dir });
  } else if (type === 'grass' && !isSafe) {
    if(Math.random() > 0.3) objects.push({ x: Math.floor(Math.random() * COLS) * TILE_SIZE, w: TILE_SIZE });
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
        if (obj.dir === 1 && obj.x > 400) obj.x = -obj.w;
        if (obj.dir === -1 && obj.x < -obj.w) obj.x = 400;
      });
    } else if (row.type === 'river') {
      row.objects.forEach(obj => {
        // 橋在 360 框架內左右來回反彈
        obj.x += row.speed * obj.dir * currentSpeedMult;
        if (obj.x + obj.w > 360) { obj.x = 360 - obj.w; obj.dir = -1; }
        if (obj.x < 0) { obj.x = 0; obj.dir = 1; }
      });
    }
  });

  if (cat.y < cameraY + 6) cameraY -= 0.1;
  const minRow = Math.min(...mapRows.map(r => r.y));
  if (minRow > cameraY - 4) generateRow(minRow - 1);
  
  const currentRow = mapRows.find(r => r.y === cat.y);
  if (!currentRow) return;

  // 草地撞樹判定
  if (currentRow.type === 'grass') {
    currentRow.objects.forEach(tree => {
      const catCenterX = cat.realX + TILE_SIZE / 2;
      const treeCenterX = tree.x + TILE_SIZE / 2;
      // 只要兩者中心距離太近就是相撞
      if (Math.abs(catCenterX - treeCenterX) < 25) gameOver("撞到大樹暈倒了！🌲");
    });
  }

  // 橋上移動判定
  let onLog = false;
  if (currentRow.type === 'river') {
    currentRow.objects.forEach(log => {
      const catCenterX = cat.realX + TILE_SIZE / 2;
      if (catCenterX > log.x && catCenterX < log.x + log.w) {
        onLog = true;
        cat.realX += currentRow.speed * log.dir * currentSpeedMult;
        // 貓咪在橋上時不能被推出畫面外
        if (cat.realX < 0) cat.realX = 0;
        if (cat.realX > (COLS - 1) * TILE_SIZE) cat.realX = (COLS - 1) * TILE_SIZE;
        cat.gridX = Math.round(cat.realX / TILE_SIZE);
      }
    });
    if (!onLog) gameOver("掉進河裡了！💦");
  } else {
    // 平滑回到網格
    cat.realX += (cat.gridX * TILE_SIZE - cat.realX) * 0.3; 
  }

  // 馬路撞車判定
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
      ctx.fillStyle = '#FAF8F5'; for(let x = 10; x < canvas.width; x += 30) ctx.fillRect(x, drawY + TILE_SIZE / 2 - 1, 15, 2);
    } else if (row.type === 'river') {
      ctx.fillStyle = '#A2D5F2'; ctx.fillRect(0, drawY, canvas.width, TILE_SIZE);
    }
    
    row.objects.forEach(obj => {
      if (row.type === 'road') {
        const carSprite = getPixelEmoji(obj.dir > 0 ? "🚙" : "🚕", 18);
        ctx.drawImage(carSprite, obj.x, drawY + 4, 36, 36);
      } else if (row.type === 'river') {
        ctx.fillStyle = '#D7B080'; ctx.strokeStyle = '#B88E5C'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(obj.x, drawY + 6, obj.w, TILE_SIZE - 12, 6); ctx.fill(); ctx.stroke();
      } else if (row.type === 'grass') {
        const treeSprite = getPixelEmoji("🌳", 18);
        ctx.drawImage(treeSprite, obj.x + 2, drawY + 2, 36, 36);
      }
    });
  });

  const catDrawY = (cat.y - cameraY) * TILE_SIZE;
  ctx.beginPath(); ctx.ellipse(cat.realX + TILE_SIZE / 2, catDrawY + TILE_SIZE - 4, 16, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fill();

  if (activeCatImg && activeCatImg.src) {
    const catW = 64; const catH = 40;
    const offsetX = (TILE_SIZE - catW) / 2; const offsetY = TILE_SIZE - catH;
    ctx.drawImage(activeCatImg, cat.realX + offsetX, catDrawY + offsetY - 2, catW, catH);
  }
}

window.moveCrossyCat = function(dir) {
  if (!isPlaying) return;
  if (dir === 'up') cat.y--;
  
  // 限制後退不能掉出螢幕底部
  if (dir === 'down' && cat.y < Math.floor(cameraY) + ROWS - 2) cat.y++;
  
  // 限制左右不能超出邊界
  if (dir === 'left' && cat.gridX > 0) cat.gridX--;
  if (dir === 'right' && cat.gridX < COLS - 1) cat.gridX++;
  
  if (10 - cat.y > maxRowReached) {
    maxRowReached = 10 - cat.y; score = maxRowReached;
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
  
  // 紀錄並儲存最高分
  if (activePlayingCatObj) {
    if (score > (activePlayingCatObj.crossyScore || 0)) {
      activePlayingCatObj.crossyScore = score;
      if (isLivingCatMode) {
        if (window.autoSaveCurrentCatProgress) autoSaveCurrentCatProgress();
      } else {
        if (window.saveMyStarCats) saveMyStarCats();
      }
    }
  }

  document.getElementById('crossy-overlay')?.classList.remove('hidden');
  document.getElementById('crossy-status-title').innerText = "GAME OVER";
  document.getElementById('crossy-status-desc').innerText = `${reason}\n最終得分: ${score}`;
}

if (typeof window !== 'undefined') {
  Object.assign(window, { openMinigameSelect, closeMinigameSelect, startMinigameWithCurrentCat, closeMinigame });
}