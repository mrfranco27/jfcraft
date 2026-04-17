const P = 0.058; // 1.8.8 Player Pixel Scale (1.8m / 32px)
const loader = new THREE.TextureLoader();

// Load the skin (using a default template as a placeholder)
const skinTexture = loader.load('https://t.novaskin.me/d313b808f212be17ede137490a0845ee113218f44219a775b42df58418c8042a');
skinTexture.magFilter = THREE.NearestFilter;
skinTexture.minFilter = THREE.NearestFilter;

// MC 1.12.2 Base Layer UVs [Right, Left, Top, Bottom, Front, Back]
const SKIN_UVS = {
    head: [[0, 0.75, 0.125, 0.875], [0.25, 0.75, 0.375, 0.875], [0.125, 0.875, 0.25, 1], [0.25, 0.875, 0.375, 1], [0.375, 0.75, 0.5, 0.875], [0.125, 0.75, 0.25, 0.875]],
    torso: [[0.4375, 0.5, 0.5, 0.6875], [0.25, 0.5, 0.3125, 0.6875], [0.3125, 0.6875, 0.4375, 0.75], [0.4375, 0.6875, 0.5625, 0.75], [0.5, 0.5, 0.625, 0.6875], [0.3125, 0.5, 0.4375, 0.6875]],
    rightArm: [[0.625, 0.5, 0.6875, 0.6875], [0.75, 0.5, 0.8125, 0.6875], [0.6875, 0.6875, 0.75, 0.75], [0.75, 0.6875, 0.8125, 0.75], [0.8125, 0.5, 0.875, 0.6875], [0.6875, 0.5, 0.75, 0.6875]],
    leftArm: [[0.625, 0, 0.6875, 0.1875], [0.5, 0, 0.5625, 0.1875], [0.5625, 0.1875, 0.625, 0.25], [0.625, 0.1875, 0.6875, 0.25], [0.6875, 0, 0.75, 0.1875], [0.5625, 0, 0.625, 0.1875]],
    rightLeg: [[0.125, 0.5, 0.1875, 0.6875], [0, 0.5, 0.0625, 0.6875], [0.0625, 0.6875, 0.125, 0.75], [0.125, 0.6875, 0.1875, 0.75], [0.1875, 0.5, 0.25, 0.6875], [0.0625, 0.5, 0.125, 0.6875]],
    leftLeg: [[0.375, 0, 0.4375, 0.1875], [0.25, 0, 0.3125, 0.1875], [0.3125, 0.1875, 0.375, 0.25], [0.375, 0.1875, 0.4375, 0.25], [0.4375, 0, 0.5, 0.1875], [0.3125, 0, 0.375, 0.1875]]
};

class PlayerModel {
    constructor() {
        this.scene = window.scene;
        this.root = new THREE.Group();

        // 1. LEGS (4x12x4 pixels)
        this.rightLeg = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.rightLeg);
        this.leftLeg = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.leftLeg);
        this.rightLeg.position.set(-2*P, 6*P, 0);
        this.leftLeg.position.set(2*P, 6*P, 0);

        // 2. TORSO (8x12x4 pixels)
        this.torso = this.createPart(8*P, 12*P, 4*P, SKIN_UVS.torso);
        this.torso.position.set(0, 18*P, 0);

        // 3. ARMS (4x12x4 pixels)
        const shoulderY = 18 * P;
        const armOffsetX = 6 * P;
        this.rightArm = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.rightArm);
        this.leftArm = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.leftArm);
        this.rightArm.position.set(-armOffsetX, shoulderY, 0);
        this.leftArm.position.set(armOffsetX, shoulderY, 0);

        // 4. HEAD (8x8x8 pixels)
        this.head = this.createPart(8*P, 8*P, 8*P, SKIN_UVS.head);
        this.head.position.set(0, 28*P, 0);

        // ASSEMBLY
        this.root.add(this.torso, this.head, this.rightArm, this.leftArm, this.rightLeg, this.leftLeg);
        this.scene.add(this.root);
    }

    createPart(w, h, d, uvs) {
        const geo = new THREE.BoxGeometry(w, h, d);
        
        // Minecraft face order: Right, Left, Top, Bottom, Front, Back
        const materials = uvs.map(uv => {
            const faceTex = skinTexture.clone();
            faceTex.offset.set(uv[0], uv[1]);
            faceTex.repeat.set(uv[2] - uv[0], uv[3] - uv[1]);
            faceTex.needsUpdate = true;
            return new THREE.MeshStandardMaterial({ map: faceTex, transparent: true, alphaTest: 0.5 });
        });

        return new THREE.Mesh(geo, materials);
    }

    setHeadRotation(yaw, pitch) {
        this.head.rotation.y = yaw;
        this.head.rotation.x = pitch;
    }
}

// Lighting Setup
window.setupGlobalLighting = function(targetScene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    targetScene.add(ambient);

    // Create the front and back lights
    const front = new THREE.DirectionalLight(0xffffff, 0.8);
    const back = new THREE.DirectionalLight(0xffffff, 0.6);
    
    targetScene.add(front);
    targetScene.add(back);

    // Save them to a global object if this is the uiScene
    if (targetScene === window.uiScene) {
        window.uiFrontLight = front;
        window.uiBackLight = back;
        // Keep their base "world" positions
        window.uiFrontBasePos = new THREE.Vector3(5, 10, 7.5);
        window.uiBackBasePos = new THREE.Vector3(-5, 10, -7.5);
    } else {
        front.position.set(5, 10, 7.5);
        back.position.set(-5, 10, -7.5);
    }
};


window.setupGlobalLighting(window.scene);

const player = new PlayerModel();
player.root.position.set(8, 30, 8);