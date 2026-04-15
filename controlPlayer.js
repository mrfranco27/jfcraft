class ControlPlayer {
    constructor(entity) {
        this.entity = entity;
        this.keys = {};

        this.leftClicking = false;
        this.rightClicking = false;

        this.camera = window.camera;

        this.initInput();
    }

    initInput() {

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (e.code === 'KeyW') {
                this.entity.sprinting = false;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.leftClicking = true;
            if (e.button === 2) this.rightClicking = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.leftClicking = false;
            if (e.button === 2) this.rightClicking = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== window.canvas) return;

            const p = this.entity;

            p.yaw -= e.movementX * 0.002;
            p.pitch -= e.movementY * 0.002;

            p.pitch = Math.max(
                -Math.PI / 2 + 0.01,
                Math.min(Math.PI / 2 - 0.01, p.pitch)
            );

            this.camera.rotation.set(p.pitch, p.yaw, 0);
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    tick(world) {
        const e = this.entity;

        // INPUT
        const W = this.keys['KeyW'];
        const A = this.keys['KeyA'];
        const S = this.keys['KeyS'];
        const D = this.keys['KeyD'];
        const Shift = this.keys['ShiftLeft'];
        const R = this.keys['KeyR'];

        e.crouching = Shift;

        if (!W || S || Shift) e.sprinting = false;

        const onlyW = W && !A && !S && !D && !Shift;

        if (R && onlyW) e.sprinting = true;

        // MOVEMENT (same logic as your Physics.js expects)
        let inputX = (D ? 1 : 0) - (A ? 1 : 0);
        let inputZ = (S ? 1 : 0) - (W ? 1 : 0);

        const moveVec = new THREE.Vector3(inputX, 0, inputZ).normalize();
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), e.yaw);

        e.velocity.x += moveVec.x * 0.1;
        e.velocity.z += moveVec.z * 0.1;

        // JUMP
        if (this.keys['Space'] && e.onGround) {
            e.velocity.y = window.Physics.JUMP_FORCE;
            e.onGround = false;
        }

        // CAMERA FOLLOW (IDENTICAL to your old renderUpdate)
        this.camera.position.copy(e.position);
        this.camera.position.y += e.crouching ? 1.54 : 1.62;

        // BLOCK ACTIONS
        if (this.leftClicking && e.breakCooldown <= 0) {
            this.perform(true);
            e.breakCooldown = 6;
        }

        if (this.rightClicking && e.placeCooldown <= 0) {
            this.perform(false);
            e.placeCooldown = 4;
        }

        window.Physics.apply(e);
    }

    perform(isBreaking) {
        const ray = new THREE.Raycaster();
        ray.far = 6;

        ray.setFromCamera(new THREE.Vector2(0, 0), window.camera);

        const hits = ray.intersectObjects(window.scene.children, true);
        if (!hits.length) return;

        const hit = hits[0];

        const off = isBreaking ? -0.5 : 0.5;

        const bx = Math.floor(hit.point.x + hit.face.normal.x * off);
        const by = Math.floor(hit.point.y + hit.face.normal.y * off);
        const bz = Math.floor(hit.point.z + hit.face.normal.z * off);

        const key = `${bx},${by},${bz}`;

        if (isBreaking) {
            delete window.WorldData[key];
        } else {
            window.WorldData[key] = { type: "GRASS" };
        }

        const cx = Math.floor(bx / 16);
        const cz = Math.floor(bz / 16);

        const mesh = Block.generateChunkMesh(cx, cz);
        window.scene.add(mesh);
    }
}

window.ControlPlayer = ControlPlayer;