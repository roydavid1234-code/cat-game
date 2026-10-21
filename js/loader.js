/**
 * 載入外部 HTML 組件至指定容器
 * @param {string} selector - 掛載點 DOM 選擇器
 * @param {string} fileUrl - components/*.html 檔案路徑
 */
async function loadComponent(selector, fileUrl) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`載入組件失敗: ${fileUrl}`);
    const html = await response.text();
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

/**
 * 平行載入所有 HTML 組件
 */
export async function loadAllComponents() {
  await Promise.all([
    loadComponent('#comp-header', './components/header.html'),
    loadComponent('#comp-landing', './components/phase-landing.html'),
    loadComponent('#comp-game', './components/phase-game.html'),
    loadComponent('#comp-modals', './components/modals.html')
  ]);
}