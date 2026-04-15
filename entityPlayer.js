class EntityPlayer extends EntityLiving {
    constructor() {
        super();

        this.prevPosition = this.position.clone();

        this.leftClicking = false;
        this.rightClicking = false;

        this.breakCooldown = 0;
        this.placeCooldown = 0;

        this.keys = {};

        // === YOUR MODEL (UNCHANGED) ===
        this.playerModel = new PlayerModel();

        // spawn like your original
        this.position.set(8, 5, 8);
        this.prevPosition.copy(this.position);

        this.playerModel.root.position.copy(this.position);
        window.scene.add(this.playerModel.root);

        // === SELECTION BOX (moved from Player.js but SAME LOGIC) ===
        if (!window.selectionBox) {
            const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
            const edges = new THREE.EdgesGeometry(geo);
            const mat = new THREE.LineBasicMaterial({ color: 0xffffff });

            window.selectionBox = new THREE.LineSegments(edges, mat);
            window.selectionBox.visible = false;
            window.scene.add(window.selectionBox);
        }

        // === HAND UI (UNCHANGED LOGIC) ===
        window.uiScene = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        window.uiCam = new THREE.PerspectiveCamera(90, aspect, 0.01, 10);

        const p = 0.0625;
        const armGeo = new THREE.BoxGeometry(4 * p, 12 * p, 4 * p);
        const baseColor = new THREE.Color(0x5D4037);

        const shades = [0.8, 0.8, 1.0, 0.5, 0.6, 0.6];
        const armMaterials = shades.map(s =>
            new THREE.MeshBasicMaterial({
                color: baseColor.clone().multiplyScalar(s),
                depthTest: false
            })
        );

        const armMesh = new THREE.Mesh(armGeo, armMaterials);

        this.handPivot = new THREE.Group();
        this.handPivot.add(armMesh);

        this.handPivot.position.set(0.57, -0.6, -0.5);

        const d2r = Math.PI / 180;
        this.handPivot.rotation.order = 'ZXY';
        this.handPivot.rotation.set(-45 * d2r, -20 * d2r, -45 * d2r);

        window.uiScene.add(this.handPivot);
    }

    tick(world) {
        this.prevPosition.copy(this.position);

        // cooldowns
        if (this.breakCooldown > 0) this.breakCooldown--;
        if (this.placeCooldown > 0) this.placeCooldown--;

        super.tick(world);

        // model sync
        this.playerModel.root.position.copy(this.position);
    }
}

window.EntityPlayer = EntityPlayer;