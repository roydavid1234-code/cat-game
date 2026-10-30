import { gameState, saveMyStarCats, saveBirthedHistory } from './game-state.js';
import { RANDOM_COUNTRIES, ALL_BREEDS_DATABASE, RANDOM_NAMES, NOSTALGIC_STAR_QUOTES, CAT_QUOTES, EMOJIS, EXPANDED_EVENTS, generateBreedThumbnail } from './data.js';
import { playMeowSound, playPurrSound, playClickSound, toggleAudio } from './audio.js';
import { startRoamingLoop, initParadiseGarden } from './canvas-render.js';
import { uploadStarCatToCloud, uploadBirthToCloud } from './cloud-db.js';

let gameLoopInterval = null;
let doctorCdTimer = null;
let feedCdTimer = null;
let waterCdTimer = null;

function getBreedRarityTier(breed) {
  if (breed.rarity) return breed.rarity;
  const name = breed.name || '';
  if (/沙貓|鏽斑|兔猻|黑足|阿比西尼亞|藪貓/.test(name)) return 5;
  if (/緬因|豹貓|德文|斯芬克斯|無毛|柯尼斯|塞爾凱克/.test(name)) return 4;
  if (/布偶|暹羅|俄羅斯藍|波斯|挪威森林|伯曼|土耳其/.test(name)) return 3;
  if (/英短|美短|摺耳|金吉拉|異國短毛|蘇格蘭/.test(name)) return 2;
  return 1;
}

function getRandomBreedByRarity() {
  const weights = { 1: 50, 2: 25, 3: 14, 4: 8, 5: 3 };
  const weightedList = ALL_BREEDS_DATABASE.map(breed => {
    const tier = getBreedRarityTier(breed);
    return { breed, weight: weights[tier] || 10 };
  });

  const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
  let randomNum = Math.random() * totalWeight;

  for (const item of weightedList) {
    if (randomNum < item.weight) return item.breed;
    randomNum -= item.weight;
  }
  return ALL_BREEDS_DATABASE[0];
}

function generateStatsByRarity(tier) {
  const ranges = {
    1: { min: 2,  max: 7  },
    2: { min: 6,  max: 11 },
    3: { min: 10, max: 14 },
    4: { min: 13, max: 17 },
    5: { min: 16, max: 20 }
  };
  const range = ranges[tier] || ranges[1];
  const roll = () => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  return { tier, cute: roll(), smarts: roll(), agility: roll(), charm: roll(), affection: roll() };
}

// ==========================================
// 確保進行中的主角貓隨時常駐於記憶體中
// ==========================================
export function ensureCurrentCatLoaded() {
  // 預載記錄的主人名字
  if (!gameState.playerName) {
    gameState.playerName = localStorage.getItem('last_owner_name') || '';
  }

  if (!gameState.currentCat) {
    const raw = localStorage.getItem('saved_living_cat');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.cat) {
          gameState.currentCat = parsed.cat;
          gameState.userCoins = parsed.coins !== undefined ? parsed.coins : 1;
          gameState.userSnacks = parsed.snacks !== undefined ? parsed.snacks : 5;
          gameState.snackPrice = parsed.snackPrice || 1;
          gameState.roomPoops = parsed.poops || [];
          gameState.shopInventory = parsed.inventory || { autoWater: false, autoFeeder: false, autoCleaner: false };
        }
      } catch (e) {
        console.error("讀取存檔失敗", e);
      }
    }
  }
}

export function renderTopBreedsBars() {
  const container = document.getElementById('top-breeds-bars');
  if (!container) return;
  container.innerHTML = '';
  const birthed = gameState.birthedCatsHistory || [];
  const countMap = {};
  birthed.forEach(cat => { countMap[cat.breedName] = (countMap[cat.breedName] || 0) + 1; });

  const sortedBreeds = Object.keys(countMap)
    .map(name => ({ name, count: countMap[name] }))
    .sort((a, b) => b.count - a.count).slice(0, 10);

  const tBirth = document.getElementById('ticker-birthed');
  const tPass = document.getElementById('ticker-passed');
  if (tBirth) tBirth.innerText = birthed.length;
  if (tPass) tPass.innerText = (gameState.myStarCats || []).length;

  if (sortedBreeds.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-[#7F7B75] text-xs font-jp">目前尚無誕生紀錄，為第一隻貓咪命名開啟貓生吧！🐾</div>`;
    return;
  }

  sortedBreeds.forEach((b, i) => {
    const rate = ((b.count / birthed.length) * 100).toFixed(1);
    container.innerHTML += `
      <div>
        <div class="flex justify-between items-center mb-1 text-[11px]">
          <span class="font-bold flex items-center gap-2">
            <span class="w-4 text-center text-[#9E2A2B] font-serif">${i+1}</span>
            <span class="text-[#2C2C2C]">${b.name}</span>
            <span class="text-[9px] text-[#7F7B75] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5E0D8]">誕生 ${b.count} 隻</span>
          </span>
          <span class="font-serif font-bold text-[#7F7B75]">${rate}%</span>
        </div>
        <div class="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E5E0D8]">
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
  ['growth', 'charm', 'cute', 'affection', 'smarts', 'agility', 'crossyScore', 'dogScore'].forEach(k => {
    const btn = document.getElementById(`hrank-tab-${k}`);
    if (btn) {
      btn.className = (k === statKey)
        ? "py-1.5 px-1 rounded-lg bg-[#9E2A2B] text-white font-bold transition shadow-sm text-center truncate"
        : "py-1.5 px-1 rounded-lg text-[#7F7B75] bg-[#F7F5F0] hover:text-[#2C2C2C] transition text-center truncate";
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
  renderHomeRankTab(gameState.currentRankTab || 'growth');
}

function getCatGrowthMonths(cat) {
  if (cat.totalMonths !== undefined) return Number(cat.totalMonths);
  if (cat.ageMonths !== undefined) return Number(cat.ageMonths);
  if (cat.lifespan) {
    const yMatch = cat.lifespan.match(/(\d+)\s*歲/);
    const mMatch = cat.lifespan.match(/(\d+)\s*個?月/);
    const y = yMatch ? parseInt(yMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return y * 12 + m;
  }
  return 0;
}

export function renderHomeRankTab(statKey = 'growth') {
  const container = document.getElementById('home-rank-list');
  if (!container) return;
  container.innerHTML = '';

  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const dogScoresMap = JSON.parse(localStorage.getItem('cat_dog_scores') || '{}');
  const crossyScoresMap = JSON.parse(localStorage.getItem('cat_crossy_scores') || '{}');

  const allPool = [...(gameState.myStarCats || [])];

  let livingCat = gameState.currentCat;
  if (!livingCat) {
    try {
      const saved = localStorage.getItem('saved_living_cat');
      if (saved) livingCat = JSON.parse(saved).cat;
    } catch (e) {}
  }

  if (livingCat) {
    allPool.push({
      catId: 'current',
      isLiving: true,
      name: livingCat.name,
      breed: livingCat.breed?.name || livingCat.breed || '米克斯貓',
      owner: livingCat.owner || gameState.playerName || '貓奴',
      lifespan: `成長中 (${Math.floor((livingCat.ageMonths || 0) / 12)}歲${Math.floor((livingCat.ageMonths || 0) % 12)}個月)`,
      totalMonths: livingCat.ageMonths || 0,
      ageMonths: livingCat.ageMonths || 0,
      cute: livingCat.cute || 0,
      smarts: livingCat.smarts || 0,
      agility: livingCat.agility || 0,
      charm: livingCat.charm || 0,
      affection: livingCat.affection || 0,
      crossyScore: livingCat.crossyScore || 0,
      dogScore: livingCat.dogScore || 0,
      color: livingCat.breed?.color || livingCat.color || '#E67E22',
      stripe: livingCat.breed?.stripe || livingCat.stripe || '#D35400',
      img: livingCat.img || generateBreedThumbnail(livingCat.breed?.color || livingCat.color || '#E67E22', livingCat.breed?.stripe || livingCat.stripe || '#D35400')
    });
  }

  allPool.forEach(cat => {
    const key = cat.catId || cat.id || cat.name;
    const localDog = dogScoresMap[key] || (cat.name ? dogScoresMap[cat.name] : 0) || 0;
    cat.dogScore = Math.max(Number(cat.dogScore) || 0, Number(cat.dog_score) || 0, localDog);

    const localCrossy = crossyScoresMap[key] || (cat.name ? crossyScoresMap[cat.name] : 0) || 0;
    cat.crossyScore = Math.max(Number(cat.crossyScore) || 0, Number(cat.crossy_score) || 0, localCrossy);
  });

  if (statKey === 'growth') {
    allPool.sort((a, b) => getCatGrowthMonths(b) - getCatGrowthMonths(a));
  } else {
    allPool.sort((a, b) => (Number(b[statKey]) || 0) - (Number(a[statKey]) || 0));
  }

  let displayPool = allPool;
  if (statKey === 'crossyScore' || statKey === 'dogScore') {
    let seenMyCat = false;
    displayPool = allPool.filter(item => {
      const isMine = item.catId === 'current' || item.isLiving || myOwnedIds.includes(item.catId) || myOwnedIds.includes(item.id);
      if (isMine) {
        if (!seenMyCat) {
          seenMyCat = true;
          return true;
        }
        return false;
      }
      return true;
    });
  }

  if (displayPool.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-[#7F7B75] text-xs font-serif leading-relaxed">🐾 目前尚未有貓咪紀錄 ✨</div>`;
    return;
  }

  const limit = gameState.isRankExpanded ? 10 : 3;
  displayPool.slice(0, limit).forEach((item, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    const catThumb = item.img || generateBreedThumbnail(item.color || '#E67E22', item.stripe || '#D35400');
    
    const isMine = item.catId === 'current' || item.isLiving || myOwnedIds.includes(item.catId) || myOwnedIds.includes(item.id);
    const livingBadge = item.isLiving 
      ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold ml-1.5 border border-emerald-300">陪伴中</span>' 
      : '';
    const myCatBadge = isMine
      ? '<span class="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold ml-1.5 border border-amber-300 shadow-sm">🌟我的</span>'
      : '';

    let statLabel = '';
    if (statKey === 'growth') statLabel = `⏳成長:${Math.floor(getCatGrowthMonths(item) / 12)}歲${Math.floor(getCatGrowthMonths(item)) % 12}月`;
    else if (statKey === 'charm') statLabel = `✨魅力:${item.charm || 0}`;
    else if (statKey === 'cute') statLabel = `🥰可愛:${item.cute || 0}`;
    else if (statKey === 'affection') statLabel = `❤️親密:${item.affection || 0}`;
    else if (statKey === 'smarts') statLabel = `💡智力:${item.smarts || 0}`;
    else if (statKey === 'agility') statLabel = `⚡靈巧:${item.agility || 0}`;
    else if (statKey === 'crossyScore') statLabel = `🎮過街:${item.crossyScore || 0}分`;
    else if (statKey === 'dogScore') statLabel = `🐕抓貓:${item.dogScore || 0}分`;

    container.innerHTML += `
      <div class="p-3 bg-[#FAF8F5] border ${item.isLiving ? 'border-emerald-400 bg-emerald-50/30' : 'border-[#E5E0D8]'} rounded-2xl flex items-center justify-between gap-2 shadow-sm hover:border-[#9E2A2B] transition ${isMine ? 'ring-1 ring-amber-400/50' : ''}">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <span class="font-serif font-black text-base w-5 text-center text-[#9E2A2B] flex-shrink-0">${medal}</span>
          <img src="${catThumb}" class="w-10 h-10 rounded-xl bg-white border border-[#E5E0D8] p-1 flex-shrink-0">
          <div class="truncate">
            <div class="font-bold text-[#2C2C2C] truncate text-xs sm:text-sm flex items-center">
              <span>${item.name}</span>
              <span class="text-[10px] font-normal text-[#7F7B75] ml-1">(${item.breed})</span>
              ${livingBadge}
              ${myCatBadge}
            </div>
            <div class="text-[9px] sm:text-[10px] text-[#7F7B75] mt-0.5 leading-tight">主人：${item.owner}<br>年齡：${item.lifespan}</div>
          </div>
        </div>
        <div class="bg-white px-2 py-1.5 rounded-lg border border-[#E5E0D8] text-[10px] sm:text-[11px] font-bold text-[#9E2A2B] whitespace-nowrap flex-shrink-0 shadow-sm">
          ${statLabel}
        </div>
      </div>
    `;
  });
}

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

  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const allCats = (gameState.myStarCats || []).map(c => ({ ...c, isMine: myOwnedIds.includes(c.catId) || myOwnedIds.includes(c.id) }));
  const sourceCats = gameState.currentPlanetFilter === 'mine' ? allCats.filter(c => c.isMine) : allCats;
  const totalCats = sourceCats.length;

  if (totalCats === 0) {
    container.innerHTML = `<div class="col-span-full py-10 text-center text-indigo-300/70 font-serif text-xs leading-relaxed">🐾 目前貓星球還沒有登陸的毛孩子...</div>`;
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
    const clickAttr = c.isMine ? `onclick="showNostalgicQuote('${c.name}')" class="relative cursor-pointer group"` : `class="relative cursor-default opacity-80"`;
    let scoreHtml = '';
    if (c.crossyScore && c.crossyScore > 0) scoreHtml += `<div class="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded-full mt-1 inline-block border border-amber-500/40">🎮過街: ${c.crossyScore}</div> `;
    if (c.dogScore && c.dogScore > 0) scoreHtml += `<div class="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded-full mt-1 inline-block border border-amber-500/40">🐕小狗: ${c.dogScore}分</div>`;

    container.innerHTML += `
      <div class="bg-white/10 backdrop-blur-md border border-indigo-400/20 rounded-2xl p-4 text-left shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div ${clickAttr}>
              <img src="${thumb}" class="w-12 h-12 rounded-xl bg-white/20 border border-white/30 p-1 flex-shrink-0 ${c.isMine ? 'group-hover:scale-105 transition transform' : ''}">
              ${c.isMine ? '<span class="absolute -bottom-1 -right-1 text-[8px] bg-amber-500 text-white rounded-full px-1 font-bold shadow-sm">我的</span>' : ''}
            </div>
            <div>
              <h5 class="font-serif font-bold text-sm text-indigo-100 flex items-center gap-1.5">
                <span>${c.name}</span>
                <span class="text-[10px] text-indigo-300/80 font-normal">(${c.breed})</span>
              </h5>
              <p class="text-[11px] text-amber-300 font-bold mt-0.5">主人：${c.owner || '貓奴主人'}</p>
              ${scoreHtml}
            </div>
          </div>
        </div>
        <div class="p-2.5 rounded-xl bg-white/5 border border-indigo-400/20 text-xs text-indigo-100 font-serif italic mt-1">
          " ${c.farewellMsg || '謝謝你曾來到我的生命裡。'} "
        </div>
      </div>
    `;
  });

  if (totalPages > 1) {
    let pagHtml = `<button onclick="gotoPlanetPage(${gameState.planetCurrentPage - 1})" class="px-3 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-700 text-white disabled:opacity-30 transition" ${gameState.planetCurrentPage === 1 ? 'disabled' : ''}>上一頁</button>`;
    for (let i = 1; i <= totalPages; i++) {
      pagHtml += `<button onclick="gotoPlanetPage(${i})" class="px-2.5 py-1 rounded-lg transition ${i === gameState.planetCurrentPage ? 'bg-indigo-600 text-white font-bold' : 'bg-indigo-900/40 text-indigo-300 hover:text-white'}">第 ${i} 頁</button>`;
    }
    pagHtml += `<button onclick="gotoPlanetPage(${gameState.planetCurrentPage + 1})" class="px-3 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-700 text-white disabled:opacity-30 transition" ${gameState.planetCurrentPage === totalPages ? 'disabled' : ''}>下一頁</button>`;
    pagContainer.innerHTML = pagHtml;
  }
}

export function gotoPlanetPage(page) { gameState.planetCurrentPage = page; renderCatPlanetSection(); }
export function showNostalgicQuote(catName) {
  const q = NOSTALGIC_STAR_QUOTES[Math.floor(Math.random() * NOSTALGIC_STAR_QUOTES.length)];
  showCustomAlert(`來自 ${catName} 的星空信件 💌`, `「${q}」`, "✨");
}

export function renderMyMemories() {
  const container = document.getElementById('my-memories-container');
  if (!container) return;
  container.innerHTML = '';

  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]');
  const myCats = (gameState.myStarCats || []).filter(c => myOwnedIds.includes(c.catId) || myOwnedIds.includes(c.id));

  if (myCats.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-[#7F7B75] text-xs font-serif leading-relaxed">
        🌸 目前尚未有已前往貓星球的專屬愛貓記憶。<br>
        在貓咪的一生圓滿後，牠們的足跡與給你的悄悄話都會珍藏在這裡 🐾
      </div>
    `;
    return;
  }

  myCats.forEach(c => {
    const thumb = c.img || generateBreedThumbnail(c.color || '#E67E22', c.stripe || '#D35400');
    container.innerHTML += `
      <div class="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-3.5 flex flex-col justify-between shadow-sm hover:border-[#9E2A2B] transition">
        <div>
          <div class="flex items-center gap-3 mb-2.5">
            <img src="${thumb}" class="w-12 h-12 rounded-xl bg-white border border-[#E5E0D8] p-1 flex-shrink-0">
            <div>
              <div class="font-bold text-sm text-[#2C2C2C] flex items-center gap-1.5">
                <span>${c.name}</span>
                <span class="text-[11px] font-normal text-[#7F7B75]">(${c.breed})</span>
              </div>
              <div class="text-[11px] text-[#9E2A2B] font-bold mt-0.5">年齡：${c.lifespan || '未知'}</div>
              <div class="text-[10px] text-[#7F7B75]">守護主人：${c.owner || '貓奴'}</div>
            </div>
          </div>
          <div class="p-2.5 rounded-xl bg-white border border-[#E5E0D8] text-xs text-[#55524D] font-serif italic mb-2">
            " ${c.farewellMsg || '謝謝你曾來到我的生命裡。'} "
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-[#7F7B75] pt-2 border-t border-[#E5E0D8]/60">
          <span class="font-bold">🎮 過街: ${c.crossyScore || 0}分 ｜ 🐕 抓貓: ${c.dogScore || 0}分</span>
          <button onclick="showNostalgicQuote('${c.name}')" class="text-[#9E2A2B] hover:underline font-bold">聽星空信件 ✨</button>
        </div>
      </div>
    `;
  });
}

export function openMyMemoryModal() {
  renderMyMemories();
  document.getElementById('modal-my-memories')?.classList.remove('hidden');
}

export function closeMyMemoryModal() {
  document.getElementById('modal-my-memories')?.classList.add('hidden');
}

export function showCustomAlert(title, msg, icon = "🐾") {
  const t = document.getElementById('custom-alert-title');
  const m = document.getElementById('custom-alert-msg');
  const i = document.getElementById('custom-alert-icon');
  if (t) t.innerText = title;
  if (m) m.innerText = msg;
  if (i) i.innerText = icon;
  document.getElementById('cat-custom-alert-modal')?.classList.remove('hidden');
}
export function closeCustomAlert() { document.getElementById('cat-custom-alert-modal')?.classList.add('hidden'); }

export function openNameModal() {
  const catInput = document.getElementById('cat-name-input');
  const ownerInput = document.getElementById('owner-name-input');
  
  // 貓咪名字清空，等待新起名
  if (catInput) catInput.value = '';
  
  // 自動帶入上次記錄的主人名字（若沒有則留空），玩家仍可自由修改
  if (ownerInput) {
    const rememberedOwner = localStorage.getItem('last_owner_name') || gameState.playerName || '';
    ownerInput.value = rememberedOwner;
  }
  
  document.getElementById('modal-naming')?.classList.remove('hidden');
}

export function closeNameModal() { document.getElementById('modal-naming')?.classList.add('hidden'); }
export function randomizeCatName() {
  const n = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const input = document.getElementById('cat-name-input');
  if (input) input.value = n;
}

export function confirmBirthWithName() {
  const catName = document.getElementById('cat-name-input')?.value.trim();
  const ownerName = document.getElementById('owner-name-input')?.value.trim();
  if (!catName || !ownerName) { 
    showCustomAlert("資料未完整", "主人與貓咪名字皆為必填！🐾", "⚠️"); 
    return; 
  }
  
  // 更新記憶體狀態
  gameState.playerName = ownerName;
  
  // 永久保存到本機儲存空間，版本更新或誕生下一隻貓時自動帶入
  localStorage.setItem('last_owner_name', ownerName);
  
  closeNameModal();
  initCatLife(catName);
}

function initCatLife(name) {
  playMeowSound();
  const breed = getRandomBreedByRarity();
  const countryObj = RANDOM_COUNTRIES[Math.floor(Math.random() * RANDOM_COUNTRIES.length)];
  const rarityTier = getBreedRarityTier(breed);
  const stats = generateStatsByRarity(rarityTier);

  gameState.userCoins = 1;
  gameState.userSnacks = 5;
  gameState.snackPrice = 1;

  gameState.currentCat = {
    name, owner: gameState.playerName, breed, country: countryObj.name,
    ageMonths: 0, stage: '幼貓', 
    maxLifeMonths: breed.isMix ? Math.floor((18 + Math.random() * 4) * 12) : Math.floor((12 + Math.random() * 3.5) * 12),
    hunger: 80, happiness: 85, water: 75, energy: 100, health: 100,
    cute: stats.cute, smarts: stats.smarts, agility: stats.agility, charm: stats.charm, affection: stats.affection, rarityTier
  };

  gameState.roamState = { x: 320, y: 250, vx: 0.8, vy: 0.5, facing: 1, isWalking: true, isSleepingInCage: false, isStarving: false, isScurrying: false, scurryTimer: 0, hitRadius: 40 };

  const birthRecord = { name, breedName: breed.name, birthTime: Date.now() };
  if (!gameState.birthedCatsHistory) gameState.birthedCatsHistory = [];
  gameState.birthedCatsHistory.push(birthRecord);
  saveBirthedHistory();
  uploadBirthToCloud(birthRecord);

  document.getElementById('phase-landing')?.classList.add('hidden');
  document.getElementById('phase-game')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.remove('hidden');
  document.getElementById('nav-cat-planet')?.classList.add('hidden');
  document.getElementById('ui-country-badge').innerText = gameState.currentCat.country;
  document.getElementById('ui-cat-name').innerText = gameState.currentCat.name;
  
  const lifeYears = Math.floor(gameState.currentCat.maxLifeMonths / 12);
  const stars = '⭐'.repeat(rarityTier);
  document.getElementById('ui-cat-trait-text').innerHTML = `${gameState.currentCat.breed.name}<br>${stars} (自然壽命預估約 ${lifeYears} 歲)`;

  updateStatusUI();
  autoSaveCurrentCatProgress();
  startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback);
  startGameTimeClock();
  triggerNextEvent();
}

export function autoSaveCurrentCatProgress() {
  if (!gameState.currentCat) return;
  const saveData = { cat: gameState.currentCat, coins: gameState.userCoins, snacks: gameState.userSnacks, snackPrice: gameState.snackPrice || 1, poops: gameState.roomPoops, inventory: gameState.shopInventory };
  localStorage.setItem('saved_living_cat', JSON.stringify(saveData));
}

export function saveCurrentCatProgress() {
  if (!gameState.currentCat) return;
  autoSaveCurrentCatProgress();
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameState.isPaused = true;
  document.getElementById('phase-game')?.classList.add('hidden');
  document.getElementById('phase-landing')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.add('hidden');
  document.getElementById('nav-cat-planet')?.classList.remove('hidden');
  updateContinueButtonState();
  showCustomAlert("已回到主頁", `【${gameState.currentCat.name}】的進度已自動保存！🐾`, "💾");
}

export function continueSavedCat() {
  const raw = localStorage.getItem('saved_living_cat');
  if (!raw) { showCustomAlert("尚無進度", "請先誕生一隻主角貓咪🐾", "ℹ️"); return; }
  let saveData;
  try { saveData = JSON.parse(raw); } catch (e) {
    showCustomAlert("存檔異常", "讀取失敗，請重新誕生貓咪。🐾", "⚠️");
    localStorage.removeItem('saved_living_cat'); updateContinueButtonState(); return;
  }
  if (!saveData || !saveData.cat) {
    showCustomAlert("存檔損毀", "找不到貓咪資料，請重新誕生貓咪！", "⚠️");
    localStorage.removeItem('saved_living_cat'); updateContinueButtonState(); return;
  }

  gameState.currentCat = saveData.cat;
  gameState.userCoins = saveData.coins !== undefined ? saveData.coins : 1;
  gameState.userSnacks = saveData.snacks !== undefined ? saveData.snacks : 5;
  gameState.snackPrice = saveData.snackPrice || 1;
  gameState.roomPoops = saveData.poops || [];
  gameState.shopInventory = saveData.inventory || { autoWater: false, autoFeeder: false, autoCleaner: false };
  gameState.roamState = { x: 320, y: 250, vx: 0.8, vy: 0.5, facing: 1, isWalking: true, isSleepingInCage: false, isStarving: false, isScurrying: false, scurryTimer: 0, hitRadius: 40 };

  document.getElementById('phase-landing')?.classList.add('hidden');
  document.getElementById('phase-game')?.classList.remove('hidden');
  document.getElementById('coin-counter-badge')?.classList.remove('hidden');
  document.getElementById('nav-cat-planet')?.classList.add('hidden');
  document.getElementById('ui-country-badge').innerText = gameState.currentCat.country || '台灣';
  document.getElementById('ui-cat-name').innerText = gameState.currentCat.name || '貓咪';
  
  const lifeYears = Math.floor((gameState.currentCat.maxLifeMonths || 180) / 12);
  const tier = gameState.currentCat.rarityTier || getBreedRarityTier(gameState.currentCat.breed);
  const stars = '⭐'.repeat(tier || 1);
  document.getElementById('ui-cat-trait-text').innerHTML = `${gameState.currentCat.breed?.name || '米克斯貓'}<br>${stars} (自然壽命預估約 ${lifeYears} 歲)`;

  if (gameState.shopInventory.autoWater) document.getElementById('btn-buy-water').innerText = "已裝備 ✓";
  if (gameState.shopInventory.autoFeeder) document.getElementById('btn-buy-feeder').innerText = "已裝備 ✓";
  if (gameState.shopInventory.autoCleaner) document.getElementById('btn-buy-cleaner').innerText = "已裝備 ✓";

  updateStatusUI();
  startRoamingLoop(onCanvasClick, updateStatusUI, spawnFloatingFeedback);
  startGameTimeClock();
  triggerNextEvent();

  gameState.isPaused = false;
  const btnText = document.getElementById('pause-btn-text');
  const btn = document.getElementById('btn-toggle-pause');
  if (btnText) btnText.innerText = "⏸ 暫停";
  if (btn) btn.className = "px-2 py-1 rounded-lg border border-[#9E2A2B] bg-[#9E2A2B] text-white font-bold flex items-center gap-1 transition text-[11px]";
  if (document.getElementById('ui-state-pill')) document.getElementById('ui-state-pill').innerText = "🐾 正在自由散步...";
}

export function updateContinueButtonState() {
  const btn = document.getElementById('btn-continue-game');
  const txt = document.getElementById('continue-btn-text');
  const raw = localStorage.getItem('saved_living_cat');
  if (!btn || !txt) return;
  if (raw) {
    try {
      const data = JSON.parse(raw);
      txt.innerText = `繼續陪伴：${data.cat.name}（${Math.floor(data.cat.ageMonths / 12)}歲${Math.floor(data.cat.ageMonths % 12)}個月）`;
      btn.classList.remove('opacity-50', 'pointer-events-none');
      btn.disabled = false;
    } catch(e) { 
      txt.innerText = `繼續陪伴（尚無進度）`; 
      btn.classList.add('opacity-50', 'pointer-events-none'); 
      btn.disabled = true;
    }
  } else {
    txt.innerText = `繼續陪伴（尚無進度）`;
    btn.classList.add('opacity-50', 'pointer-events-none');
    btn.disabled = true;
  }
}

export function onCanvasClick(e) {
  if (gameState.isPaused) { spawnFloatingFeedback(0, 0, "⏸ 遊戲已暫停！", true); return; }
  let targetCanvas = e.target;
  if (!targetCanvas || targetCanvas.tagName.toLowerCase() !== 'canvas') targetCanvas = document.querySelector('#phase-game canvas') || targetCanvas;
  const rect = targetCanvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (640 / rect.width);
  const clickY = (e.clientY - rect.top) * (360 / rect.height);

  if (gameState.activeBug) {
    if (Math.hypot(clickX - gameState.activeBug.x, clickY - gameState.activeBug.y) < 35) {
      gameState.activeBug = null;
      gameState.userCoins += 1;
      gameState.currentCat.health = Math.min(110, gameState.currentCat.health + 1);
      playClickSound(); spawnFloatingFeedback(0, 0, "+1 貓幣 抵抗力+1 🪲✨");
      updateStatusUI(); autoSaveCurrentCatProgress(); return;
    }
  }

  for (let i = 0; i < (gameState.roomPoops || []).length; i++) {
    if (Math.hypot(clickX - gameState.roomPoops[i].x, clickY - gameState.roomPoops[i].y) < 25) {
      gameState.roomPoops.splice(i, 1);
      gameState.userCoins += 2;
      playClickSound(); spawnFloatingFeedback(0, 0, "+2 貓幣 清理乾淨！✨");
      updateStatusUI(); autoSaveCurrentCatProgress(); return;
    }
  }

  const distToCat = Math.hypot(clickX - gameState.roamState.x, clickY - gameState.roamState.y);
  if (gameState.activeInteractionMode === 'snack') {
    if (distToCat < 65) handleFeedSnackAction(e.clientX, e.clientY);
    else spawnFloatingFeedback(0, 0, "點偏了～沒餵到貓咪！", true);
    return;
  }
  if (gameState.activeInteractionMode === 'toy') return;
  if (distToCat < 60) handleCatInteraction(e.clientX, e.clientY, clickX);
  else spawnFloatingFeedback(0, 0, "點偏了～沒摸到貓咪！", true);
}

function handleFeedSnackAction(clientX, clientY) {
  if (gameState.userSnacks <= 0) { showCustomAlert("零食吃完了", "去商店用貓幣購買吧！🐟", "🛒"); return; }
  gameState.userSnacks--; playPurrSound(); playMeowSound();
  const c = gameState.currentCat;
  c.hunger = Math.min(100, c.hunger + 10);
  c.happiness = Math.min(100, c.happiness + 8);
  c.energy = Math.min(100, c.energy + 6);
  if (Date.now() - (gameState.lastAffectionIncreaseTime || 0) >= 10000) {
    gameState.lastAffectionIncreaseTime = Date.now();
    c.affection = (c.affection || 0) + 2;
    spawnFloatingFeedback(0, 0, "大口吃零食！親密+2 🐟✨");
  } else spawnFloatingFeedback(0, 0, "大口吃零食！飽足+10 🐟✨");
  c.cute = (c.cute || 0) + 1; spawnFloatingHeart(clientX, clientY);
  document.getElementById('speech-text').innerText = `「最愛小魚乾肉泥！呼嚕嚕💖」`;
  updateStatusUI(); autoSaveCurrentCatProgress();
}

function handleCatInteraction(clientX, clientY, clickX) {
  const r = gameState.roamState;
  const c = gameState.currentCat;
  if (gameState.activeInteractionMode === 'groom') {
    if (Date.now() - (gameState.lastGroomStatTime || 0) >= 10000) {
      gameState.lastGroomStatTime = Date.now();
      c.charm = (c.charm || 0) + 1; c.happiness = Math.min(100, c.happiness + 2);
      playPurrSound(); spawnFloatingHeart(clientX, clientY);
      spawnFloatingFeedback(0, 0, "幫貓咪梳毛！魅力+1 心情+2 ✨");
      updateStatusUI(); autoSaveCurrentCatProgress();
    }
    return;
  }
  let successRate = 0.55 + ((c.affection || 0) * 0.003) + ((c.happiness || 0) * 0.003);
  if (c.hunger < 25) successRate = 0.25;

  if (Math.random() < successRate) {
    playPurrSound(); spawnFloatingHeart(clientX, clientY);
    if (gameState.activeInteractionMode === 'pet') {
      c.happiness = Math.min(100, c.happiness + 4);
      gameState.consecutivePetCount = (gameState.consecutivePetCount || 0) + 1;
      const bonus = gameState.consecutivePetCount >= 2 ? 4 : 2;
      c.energy = Math.min(100, c.energy + bonus);
      if (Date.now() - (gameState.lastAffectionIncreaseTime || 0) >= 10000) {
        gameState.lastAffectionIncreaseTime = Date.now();
        c.affection = (c.affection || 0) + 1;
        if (Math.random() < 0.4) c.cute = (c.cute || 0) + 1;
        spawnFloatingFeedback(0, 0, `摸摸頭！親密+1 心情+4 活力+${bonus} ❤️`);
      }
      
      gameState.petSuccessCounter = (gameState.petSuccessCounter || 0) + 1;
      if (gameState.petSuccessCounter % 5 === 0) {
        const rawQuote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
        document.getElementById('speech-text').innerText = `「${rawQuote.slice(0, 8)} ${EMOJIS[Math.floor(Math.random()*EMOJIS.length)]}」`;
      }
    }
  } else {
    playMeowSound(); gameState.consecutivePetCount = 0;
    r.isScurrying = true; r.scurryTimer = 30;
    r.vx = (r.x > clickX ? 1 : -1) * 3.5; r.vy = (Math.random() - 0.5) * 2;
    r.facing = r.vx > 0 ? 1 : -1;
    spawnFloatingFeedback(0, 0, "嗖～貓咪閃開了！", true);
  }
  updateStatusUI(); autoSaveCurrentCatProgress();
}

export function spawnFloatingHeart(x, y) {
  const el = document.createElement('div'); el.className = 'floating-heart fa-solid fa-heart';
  el.style.left = `${x - 10}px`; el.style.top = `${y - 15}px`; document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

export function spawnFloatingFeedback(x, y, text, isMiss = false) {
  const el = document.createElement('div'); el.className = 'floating-miss';
  if (!isMiss) el.style.color = '#27AE60'; el.innerText = text;
  const canvas = document.getElementById('roaming-stage');
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    el.style.width = '300px'; el.style.textAlign = 'center';
    el.style.left = `${rect.left + window.scrollX + (rect.width/2) - 150}px`; 
    el.style.top = `${rect.top + window.scrollY + 20}px`;
    el.style.textShadow = '0px 1px 3px rgba(255,255,255,0.9)';
  }
  document.body.appendChild(el); setTimeout(() => el.remove(), 750);
}

export function setInteractionMode(mode) {
  gameState.activeInteractionMode = mode;
  ['pet', 'toy', 'snack', 'groom'].forEach(m => {
    const btn = document.getElementById(`btn-mode-${m}`);
    if (btn) btn.className = (m === mode) ? 'p-2 rounded-xl border border-[#9E2A2B] bg-[#9E2A2B] text-white font-jp text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-sm' : 'p-2 rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] text-[#55524D] hover:text-[#9E2A2B] font-jp text-xs font-bold transition flex flex-col items-center justify-center gap-1';
  });
}

export function feedDirectFood() {
  if (gameState.isPaused || (gameState.feedCdUntil && Date.now() < gameState.feedCdUntil)) return;
  gameState.feedCdUntil = Date.now() + 5000; playMeowSound();
  gameState.currentCat.hunger = Math.min(100, gameState.currentCat.hunger + 5);
  gameState.currentCat.happiness = Math.min(100, gameState.currentCat.happiness + 2);
  if (gameState.currentCat.hunger > 0 && gameState.roamState.isStarving) {
    gameState.roamState.isStarving = false; document.getElementById('starve-overlay')?.classList.add('hidden');
  }
  spawnFloatingFeedback(0, 0, "吃飽飽！飽足+5 心情+2 🍲"); updateStatusUI(); autoSaveCurrentCatProgress();

  const btn = document.getElementById('btn-feed'); const txt = document.getElementById('feed-btn-text');
  if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
  let remain = 5; if (txt) txt.innerText = `冷卻中 (${remain}s)`;
  if (feedCdTimer) clearInterval(feedCdTimer);
  feedCdTimer = setInterval(() => {
    remain--;
    if (remain > 0) { if (txt) txt.innerText = `冷卻中 (${remain}s)`; } 
    else { clearInterval(feedCdTimer); if (txt) txt.innerText = `餵主食 (+5)`; if (btn) btn.classList.remove('opacity-50', 'pointer-events-none'); }
  }, 1000);
}

export function refillWater() {
  if (gameState.isPaused || (gameState.waterCdUntil && Date.now() < gameState.waterCdUntil)) return;
  gameState.waterCdUntil = Date.now() + 5000; playPurrSound();
  gameState.currentCat.water = Math.min(100, gameState.currentCat.water + 5);
  gameState.currentCat.happiness = Math.min(100, gameState.currentCat.happiness + 1);
  spawnFloatingFeedback(0, 0, "大口喝水！水分+5 心情+1 💧"); updateStatusUI(); autoSaveCurrentCatProgress();

  const btn = document.getElementById('btn-water'); const txt = document.getElementById('water-btn-text');
  if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
  let remain = 5; if (txt) txt.innerText = `冷卻中 (${remain}s)`;
  if (waterCdTimer) clearInterval(waterCdTimer);
  waterCdTimer = setInterval(() => {
    remain--;
    if (remain > 0) { if (txt) txt.innerText = `冷卻中 (${remain}s)`; }
    else { clearInterval(waterCdTimer); if (txt) txt.innerText = `💧 換水補水 (+5)`; if (btn) btn.classList.remove('opacity-50', 'pointer-events-none'); }
  }, 1000);
}

export function visitDoctor() {
  if (gameState.isPaused || (gameState.doctorCdUntil && Date.now() < gameState.doctorCdUntil)) return;
  gameState.doctorCdUntil = Date.now() + 5000; playPurrSound();
  gameState.currentCat.health = Math.min(110, gameState.currentCat.health + 5);
  gameState.currentCat.happiness = Math.max(0, gameState.currentCat.happiness - 1);
  spawnFloatingFeedback(0, 0, "細心體檢！抵抗力+5% 🩺"); updateStatusUI(); autoSaveCurrentCatProgress();

  const btn = document.getElementById('btn-doctor'); const txt = document.getElementById('doctor-btn-text');
  if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
  let remain = 5; if (txt) txt.innerText = `冷卻中 (${remain}s)`;
  if (doctorCdTimer) clearInterval(doctorCdTimer);
  doctorCdTimer = setInterval(() => {
    remain--;
    if (remain > 0) { if (txt) txt.innerText = `冷卻中 (${remain}s)`; }
    else { clearInterval(doctorCdTimer); if (txt) txt.innerText = `🩺 看醫生 (+5)`; if (btn) btn.classList.remove('opacity-50', 'pointer-events-none'); }
  }, 1000);
}

export function togglePlayPause() {
  gameState.isPaused = !gameState.isPaused;
  const btnText = document.getElementById('pause-btn-text');
  const btn = document.getElementById('btn-toggle-pause');
  if (gameState.isPaused) {
    if (btnText) btnText.innerText = "▶ 繼續";
    if (btn) btn.className = "px-2 py-1 rounded-lg border border-emerald-600 bg-emerald-600 text-white font-bold flex items-center gap-1 transition shadow-sm text-[11px]";
    if (document.getElementById('ui-state-pill')) document.getElementById('ui-state-pill').innerText = "⏸ 已暫停中 (無法互動)";
  } else {
    if (btnText) btnText.innerText = "⏸ 暫停";
    if (btn) btn.className = "px-2 py-1 rounded-lg border border-[#9E2A2B] bg-[#9E2A2B] text-white font-bold flex items-center gap-1 transition text-[11px]";
    if (document.getElementById('ui-state-pill')) document.getElementById('ui-state-pill').innerText = "🐾 正在自由散步...";
  }
}

export function setTimeSpeed(spd) {
  if (gameState.isPaused) togglePlayPause();
  gameState.timeSpeedMultiplier = spd;
  [1, 3, 5, 10].forEach(s => {
    const btn = document.getElementById(`spd-btn-${s}`);
    if (btn) btn.className = (s === spd) ? "px-1.5 py-0.5 rounded border border-[#9E2A2B] bg-[#9E2A2B] text-white font-bold text-[10px]" : "px-1.5 py-0.5 rounded border border-[#E5E0D8] bg-[#F7F5F0] text-[10px]";
  });
  startGameTimeClock();
}

export function startGameTimeClock() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  const intervalMs = 1000 / (gameState.timeSpeedMultiplier || 1);

  gameLoopInterval = setInterval(() => {
    const c = gameState.currentCat;
    if (!c || gameState.isPaused) return;

    const prevFloorMonth = Math.floor(c.ageMonths);
    c.ageMonths += (1 / 30);
    const currentFloorMonth = Math.floor(c.ageMonths);

    // 每月隨機撒嬌 & 每季刷新事件
    if (currentFloorMonth > prevFloorMonth) {
      if (Math.random() < ((c.affection || 0) / 1000)) {
        playPurrSound(); 
        spawnFloatingHeart(gameState.roamState.x, gameState.roamState.y);
        c.affection = (c.affection || 0) + 2; 
        c.happiness = Math.min(100, c.happiness + 5);
      }
      if (currentFloorMonth % 3 === 0 && currentFloorMonth > 0) {
        gameState.snackPrice = Math.max(1, (gameState.snackPrice || 1) - 1);
        triggerNextEvent();
      }
    }

    // 1. 基礎自然消耗
    c.hunger = Math.max(0, c.hunger - 0.2); 
    c.water = Math.max(0, c.water - 0.2); 
    c.energy = Math.max(0, c.energy - 0.15);
    if (c.hunger < 30 || c.water < 30 || (gameState.roomPoops || []).length > 2) {
      c.happiness = Math.max(0, c.happiness - 0.25);
    }

    // 2. 自動設備補給（調整為每秒 +0.5%）
    if (gameState.shopInventory?.autoWater && c.water < 70) {
      c.water = Math.min(100, c.water + 0.5);
    }
    if (gameState.shopInventory?.autoFeeder && c.hunger < 70) {
      c.hunger = Math.min(100, c.hunger + 0.5);
    }

    // 3. 檢查「飽足 / 心情 / 水分 / 體力」為 0% 的項目數量
    let zeroStatsCount = 0;
    if (c.hunger <= 0) zeroStatsCount++;
    if (c.happiness <= 0) zeroStatsCount++;
    if (c.water <= 0) zeroStatsCount++;
    if (c.energy <= 0) zeroStatsCount++;

    // 4. 抵抗力自然衰退與恢復
    if (c.ageMonths < 12) {
      if (c.hunger < 90 || c.happiness < 90 || c.water < 90 || c.energy < 90) {
        c.health = Math.max(0, c.health - 0.6);
      } else {
        c.health = Math.min(110, c.health + 0.1);
      }
    } else {
      let stressDeficit = 0;
      if (c.hunger < 35) stressDeficit += (35 - c.hunger) * 0.08;
      if (c.water < 35) stressDeficit += (35 - c.water) * 0.08;
      if (c.happiness < 30) stressDeficit += (30 - c.happiness) * 0.06;
      if (c.energy < 20) stressDeficit += (20 - c.energy) * 0.05;
      if ((gameState.roomPoops || []).length > 2) stressDeficit += gameState.roomPoops.length * 0.3;
      
      if (stressDeficit > 0) c.health = Math.max(0, c.health - stressDeficit);
      else c.health = Math.min(110, c.health + 0.1);
    }

    // 【懲罰實裝】任 2 項（或以上）數值為 0%，抵抗力大幅度降低（額外重扣 1.8% / 秒）
    if (zeroStatsCount >= 2) {
      c.health = Math.max(0, c.health - 1.8);
      if (Math.random() < 0.25) {
        spawnFloatingFeedback(0, 0, "⚠️ 身體極度虛弱！抵抗力急遽崩跌！", true);
      }
    }

    // 5. 生病遮罩提示 (低於 30% 呈現病危狀態)
    if (c.health < 30) {
      document.getElementById('sick-overlay')?.classList.remove('hidden');
    } else {
      document.getElementById('sick-overlay')?.classList.add('hidden');
    }

    // 房間髒亂懲罰
    if ((gameState.roomPoops || []).length + (gameState.activeBug ? 1 : 0) > 10) {
      c.health = Math.max(0, c.health - 0.8);
    }

    // 飢餓趴地判定
    if (c.hunger <= 0) { 
      gameState.roamState.isStarving = true; 
      document.getElementById('starve-overlay')?.classList.remove('hidden'); 
    } else { 
      gameState.roamState.isStarving = false; 
      document.getElementById('starve-overlay')?.classList.add('hidden'); 
    }

    // 6. 【核心調整】抵抗力階梯式死亡檢測
    let isDead = false;

    if (c.health <= 0 || c.ageMonths >= c.maxLifeMonths) {
      // 0% 抵抗力或壽命終了：直接死亡
      isDead = true;
    } else if (c.health < 30) {
      // 階梯式猝死機率判定 (每秒檢測)
      let deathChance = 0.01; // 20% ~ 30%：每秒 1% 機率猝死
      if (c.health < 10) {
        deathChance = 0.08;   // 0% ~ 10%：每秒 8% 機率猝死
      } else if (c.health < 20) {
        deathChance = 0.035;  // 10% ~ 20%：每秒 3.5% 機率猝死
      }

      if (Math.random() < deathChance) {
        isDead = true;
      }
    }

    if (isDead) {
      triggerCatPassingModal();
      return;
    }

    // 7. 隨機排便
    if (Math.random() < 0.025) attemptCatPoop();

    updateStatusUI(); 
    autoSaveCurrentCatProgress();
  }, intervalMs);
}

function attemptCatPoop() {
  if (Math.random() * 100 < (gameState.currentCat?.smarts || 10)) {
    gameState.userCoins += 3; spawnFloatingFeedback(0, 0, "+3 貓幣 (貓砂盆) 🚽✨");
  } else {
    gameState.roomPoops.push({ x: Math.random() * 450 + 100, y: Math.random() * 140 + 160 });
    document.getElementById('speech-text').innerText = `「不小心便便在地板上了... 💩」`;
  }
}

export function stepAgeTime(months) {
  if (gameState.isPaused) { showCustomAlert("暫停中", "遊戲暫停中，無法推進時間！", "⏸"); return; }
  const c = gameState.currentCat;
  const prevFloorMonth = Math.floor(c.ageMonths); c.ageMonths += months;
  const currentFloorMonth = Math.floor(c.ageMonths);
  
  c.hunger = Math.max(0, c.hunger - 15); c.water = Math.max(0, c.water - 15);
  c.energy = Math.max(0, c.energy - 10); c.happiness = Math.max(0, c.happiness - 8);
  gameState.roomPoops.push({ x: Math.random() * 450 + 100, y: Math.random() * 140 + 160 });
  if (currentFloorMonth > prevFloorMonth) {
    for (let m = prevFloorMonth + 1; m <= currentFloorMonth; m++) {
      if (m > 0 && m % 3 === 0) { gameState.snackPrice = Math.max(1, (gameState.snackPrice || 1) - 1); triggerNextEvent(); break; }
    }
  }
  updateStatusUI(); autoSaveCurrentCatProgress();
}

export function triggerNextEvent() {
  const evt = EXPANDED_EVENTS[Math.floor(Math.random() * EXPANDED_EVENTS.length)];
  const titleEl = document.getElementById('event-title'); const descEl = document.getElementById('event-desc');
  if (titleEl) titleEl.innerText = evt.title; if (descEl) descEl.innerText = evt.desc;
  const box = document.getElementById('event-choices-box');
  if (box) {
    box.innerHTML = [1,2,3,4].map(num => `
      <button onclick="resolveEventChoice(${num})" class="w-full text-left p-1.5 px-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#9E2A2B] text-xs font-bold text-[#2C2C2C] transition flex justify-between items-center">
        <span>${evt['c'+num]}</span><i class="fa-solid fa-chevron-right text-[10px] text-[#7F7B75]"></i>
      </button>`).join('');
  }
  window.activeGameEvent = evt;
}

export function resolveEventChoice(num) {
  if (gameState.isPaused) return; playClickSound();
  const evt = window.activeGameEvent; if (!evt) return;
  const res = evt['r' + num]; const c = gameState.currentCat;

  if (res.cute) c.cute = (c.cute || 0) + res.cute;
  c.smarts = (c.smarts || 0) + (res.smarts || 0) + 1;
  if (res.agility) c.agility = (c.agility || 0) + res.agility;
  if (res.charm) c.charm = (c.charm || 0) + res.charm;
  if (res.affection) c.affection = (c.affection || 0) + res.affection;
  if (res.coins) gameState.userCoins += res.coins;
  if (res.happiness) c.happiness = Math.max(0, Math.min(100, c.happiness + res.happiness));
  if (res.hunger) c.hunger = Math.max(0, Math.min(100, c.hunger + res.hunger));
  if (res.water) c.water = Math.max(0, Math.min(100, c.water + res.water));
  if (res.energy) c.energy = Math.max(0, Math.min(100, c.energy + res.energy));
  if (res.health) c.health = Math.min(110, c.health + res.health);

  const box = document.getElementById('event-choices-box');
  if (box) box.innerHTML = `<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-bold">✨ ${res.msg}</div>`;
  document.getElementById('speech-text').innerText = `「${res.msg}」`;
  updateStatusUI(); autoSaveCurrentCatProgress();
}

export function getSnackPrice() { return gameState.snackPrice || 1; }
export function openShopModal() {
  document.getElementById('shop-snack-btn-text').innerText = `${getSnackPrice()} 貓幣`;
  document.getElementById('shop-coin-display').innerText = gameState.userCoins;
  document.getElementById('shop-snack-display').innerText = gameState.userSnacks;
  document.getElementById('modal-shop')?.classList.remove('hidden');
}
export function closeShopModal() { document.getElementById('modal-shop')?.classList.add('hidden'); }
export function buySnackItem(amount) {
  const cost = getSnackPrice() * amount;
  if (gameState.userCoins >= cost) {
    gameState.userCoins -= cost; gameState.userSnacks += amount;
    gameState.snackPrice = Math.min(10, (gameState.snackPrice || 1) + 1);
    playPurrSound(); document.getElementById('shop-coin-display').innerText = gameState.userCoins;
    document.getElementById('shop-snack-display').innerText = gameState.userSnacks;
    updateStatusUI(); autoSaveCurrentCatProgress();
    const btn = document.getElementById('shop-snack-btn-text');
    if (btn) {
      btn.innerText = `成功!`; const p = btn.closest('button'); p.classList.remove('bg-rose-600'); p.classList.add('bg-emerald-600');
      setTimeout(() => { btn.innerText = `${getSnackPrice()} 貓幣`; p.classList.remove('bg-emerald-600'); p.classList.add('bg-rose-600'); }, 800);
    }
  } else showCustomAlert("貓幣不足", `需要 ${cost} 貓幣。`, "🪙");
}

export function buyShopItem(itemKey, cost) {
  if (gameState.userCoins >= cost) {
    gameState.userCoins -= cost;
    if (!gameState.shopInventory) gameState.shopInventory = {};
    gameState.shopInventory[itemKey] = true; playPurrSound();
    showCustomAlert("購買成功", "已裝備自動化設備！✨", "🛍️");
    if (itemKey === 'autoWater') document.getElementById('btn-buy-water').innerText = "已裝備 ✓";
    if (itemKey === 'autoFeeder') document.getElementById('btn-buy-feeder').innerText = "已裝備 ✓";
    if (itemKey === 'autoCleaner') document.getElementById('btn-buy-cleaner').innerText = "已裝備 ✓";
    updateStatusUI(); autoSaveCurrentCatProgress(); closeShopModal();
  } else showCustomAlert("貓幣不足", "去撿便便賺錢吧！", "🪙");
}

function triggerCatPassingModal() {
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  const c = gameState.currentCat;
  document.getElementById('passing-core-text').innerText = `親愛的 ${c.name} 已安詳地啟程前往貓星球（享年 ${Math.floor(c.ageMonths/12)}歲 ${Math.floor(c.ageMonths%12)}個月）。`;
  document.getElementById('modal-cat-passing')?.classList.remove('hidden');
}

export async function submitCatFarewellAndFinish() {
  const btn = document.getElementById('btn-submit-farewell');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span>⏳ 前往星空...</span>`; }
  
  const c = gameState.currentCat;
  const localCatId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  
  const record = {
    catId: localCatId, name: c.name, owner: c.owner || gameState.playerName, lifespan: `${Math.floor(c.ageMonths/12)}歲 ${Math.floor(c.ageMonths%12)}個月`,
    totalMonths: c.ageMonths, breed: c.breed.name, cute: c.cute, smarts: c.smarts, agility: c.agility, charm: c.charm, affection: c.affection, crossyScore: c.crossyScore || 0, dogScore: c.dogScore || 0,
    color: c.breed.color, stripe: c.breed.stripe, img: generateBreedThumbnail(c.breed.color, c.breed.stripe), farewellMsg: document.getElementById('cat-final-farewell-input')?.value.trim() || "謝謝你帶給我的所有溫柔陪伴。"
  };
  
  const myOwnedIds = JSON.parse(localStorage.getItem('my_owned_cat_ids') || '[]'); 
  myOwnedIds.push(localCatId); 
  localStorage.setItem('my_owned_cat_ids', JSON.stringify(myOwnedIds));
  
  await uploadStarCatToCloud(record);
  gameState.currentCat = null;
  localStorage.removeItem('saved_living_cat');
  location.reload();
}

export function updateStatusUI() {
  const c = gameState.currentCat; if (!c) return;
  document.getElementById('ui-cat-age-text').innerText = `${Math.floor(c.ageMonths/12)} 歲 ${Math.floor(c.ageMonths%12)} 個月大`;
  c.stage = c.ageMonths <= 12 ? '幼貓' : (c.ageMonths <= 84 ? '成年' : '熟齡');
  document.getElementById('ui-stage-badge').innerText = `${c.stage}階段`;
  document.getElementById('val-health').innerText = `${Math.round(c.health)}%`; document.getElementById('bar-health').style.width = `${Math.min(100, (c.health/110)*100)}%`;
  document.getElementById('val-hunger').innerText = `${Math.round(c.hunger)}%`; document.getElementById('bar-hunger').style.width = `${c.hunger}%`;
  document.getElementById('val-happiness').innerText = `${Math.round(c.happiness)}%`; document.getElementById('bar-happiness').style.width = `${c.happiness}%`;
  document.getElementById('val-water').innerText = `${Math.round(c.water)}%`; document.getElementById('bar-water').style.width = `${c.water}%`;
  document.getElementById('val-energy').innerText = `${Math.round(c.energy)}%`; document.getElementById('bar-energy').style.width = `${c.energy}%`;
  document.getElementById('val-cute').innerText = c.cute; document.getElementById('val-smarts').innerText = c.smarts; document.getElementById('val-agility').innerText = c.agility; document.getElementById('val-charm').innerText = c.charm;
  document.getElementById('ui-affection-badge').innerText = `親密: ❤️ ${c.affection}`;
  if (document.getElementById('val-coins')) document.getElementById('val-coins').innerText = gameState.userCoins;
  if (document.getElementById('val-snacks')) document.getElementById('val-snacks').innerText = gameState.userSnacks;
  if (document.getElementById('sub-snack-qty')) document.getElementById('sub-snack-qty').innerText = `(剩 ${gameState.userSnacks} 個)`;
}

export function openMinigameHub(mode = 'star') {
  window.currentHubMode = mode;
  if (mode === 'living' && !gameState.isPaused) {
    togglePlayPause();
  }
  document.getElementById('modal-minigame-hub')?.classList.remove('hidden');
}

export function closeMinigameHub() {
  document.getElementById('modal-minigame-hub')?.classList.add('hidden');
}

export function hubLaunchCrossy() {
  closeMinigameHub();
  if (window.openMinigameSelect) window.openMinigameSelect();
}

export function hubLaunchDog() {
  closeMinigameHub();
  if (window.openMinigameDogSelect) window.openMinigameDogSelect();
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    renderTopBreedsBars, renderAllBreedsModal, openBreedModal, closeBreedModal, switchHomeRankTab, toggleRankExpand, renderHomeRankTab, switchPlanetFilter, renderCatPlanetSection, gotoPlanetPage, showNostalgicQuote, openMyMemoryModal, closeMyMemoryModal, showCustomAlert, closeCustomAlert, openNameModal, closeNameModal, randomizeCatName, confirmBirthWithName, autoSaveCurrentCatProgress, saveCurrentCatProgress, continueSavedCat, updateContinueButtonState, onCanvasClick, setInteractionMode, feedDirectFood, refillWater, visitDoctor, togglePlayPause, setTimeSpeed, stepAgeTime, triggerNextEvent, resolveEventChoice, openShopModal, closeShopModal, buySnackItem, buyShopItem, submitCatFarewellAndFinish, updateStatusUI, toggleAudio, getSnackPrice,
    openMinigameHub, closeMinigameHub, hubLaunchCrossy, hubLaunchDog, renderMyMemories, ensureCurrentCatLoaded
  });
}