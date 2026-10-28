// ==========================================
// 全域遊戲狀態管理中心
// ==========================================

export const gameState = {
  playerName: '',
  currentCat: null,
  userCoins: 1, // 預設持有 1 貓幣
  userSnacks: 5,
  roomPoops: [],
  shopInventory: {
    autoWater: false,
    autoFeeder: false,
    autoCleaner: false
  },
  roamState: {
    x: 320,
    y: 250,
    vx: 0.8,
    vy: 0.5,
    facing: 1,
    isWalking: true,
    isSleepingInCage: false,
    isStarving: false,
    isScurrying: false,
    scurryTimer: 0,
    hitRadius: 40
  },
  activeBug: null,
  activeInteractionMode: 'pet', // pet | toy | snack
  timeSpeedMultiplier: 1,
  isPaused: false,
  doctorCdUntil: 0,
  lastAffectionIncreaseTime: 0,
  lastToyStatTime: 0, // 逗貓棒能力增加冷卻時間戳記 (30秒)
  consecutivePetCount: 0,
  petSuccessCounter: 0,
  currentRankTab: 'growth',
  isRankExpanded: false,
  currentPlanetFilter: 'all',
  planetCurrentPage: 1,
  birthedCatsHistory: [],
  myStarCats: []
};

export function saveMyStarCats() {
  localStorage.setItem('my_star_cats_data', JSON.stringify(gameState.myStarCats));
}

export function saveBirthedHistory() {
  localStorage.setItem('birthed_cats_history', JSON.stringify(gameState.birthedCatsHistory));
}