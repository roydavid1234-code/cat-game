import { gameState, saveMyStarCats, saveBirthedHistory } from './game-state.js';
import { 
  RANDOM_COUNTRIES, 
  ALL_BREEDS_DATABASE, 
  RANDOM_NAMES, 
  NOSTALGIC_STAR_QUOTES, 
  CAT_QUOTES, 
  EMOJIS, 
  EXPANDED_EVENTS, 
  generateBreedThumbnail 
} from './data.js';
import { playMeowSound, playPurrSound, playClickSound } from './audio.js';
import { startRoamingLoop, initParadiseGarden } from './canvas-render.js';
import { uploadStarCatToCloud, uploadBirthToCloud } from './cloud-db.js';

let gameLoopInterval = null;
let doctorCdTimer = null;

// ==========================================
// 1. 誕生前：排行榜與品種圖鑑
// ==========================================

export function renderTopBreedsBars() {
  const container = document.getElementById('top-breeds-bars');
  if (!container) return;
  container.innerHTML = '';

  const birthed = gameState.birthedCatsHistory;
  const countMap = {};
  birthed.forEach(cat => {
    countMap[cat.breedName] = (countMap[cat.breedName] || 0) + 1;
  });

  const sortedBreeds = Object.keys(countMap)
    .map(name => ({ name, count: countMap[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const tBirth = document.getElementById('ticker-birthed');
  const tPass = document.getElementById('ticker-passed');
  if (tBirth) tBirth.innerText = birthed.length;
  if (tPass) tPass.innerText = gameState.myStarCats.length;

  if (sortedBreeds.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-[#7F7B75] text-xs">
        目前尚無誕生紀錄，點擊左側為第一隻貓咪命名開啟貓生吧！🐾
      </div>
    `;
    return;
  }

  sortedBreeds.forEach((b, i) => {
    const rate = ((b.count / birthed.length) * 100).toFixed(1);
    container.innerHTML += `
      <div>
        <div class="flex justify-between items-center mb-1">
          <span class="font-bold flex items-center gap-2">
            <span class="w-4 text-center text-[#9E2A2B] font-serif">${i+1}</span>
            <span>${b.name}</span>
            <span class="text-[10px] text-[#7F7B75] bg-[#F7F5F0] px-1.5 py-0.5 rounded border border-[#E5E0D8]">誕生 ${b.count} 隻</span>
          </span>
          <span class="font-serif font-bold text-[#7F7B75]">${rate}%</span>
        </div>
        <div class="w-full h-2 bg-[#F7F5F0] rounded-full overflow-hidden border border-[#E5E0D8]">
          <div class="h-full bg-[#9E2A2B] rounded-full" style="width: ${rate}%;"></div>
        </div>
      </div>
    `;
  });
}

export function renderAllBreedsModal() {
  const grid = document.getElementById('all-breeds-grid');
  if (!grid) return;
  grid.innerHTML = '';
  ALL_BREEDS_DATABASE.forEach(b => {
    const previewUrl = generateBreedThumbnail(b.color, b.stripe);
    grid.innerHTML += `
      <div class="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-2.5 flex items-center gap-3">
        <img src="${previewUrl}" class="w-12 h-12 rounded-xl bg-white border border-[#E5E0D8] p-1 flex-shrink-0">
        <div class="overflow-hidden">
          <div class="font-bold text-xs truncate text-[#2C2C2C]">${b.name}</div>
          <div class="text-[10px] text-[#7F7B75] mt-0.5">${b.type}</div>
        </div>
      </div>
    `;
  });
}

export function openBreedModal() { document.getElementById('modal-breeds')?.classList.remove('hidden'); }
export function closeBreedModal() { document.getElementById('modal-breeds')?.classList.add('hidden'); }

export function switchHomeRankTab(statKey) {
  gameState.currentRankTab = statKey;
  ['cute', 'affection', 'smarts', 'agility', 'charm'].forEach(k => {
    const btn = document.getElementById(`hrank-tab-${k}`);
    if (btn) {
      btn.className = (k === statKey)
        ? "py-1.5 px-3 rounded-lg bg-[#9E2A2B] text-white font-bold transition shadow-sm"
        : "py-1.5 px-3 rounded-lg text-[#7F7B75] hover:text-[#2C2C2C] transition";
    }
  });
  renderHomeRankTab(statKey);
}

export function toggleRankExpand() {
  gameState.isRankExpanded = !gameState.isRankExpanded;
  const btn = document.getElementById('btn-toggle-rank-more');
  if (btn) {
    btn.innerHTML = gameState.isRankExpanded
      ? `收合排行榜 <i class="fa-solid fa-chevron-up ml-1"></i>`
      : `查看更多 (TOP 10) <i class="fa-solid fa-chevron-down ml-1"></i>`;
  }
  renderHomeRankTab(gameState.currentRankTab);
}

export function renderHomeRankTab(statKey) {
  const container = document.getElementById('home-rank-list');
  if (!container) return;
  container.innerHTML = '';

  const allPool = [...gameState.myStarCats];
  allPool.sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));

  if (allPool.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-[#7F7B75] text-xs">
        目前貓星球尚未有回到星空的貓咪守護神 ✨
      </div>
    `;
    return;
  }

  const limit = gameState.isRankExpanded ? 10 : 4;
  allPool.slice(0, limit).forEach((item, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
    const catThumb = generateBreedThumbnail(item.color || '#E67E22', item.stripe || '#D35400');

    let statLabel = '';
    if (statKey === 'cute') statLabel = `🥰可愛:${item.cute || 0}`;
    else if (statKey === 'affection') statLabel = `❤️親密:${item.affection || 0}`;
    else if (statKey === 'smarts') statLabel = `💡智力:${item.smarts}`;
    else if (statKey === 'agility') statLabel = `⚡靈巧:${item.agility}`;
    else if (statKey === 'charm') statLabel = `✨魅力:${item.charm}`;

    container.innerHTML += `
      <div class="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <span class="font-serif font-black text-base w-5 text-center text-[#9E2A2B] flex-shrink-0">${medal}</span>
          <img src="${catThumb}" class="w-10 h-10 rounded-lg bg-white border border-[#E5E0D8] p-1 flex-shrink-0">
          <div class="truncate">
            <div class="font-bold text-[#2C2C2C] truncate">${item.name} <span class="text-[11px] font-normal text-[#7F7B75]">(${item.breed})</span></div>
            <div class="text-[10px] text-[#7F7B75] mt-0.5 leading-tight">主人：${item.owner}<br>成長：${item.lifespan}</div>
          </div>
        </div>
        <div class="bg-white px-2 py-1 rounded-lg border border-[#E5E0D8] text-[10px] font-bold text-[#9E2A2B] whitespace-nowrap flex-shrink-0 shadow-sm">
          ${statLabel}
        </div>
      </div>
    `;
  });
}

// ==========================================
// 2. 貓星球與回憶錄（雲端同步 + 點擊權限分離）
// ==========================================

export function switchPlanetFilter(filter) {
  gameState.currentPlanetFilter = filter;
  gameState.planetCurrentPage = 1;
  const btnAll = document.getElementById('planet-filter-all');
  const btnMine = document.getElementById('planet-filter-mine');

  if (btnAll && btnMine) {
    if (filter === 'all') {
      btnAll.className = "py-1.5 px-4 rounded-lg bg-indigo-600 text-white transition shadow-sm";
      btnMine.className = "py-1.5 px-4 rounded-lg text-indigo-200 hover:text-white transition";
    } else {
      btnMine.className = "py-1.5 px-4 rounded-lg bg-indigo-600 text-white transition shadow-sm";
      btnAll.className = "py-1.5 px-4 rounded-lg text-indigo-200 hover:text-white transition";
    }
  }
  renderCatPlanetSection();
}

export function renderCatPlanetSection() {
  const container = document.getElementById('cat-planet-cards-container');
  const pagContainer = document.getElementById('cat-planet-pagination');
  if (!container || !pagContainer) return;
  container.innerHTML = '';
  pagContainer.innerHTML = '';

  // 從本地讀取由當前裝置送上星空的專屬 ID 清單
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');

  const allCats = gameState.myStarCats.map(c => ({
    ...c,
    isMine: myOwnedIds.includes(c.catId)
  }));

  const sourceCats = gameState.currentPlanetFilter === 'mine'
    ? allCats.filter(c => c.isMine)
    : allCats;

  const totalCats = sourceCats.length;
  if (totalCats === 0) {
    container.innerHTML = `
      <div class="col-span-full py-10 text-center text-indigo-300/70 font-serif text-xs">
        🐾 目前貓星球還沒有登陸的毛孩子，當一段生命圓滿謝幕，牠們將在此化為星光...
      </div>
    `;
    return;
  }

  const pageSize = 9;
  const totalPages = Math.ceil(totalCats / pageSize);
  if (gameState.planetCurrentPage > totalPages) gameState.planetCurrentPage = totalPages;
  if (gameState.planetCurrentPage < 1) gameState.planetCurrentPage = 1;

  const startIndex = (gameState.planetCurrentPage - 1) * pageSize;
  const displayCats = sourceCats.slice(startIndex, startIndex + pageSize);

  displayCats.forEach((c) => {
    const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    
    // 只有自己送上星空的愛貓才能點擊，其他人點擊完全無反應
    const clickAttr = c.isMine 
      ? `onclick="showNostalgicQuote('${c.name}')" class="relative cursor-pointer group"` 
      : `class="relative cursor-default opacity-80"`;

    container.innerHTML += `
      <div class="bg-white/10 backdrop-blur-md border border-indigo-400/20 rounded-2xl p-4 text-left shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div ${clickAttr}>
              <img src="${thumb}" class="w-12 h-12 rounded-xl bg-white/20 border border-white/30 p-1 flex-shrink-0 ${c.isMine ? 'group-hover:scale-105 transition transform' : ''}">
              ${c.isMine ? '<span class="absolute -bottom-1 -right-1 text-[8px] bg-amber-500 text-white rounded-full px-1 font-bold">我的</span>' : ''}
            </div>
            <div>
              <h5 class="font-serif font-bold text-sm text-indigo-100 flex items-center gap-1.5">
                <span>${c.name}</span>
                <span class="text-[10px] text-indigo-300/80 font-normal">(${c.breed})</span>
              </h5>
              <p class="text-[11px] text-amber-300 font-bold mt-0.5">守護主人：${c.owner || '貓奴主人'}</p>
              <p class="text-[10px] text-indigo-200/60">享年 ${c.lifespan}</p>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-1 text-[9px] bg-black/20 p-1.5 rounded-lg text-indigo-200 mb-2">
            <span>🥰${c.cute || 0}</span>
            <span>💡${c.smarts}</span>
            <span>⚡${c.agility}</span>
            <span>✨${c.charm}</span>
          </div>
        </div>
        <div class="p-2.5 rounded-xl bg-white/5 border border-indigo-400/20 text-xs text-indigo-100 font-serif italic">
          " ${c.farewellMsg || '謝謝你曾來到我的生命裡。'} "
        </div>
      </div>
    `;
  });

  if (totalPages > 1) {
    let pagHtml = `
      <button onclick="gotoPlanetPage(${gameState.planetCurrentPage - 1})" class="px-3 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-700 text-white disabled:opacity-30" ${gameState.planetCurrentPage === 1 ? 'disabled' : ''}>
        上一頁
      </button>
    `;
    for (let i = 1; i <= totalPages; i++) {
      pagHtml += `
        <button onclick="gotoPlanetPage(${i})" class="px-2.5 py-1 rounded-lg ${i === gameState.planetCurrentPage ? 'bg-indigo-600 text-white font-bold' : 'bg-indigo-900/40 text-indigo-300 hover:text-white'}">
          第 ${i} 頁
        </button>
      `;
    }
    pagHtml += `
      <button onclick="gotoPlanetPage(${gameState.planetCurrentPage + 1})" class="px-3 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-700 text-white disabled:opacity-30" ${gameState.planetCurrentPage === totalPages ? 'disabled' : ''}>
        下一頁
      </button>
    `;
    pagContainer.innerHTML = pagHtml;
  }
}

export function gotoPlanetPage(page) {
  gameState.planetCurrentPage = page;
  renderCatPlanetSection();
}

export function showNostalgicQuote(catName) {
  const q = NOSTALGIC_STAR_QUOTES[Math.floor(Math.random() * NOSTALGIC_STAR_QUOTES.length)];
  showCustomAlert(`來自 ${catName} 的星空信件 💌`, `「${q}」`, "✨");
}

export function openMyMemoryModal() {
  const container = document.getElementById('my-memories-container');
  if (!container) return;
  container.innerHTML = '';

  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const myCats = gameState.myStarCats.filter(c => myOwnedIds.includes(c.catId));

  if (myCats.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-xs text-[#7F7B75]">
        目前還沒有在貓星球上的愛貓回憶喔！開始一段陪伴旅程，愛會永遠長存。
      </div>
    `;
  } else {
    myCats.forEach(c => {
      container.innerHTML += `
        <div class="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-4 flex flex-col justify-between">
          <div class="flex items-center gap-3 mb-2">
            <img src="${c.img}" class="w-14 h-14 rounded-xl bg-white border border-[#E5E0D8] p-1 flex-shrink-0 cursor-pointer" onclick="showNostalgicQuote('${c.name}')">
            <div>
              <h4 class="font-serif font-bold text-sm text-[#2C2C2C]">${c.name}</h4>
              <p class="text-[11px] text-[#7F7B75]">${c.breed} · 享年 ${c.lifespan}</p>
              <p class="text-[10px] text-[#9E2A2B] mt-0.5">❤️ 終生親密度: ${c.affection}</p>
            </div>
          </div>
          <div class="bg-white p-2.5 rounded-xl border border-[#E5E0D8] text-xs font-serif text-[#55524D] mt-2">
            <strong>給牠的寄語：</strong><br>
            "${c.farewellMsg || '在貓星球也要開心玩耍喔！'}"
          </div>
        </div>
      `;
    });
  }
  document.getElementById('modal-my-memories')?.classList.remove('hidden');
}

export function closeMyMemoryModal() {
  document.getElementById('modal-my-memories')?.classList.add('hidden');
}

export function showCustomAlert(title, msg, icon = "🐾") {
  document.getElementById('custom-alert-title').innerText = title;
  document.getElementById('custom-alert-msg').innerText = msg;
  document.getElementById('custom-alert-icon').innerText = icon;
  document.getElementById('cat-custom-alert-modal')?.classList.remove('hidden');
}

export function closeCustomAlert() {
  document.getElementById('cat-custom-alert-modal')?.classList.add('hidden');
}

// ==========================================
// 3. 命名、誕生與保存/讀取存檔
// ==========================================

export function openNameModal() {
  const input = document.getElementById('cat-name-input');
  if (input) input.value = '';
  document.getElementById('modal-naming')?.classList.remove('hidden');
}

export function closeNameModal() {
  document.getElementById('modal-naming')?.classList.add('hidden');
}

export function randomizeCatName() {
  const n = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const input = document.getElementById('cat-name-input');
  if (input) input.value = n;
}

export function confirmBirthWithName() {
  const catName = document.getElementById('cat-name-input')?.value.trim();
  const ownerName = document.getElementById('owner-name-input')?.value.trim() || "貓奴主人";

  if (!catName) {
    showCustomAlert("請填寫名字", "貓咪的名字是必填的喔！請為牠取一個溫暖的名字🐾", "⚠️");
    return;
  }

  gameState.playerName = ownerName;
  document.getElementById('modal-naming')?.classList.add('hidden');
  initCatLife(catName);
}

function initCatLife(name) {
  playMeowSound();
  const breed = ALL_BREEDS_DATABASE[Math.floor(Math.random() * ALL_BREEDS_DATABASE.length)];
  const countryObj = RANDOM_COUNTRIES[Math.floor(Math.random() * RANDOM_COUNTRIES.length)];

  const maxLifeMonths = breed.isMix 
    ? Math.floor((18 + Math.random() * 4) * 12) 
    : Math.floor((12 + Math.random() * 3.5) * 12);

  gameState.currentCat = {
    name: name,
    owner: gameState.playerName,
    breed: breed,
    country: countryObj.name,
    ageMonths: 0,
    stage: '幼貓',
    maxLifeMonths: maxLifeMonths,
    hunger: 80,
    happiness: 85,
    water: 75,
    energy: 100,
    health: 100,
    cute: 14,
    smarts: 18,
    agility: 12,
    charm: 15,
    affection: 21
  };

  const birthRecord = {
    name: name,
    breedName: breed.name,
    birthTime: Date.now()
  };

  gameState.birthedCatsHistory.push(birthRecord);
  saveBirthedHistory();
  // 同步上傳至雲端供所有玩家即時排行
  uploadBirthToCloud(birthRecord);

  document.getElementById('phase-landing')?.classList.add('hidden');
  document.getElementById('phase-game')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.add('flex');
  document.getElementById('snack-counter-badge')?.classList.remove('hidden');
  document.getElementById('snack-counter-badge')?.classList.add('flex');

  const navPlanet = document.getElementById('nav-cat-planet');
  if (navPlanet) navPlanet.classList.add('hidden');

  document.getElementById('ui-country-badge').innerText = gameState.currentCat.country;
  document.getElementById('ui-cat-name').innerText = gameState.currentCat.name;
  const lifeYears = Math.floor(gameState.currentCat.maxLifeMonths / 12);
  document.getElementById('ui-cat-trait-text').innerText = `${gameState.currentCat.breed.name} (自然壽命預估約 ${lifeYears} 歲)`;

  updateStatusUI();
  startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback);
  startGameTimeClock();
  triggerNextEvent();
}

export function saveCurrentCatProgress() {
  if (!gameState.currentCat) return;
  
  const ok = confirm(`是否保留【${gameState.currentCat.name}】的當前進度並回到主頁面？\n（隨時可點擊「繼續陪伴」回來繼續）`);
  if (!ok) return;

  const saveData = {
    cat: gameState.currentCat,
    coins: gameState.userCoins,
    snacks: gameState.userSnacks,
    poops: gameState.roomPoops,
    inventory: gameState.shopInventory
  };
  localStorage.setItem('saved_living_cat', JSON.stringify(saveData));

  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameState.isPaused = false;

  document.getElementById('phase-game')?.classList.add('hidden');
  document.getElementById('phase-landing')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.add('hidden');
  document.getElementById('snack-counter-badge')?.classList.add('hidden');
  document.getElementById('nav-cat-planet')?.classList.remove('hidden');

  updateContinueButtonState();
  showCustomAlert("保存成功", `已成功儲存【${saveData.cat.name}】的當前狀態！`, "💾");
}

export function continueSavedCat() {
  const raw = localStorage.getItem('saved_living_cat');
  if (!raw) {
    showCustomAlert("尚無進度", "目前沒有正在進行中的貓咪存檔喔！請先誕生一隻主角貓咪🐾", "ℹ️");
    return;
  }

  const saveData = JSON.parse(raw);
  gameState.currentCat = saveData.cat;
  gameState.userCoins = saveData.coins || 0;
  gameState.userSnacks = saveData.snacks !== undefined ? saveData.snacks : 5;
  gameState.roomPoops = saveData.poops || [];
  gameState.shopInventory = saveData.inventory || { autoWater: false, autoFeeder: false, autoCleaner: false };

  document.getElementById('phase-landing')?.classList.add('hidden');
  document.getElementById('phase-game')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.add('flex');
  document.getElementById('snack-counter-badge')?.classList.remove('hidden');
  document.getElementById('snack-counter-badge')?.classList.add('flex');
  document.getElementById('nav-cat-planet')?.classList.add('hidden');

  document.getElementById('ui-country-badge').innerText = gameState.currentCat.country;
  document.getElementById('ui-cat-name').innerText = gameState.currentCat.name;
  const lifeYears = Math.floor(gameState.currentCat.maxLifeMonths / 12);
  document.getElementById('ui-cat-trait-text').innerText = `${gameState.currentCat.breed.name} (自然壽命預估約 ${lifeYears} 歲)`;

  updateStatusUI();
  startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback);
  startGameTimeClock();
  triggerNextEvent();
}

export function updateContinueButtonState() {
  const btn = document.getElementById('btn-continue-game');
  const txt = document.getElementById('continue-btn-text');
  const raw = localStorage.getItem('saved_living_cat');
  if (!btn || !txt) return;

  if (raw) {
    const data = JSON.parse(raw);
    txt.innerText = `繼續陪伴：${data.cat.name}（${Math.floor(data.cat.ageMonths / 12)}歲${Math.floor(data.cat.ageMonths % 12)}個月）`;
    btn.classList.remove('opacity-50');
  } else {
    txt.innerText = `繼續陪伴（尚無進行中進度）`;
    btn.classList.add('opacity-50');
  }
}

// ==========================================
// 4. 畫布互動與撫摸/餵食邏輯
// ==========================================

export function onCanvasClick(e) {
  if (gameState.isPaused) {
    spawnFloatingFeedback(e.clientX, e.clientY, "⏸ 遊戲已暫停，無法進行任何互動！", true);
    return;
  }

  const rect = e.target.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (e.target.width / rect.width);
  const clickY = (e.clientY - rect.top) * (e.target.height / rect.height);

  // 判斷是否點擊到蟲子
  if (gameState.activeBug) {
    const distToBug = Math.hypot(clickX - gameState.activeBug.x, clickY - gameState.activeBug.y);
    if (distToBug < 35) { // 手機上給予較寬鬆的點擊範圍
      gameState.activeBug = null;
      gameState.userCoins += 1;
      gameState.currentCat.health = Math.min(100, gameState.currentCat.health + 1);
      playClickSound();
      spawnFloatingFeedback(e.clientX, e.clientY, "+1 貓幣 抵抗力+1 (抓到蟲子!) ✨");
      updateStatusUI();
      return;
    }
  }

  for (let i = 0; i < gameState.roomPoops.length; i++) {
    const p = gameState.roomPoops[i];
    if (Math.hypot(clickX - p.x, clickY - p.y) < 22) {
      gameState.roomPoops.splice(i, 1);
      gameState.userCoins += 2;
      playClickSound();
      spawnFloatingFeedback(e.clientX, e.clientY, "+2 貓幣 清理乾淨！✨");
      updateStatusUI();
      return;
    }
  }

  // 逗貓棒模式禁止點擊貓咪
  if (gameState.activeInteractionMode === 'toy') {
    return;
  }

  if (gameState.activeInteractionMode === 'snack') {
    handleFeedSnackAction(e.clientX, e.clientY);
    return;
  }

  const distToCat = Math.hypot(clickX - gameState.roamState.x, clickY - gameState.roamState.y);
  if (distToCat < gameState.roamState.hitRadius + 20) {
    handleCatInteraction(e.clientX, e.clientY);
  } else {
    spawnFloatingFeedback(e.clientX, e.clientY, "點偏了～沒摸到貓咪！", true);
  }
}

function handleFeedSnackAction(clientX, clientY) {
  if (gameState.userSnacks <= 0) {
    showCustomAlert("零食吃完了", "貓零食已經沒有囉！請前往商店用 1 貓幣購買！🐟", "🛒");
    return;
  }

  gameState.userSnacks--;
  playPurrSound();
  playMeowSound();
  const c = gameState.currentCat;
  c.hunger = Math.min(100, c.hunger + 10);
  c.happiness = Math.min(100, c.happiness + 8);
  c.energy = Math.min(100, c.energy + 6);

  const now = Date.now();
  if (now - (gameState.lastAffectionIncreaseTime || 0) >= 15000) {
    gameState.lastAffectionIncreaseTime = now;
    c.affection = Math.min(100, c.affection + 2);
    spawnFloatingFeedback(clientX, clientY, "大口吃零食！親密+2 活力+6 🐟✨");
  } else {
    spawnFloatingFeedback(clientX, clientY, "大口吃零食！活力+6 飽足+10 🐟✨");
  }

  c.cute += 1;
  spawnFloatingHeart(clientX, clientY);
  document.getElementById('speech-text').innerText = `「哇～是最愛的小魚乾肉泥！謝謝奴才～呼嚕嚕💖」`;
  updateStatusUI();
}

function handleCatInteraction(clientX, clientY) {
  const r = gameState.roamState;
  const c = gameState.currentCat;

  if (gameState.activeInteractionMode === 'pet' && Math.random() < 0.35 && !r.isSleepingInCage) {
    playMeowSound();
    r.isScurrying = true;
    r.scurryTimer = 0;
    r.facing = Math.random() > 0.5 ? 1 : -1;
    r.vy = (Math.random() - 0.5) * 3;
    gameState.consecutivePetCount = 0;
    spawnFloatingFeedback(clientX, clientY, "嗖～貓咪靈巧地溜走了！(想摸摸不到)", true);
    return;
  }

  let successRate = 0.55 + (c.affection * 0.003) + (c.happiness * 0.003);
  if (c.hunger <= 0) successRate = 0.2;

  if (Math.random() < successRate) {
    playPurrSound();
    spawnFloatingHeart(clientX, clientY);

    if (gameState.activeInteractionMode === 'pet') {
      c.happiness = Math.min(100, c.happiness + 3);
      
      gameState.consecutivePetCount = (gameState.consecutivePetCount || 0) + 1;
      const bonusEnergy = gameState.consecutivePetCount >= 2 ? 4 : 2;
      c.energy = Math.min(100, c.energy + bonusEnergy);

      const now = Date.now();
      if (now - (gameState.lastAffectionIncreaseTime || 0) >= 15000) {
        gameState.lastAffectionIncreaseTime = now;
        c.affection = Math.min(100, c.affection + 1);
        spawnFloatingFeedback(clientX, clientY, `摸摸頭！親密+1 活力+${bonusEnergy} ❤️`);
      } else {
        spawnFloatingFeedback(clientX, clientY, `摸摸頭舒服！活力+${bonusEnergy} 🐾`);
      }
      
      gameState.petSuccessCounter++;
      if (gameState.petSuccessCounter % 5 === 0) {
        triggerCatSpeechWithEmojis();
      }
    }
  } else {
    playClickSound();
    gameState.consecutivePetCount = 0;
    spawnFloatingFeedback(clientX, clientY, "傲嬌閃開了～(好感不足)", true);
    r.facing *= -1;
    r.x += r.facing * 30;
  }

  updateStatusUI();
}

function triggerCatSpeechWithEmojis() {
  const rawQuote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
  const randEmoji1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const randEmoji2 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  document.getElementById('speech-text').innerText = `「${rawQuote.slice(0, 8)} ${randEmoji1} ${rawQuote.slice(8)} ${randEmoji2}」`;
}

export function spawnFloatingHeart(x, y) {
  const el = document.createElement('div');
  el.className = 'floating-heart fa-solid fa-heart';
  el.style.left = `${x - 10}px`;
  el.style.top = `${y - 15}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

export function spawnFloatingFeedback(x, y, text, isMiss = false) {
  const el = document.createElement('div');
  el.className = 'floating-miss';
  if (!isMiss) el.style.color = '#27AE60';
  el.innerText = text;
  el.style.left = `${x - 40}px`;
  el.style.top = `${y - 20}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 750);
}

export function setInteractionMode(mode) {
  gameState.activeInteractionMode = mode;
  const stage = document.getElementById('roaming-stage');
  stage.classList.remove('cursor-toy', 'cursor-snack');

  if (mode === 'toy') stage.classList.add('cursor-toy');
  else if (mode === 'snack') stage.classList.add('cursor-snack');

  ['pet', 'toy', 'snack'].forEach(m => {
    const btn = document.getElementById(`btn-mode-${m}`);
    if (btn) {
      btn.className = (m === mode)
        ? 'p-2 rounded-xl border border-[#9E2A2B] bg-[#9E2A2B] text-white font-jp text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-sm'
        : 'p-2 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] text-[#55524D] hover:text-[#9E2A2B] font-jp text-xs font-bold transition flex flex-col items-center justify-center gap-1';
    }
  });
}

// ==========================================
// 5. 照護日常按鈕（餵食、換水、看醫生）
// ==========================================

export function feedDirectFood() {
  if (gameState.isPaused) { showCustomAlert("暫停中", "遊戲處於暫停狀態，不能餵食喔！", "⏸"); return; }
  playMeowSound();
  gameState.currentCat.hunger = Math.min(100, gameState.currentCat.hunger + 5);
  gameState.currentCat.happiness = Math.min(100, gameState.currentCat.happiness + 2);
  if (gameState.currentCat.hunger > 0 && gameState.roamState.isStarving) {
    gameState.roamState.isStarving = false;
    document.getElementById('starve-overlay')?.classList.add('hidden');
  }
  updateStatusUI();
}

export function refillWater() {
  if (gameState.isPaused) { showCustomAlert("暫停中", "遊戲處於暫停狀態，不能換水喔！", "⏸"); return; }
  playPurrSound();
  gameState.currentCat.water = Math.min(100, gameState.currentCat.water + 5);
  gameState.currentCat.happiness = Math.min(100, gameState.currentCat.happiness + 1);
  updateStatusUI();
}

export function visitDoctor() {
  if (gameState.isPaused) return;
  const now = Date.now();
  if (gameState.doctorCdUntil && now < gameState.doctorCdUntil) {
    return;
  }

  gameState.doctorCdUntil = now + 5000;
  playPurrSound();
  
  gameState.currentCat.health = Math.min(100, gameState.currentCat.health + 5);
  gameState.currentCat.happiness = Math.max(0, gameState.currentCat.happiness - 1);
  spawnFloatingFeedback(gameState.roamState.x, gameState.roamState.y, "細心體檢！抵抗力+5% 🩺");
  updateStatusUI();

  const btnText = document.getElementById('doctor-btn-text');
  const btn = document.getElementById('btn-doctor');
  if (btn) btn.classList.add('opacity-50', 'pointer-events-none');

  let remaining = 5;
  if (btnText) btnText.innerText = `冷卻中 (${remaining}s)`;
  
  if (doctorCdTimer) clearInterval(doctorCdTimer);
  doctorCdTimer = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      if (btnText) btnText.innerText = `冷卻中 (${remaining}s)`;
    } else {
      clearInterval(doctorCdTimer);
      if (btnText) btnText.innerText = `🩺 看醫生 (+5)`;
      if (btn) btn.classList.remove('opacity-50', 'pointer-events-none');
    }
  }, 1000);
}

function attemptCatPoop() {
  const goesToLitter = (Math.random() * 100) < gameState.currentCat.smarts;
  if (goesToLitter) {
    gameState.userCoins += 3;
    spawnFloatingFeedback(800, 270, "+3 貓幣 (在貓砂盆如廁) 🚽✨");
  } else {
    if (gameState.shopInventory.autoCleaner) {
      gameState.userCoins += 1;
    } else {
      gameState.roomPoops.push({
        x: Math.random() * 500 + 150,
        y: Math.random() * 200 + 100
      });
      document.getElementById('speech-text').innerText = `「不小心便便在地板上了... 💩 請奴才幫忙清理！」`;
    }
  }
}

// ==========================================
// 6. 時間與健康循環系統
// ==========================================

export function togglePlayPause() {
  gameState.isPaused = !gameState.isPaused;
  const btnText = document.getElementById('pause-btn-text');
  const btn = document.getElementById('btn-toggle-pause');

  if (gameState.isPaused) {
    btnText.innerText = "▶ 繼續";
    btn.className = "px-2.5 py-1 rounded-lg border border-emerald-600 bg-emerald-600 text-white font-bold flex items-center gap-1 transition shadow-sm";
    document.getElementById('ui-state-pill').innerText = "⏸ 已暫停中 (無法進行任何互動)";
  } else {
    btnText.innerText = "⏸ 暫停";
    btn.className = "px-2.5 py-1 rounded-lg border border-[#9E2A2B] bg-[#9E2A2B] text-white font-bold flex items-center gap-1 transition";
    document.getElementById('ui-state-pill').innerText = "🐾 正在自由散步...";
  }
}

export function setTimeSpeed(spd) {
  if (gameState.isPaused) togglePlayPause();
  gameState.timeSpeedMultiplier = spd;
  [1, 3, 5, 10].forEach(s => {
    const btn = document.getElementById(`spd-btn-${s}`);
    if (btn) {
      btn.className = (s === spd)
        ? "px-2 py-0.5 rounded border border-[#9E2A2B] bg-[#9E2A2B] text-white font-bold"
        : "px-2 py-0.5 rounded border border-[#E5E0D8] bg-[#F7F5F0]";
    }
  });
  startGameTimeClock();
}

export function startGameTimeClock() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);

  const intervalMs = 1000 / gameState.timeSpeedMultiplier;
  gameLoopInterval = setInterval(() => {
    const c = gameState.currentCat;
    if (!c || gameState.isPaused) return;

    const prevAgeMonths = c.ageMonths;
    c.ageMonths += (1 / 30);

    const currentFloorMonth = Math.floor(c.ageMonths);
    const prevFloorMonth = Math.floor(prevAgeMonths);

    // 每過 1 個月結算
    if (currentFloorMonth > prevFloorMonth) {
      checkMonthlyPurrEvent();
      
      // 【新增】每 3 個月自動產生新事件（不管上一次有沒有點，都會強制換新）
      if (currentFloorMonth % 3 === 0 && currentFloorMonth > 0) {
        triggerNextEvent();
      }
    }

    c.hunger = Math.max(0, c.hunger - 0.25);
    c.water = Math.max(0, c.water - 0.25);
    c.energy = Math.max(0, c.energy - 0.15);

    if (gameState.shopInventory.autoWater && c.water < 30) c.water = 100;
    if (gameState.shopInventory.autoFeeder && c.hunger < 30) c.hunger = 100;
    if (gameState.shopInventory.autoCleaner && gameState.roomPoops.length > 0) gameState.roomPoops = [];

    let compositeMood = (c.hunger * 0.35) + (c.water * 0.35) + (c.energy * 0.3);
    if (gameState.roomPoops.length > 2) compositeMood -= gameState.roomPoops.length * 5;
    c.happiness = Math.max(0, Math.min(100, compositeMood));

    evaluateHealthAndIllness();

    if (c.hunger <= 0) {
      gameState.roamState.isStarving = true;
      document.getElementById('starve-overlay')?.classList.remove('hidden');
    } else {
      gameState.roamState.isStarving = false;
      document.getElementById('starve-overlay')?.classList.add('hidden');
    }

    if (Math.random() < 0.03) {
      attemptCatPoop();
    }

    updateStatusUI();
  }, intervalMs);
}

function evaluateHealthAndIllness() {
  const c = gameState.currentCat;
  if (!c) return;

  if (c.ageMonths < 12) {
    if (c.hunger < 90 || c.happiness < 90 || c.water < 90 || c.energy < 90) {
      c.health = Math.max(0, c.health - 0.6);
    } else {
      c.health = Math.min(100, c.health + 0.1);
    }
  } else {
    let stressDeficit = 0;
    if (c.hunger < 35) stressDeficit += (35 - c.hunger) * 0.08;
    if (c.water < 35) stressDeficit += (35 - c.water) * 0.08;
    if (c.happiness < 30) stressDeficit += (30 - c.happiness) * 0.06;
    if (c.energy < 20) stressDeficit += (20 - c.energy) * 0.05;
    if (gameState.roomPoops.length > 2) stressDeficit += gameState.roomPoops.length * 0.3;

    if (stressDeficit > 0) {
      c.health = Math.max(0, c.health - stressDeficit);
    } else {
      c.health = Math.min(100, c.health + 0.1);
    }
  }

  if (c.health < 40) {
    document.getElementById('sick-overlay')?.classList.remove('hidden');
  } else {
    document.getElementById('sick-overlay')?.classList.add('hidden');
  }

  if (c.health <= 0 || c.ageMonths >= c.maxLifeMonths) {
    triggerCatPassingModal();
  }
}

function checkMonthlyPurrEvent() {
  const c = gameState.currentCat;
  const purrChance = c.affection / 1000;
  if (Math.random() < purrChance) {
    playPurrSound();
    playMeowSound();
    spawnFloatingHeart(gameState.roamState.x, gameState.roamState.y);
    showCustomAlert("咕嚕嚕嚕～🐾", `「${c.name} 靠在懷裡，發出了超級滿足的咕嚕嚕呼嚕聲～親密度提升！❤️」`, "💖");
    c.affection = Math.min(100, c.affection + 2);
    c.happiness = Math.min(100, c.happiness + 5);
  }
}

export function stepAgeTime(months) {
  if (gameState.isPaused) { showCustomAlert("暫停中", "目前遊戲已暫停，無法推進時間！", "⏸"); return; }
  const c = gameState.currentCat;
  c.ageMonths += months;
  
  c.hunger = Math.max(0, c.hunger - 15);
  c.water = Math.max(0, c.water - 15);
  c.energy = Math.max(0, c.energy - 10);
  c.happiness = Math.max(0, c.happiness - 8);

  gameState.roomPoops.push({
    x: Math.random() * 500 + 150,
    y: Math.random() * 200 + 100
  });

  checkMonthlyPurrEvent();
  evaluateHealthAndIllness();
  triggerNextEvent();
  updateStatusUI();
}

// ==========================================
// 7. 生活隨機事件
// ==========================================

export function triggerNextEvent() {
  const evt = EXPANDED_EVENTS[Math.floor(Math.random() * EXPANDED_EVENTS.length)];
  document.getElementById('event-title').innerText = evt.title;
  document.getElementById('event-desc').innerText = evt.desc;

  const box = document.getElementById('event-choices-box');
  if (box) {
    box.innerHTML = `
      <button onclick="resolveEventChoice(1)" class="w-full text-left p-1.5 px-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#9E2A2B] text-xs font-bold text-[#2C2C2C] transition flex justify-between items-center">
        <span>${evt.c1}</span>
        <i class="fa-solid fa-chevron-right text-[10px] text-[#7F7B75]"></i>
      </button>
      <button onclick="resolveEventChoice(2)" class="w-full text-left p-1.5 px-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#9E2A2B] text-xs font-bold text-[#2C2C2C] transition flex justify-between items-center">
        <span>${evt.c2}</span>
        <i class="fa-solid fa-chevron-right text-[10px] text-[#7F7B75]"></i>
      </button>
      <button onclick="resolveEventChoice(3)" class="w-full text-left p-1.5 px-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#9E2A2B] text-xs font-bold text-[#2C2C2C] transition flex justify-between items-center">
        <span>${evt.c3}</span>
        <i class="fa-solid fa-chevron-right text-[10px] text-[#7F7B75]"></i>
      </button>
      <button onclick="resolveEventChoice(4)" class="w-full text-left p-1.5 px-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#9E2A2B] text-xs font-bold text-[#2C2C2C] transition flex justify-between items-center">
        <span>${evt.c4}</span>
        <i class="fa-solid fa-chevron-right text-[10px] text-[#7F7B75]"></i>
      </button>
    `;
  }
  window.activeGameEvent = evt;
}

export function resolveEventChoice(num) {
  if (gameState.isPaused) { showCustomAlert("暫停中", "遊戲暫停中，無法選擇事件喔！", "⏸"); return; }
  playClickSound();
  const evt = window.activeGameEvent;
  if (!evt) return;
  const res = evt['r' + num];
  const c = gameState.currentCat;

  if (res.cute) c.cute += res.cute;
  if (res.smarts) c.smarts += res.smarts;
  if (res.agility) c.agility += res.agility;
  if (res.charm) c.charm += res.charm;
  if (res.affection) c.affection += res.affection;
  if (res.coins) gameState.userCoins += res.coins;

  if (res.happiness) c.happiness = Math.max(0, Math.min(100, c.happiness + res.happiness));
  if (res.hunger) c.hunger = Math.max(0, Math.min(100, c.hunger + res.hunger));
  if (res.water) c.water = Math.max(0, Math.min(100, c.water + res.water));
  if (res.energy) c.energy = Math.max(0, Math.min(100, c.energy + res.energy));
  if (res.health) c.health = Math.max(0, Math.min(100, c.health + res.health));

  const box = document.getElementById('event-choices-box');
  if (box) {
    // 計算下一個 3 的倍數
    const nextTarget = Math.floor(c.ageMonths / 3) * 3 + 3;
    const y = Math.floor(nextTarget / 12);
    const m = nextTarget % 12;

    box.innerHTML = `
      <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-bold">
        ✨ 選擇完成！${res.msg}<br>
        <span class="text-[11px] font-normal text-emerald-600 mt-1 block">等待下次生活點滴 (預計 ${y}歲${m}個月) 🐾</span>
      </div>
    `;
  }

  document.getElementById('speech-text').innerText = `「${res.msg}」`;
  updateStatusUI();
}

// ==========================================
// 8. 商店與離世邏輯（同步寫入 Firebase 雲端）
// ==========================================

export function openShopModal() {
  document.getElementById('shop-coin-display').innerText = gameState.userCoins;
  document.getElementById('shop-snack-display').innerText = gameState.userSnacks;
  document.getElementById('modal-shop')?.classList.remove('hidden');
}

export function closeShopModal() {
  document.getElementById('modal-shop')?.classList.add('hidden');
}

export function buySnackItem(amount) {
  if (gameState.userCoins >= amount) {
    gameState.userCoins -= amount;
    gameState.userSnacks += amount;
    playPurrSound();
    showCustomAlert("購買成功", `已購入 ${amount} 個特級肉泥零食！可隨時餵給愛貓享用～🐟`, "🛍️");
    document.getElementById('shop-coin-display').innerText = gameState.userCoins;
    document.getElementById('shop-snack-display').innerText = gameState.userSnacks;
    updateStatusUI();
  } else {
    showCustomAlert("貓幣不足", "貓幣不夠喔！清理地上的便便 💩 或讓貓咪如廁即可賺取貓幣！", "🪙");
  }
}

export function buyShopItem(itemKey, cost) {
  if (gameState.userCoins >= cost) {
    gameState.userCoins -= cost;
    gameState.shopInventory[itemKey] = true;
    playPurrSound();
    showCustomAlert("購買成功", "已為愛貓裝備該自動化設備！✨", "🛍️");
    
    if (itemKey === 'autoWater') document.getElementById('btn-buy-water').innerText = "已裝備 ✓";
    if (itemKey === 'autoFeeder') document.getElementById('btn-buy-feeder').innerText = "已裝備 ✓";
    if (itemKey === 'autoCleaner') document.getElementById('btn-buy-cleaner').innerText = "已裝備 ✓";
    
    updateStatusUI();
    closeShopModal();
  } else {
    showCustomAlert("貓幣不足", "貓幣不夠喔！平時讓貓咪在貓砂盆如廁或清理便便 💩 賺取貓幣吧！", "🪙");
  }
}

function triggerCatPassingModal() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  const c = gameState.currentCat;
  const years = Math.floor(c.ageMonths / 12);
  const months = Math.floor(c.ageMonths % 12);

  document.getElementById('passing-core-text').innerText = 
    `親愛的 ${c.name} 結束了牠圓滿又幸福的貓生（享年 ${years}歲 ${months}個月）。\n牠已安詳地啟程前往貓星球與花園天堂`;
  
  document.getElementById('cat-final-farewell-input').value = '';
  document.getElementById('modal-cat-passing')?.classList.remove('hidden');
}

export async function submitCatFarewellAndFinish() {
  const c = gameState.currentCat;
  const farewell = document.getElementById('cat-final-farewell-input')?.value.trim() || "謝謝你帶給我的所有溫柔陪伴。";
  const years = Math.floor(c.ageMonths / 12);
  const months = Math.floor(c.ageMonths % 12);

  // 產生專屬唯一識別碼
  const localCatId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const record = {
    catId: localCatId,
    name: c.name,
    owner: c.owner || gameState.playerName,
    lifespan: `${years}歲 ${months}個月`,
    breed: c.breed.name,
    cute: c.cute,
    smarts: c.smarts,
    agility: c.agility,
    charm: c.charm,
    affection: c.affection,
    color: c.breed.color,
    stripe: c.breed.stripe,
    img: generateBreedThumbnail(c.breed.color, c.breed.stripe),
    farewellMsg: farewell
  };

  // 記錄「這隻貓是我養的」到當前設備
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  myOwnedIds.push(localCatId);
  localStorage.setItem('my_owned_cat_ids', JSON.stringify(myOwnedIds));

  // 真正上傳至雲端 Firebase 資料庫
  await uploadStarCatToCloud(record);

  localStorage.removeItem('saved_living_cat');
  document.getElementById('modal-cat-passing')?.classList.add('hidden');
  location.reload();
}

// ==========================================
// 9. 即時狀態 UI 刷新
// ==========================================

export function updateStatusUI() {
  const c = gameState.currentCat;
  if (!c) return;

  const years = Math.floor(c.ageMonths / 12);
  const remM = Math.floor(c.ageMonths % 12);
  
  document.getElementById('ui-cat-age-text').innerText = `${years} 歲 ${remM} 個月大`;

  if (c.ageMonths <= 12) {
    c.stage = '幼貓';
  } else if (c.ageMonths <= 84) {
    c.stage = '成年';
  } else {
    c.stage = '熟齡';
  }
  document.getElementById('ui-stage-badge').innerText = `${c.stage}階段`;

  document.getElementById('val-health').innerText = `${Math.round(c.health)}%`;
  document.getElementById('bar-health').style.width = `${c.health}%`;

  document.getElementById('val-hunger').innerText = `${Math.round(c.hunger)}%`;
  document.getElementById('bar-hunger').style.width = `${c.hunger}%`;

  document.getElementById('val-happiness').innerText = `${Math.round(c.happiness)}%`;
  document.getElementById('bar-happiness').style.width = `${c.happiness}%`;

  document.getElementById('val-water').innerText = `${Math.round(c.water)}%`;
  document.getElementById('bar-water').style.width = `${c.water}%`;

  document.getElementById('val-energy').innerText = `${Math.round(c.energy)}%`;
  document.getElementById('bar-energy').style.width = `${c.energy}%`;

  document.getElementById('val-cute').innerText = c.cute;
  document.getElementById('val-smarts').innerText = c.smarts;
  document.getElementById('val-agility').innerText = c.agility;
  document.getElementById('val-charm').innerText = c.charm;

  document.getElementById('ui-affection-badge').innerText = `親密: ❤️ ${c.affection}`;
  document.getElementById('val-coins').innerText = gameState.userCoins;
  document.getElementById('val-snacks').innerText = gameState.userSnacks;
  document.getElementById('sub-snack-qty').innerText = `(剩 ${gameState.userSnacks} 個)`;
}