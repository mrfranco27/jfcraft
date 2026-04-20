class HUD {
    constructor() {
        this.createCrosshair();
        this.createInfo();
        this.createChat();

        // cache elements (important)
        this.coords = null;
        this.speed = null;
        this.facing = null;
    }

    createCrosshair() {
        this.crosshair = document.createElement("div");
        this.crosshair.id = "crosshair";
        document.body.appendChild(this.crosshair);
    }

    createInfo() {
        this.info = document.createElement("div");
        this.info.id = "info";
        this.info.innerHTML = `
            Facing: <span id="dirfacing">N</span><br>
            XYZ: <span id="coords">0 / 0 / 0</span><br>
            Speed: <span id="speed">0.00</span> bps
        `;
        document.body.appendChild(this.info);

        // 🔥 cache spans
        this.coords = this.info.querySelector("#coords");
        this.speed = this.info.querySelector("#speed");
        this.facing = this.info.querySelector("#dirfacing");

        Object.assign(this.info.style, {
    position: "absolute",
    top: "0",
    left: "0",
    color: "white",
    background: "rgba(0,0,0,0.5)",
    padding: "5px",
    zIndex: "9999",
    fontSize: "14px",
    pointerEvents: "none"
});
    }

    createChat() {
        this.chatInput = document.createElement("input");
        this.chatInput.id = "chatInput";
        document.body.appendChild(this.chatInput);
    }

    update(player) {
        // Crosshair visibility
        this.crosshair.style.display = UI.state.menuOpen ? "none" : "block";

        if (!player) return;

        const { x, y, z } = player.position;

        this.coords.textContent =
            `${x.toFixed(3)} / ${y.toFixed(3)} / ${z.toFixed(3)}`;

        this.speed.textContent =
            player.velocity.length().toFixed(2);

        this.facing.textContent =
            this.getFacing(player.rotation.y);
    }

    getFacing(yaw) {
        const deg = (yaw * 180 / Math.PI + 360) % 360;

        if (deg >= 45 && deg < 135) return "W";
        if (deg >= 135 && deg < 225) return "S";
        if (deg >= 225 && deg < 315) return "E";
        return "N";
    }
}

window.hud = new HUD();