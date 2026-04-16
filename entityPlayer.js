class EntityPlayer extends EntityLiving {
    constructor() {
        super(); // ALWAYS FIRST

        // 1. Core Properties
        this.prevPosition = this.position.clone();
        this.sprinting = false;
        this.crouching = false;
        this.leftClicking = false;
        this.rightClicking = false;
        this.breakCooldown = 0;
        this.placeCooldown = 0;
        this.yaw = Math.PI;
        this.pitch = 0;
        this.headYaw = 0;
        this.perspective = 'firstPerson';
        this.keys = {};

        window.camera.rotation.order = 'YXZ';
        window.camera.rotation.set(this.pitch, this.yaw, 0);

        // 2. Models & Scene
        this.playerModel = new PlayerModel();
        this.position.set(8, 30, 8);
        this.prevPosition.copy(this.position);
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

         // 3. UI Scene & Camera
        window.uiScene = new THREE.Scene();
        const aspect = window.innerWidth / window.innerHeight;
        window.uiCam = new THREE.PerspectiveCamera(window.camera.fov, aspect, 0.01, 10);
        window.uiCam.position.set(0, 0, 5);

        // Lights
        window.uiScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const uiLight = new THREE.DirectionalLight(0xffffff, 0.8);
        uiLight.position.set(5, 10, 7.5);
        window.uiScene.add(uiLight);

        const uiBackLight = new THREE.DirectionalLight(0xffffff, 0.6);
        uiBackLight.position.set(-5, 10, -7.5);
        window.uiScene.add(uiBackLight);


        const P = 1/16;
        const armMesh = this.playerModel.rightArm.clone();
        armMesh.position.set(0, 0, 0);
        armMesh.rotation.x = Math.PI / 2; // Lay flat
        armMesh.position.z = 6 * P;

        const armOffset = new THREE.Group();
        armOffset.add(armMesh);

        this.handPivot = new THREE.Group();
        this.handPivot.add(armOffset);
        this.handPivot.position.set(0.5, -0.5, 4.4);
        window.uiScene.add(this.handPivot);

        // 5. ROTATION ENGINE VARS
        const d2r = Math.PI / 180;
        this.handPitch = 30 * d2r;
        this.handRoll = 60 * d2r;
        this.handYaw = -33 * d2r;
        
        // Static axes for world rotation
        this.axisY = new THREE.Vector3(0, 1, 0);
        this.axisX = new THREE.Vector3(1, 0, 0);
        this.axisZ = new THREE.Vector3(0, 0, 1);

        this.spawn();
    }

    findSafeLocation() {
        let tx = 8, ty = 100, tz = 8;
        let found = false;
        let attempts = 0;

        while (!found && attempts < 100) {
            attempts++;

            tx = Math.floor(Math.random() * 16);
            tz = Math.floor(Math.random() * 16);

            for (let y = 255; y >= 0; y--) {
                const key = `${tx},${y},${tz}`;

                if (
                    window.WorldData[key] &&
                    !window.WorldData[`${tx},${y + 1},${tz}`] &&
                    !window.WorldData[`${tx},${y + 2},${tz}`]
                ) {
                    ty = y + 1;
                    found = true;
                    break;
                }
            }
        }

        this.position.set(tx, ty, tz);
        this.prevPosition.copy(this.position);
        this.velocity.set(0, 0, 0);
    }

    spawn() { this.findSafeLocation(); }
    respawn() { this.findSafeLocation(); }

    getTargetBlock() {
        const raycaster = new THREE.Raycaster();
        raycaster.far = 6;

        raycaster.setFromCamera(new THREE.Vector2(0, 0), window.camera);

        const hits = raycaster.intersectObjects(window.scene.children, true);

        for (const hit of hits) {
            if (hit.object.type === "LineSegments") continue;
            
            // Skip the player model
            let parent = hit.object;
            let isPlayerModel = false;
            while (parent) {
                if (parent === this.playerModel.root) {
                    isPlayerModel = true;
                    break;
                }
                parent = parent.parent;
            }
            
            if (isPlayerModel) continue;
            
            return hit;
        }

        return null;
    }

    performAction(isBreaking) {
        const hit = this.getTargetBlock();
        if (!hit) return;

        const offset = isBreaking ? -0.5 : 0.5;

        const bx = Math.floor(hit.point.x + hit.face.normal.x * offset);
        const by = Math.floor(hit.point.y + hit.face.normal.y * offset);
        const bz = Math.floor(hit.point.z + hit.face.normal.z * offset);

        const key = `${bx},${by},${bz}`;

        if (isBreaking) {
            if (!window.WorldData[key]) return;
            delete window.WorldData[key];
        } else {
            const hw = 0.3;

            if (
                bx + 1 > this.position.x - hw && bx < this.position.x + hw &&
                by + 1 > this.position.y && by < this.position.y + 1.8 &&
                bz + 1 > this.position.z - hw && bz < this.position.z + hw
            ) return;

            window.WorldData[key] = {
                type: 'GRASS',
                skyLight: 0
            };
        }

        const cx = Math.floor(bx / 16);
        const cz = Math.floor(bz / 16);

        const newChunk = Block.generateChunkMesh(cx, cz, window.WorldData);

        const oldChunk = window.scene.children.find(c =>
            c.userData && c.userData.cx === cx && c.userData.cz === cz && c !== newChunk
        );

        window.scene.add(newChunk);

        if (oldChunk) {
            window.scene.remove(oldChunk);

            if (oldChunk.geometry) oldChunk.geometry.dispose();

            oldChunk.traverse(child => {
                if (child.geometry) child.geometry.dispose();
            });
        }
    }

    renderUpdate(partialTick) {
        const lerp = new THREE.Vector3().lerpVectors(
            this.prevPosition,
            this.position,
            partialTick
        );

        const eyeHeight = this.crouching ? 1.54 : 1.62;
        const headPos = lerp.clone();
        headPos.y += eyeHeight;

        // Update model position and rotation
        this.playerModel.root.position.copy(lerp);
        this.playerModel.root.rotation.y = this.yaw;
        this.playerModel.setHeadRotation(this.headYaw, this.pitch);

        // === SMOOTH CAMERA POSITIONING (FPS-BASED) ===
        const totalYaw = this.yaw + this.headYaw;
        const pitch = this.pitch;

        if (this.perspective === 'firstPerson') {
            this.playerModel.root.visible = false;
            window.camera.position.copy(headPos);
            window.camera.rotation.set(this.pitch, totalYaw, 0, 'YXZ');
        } else {
            this.playerModel.root.visible = true;
            const distance = (this.perspective === 'thirdPersonBack') ? 4 : -4;
            
            // Spherical math for smooth orbital camera
            const x = distance * Math.sin(totalYaw) * Math.cos(pitch);
            const y = -distance * Math.sin(pitch);
            const z = distance * Math.cos(totalYaw) * Math.cos(pitch);

            window.camera.position.set(headPos.x + x, headPos.y + y, headPos.z + z);
            window.camera.lookAt(headPos);
        }

        const hit = this.getTargetBlock();

        if (hit && window.selectionBox) {
            const bx = Math.floor(hit.point.x - hit.face.normal.x * 0.5);
            const by = Math.floor(hit.point.y - hit.face.normal.y * 0.5);
            const bz = Math.floor(hit.point.z - hit.face.normal.z * 0.5);

            window.selectionBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
            window.selectionBox.visible = true;
        } else if (window.selectionBox) {
            window.selectionBox.visible = false;
        }

        // === 1:1 MINECRAFT ARM ROTATION (WORLD-SPACE ONLY) ===
if (this.handPivot) {
    // 1. Force the pivot back to a neutral world state every frame
    this.handPivot.quaternion.set(0, 0, 0, 1);

    // 2. Create a rotation based strictly on your variables
    // Minecraft uses YXZ order for head/hand logic (Yaw first, then Pitch, then Roll)
    const worldRotation = new THREE.Euler(
        this.handPitch, 
        this.handYaw, 
        this.handRoll, 
        'YXZ'
    );

    // 3. Apply the absolute rotation directly
    this.handPivot.quaternion.setFromEuler(worldRotation);
    
    // 4. Ensure the pivot stays at a fixed "Global" screen position 
    // This prevents any "bobbing" from affecting the rotation math
    this.handPivot.position.set(0.7, -0.35, 4.27); 
}

    }

    tick(world) {

        
        this.prevPosition.copy(this.position);

        if (this.leftClicking && this.breakCooldown <= 0) {
            this.performAction(true);
            this.breakCooldown = 6;
        }

        if (this.rightClicking && this.placeCooldown <= 0) {
            this.performAction(false);
            this.placeCooldown = 4;
        }

        if (this.breakCooldown > 0) this.breakCooldown--;
        if (this.placeCooldown > 0) this.placeCooldown--;

        const W = this.keys['KeyW'];
        const S = this.keys['KeyS'];
        const Shift = this.keys['ShiftLeft'];
        const R = this.keys['KeyR'];
        const A = this.keys['KeyA'];
        const D = this.keys['KeyD'];

        if (!W || S || Shift) this.sprinting = false;

        const onlyW = W && !S && !Shift && !A && !D;

        this.crouching = Shift;

        if (R && onlyW) {
            this.sprinting = true;
        }

        // === BODY ROTATION LOGIC ===
        // Check if player is moving (any WASD input)
        const isMoving = W || S || A || D;
        
        if (isMoving) {
            // While moving, snap body to face where head is facing
            this.yaw += this.headYaw;
            this.headYaw = 0;
        }
        // If not moving, body stays at current yaw

        super.tick(world);

        // model sync is in renderUpdate

        if (this.position.y < -64) this.respawn();
    }
}

window.EntityPlayer = EntityPlayer;