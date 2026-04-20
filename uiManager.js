const UI = {
    guiScale: 2,

    setScale(scale) {
        this.guiScale = scale;
        this.applyScale();
    },

    applyScale() {
        // Update DOM-based UI
        document.documentElement.style.setProperty("--gui-scale", this.guiScale);

        // Update canvas-based UIs
        if (window.gameMenu) gameMenu.guiScale = this.guiScale;
        if (window.optionsMenu) optionsMenu.guiScale = this.guiScale;
    },

    state: {
        menuOpen: false,
        chatOpen: false
    }
};



window.UI = UI;