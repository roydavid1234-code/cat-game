import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWOtcco52iK9in2Iis1IrR_QRDb6fgPKc",
  authDomain: "cat-planet-89c9e.firebaseapp.com",
  projectId: "cat-planet-89c9e",
  storageBucket: "cat-planet-89c9e.firebasestorage.app",
  messagingSenderId: "449678472915",
  appId: "1:449678472915:web:78cad08b95dbfef4f90626",
  measurementId: "G-H50XJPDZG6",
  databaseURL: "https://cat-planet-89c9e-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 1. 上傳已故貓咪到全域貓星球
export async function uploadStarCatToCloud(catData) {
  try {
    const starCatsRef = ref(db, 'star_cats');
    const newRef = await push(starCatsRef, catData);
    return newRef.key;
  } catch (err) {
    console.error("雲端上傳失敗：", err);
    return null;
  }
}

// 2. 從全域貓星球拉取所有玩家的貓咪
export async function fetchGlobalStarCats() {
  try {
    const starCatsRef = ref(db, 'star_cats');
    const snapshot = await get(starCatsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).reverse();
    }
    return [];
  } catch (err) {
    console.error("拉取全域貓咪失敗：", err);
    return [];
  }
}

// 3. 上傳誕生紀錄
export async function uploadBirthToCloud(birthData) {
  try {
    const birthRef = ref(db, 'birthed_history');
    await push(birthRef, birthData);
  } catch (err) {}
}

// 4. 拉取全域誕生紀錄
export async function fetchGlobalBirthHistory() {
  try {
    const birthRef = ref(db, 'birthed_history');
    const snapshot = await get(birthRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    return [];
  } catch (err) {
    return [];
  }
}