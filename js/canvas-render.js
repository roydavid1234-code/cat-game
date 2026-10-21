/**
 * Canvas 渲染引擎封裝類別
 * 支援高畫質 (Retina) 適配、自動清屏、物件動態渲染與生命週期管理
 */
class CanvasRenderer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`找不到 ID 為 "${canvasId}" 的 canvas 元素。`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // 配置項
        this.autoResize = options.autoResize || false;
        this.scaleDPR = options.scaleDPR !== undefined ? options.scaleDPR : true;
        
        // 渲染物件清單
        this.renderList = [];

        // 初始化尺寸與高分屏處理
        this.initSize();
        
        if (this.autoResize) {
            window.addEventListener('resize', () => this.handleResize());
        }
    }

    /**
     * 初始化 Canvas 尺寸與設備像素比 (DPR) 適配
     */
    initSize() {
        const dpr = this.scaleDPR ? (window.devicePixelRatio || 1) : 1;
        
        // 取得 CSS 設置的顯示寬高或預設寬高
        const displayWidth = this.canvas.clientWidth || 800;
        const displayHeight = this.canvas.clientHeight || 600;

        // 設置真實像素尺寸
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;

        // 設置 CSS 樣式尺寸保持不變
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        // 縮放上下文以匹配高分屏
        this.ctx.scale(dpr, dpr);
        
        this.width = displayWidth;
        this.height = displayHeight;
    }

    /**
     * 視窗大小改變時的處理函數
     */
    handleResize() {
        this.initSize();
        this.render();
    }

    /**
     * 清空畫布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 添加渲染物件
     * @param {Object} item 需包含 draw(ctx) 方法的物件
     */
    add(item) {
        if (item && typeof item.draw === 'function') {
            this.renderList.push(item);
        } else {
            console.warn('渲染物件必須包含 draw(ctx) 方法');
        }
    }

    /**
     * 移除渲染物件
     */
    remove(item) {
        const index = this.renderList.indexOf(item);
        if (index !== -1) {
            this.renderList.splice(index, 1);
        }
    }

    /**
     * 清空所有渲染物件
     */
    clearObjects() {
        this.renderList = [];
    }

    /**
     * 執行單次完整渲染
     */
    render() {
        this.clear();
        
        // 依序渲染清單中的所有物件
        for (const item of this.renderList) {
            this.ctx.save();
            item.draw(this.ctx);
            this.ctx.restore();
        }
    }

    /**
     * 啟動基於 requestAnimationFrame 的渲染循環（適用於動畫或遊戲）
     */
    startLoop() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const loop = () => {
            if (!this.isAnimating) return;
            
            // 可在此處加入 update 邏輯 (如: item.update?.())
            this.render();
            
            this.animationFrameId = requestAnimationFrame(loop);
        };

        loop();
    }

    /**
     * 停止渲染循環
     */
    stopLoop() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

// 匯出模組（支援 ES6 Module）
export default CanvasRenderer;