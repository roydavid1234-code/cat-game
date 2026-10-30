import { gameState } from './game-state.js';
import { 
  renderTopBreedsBars, 
  renderAllBreedsModal, 
  renderHomeRankTab, 
  renderCatPlanetSection, 
  updateContinueButtonState, 
  ensureCurrentCatLoaded,
  autoSaveCurrentCatProgress
} from './ui-handler.js';
import { initParadiseGarden } from './canvas-render.js';
import { loadBirthedHistoryFromCloud, loadStarCatsFromCloud } from './cloud-db.js';

// 引入雙小遊戲模組
import './minigame-crossy.js';
import './minigame-dog.js';

async function initApp() {
  // 1. 載入本地存檔的主角貓與按鈕狀態（維持在大廳等待玩家點選）
  ensureCurrentCatLoaded();
  updateContinueButtonState();

  // 2. 先繪製圖鑑框架
  renderAllBreedsModal();

  // 3. 精確呼叫雲端資料庫，抓取全服 22 隻誕生紀錄與星空貓咪
  try {
    if (typeof loadStarCatsFromCloud === 'function') {
      const starCats = await loadStarCatsFromCloud();
      if (Array.isArray(starCats)) gameState.myStarCats = starCats;
    }
    if (typeof loadBirthedHistoryFromCloud === 'function') {
      const birthHistory = await loadBirthedHistoryFromCloud();
      if (Array.isArray(birthHistory)) gameState.birthedCatsHistory = birthHistory;
    }
  } catch (err) {
    console.error("雲端資料同步異常:", err);
  }

  // 4. 雲端資料同步完成，即時重繪首頁 22 隻統計、排行榜與天堂花園
  renderTopBreedsBars();
  renderHomeRankTab('growth');
  renderCatPlanetSection();
  initParadiseGarden();
}

window.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// 視窗離開或重新整理前，自動寫入存檔
window.addEventListener('beforeunload', () => {
  if (gameState.currentCat) {
    try {
      autoSaveCurrentCatProgress();
    } catch (e) {}
  }
});