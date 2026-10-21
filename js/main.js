import { toggleAudio } from './audio.js';
import { 
  renderTopBreedsBars, 
  renderAllBreedsModal, 
  openBreedModal, 
  closeBreedModal, 
  switchHomeRankTab, 
  toggleRankExpand, 
  switchPlanetFilter, 
  renderCatPlanetSection, 
  gotoPlanetPage, 
  showNostalgicQuote, 
  openMyMemoryModal, 
  closeMyMemoryModal, 
  showCustomAlert, 
  closeCustomAlert, 
  openNameModal, 
  closeNameModal, 
  randomizeCatName, 
  confirmBirthWithName, 
  setInteractionMode, 
  feedDirectFood, 
  refillWater, 
  visitDoctor, 
  togglePlayPause, 
  setTimeSpeed, 
  stepAgeTime, 
  resolveEventChoice, 
  openShopModal, 
  closeShopModal, 
  buySnackItem, 
  buyShopItem, 
  submitCatFarewellAndFinish,
  saveCurrentCatProgress,
  continueSavedCat,
  updateContinueButtonState
} from './ui-handler.js';
import { initParadiseGarden } from './canvas-render.js';
import { gameState } from './game-state.js';
import { fetchGlobalStarCats, fetchGlobalBirthHistory } from './cloud-db.js';

// 掛載至全域 window 供 HTML inline onclick 呼叫
Object.assign(window, {
  toggleAudio,
  renderTopBreedsBars,
  openBreedModal,
  closeBreedModal,
  switchHomeRankTab,
  toggleRankExpand,
  switchPlanetFilter,
  renderCatPlanetSection,
  gotoPlanetPage,
  showNostalgicQuote,
  openMyMemoryModal,
  closeMyMemoryModal,
  showCustomAlert,
  closeCustomAlert,
  openNameModal,
  closeNameModal,
  randomizeCatName,
  confirmBirthWithName,
  setInteractionMode,
  feedDirectFood,
  refillWater,
  visitDoctor,
  togglePlayPause,
  setTimeSpeed,
  stepAgeTime,
  resolveEventChoice,
  openShopModal,
  closeShopModal,
  buySnackItem,
  buyShopItem,
  submitCatFarewellAndFinish,
  saveCurrentCatProgress,
  continueSavedCat
});

// 初始化應用程式（先拉取雲端數據，再進行畫面渲染）
async function initApp() {
  try {
    // 1. 同步雲端資料庫中所有玩家送上星空的貓咪與誕生紀錄
    const [globalCats, globalBirths] = await Promise.all([
      fetchGlobalStarCats(),
      fetchGlobalBirthHistory()
    ]);

    if (globalCats && globalCats.length > 0) {
      gameState.myStarCats = globalCats;
    }
    if (globalBirths && globalBirths.length > 0) {
      gameState.birthedCatsHistory = globalBirths;
    }
  } catch (err) {
    console.error("雲端載入失敗，降級使用本地存檔：", err);
  }

  // 2. 執行初次渲染
  renderTopBreedsBars();
  renderAllBreedsModal();
  switchHomeRankTab(gameState.currentRankTab);
  renderCatPlanetSection();
  initParadiseGarden();
  updateContinueButtonState();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}