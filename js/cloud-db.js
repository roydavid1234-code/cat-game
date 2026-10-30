import { gameState, saveMyStarCats, saveBirthedHistory } from './game-state.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase 配置 (對準您原本的 Realtime Database)
const firebaseConfig = {
  projectId: "cat-planet-89c9e",
  databaseURL: "https://cat-planet-89c9e-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 1. 上傳星空貓咪資料
export async function uploadStarCatToCloud(record) {
  try {
    await push(ref(db, "star_cats"), record);
    console.log("☁️ 星空貓咪上傳雲端成功！");
  } catch (e) {
    console.warn("☁️ 雲端上傳失敗，已存至本地：", e);
  }
}

// 2. 上傳誕生紀錄
export async function uploadBirthToCloud(record) {
  try {
    await push(ref(db, "birthed_history"), record);
    console.log("☁️ 誕生紀錄上傳雲端成功！");
  } catch (e) {
    console.warn("☁️ 雲端誕生紀錄上傳失敗：", e);
  }
}

// 3. 載入星空貓咪
export async function loadStarCatsFromCloud() {
  try {
    const snapshot = await get(ref(db, "star_cats"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const cloudCats = Object.values(data);
      gameState.myStarCats = cloudCats;
      saveMyStarCats();
      console.log(`☁️ 已成功載入 ${cloudCats.length} 隻星空貓咪資料`);
    } else {
      console.log("☁️ 目前雲端尚無星空貓咪資料");
    }
  } catch (e) {
    console.warn("☁️ 讀取雲端星空貓咪失敗：", e);
  }
}

// 4. 載入誕生歷史紀錄
export async function loadBirthedHistoryFromCloud() {
  try {
    const snapshot = await get(ref(db, "birthed_history"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const cloudHistory = Object.values(data);
      gameState.birthedCatsHistory = cloudHistory;
      saveBirthedHistory();
      console.log(`☁️ 已成功載入 ${cloudHistory.length} 筆誕生紀錄`);
    } else {
      console.log("☁️ 目前雲端尚無誕生紀錄");
    }
  } catch (e) {
    console.warn("☁️ 讀取雲端誕生紀錄失敗：", e);
  }
}