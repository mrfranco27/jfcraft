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
            zIndex: "100001",
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

            const rect = this.canvas.getBoundingClientRect();
            const mouse = window.uiManager.mouse(e, rect);

            this.buttons.forEach(item => {
                if (item instanceof UIPair) {
                    if (item.btnLeft.contains(mouse.x, mouse.y)) item.btnLeft.onClick();
                    if (item.btnRight.contains(mouse.x, mouse.y)) item.btnRight.onClick();
                } else if (item instanceof UIButton) {
                    if (item.contains(mouse.x, mouse.y)) item.onClick();
                }
            });
        });

        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouse = window.uiManager.mouse(e, rect);
            this.mouseX = mouse.x;
            this.mouseY = mouse.y;
        });
    }

    createButtons() {
        this.buttons = [
            new UIPair(
                new UIButton({ text: "FOV: 90", width: 150, disabled: true }),
                new UIButton({ text: "Difficulty: Normal", width: 150 }),
                10
            ),

            null,

            new UIPair(
                new UIButton({ text: "Music & Sounds...", width: 150 }),
                new UIButton({ text: "Video Settings...", width: 150 }),
                10
            ),

            new UIPair(
                new UIButton({ text: "Controls...", width: 150 }),
                new UIButton({ text: "Language...", width: 150 }),
                10
            ),

            new UIPair(
                new UIButton({ text: "Chat Settings...", width: 150 }),
                new UIButton({ text: "Resource Packs...", width: 150 }),
                10
            ),

            new UIPair(
                new UIButton({ text: "Accessibility...", width: 150 }),
                new UIButton({ text: "Skin Customization...", width: 150 }),
                10
            ),

            new UIPair(
                new UIButton({ text: "Telemetry...", width: 150 }),
                new UIButton({ text: "Credits...", width: 150 }),
                10
            ),

            { vGap: 0 },

            new UIButton({
                text: "Done",
                width: 200,
                onClick: () => {
                    this.deactivate();
                    window.gameMenu.show();
                }
            })
        ];
    }

    show() {
        this.visible = true;
        this.canvas.style.display = "block";
        this.canvas.style.pointerEvents = "auto";
        if (window.gameMenu) window.gameMenu.visible = false;
    }

    deactivate() {
        this.visible = false;
        this.canvas.style.display = "none";
        this.canvas.style.pointerEvents = "none";
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.visible) return;

        const { ctx, canvas, buttons } = this;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = window.uiManager.centerX(canvas.width);
        const startY = window.uiManager.centerY(canvas.height, 6);

        let offset = 0;

        const mouseX = this.mouseX;
        const mouseY = this.mouseY;

        buttons.forEach(item => {
            if (item === null) {
                offset += 24;
                return;
            }

            if (item.vGap !== undefined) {
                offset += item.vGap;
                return;
            }

            const y = Math.floor(startY + offset);

            if (item instanceof UIPair) {
                const total = item.btnLeft.width + item.pairGap + item.btnRight.width;
                const startX = centerX - total / 2;

                item.btnLeft.x = Math.floor(startX);
                item.btnLeft.y = y;

                item.btnRight.x = Math.floor(startX + item.btnLeft.width + item.pairGap);
                item.btnRight.y = y;

                [item.btnLeft, item.btnRight].forEach(b => {
                    b.setHover(b.contains(mouseX, mouseY));
                    b.draw(ctx);
                });

                offset += 24;
            } else {
                item.x = Math.floor(centerX - item.width / 2);
                item.y = y;
                item.setHover(item.contains(mouseX, mouseY));
                item.draw(ctx);

                offset += 24;
            }
        });
    }
}

window.optionsMenu = new OptionsMenu();