const P = 0.058; // 1.8.8 Player Pixel Scale (1.8m / 32px)
const loader = new THREE.TextureLoader();

// Load the skin
const skinTexture = loader.load('https://raw.githubusercontent.com/mrfranco27/textures/refs/heads/main/pickledpeaf.png');
skinTexture.magFilter = THREE.NearestFilter;
skinTexture.minFilter = THREE.NearestFilter;

// ======================================================
// BASE UVs
// ======================================================
const SKIN_UVS = {
    head: [[0, 0.75, 0.125, 0.875], [0.25, 0.75, 0.375, 0.875], [0.125, 0.875, 0.25, 1], [0.25, 0.875, 0.375, 1], [0.375, 0.75, 0.5, 0.875], [0.125, 0.75, 0.25, 0.875]],
    torso: [[0.4375, 0.5, 0.5, 0.6875], [0.25, 0.5, 0.3125, 0.6875], [0.3125, 0.6875, 0.4375, 0.75], [0.4375, 0.6875, 0.5625, 0.75], [0.5, 0.5, 0.625, 0.6875], [0.3125, 0.5, 0.4375, 0.6875]],
    rightArm: [[0.625, 0.5, 0.6875, 0.6875], [0.75, 0.5, 0.8125, 0.6875], [0.6875, 0.6875, 0.75, 0.75], [0.75, 0.6875, 0.8125, 0.75], [0.8125, 0.5, 0.875, 0.6875], [0.6875, 0.5, 0.75, 0.6875]],
    leftArm: [[0.625, 0, 0.6875, 0.1875], [0.5, 0, 0.5625, 0.1875], [0.5625, 0.1875, 0.625, 0.25], [0.625, 0.1875, 0.6875, 0.25], [0.6875, 0, 0.75, 0.1875], [0.5625, 0, 0.625, 0.1875]],
    rightLeg: [[0.125, 0.5, 0.1875, 0.6875], [0, 0.5, 0.0625, 0.6875], [0.0625, 0.6875, 0.125, 0.75], [0.125, 0.6875, 0.1875, 0.75], [0.1875, 0.5, 0.25, 0.6875], [0.0625, 0.5, 0.125, 0.6875]],
    leftLeg: [[0.375, 0, 0.4375, 0.1875], [0.25, 0, 0.3125, 0.1875], [0.3125, 0.1875, 0.375, 0.25], [0.375, 0.1875, 0.4375, 0.25], [0.4375, 0, 0.5, 0.1875], [0.3125, 0, 0.375, 0.1875]]
};

// ======================================================
// OVERLAY UVs (hat, jacket, sleeves, pants)
// ======================================================
const SKIN_OVERLAY_UVS = {
    head: [[0.5, 0.75, 0.625, 0.875], [0.75, 0.75, 0.875, 0.875], [0.625, 0.875, 0.75, 1], [0.75, 0.875, 0.875, 1], [0.875, 0.75, 1, 0.875], [0.625, 0.75, 0.75, 0.875]],
    torso: [[0.4375, 0.25, 0.5, 0.4375], [0.25, 0.25, 0.3125, 0.4375], [0.3125, 0.4375, 0.4375, 0.5], [0.4375, 0.4375, 0.5625, 0.5], [0.5, 0.25, 0.625, 0.4375], [0.3125, 0.25, 0.4375, 0.4375]],
    rightArm: [[0.625, 0.25, 0.6875, 0.4375], [0.75, 0.25, 0.8125, 0.4375], [0.6875, 0.4375, 0.75, 0.5], [0.75, 0.4375, 0.8125, 0.5], [0.8125, 0.25, 0.875, 0.4375], [0.6875, 0.25, 0.75, 0.4375]],
    leftArm: [[0.625, 0, 0.6875, 0.1875], [0.5, 0, 0.5625, 0.1875], [0.5625, 0.1875, 0.625, 0.25], [0.625, 0.1875, 0.6875, 0.25], [0.6875, 0, 0.75, 0.1875], [0.5625, 0, 0.625, 0.1875]],
    rightLeg: [[0.125, 0.25, 0.1875, 0.4375], [0, 0.25, 0.0625, 0.4375], [0.0625, 0.4375, 0.125, 0.5], [0.125, 0.4375, 0.1875, 0.5], [0.1875, 0.25, 0.25, 0.4375], [0.0625, 0.25, 0.125, 0.4375]],
    leftLeg: [[0.375, 0, 0.4375, 0.1875], [0.25, 0, 0.3125, 0.1875], [0.3125, 0.1875, 0.375, 0.25], [0.375, 0.1875, 0.4375, 0.25], [0.4375, 0, 0.5, 0.1875], [0.3125, 0, 0.375, 0.1875]]
};

// ======================================================
// PLAYER MODEL
// ======================================================
class PlayerModel {
    constructor() {
        this.scene = window.scene;
        this.root = new THREE.Group();

        // LEGS
        this.rightLeg = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.rightLeg);
        this.leftLeg = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.leftLeg);

        this.rightLegOverlay = this.createPart(4.5*P, 12.5*P, 4.5*P, SKIN_OVERLAY_UVS.rightLeg);
        this.leftLegOverlay = this.createPart(4.5*P, 12.5*P, 4.5*P, SKIN_OVERLAY_UVS.leftLeg);

        this.rightLeg.add(this.rightLegOverlay);
        this.leftLeg.add(this.leftLegOverlay);

        this.rightLeg.position.set(-2*P, 6*P, 0);
        this.leftLeg.position.set(2*P, 6*P, 0);

        // TORSO
        this.torso = this.createPart(8*P, 12*P, 4*P, SKIN_UVS.torso);
        this.torsoOverlay = this.createPart(8.5*P, 12.5*P, 4.5*P, SKIN_OVERLAY_UVS.torso);

        this.torso.add(this.torsoOverlay);
        this.torso.position.set(0, 18*P, 0);

        // ARMS
        const shoulderY = 18 * P;
        const armOffsetX = 6 * P;

        this.rightArm = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.rightArm);
        this.leftArm = this.createPart(4*P, 12*P, 4*P, SKIN_UVS.leftArm);

        this.rightArmOverlay = this.createPart(4.5*P, 12.5*P, 4.5*P, SKIN_OVERLAY_UVS.rightArm);
        this.leftArmOverlay = this.createPart(4.5*P, 12.5*P, 4.5*P, SKIN_OVERLAY_UVS.leftArm);

        this.rightArm.add(this.rightArmOverlay);
        this.leftArm.add(this.leftArmOverlay);

        this.rightArm.position.set(-armOffsetX, shoulderY, 0);
        this.leftArm.position.set(armOffsetX, shoulderY, 0);

        // HEAD
        this.head = this.createPart(8*P, 8*P, 8*P, SKIN_UVS.head);
        this.headOverlay = this.createPart(8.5*P, 8.5*P, 8.5*P, SKIN_OVERLAY_UVS.head);

        this.head.add(this.headOverlay);
        this.head.position.set(0, 28*P, 0);

        // ASSEMBLY
        this.root.add(
            this.torso,
            this.head,
            this.rightArm,
            this.leftArm,
            this.rightLeg,
            this.leftLeg
        );

        this.scene.add(this.root);
    }

    createPart(w, h, d, uvs) {
        const geo = new THREE.BoxGeometry(w, h, d);

        const materials = uvs.map(uv => {
            const faceTex = skinTexture.clone();
            faceTex.offset.set(uv[0], uv[1]);
            faceTex.repeat.set(uv[2] - uv[0], uv[3] - uv[1]);
            faceTex.needsUpdate = true;

            return new THREE.MeshStandardMaterial({
                map: faceTex,
                transparent: true,
                alphaTest: 0.5,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1
            });
        });

        return new THREE.Mesh(geo, materials);
    }

    setHeadRotation(yaw, pitch) {
        this.head.rotation.y = yaw;
        this.head.rotation.x = pitch;
    }
}

// ======================================================
// LIGHTING
// ======================================================
window.setupGlobalLighting = function(targetScene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    targetScene.add(ambient);

    const front = new THREE.DirectionalLight(0xffffff, 0.8);
    const back = new THREE.DirectionalLight(0xffffff, 0.6);

    targetScene.add(front);
    targetScene.add(back);

    if (targetScene === window.uiScene) {
        window.uiFrontLight = front;
        window.uiBackLight = back;
        window.uiFrontBasePos = new THREE.Vector3(5, 10, 7.5);
        window.uiBackBasePos = new THREE.Vector3(-5, 10, -7.5);
    } else {
        front.position.set(5, 10, 7.5);
        back.position.set(-5, 10, -7.5);
    }
};

window.setupGlobalLighting(window.scene);

// ======================================================
// INIT
// ======================================================
const player = new PlayerModel();
player.root.position.set(8, 30, 8);