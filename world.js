window.scene = new THREE.Scene();

window.camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

window.camera.rotation.order = 'YXZ';
window.scene.add(window.camera);

window.canvas = document.getElementById('game');

window.renderer = new THREE.WebGLRenderer({
    canvas: window.canvas,
    antialias: false
});

window.renderer.setSize(window.innerWidth, window.innerHeight);
window.renderer.autoClear = false;

window.scene.background = new THREE.Color(0x78A7FF);

// =========================
// GAME WORLD
// =========================
class GameWorld {
    constructor() {
        window.WorldData = {};

        this.seed = Math.floor(Math.random() * 4294967296) - 2147483648;
        this.generator = new ChunkGenerator(this.seed);

        this.generateOneChunk();
    }

    generateOneChunk() {

        const cx = 0, cz = 0;

        this.generator.generateChunk(cx, cz);

        const mesh = Block.generateChunkMesh(cx, cz);
        window.scene.add(mesh);
    }
}

window.worldInstance = new GameWorld();

// selection box
const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const mat = new THREE.LineBasicMaterial({ color: 0x000000 });

window.selectionBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    mat
);

window.selectionBox.raycast = () => {};
window.selectionBox.visible = false;

window.scene.add(window.selectionBox);

// resize
window.addEventListener('resize', () => {
    window.camera.aspect = window.innerWidth / window.innerHeight;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("click", () => {
    const canvas = document.getElementById("game");
    if (document.pointerLockElement === canvas) return;
    canvas.requestPointerLock();
}, { once: true });