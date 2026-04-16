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

// Minecraft 1.12.2 Sky Shader
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
    // 1. Normalized vertical direction
    float h = normalize(vWorldPosition).y;

    // 2. Calculate altitude progress (0.0 at Y=1, 1.0 at Y=110)
    float altitude = clamp((cameraY - 1.0) / 109.0, 0.0, 1.0);

    // 3. Keep top color constant, but fade the bottom color INTO the top color
    // This makes the bottom "disappear" into the sky as you rise
    vec3 dynamicBottom = mix(bottomColor, topColor, altitude);

    // 4. Shift the horizon line down so the top "engulfs" more area
    // Increase 1.5 to 2.0 if you want the bottom circle to vanish faster
    float bias = altitude * 1.5; 
    float transition = smoothstep(-0.01 - bias, 0.01 - bias, h);

    // 5. Final mix
    vec3 finalColor = mix(dynamicBottom, topColor, transition);

    // 6. Minecraft 1.12.2 Void darkening
    float voidFactor = clamp(cameraY / 1.0, 0.0, 1.0);
    gl_FragColor = vec4(finalColor * voidFactor, 1.0);
}
`;



// Initialize Skybox
const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
window.skyMat = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0xb2ceff) },    // Morning Blue
        bottomColor: { value: new THREE.Color(0x2d36b8) }, // Horizon Blue
        cameraY: { value: 64.0 },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide
});

window.skyMesh = new THREE.Mesh(skyGeo, window.skyMat);
window.scene.add(window.skyMesh);

// ... rest of your GameWorld class and selectionBox logic


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

window.breakBlock = function(bx, by, bz, playSound = true) {
    const key = `${bx},${by},${bz}`;
    const block = window.WorldData[key];
    if (!block) return;

    // 1. Play Sound (Sound logic for 1.12.2)
    if (playSound) {
        // You would call your sound engine here:
        // audioManager.play(block.type.toLowerCase() + "_break");
        console.log(`Sound: ${block.type} broke.`);
    }

    // 2. Remove Data
    delete window.WorldData[key];

    // 3. Rebuild Visuals
    const cx = Math.floor(bx / 16);
    const cz = Math.floor(bz / 16);
    
    // Use your existing Block mesh generator
    const newChunk = Block.generateChunkMesh(cx, cz); 
    
    const oldChunk = window.scene.children.find(c => 
        c.userData && c.userData.cx === cx && c.userData.cz === cz && c !== newChunk
    );

    window.scene.add(newChunk);
    if (oldChunk) {
        window.scene.remove(oldChunk);
        if (oldChunk.geometry) oldChunk.geometry.dispose();
    }
};
