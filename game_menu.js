class UIPair {
    constructor(btnLeft, btnRight, pairGap = 4) {
        if (pairGap % 2 !== 0) {
            console.log("Pairgaps can only be even");
            pairGap += 1;
        }
        this.btnLeft = btnLeft;
        this.btnRight = btnRight;
        this.pairGap = pairGap;
    }
}

class GameMenu {
    constructor() {
        this.visible = false;
        this.inMenu = false;
        this.guiScale = 2;
        this.buttons = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");

        Object.assign(this.canvas.style, {
            position: "fixed", left: "0", top: "0", width: "100vw", height: "100vh",
            zIndex: "100000", display: "none", pointerEvents: "none", imageRendering: "pixelated"
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
    // Detect when the browser blocks a pointer lock request
    document.addEventListener("pointerlockerror", () => {
        console.warn("Pointer lock blocked by browser cooldown. Retrying in 3s...");
        
        // If we are NOT in the menu but the mouse isn't locked, force it in 3s
        setTimeout(() => {
            const game = document.getElementById("game");
            if (!this.visible && game && document.pointerLockElement !== game) {
                game.requestPointerLock();
            }
        }, 3000); 
    });

    document.addEventListener("pointerlockchange", () => {
        const isLocked = document.pointerLockElement !== null;
        if (!isLocked && !this.visible) this.show();
    });

        this.canvas.addEventListener("mousedown", (e) => {
    if (!this.visible) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / this.guiScale;
    const my = (e.clientY - rect.top) / this.guiScale;

    for (let item of this.buttons) {
        if (!item) continue; // Skip null (spacers)

        if (item instanceof UIPair) {
            // Check both buttons inside the pair
            if (item.btnLeft.contains(mx, my)) item.btnLeft.onClick();
            if (item.btnRight.contains(mx, my)) item.btnRight.onClick();
        } else if (item.contains(mx, my)) {
            // Standard single button
            item.onClick();
        }
    }
});

        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    createButtons() {
        this.buttons = [
            new UIButton({ text: "Back to Game", width: 200, onClick: () => this.hide() }),
            
            // Paired block with custom gap (98 + 4 + 98 = 200 total width)
            new UIPair(
                new UIButton({ text: "Achievements", width: 98, disabled: true }),
                new UIButton({ text: "Statistics", width: 98 }),
                4 
            ),
            
            null, // Vertical space
            
            // Paired block with custom gap (98 + 4 + 98 = 200 total width)
            new UIPair(
                new UIButton({ text: "Options...", width: 98, onClick: () => {
            this.deactivate(); // Don't lock mouse, just switch screens
                    window.optionsMenu.show(); 
        } }),
                new UIButton({ text: "Invite", width: 98, disabled: true }),
                4
            ),
            
            new UIButton({ text: "Save and Quit to Title", width: 200, onClick: () => location.reload() })
        ];
    }

    show() {
        this.visible = true;
        this.inMenu = true;
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
        this.deactivate(); // Hide the UI
        this.inMenu = false;
        this.canvas.style.display = "none";
        this.canvas.style.pointerEvents = "none";
        const game = document.getElementById("game");
        if (game) game.requestPointerLock();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        if (!this.visible) return;

        const { ctx, guiScale, canvas, buttons } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.627)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = (canvas.width / guiScale) / 2;
        const startY = Math.floor((canvas.height / guiScale) / 4) + 9;
        let currentRow = 0;

        buttons.forEach((item) => {
            if (item === null) {
                currentRow++;
                return;
            }

            const y = Math.floor(startY + (currentRow * 24));
            
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
            } else {
                item.x = Math.floor(centerX - (item.width / 2));
                item.y = y;
                item.setHover(item.contains(this.mouseX / guiScale, this.mouseY / guiScale));
                item.draw(ctx, guiScale);
            }
            currentRow++;
        });
    }
}

window.gameMenu = new GameMenu();
