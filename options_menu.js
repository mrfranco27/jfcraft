// options_menu.js
class OptionsMenu {
    constructor() {
        this.visible = false;
        this.buttons = [];
        this.mouseX = 0;
        this.mouseY = 0;

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        Object.assign(this.canvas.style, {
            position: "fixed",
            left: "0",
            top: "0",
            width: "100vw",
            height: "100vh",
            zIndex: "100001", // Higher than GameMenu
            display: "none",
            pointerEvents: "none",
            imageRendering: "pixelated"
        });

        document.body.appendChild(this.canvas);
        this.setupInput();
        this.createButtons();
        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
        this.loop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        this.canvas.addEventListener("mousedown", (e) => {
            if (!this.visible) return;
            const mx = e.clientX / this.guiScale;
            const my = e.clientY / this.guiScale;

            this.buttons.forEach(item => {
                if (item instanceof UIPair) {
                    if (item.btnLeft.contains(mx, my)) item.btnLeft.onClick();
                    if (item.btnRight.contains(mx, my)) item.btnRight.onClick();
                } else if (item instanceof UIButton) {
                    if (item.contains(mx, my)) item.onClick();
                }
            });
        });

        this.canvas.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    createButtons() {
        this.buttons = [
            // Row 1: FOV and Difficulty
            new UIPair(
                new UIButton({ text: "FOV: 90", width: 150, disabled: true }),
                new UIButton({ text: "Difficulty: Normal", width: 150 }),
                10
            ),
            null, // Vertical space
            // 5 more block pairs
            new UIPair(new UIButton({ text: "Music & Sounds...", width: 150 }), new UIButton({ text: "Video Settings...", width: 150 }), 10),
            new UIPair(new UIButton({ text: "Controls...", width: 150 }), new UIButton({ text: "Language...", width: 150 }), 10),
            new UIPair(new UIButton({ text: "Chat Settings...", width: 150 }), new UIButton({ text: "Resource Packs...", width: 150 }), 10),
            new UIPair(new UIButton({ text: "Accessibility...", width: 150 }), new UIButton({ text: "Skin Customization...", width: 150 }), 10),
            new UIPair(new UIButton({ text: "Telemetry...", width: 150 }), new UIButton({ text: "Credits...", width: 150 }), 10),
            
            { vGap: 0 }, // Custom Vgap
            
            new UIButton({ 
    text: "Done", 
    width: 200, 
    onClick: () => {
        this.deactivate();
        if (window.gameMenu) window.gameMenu.show();
    }
})
        ];
    }

    show() {
    this.visible = true;
    UI.state.menuOpen = true;

    this.canvas.style.display = "block";
    this.canvas.style.pointerEvents = "auto";
}

    deactivate() {
    this.visible = false;
    this.inMenu = false;
    this.canvas.style.display = "none";
    this.canvas.style.pointerEvents = "none";
}

    hide() {
    this.deactivate();
    UI.state.menuOpen = false;

    const game = document.getElementById("game");
    if (game) game.requestPointerLock();
}

    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.visible) return;

        const { ctx, canvas, buttons } = this;
        const guiScale = UI.guiScale;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = (canvas.width / guiScale) / 2;
        const startY = Math.floor((canvas.height / guiScale) / 6);
        let currentYOffset = 0;

        buttons.forEach((item) => {
            if (item === null) {
                currentYOffset += 24; // Default gap
                return;
            }
            
            if (item.vGap !== undefined) {
                currentYOffset += item.vGap;
                return;
            }

            const y = Math.floor(startY + currentYOffset);

            if (item instanceof UIPair) {
                const totalPairWidth = item.btnLeft.width + item.pairGap + item.btnRight.width;
                const pairStartX = centerX - (totalPairWidth / 2);
                
                item.btnLeft.x = Math.floor(pairStartX);
                item.btnLeft.y = y;
                item.btnRight.x = Math.floor(pairStartX + item.btnLeft.width + item.pairGap);
                item.btnRight.y = y;

                [item.btnLeft, item.btnRight].forEach(b => {
                    b.setHover(b.contains(this.mouseX / guiScale, this.mouseY / guiScale));
                    b.draw(ctx, guiScale);
                });
                currentYOffset += 24;
            } else if (item instanceof UIButton) {
                item.x = Math.floor(centerX - (item.width / 2));
                item.y = y;
                item.setHover(item.contains(this.mouseX / guiScale, this.mouseY / guiScale));
                item.draw(ctx, guiScale);
                currentYOffset += 24;
            }
        });
    }
}

window.optionsMenu = new OptionsMenu();

// Link to GameMenu: Update the Options button in game_menu.js to:
// new UIButton({ text: "Options...", width: 98, onClick: () => window.optionsMenu.show() }) done doesn't work