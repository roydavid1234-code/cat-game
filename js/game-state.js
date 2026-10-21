export const gameState = {
  currentCat: null,
  activeInteractionMode: 'pet',
  petSuccessCounter: 0,
  userCoins: 0,
  userSnacks: 5,
  playerName: "貓奴主人",
  
  shopInventory: {
    autoWater: false,
    autoFeeder: false,
    autoCleaner: false
  },

  roomPoops: [],
  mousePos: { x: -100, y: -100, onStage: false },

  // 冷卻時間控制戳 (15秒 = 15000毫秒)
  lastAffectionIncreaseTime: 0,
  lastToyRewardTime: 0,

  // 逗貓棒追逐心理狀態 (true=想追, false=不想理)
  isToyInterested: true,
  toyInterestCheckTimer: 0,

  roamState: {
    x: 450,
    y: 200,
    vx: 1.0,
    vy: 0.6,
    facing: 1,
    isWalking: true,
    walkTimer: 0,
    idleTimer: 0,
    isSleepingInCage: false,
    sleepTargetSeconds: 0,
    sleepElapsedSeconds: 0,
    isStarving: false,
    isScurrying: false,
    scurryTimer: 0,
    hitRadius: 42
  },

  isPaused: false,
  timeSpeedMultiplier: 1,
  
  planetCurrentPage: 1,
  currentPlanetFilter: 'all',
  currentRankTab: 'cute',
  isRankExpanded: false,

  // 本地存檔：前往星空的貓咪
  myStarCats: JSON.parse(localStorage.getItem('my_star_cats') || '[]'),
  
  // 本地存檔：玩家歷史誕生過的所有貓咪 (統計排行榜用)
  birthedCatsHistory: JSON.parse(localStorage.getItem('birthed_cats_history') || '[]')
};

export function saveMyStarCats() {
  localStorage.setItem('my_star_cats', JSON.stringify(gameState.myStarCats));
}

export function saveBirthedHistory() {
  localStorage.setItem('birthed_cats_history', JSON.stringify(gameState.birthedCatsHistory));
}