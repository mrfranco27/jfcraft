class Player {
    constructor() {
        // --- INITIAL STATE ---
        this.position = new THREE.Vector3(8, 100, 8); 
        this.prevPosition = new THREE.Vector3(8, 100, 8);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;

        this.sprinting = false; 
        this.crouching = false;

        this.leftClicking = false;
        this.rightClicking = false;
        this.breakCooldown = 0;
        this.placeCooldown = 0;

        this.yaw = Math.PI;
        this.pitch = 0;
        this.keys = {};

        window.camera.rotation.order = 'YXZ';
        window.camera.rotation.set(this.pitch, this.yaw, 0);

        // --- SELECTION BOX (CRITICAL FIX IF MISSING) ---
        if (!window.selectionBox) {
            const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
            const edges = new THREE.EdgesGeometry(geo);
            const mat = new THREE.LineBasicMaterial({ color: 0xffffff });

            window.selectionBox = new THREE.LineSegments(edges, mat);
            window.selectionBox.visible = false;
            window.scene.add(window.selectionBox);
        }

        // --- HAND OVERLAY ---
        window.uiScene = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        window.uiCam = new THREE.PerspectiveCamera(90, aspect, 0.01, 10);

        const p = 0.0625; 
        const armGeo = new THREE.BoxGeometry(4 * p, 12 * p, 4 * p);
        const baseColor = new THREE.Color(0x5D4037);

        const shades = [0.8, 0.8, 1.0, 0.5, 0.6, 0.6];
        const armMaterials = shades.map(s => new THREE.MeshBasicMaterial({ 
            color: baseColor.clone().multiplyScalar(s),
            depthTest: false 
        }));

        const armMesh = new THREE.Mesh(armGeo, armMaterials);

        this.handPivot = new THREE.Group();
        this.handPivot.add(armMesh);

        this.handPivot.position.set(0.57, -0.6, -0.5); 

        const d2r = Math.PI / 180;
        this.handPivot.rotation.order = 'ZXY';
        this.handPivot.rotation.set(-45 * d2r, -20 * d2r, -45 * d2r);

        window.uiScene.add(this.handPivot);

        this.spawn();

        // --- INPUT ---
        document.addEventListener('keydown', (e) => {
            if (window.gameMenu && window.gameMenu.inMenu) return;

            this.keys[e.code] = true;

            if (e.code === 'KeyR') {
                const onlyW =
                    this.keys['KeyW'] &&
                    !this.keys['KeyA'] &&
                    !this.keys['KeyS'] &&
                    !this.keys['KeyD'];

                if (onlyW && !this.keys['ShiftLeft']) {
                    this.sprinting = true;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'KeyW') this.sprinting = false;
        });

        document.addEventListener('mousedown', (e) => {
            if (window.gameMenu && window.gameMenu.inMenu) return;

            const isLocked = document.pointerLockElement === window.canvas;
            if (!isLocked) return;

            if (e.button === 0) {
                this.leftClicking = true;

                if (this.breakCooldown <= 0) {
                    this.performAction(true);
                    this.breakCooldown = 6;
                }
            }

            if (e.button === 2) {
                this.rightClicking = true;

                if (this.placeCooldown <= 0) {
                    this.performAction(false);
                    this.placeCooldown = 4;
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.leftClicking = false;
            if (e.button === 2) this.rightClicking = false;
        });

        document.addEventListener('mousemove', (e) => {
            const isLocked = document.pointerLockElement === window.canvas;
            const menuOpen = window.gameMenu && window.gameMenu.inMenu;

            if (isLocked && !menuOpen) {
                this.yaw -= e.movementX * 0.002;
                this.pitch -= e.movementY * 0.002;

                this.pitch = Math.max(
                    -Math.PI / 2 + 0.01,
                    Math.min(Math.PI / 2 - 0.01, this.pitch)
                );

                window.camera.rotation.set(this.pitch, this.yaw, 0);
            }
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('resize', () => {
            const a = window.innerWidth / window.innerHeight;

            window.uiCam.aspect = a;
            window.uiCam.updateProjectionMatrix();

            this.handPivot.position.x = a - 0.45;
        });
    }

    // --------------------------------------------------
    // SPAWN SYSTEM
    // --------------------------------------------------

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

    // --------------------------------------------------
    // GAME LOOP
    // --------------------------------------------------

    tick() {
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

        if (!W || S || Shift) this.sprinting = false;

        const onlyW = W && !S && !Shift && !this.keys['KeyA'] && !this.keys['KeyD'];

        this.crouching = Shift;

        if (R && onlyW) {
            this.sprinting = true;
        }

        window.Physics.apply(this);

        if (this.position.y < -64) this.respawn();
    }

    // --------------------------------------------------
    // RAYCAST BLOCK TARGET
    // --------------------------------------------------

    getTargetBlock() {
        const raycaster = new THREE.Raycaster();
        raycaster.far = 6;

        raycaster.setFromCamera(new THREE.Vector2(0, 0), window.camera);

        const hits = raycaster.intersectObjects(window.scene.children, true);

        for (const hit of hits) {
            if (hit.object.type === "LineSegments") continue;
            return hit;
        }

        return null;
    }

    // --------------------------------------------------
    // BLOCK BREAK / PLACE
    // --------------------------------------------------

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

    // --------------------------------------------------
    // CAMERA + UI UPDATE
    // --------------------------------------------------

    renderUpdate(partialTick) {
        const lerp = new THREE.Vector3().lerpVectors(
            this.prevPosition,
            this.position,
            partialTick
        );

        window.camera.position.copy(lerp);
        window.camera.position.y += this.crouching ? 1.54 : 1.62;

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
    }
}

window.mainPlayer = new Player();