let lastTickTime = performance.now();
let lastRenderTime = performance.now(); // Track time between frames
const TICK_RATE = 50; 
const baseFOV = 90;
const sprintMultiplier = 1.1; // 10% increase

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
        player.velocity.x ** 2 + player.velocity.z ** 2
    );
    const blocksPerSecond = horizontalVelocity * 20;
    speedElement.innerText = blocksPerSecond.toFixed(3);
}

// --------------------------------------------------
// GAME TICK LOOP (ENTITY + CONTROLLER SPLIT)
// --------------------------------------------------
setInterval(() => {
    if (window.playerEntity) {
        window.playerEntity.tick(); // physics FIRST
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
    
    // Calculate partial tick for position interpolation
    let partialTick = (now - lastTickTime) / TICK_RATE;
    partialTick = Math.min(partialTick, 1.0);
    window.playerEntity.renderUpdate(partialTick);

    // Calculate delta time for frame-rate independent FOV lerping
    const dt = (now - lastRenderTime) / 1000; 
    lastRenderTime = now;

    // --------------------------------------------------
    // SKYBOX SYNC
    // --------------------------------------------------
    if (window.skyMesh && window.skyMat) {
        window.skyMesh.position.copy(window.camera.position);
        window.skyMat.uniforms.cameraY.value = window.camera.position.y;
    }

    // --------------------------------------------------
    // FOV (FRAME-RATE INDEPENDENT LERP)
    // --------------------------------------------------
    const targetFOV = player.sprinting ? (baseFOV * sprintMultiplier) : baseFOV;
    
    // This formula ensures the zoom speed is identical on all monitors
    // 10 is the speed factor; higher = faster zoom
    window.camera.fov = THREE.MathUtils.lerp(
        window.camera.fov, 
        targetFOV, 
        1 - Math.exp(-10 * dt) 
    );
    window.camera.updateProjectionMatrix();

if (window.camera && window.uiFrontLight && window.uiBackLight) {
        // 1. Get the rotation of the player
        const playerRotation = window.camera.quaternion;

        // 2. Rotate the Front Light position
        window.uiFrontLight.position
            .copy(window.uiFrontBasePos)
            .applyQuaternion(playerRotation.clone().invert());

        // 3. Rotate the Back Light position
        window.uiBackLight.position
            .copy(window.uiBackBasePos)
            .applyQuaternion(playerRotation.clone().invert());
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

// Initialize game
window.playerEntity = new EntityPlayer();
window.playerController = new ControlPlayer(window.playerEntity);
