class EntityNPC extends EntityLiving {
    constructor() {
        super();
        
        // 1. Core Properties (Restored)
        this.position = new THREE.Vector3();
        this.prevPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.keys = {}; // Keeps physics from crashing

        // 2. Model & Rotations (Restored)
        this.playerModel = new PlayerModel();
        window.scene.add(this.playerModel.root);
        this.yaw = Math.PI;
        this.pitch = 0;
        this.headYaw = 0;

        // 3. Initial Spawn
        this.spawn();
    }

    // Uses the math from EntityLiving
    spawn() {
        super.spawn();
    }

    // Triggered when hitting the void
    respawn() {
        super.respawn();
    }

    renderUpdate(partialTick) {
        const lerp = new THREE.Vector3().lerpVectors(this.prevPosition, this.position, partialTick);
        this.playerModel.root.position.copy(lerp);
        this.playerModel.root.rotation.y = this.yaw;
        this.playerModel.setHeadRotation(this.headYaw, this.pitch);
    }

    tick(world) {
        this.prevPosition.copy(this.position);

        // Run the physics/gravity from EntityLiving
        super.tick(world);


        // VOID CHECK: Now properly calls respawn
        if (this.position.y < -64) {
            this.respawn();
        }
    }
}
