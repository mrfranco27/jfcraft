class UIManager {
    constructor() {
        this.guiScale = 2;
    }

    getScale() {
        return this.guiScale;
    }

    setScale(scale) {
        this.guiScale = scale;
    }

    // UI ↔ Screen conversion (same math you already use)
    toUI(x) {
        return x / this.guiScale;
    }

    toScreen(x) {
        return Math.floor(x * this.guiScale);
    }

    mouse(event, rect) {
        return {
            x: (event.clientX - rect.left) / this.guiScale,
            y: (event.clientY - rect.top) / this.guiScale
        };
    }

    centerX(canvasWidth) {
        return (canvasWidth / this.guiScale) / 2;
    }

    centerY(canvasHeight, divisor = 4) {
        return Math.floor((canvasHeight / this.guiScale) / divisor);
    }

    rect(x, y, w, h) {
        const s = this.guiScale;
        return {
            x: Math.floor(x * s),
            y: Math.floor(y * s),
            w: Math.floor(w * s),
            h: Math.floor(h * s),
        };
    }
}

window.uiManager = new UIManager();