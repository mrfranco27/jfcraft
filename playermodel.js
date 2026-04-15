const P = 0.058; // 1.8.8 Player Pixel Scale (1.8m / 32px)

class PlayerModel {
    constructor() {
        this.scene = window.scene;
        this.root = new THREE.Group();

        // ====================================================
        // 1. LEGS (4x12x4 pixels)
        // ====================================================
        this.rightLeg = this.createPart(4*P, 12*P, 4*P, 0x3366ff);
        this.leftLeg = this.createPart(4*P, 12*P, 4*P, 0x5588ff);
        
        // Y center = 6px
        this.rightLeg.position.set(-2*P, 6*P, 0); 
        this.leftLeg.position.set(2*P, 6*P, 0);

        // ====================================================
        // 2. TORSO (8x12x4 pixels)
        // ====================================================
        // Starts at 12px, Y center = 18px
        this.torso = this.createPart(8*P, 12*P, 4*P, 0xff3366);
        this.torso.position.set(0, 18*P, 0);

        // ====================================================
        // 3. ARMS (4x12x4 pixels)
        // ====================================================
        // Aligned 1:1 with Torso Y (18px)
        const shoulderY = 18 * P; 
        const armOffsetX = 6 * P; 

        this.rightArm = this.createPart(4*P, 12*P, 4*P, 0x33ff66);
        this.leftArm = this.createPart(4*P, 12*P, 4*P, 0x66ff99);

        this.rightArm.position.set(-armOffsetX, shoulderY, 0);
        this.leftArm.position.set(armOffsetX, shoulderY, 0);

        // ====================================================
        // 4. HEAD (8x8x8 pixels)
        // ====================================================
        // Starts at 24px, Y center = 28px
        this.head = this.createPart(8*P, 8*P, 8*P, 0xffcc33);
        this.head.position.set(0, 28*P, 0);

        // ====================================================
        // BUILD & SPAWN AT 8, 60, 8
        // ====================================================
        this.root.add(this.torso, this.head, this.rightArm, this.leftArm, this.rightLeg, this.leftLeg);
        
        // Setting the root position to your requested spawn point
        this.root.position.set(8, 5, 8); 
        
        this.scene.add(this.root);
    }

    createPart(w, h, d, color) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
        return new THREE.Mesh(geo, mat);
    }
}

// Ensure scene has lights to see the colors
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
window.scene.add(light, new THREE.AmbientLight(0x404040));

// Instantiate the model
const player = new PlayerModel();
