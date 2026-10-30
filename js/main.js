import './minigame-crossy.js';
import './minigame-dog.js';
import { loadStarCatsFromCloud, loadBirthedHistoryFromCloud } from './cloud-db.js';
import { 
  renderTopBreedsBars, 
  renderHomeRankTab, 
  renderCatPlanetSection, 
  updateContinueButtonState,
  autoSaveCurrentCatProgress 
} from './ui-handler.js';
import { initParadiseGarden } from './canvas-render.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. 載入雲端資料
  await loadStarCatsFromCloud();
  await loadBirthedHistoryFromCloud();

  // 2. 初始化首頁介面與排行榜
  renderTopBreedsBars();
  renderHomeRankTab('growth');
  renderCatPlanetSection();
  updateContinueButtonState();

  // 3. 初始化背景天堂島動畫
  const paradiseCanvas = document.getElementById('paradise-canvas');
  if (paradiseCanvas) {
    initParadiseGarden();
  }
});

// 離開分頁或重新整理時自動存檔
window.addEventListener('beforeunload', () => {
  autoSaveCurrentCatProgress();
});

// 切換至背景時自動存檔
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    autoSaveCurrentCatProgress();
  }
});