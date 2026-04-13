class UIButton {
    static globalFont = "MinecraftMain";

    constructor(opts) {
        this.text = opts.text || "Button";
        this.width = opts.width || 200;
        this.height = 20;
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.onClick = opts.onClick || function () {};
        
        // New features: pair and disabled
        this.pair = opts.pair || false;
        this.disabled = opts.disabled || false;
        
        // State 0 = Disabled, 1 = Normal, 2 = Hover
        this.state = this.disabled ? 0 : 1;
    }

    static loadTexture() {
        UIButton.image = new Image();
        UIButton.image.src = "assets/minecraft/textures/gui/buttons.png";
        UIButton.loaded = false;
        UIButton.image.onload = () => { UIButton.loaded = true; };
    }

    contains(mx, my) {
        // Disabled buttons cannot be clicked
        if (this.disabled) return false;
        return (mx >= this.x && mx <= this.x + this.width && my >= this.y && my <= this.y + this.height);
    }

    setHover(isHovering) {
        // Disabled buttons stay in state 0 (grey)
        if (this.disabled) {
            this.state = 0;
            return;
        }
        this.state = isHovering ? 2 : 1;
    }

    draw(ctx, guiScale) {
        if (!UIButton.loaded) return;

        const img = UIButton.image;
        const sliceY = this.state * 20;

        const x = Math.floor(this.x * guiScale);
        const y = Math.floor(this.y * guiScale);
        const w = Math.floor(this.width * guiScale);
        const h = Math.floor(this.height * guiScale);
        const halfW = Math.floor(w / 2);

        ctx.imageSmoothingEnabled = false;

        // --- DRAW BUTTON TEXTURE ---
        // Left Side
        ctx.drawImage(
            img, 0, sliceY,
            halfW / guiScale, 20,
            x, y,
            halfW, h
        );

        // Right Side
        ctx.drawImage(
            img, 200 - (halfW / guiScale), sliceY,
            halfW / guiScale, 20,
            x + halfW, y,
            w - halfW, h
        );

        // --- DRAW TEXT ---
        ctx.font = `${Math.floor(10 * guiScale)}px ${UIButton.globalFont}`;
        
        // Text Color Logic: Disabled gets dark grey, Hover gets yellow, Normal gets white
        if (this.disabled) {
            ctx.fillStyle = "#A0A0A0";
            ctx.shadowColor = "transparent"; // No shadow for disabled text in some versions
        } else {
            ctx.shadowOffsetX = Math.floor(1 * guiScale);
            ctx.shadowOffsetY = Math.floor(1 * guiScale);
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.fillStyle = (this.state === 2) ? "#FFFF55" : "white";
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, x + (w / 2), y + (h / 2));

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = "transparent";
    }
}

UIButton.loadTexture();
window.UIButton = UIButton;
