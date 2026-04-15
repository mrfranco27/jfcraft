let lastTickTime = performance.now();
const TICK_RATE = 50;

// --------------------------------------------------
// UI UPDATE (NOW USES ENTITYPLAYER ONLY)
// --------------------------------------------------
function updateUI() {
    const dirElement = document.getElementById('dirfacing');
    const coordsElement = document.getElementById('coords');
    const speedElement = document.getElementById('speed');

    const player = window.playerEntity;
    if (!player) return;

    let yaw = player.yaw % (Math.PI * 2);
    if (yaw < 0) yaw += Math.PI * 2;

    const directions = ['South', 'East', 'North', 'West'];
    const index = Math.round(yaw / (Math.PI / 2)) % 4;

    let status = "";
    if (player.crouching) status = " (Crouching)";
    else if (player.sprinting) status = " (Sprinting)";

    dirElement.innerText = directions[index] + status;

    const p = player.position;
    coordsElement.innerText = `${Math.floor(p.x)} / ${Math.floor(p.y)} / ${Math.floor(p.z)}`;

    const horizontalVelocity = Math.sqrt(
        player.velocity.x ** 2 +
        player.velocity.z ** 2
    );

    const blocksPerSecond = horizontalVelocity * 20;
    speedElement.innerText = blocksPerSecond.toFixed(3);
}

// --------------------------------------------------
// GAME TICK LOOP (ENTITY + CONTROLLER SPLIT)
// --------------------------------------------------
setInterval(() => {

    // 1. INPUT + ACTIONS FIRST
    if (window.playerController) {
        window.playerController.tick(window.worldInstance);
    }

    // 2. PHYSICS + STATE UPDATE
    if (window.playerEntity) {
        window.playerEntity.tick();
    }

    lastTickTime = performance.now();

}, TICK_RATE);

// --------------------------------------------------
// RENDER LOOP
// --------------------------------------------------
function animate() {
    requestAnimationFrame(animate);

    const player = window.playerEntity;
    if (!player || !window.renderer) return;

    const now = performance.now();
    let partialTick = (now - lastTickTime) / TICK_RATE;
    partialTick = Math.min(partialTick, 1.0);

    // --------------------------------------------------
    // CAMERA + VIEW (CONTROLLED BY CONTROLLER)
    // --------------------------------------------------
    if (window.playerController) {
        window.playerController.renderUpdate?.(partialTick);
    }

    // --------------------------------------------------
    // SKYBOX SYNC
    // --------------------------------------------------
    if (window.skyMesh && window.skyMat) {
        window.skyMesh.position.copy(window.camera.position);
        window.skyMat.uniforms.cameraY.value = window.camera.position.y;
    }

    // --------------------------------------------------
    // FOV (SPRINT EFFECT NOW FROM ENTITY STATE)
    // --------------------------------------------------
    const targetFOV = player.sprinting ? 99 : 90;
    window.camera.fov = THREE.MathUtils.lerp(window.camera.fov, targetFOV, 0.2);
    window.camera.updateProjectionMatrix();

    if (window.uiCam) {
        window.uiCam.fov = window.camera.fov;
        window.uiCam.updateProjectionMatrix();
    }

    // --------------------------------------------------
    // RENDER PASS
    // --------------------------------------------------
    window.renderer.autoClear = false;
    window.renderer.clear();

    window.renderer.render(window.scene, window.camera);

    window.renderer.clearDepth();
    if (window.uiScene && window.uiCam) {
        window.renderer.render(window.uiScene, window.uiCam);
    }

    updateUI();
}

animate();