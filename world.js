window.scene = new THREE.Scene();
window.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera.rotation.order = 'YXZ';
window.scene.add(window.camera);

window.canvas = document.getElementById('game');
window.renderer = new THREE.WebGLRenderer({ canvas: window.canvas, antialias: false });
window.renderer.setSize(window.innerWidth, window.innerHeight);
window.renderer.autoClear = false;
window.scene.background = new THREE.Color(0x78A7FF);

// =========================
// SKY SHADER
// =========================
const skyVertexShader = `
    varying vec3 vWorldPosition;
    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const skyFragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float cameraY;
    varying vec3 vWorldPosition;
    void main() {
        float h = normalize(vWorldPosition).y;
        float altitude = clamp((cameraY - 1.0) / 109.0, 0.0, 1.0);
        vec3 dynamicBottom = mix(bottomColor, topColor, altitude);
        float bias = altitude * 1.5;
        float transition = smoothstep(-0.01 - bias, 0.01 - bias, h);
        vec3 finalColor = mix(dynamicBottom, topColor, transition);
        float voidFactor = clamp(cameraY / 1.0, 0.0, 1.0);
        gl_FragColor = vec4(finalColor * voidFactor, 1.0);
    }
`;

const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
window.skyMat = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0xb2ceff) },
        bottomColor: { value: new THREE.Color(0x2d36b8) },
        cameraY: { value: 64.0 },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide
});
window.skyMesh = new THREE.Mesh(skyGeo, window.skyMat);
window.scene.add(window.skyMesh);
window.skyMesh.renderOrder = 2;

// =========================
// GAME WORLD & CHUNKING
// =========================
class GameWorld {
    constructor() {
        window.WorldData = {};
        this.seed = Math.floor(Math.random() * 4294967296) - 2147483648;
        // This assumes you have the 'World' class defined in worldgen.js
        this.world = new World(this.seed); 
        this.renderDistance = 0; // 3x3 chunks
        this.initSpawn();
    }

    initSpawn() {
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.world.getChunk(x, z);
            }
        }
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.refreshChunk(x, z);
            }
        }
    }

    refreshChunk(cx, cz) {
        const oldChunk = window.scene.children.find(c => 
            c.userData && c.userData.cx === cx && c.userData.cz === cz
        );
        if (oldChunk) {
            window.scene.remove(oldChunk);
            oldChunk.children.forEach(c => { if(c.geometry) c.geometry.dispose(); });
        }
        const mesh = Block.generateChunkMesh(cx, cz);
        window.scene.add(mesh);
    }
}

window.worldInstance = new GameWorld();

// =========================
// SELECTION BOX
// =========================
const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
window.selectionBox = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
window.selectionBox.raycast = () => {};
window.selectionBox.visible = false;
window.scene.add(window.selectionBox);

// =========================
// INTERACTIONS
// =========================
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

window.updateMeshArea = function(bx, bz) {
    const cx = Math.floor(bx / 16);
    const cz = Math.floor(bz / 16);
    // Refresh 3x3 chunk area to update AO shadows on neighbors
    for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
            window.worldInstance.refreshChunk(cx + x, cz + z);
        }
    }
};

window.breakBlock = function(bx, by, bz, playSound = true) {
    const key = `${bx},${by},${bz}`;
    if (!window.WorldData[key]) return;
    delete window.WorldData[key];
    if (playSound) console.log("Block broke");
    window.updateMeshArea(bx, bz);
};

window.placeBlock = function(bx, by, bz, blockID = 3, playSound = true) {
    window.WorldData[`${bx},${by},${bz}`] = { id: blockID };
    if (playSound) console.log("Block placed");
    window.updateMeshArea(bx, bz);
};
