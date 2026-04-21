class UIButton {
    static globalFont = "MinecraftMain";

    constructor(opts) {
        this.text = opts.text || "Button";
        this.width = opts.width || 200;
        this.height = 20;
        this.x = 0;
        this.y = 0;
        this.onClick = opts.onClick || function () {};
        this.disabled = opts.disabled || false;
        this.state = this.disabled ? 0 : 1;
    }

    static loadTexture() {
        UIButton.image = new Image();
        UIButton.image.src = "assets/minecraft/textures/gui/buttons.png";
        UIButton.loaded = false;
        UIButton.image.onload = () => UIButton.loaded = true;
    }

    contains(mx, my) {
        if (this.disabled) return false;
        return (
            mx >= this.x &&
            mx <= this.x + this.width &&
            my >= this.y &&
            my <= this.y + this.height
        );
    }

    setHover(hover) {
        if (this.disabled) {
            this.state = 0;
            return;
        }
        this.state = hover ? 2 : 1;
    }

    draw(ctx) {
    if (!UIButton.loaded) return;

    const scale = window.uiManager.getScale();
    const { x, y, w, h } = window.uiManager.rect(this.x, this.y, this.width, this.height);
    const sliceY = this.state * 20;

    // --- 1. CRITICAL: CLEAR THE OLD DRAWING ---
    // This prevents the "stacking" effect on the text and shadows
    ctx.clearRect(x, y, w, h);

    const img = UIButton.image;
    const halfW = Math.floor(w / 2);
    ctx.imageSmoothingEnabled = false;

    // --- 2. DRAW TEXTURE (Old slicing logic) ---
    // Left Side
    ctx.drawImage(img, 0, sliceY, halfW / scale, 20, x, y, halfW, h);
    // Right Side
    ctx.drawImage(img, 200 - (halfW / scale), sliceY, halfW / scale, 20, x + halfW, y, w - halfW, h);

    // --- 3. DRAW TEXT ---
    ctx.font = `${Math.floor(10 * scale)}px ${UIButton.globalFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Reset shadow state fully before checking disabled status
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "transparent";

    if (this.disabled) {
        ctx.fillStyle = "#A0A0A0";
    } else {
        ctx.shadowOffsetX = Math.floor(1 * scale);
        ctx.shadowOffsetY = Math.floor(1 * scale);
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.fillStyle = (this.state === 2) ? "#FFFF55" : "#FFFFFF";
    }

    ctx.fillText(this.text, x + w / 2, y + h / 2);

    // Clean up for next draw call
    ctx.shadowColor = "transparent";
}


}

UIButton.loadTexture();
window.UIButton = UIButton;