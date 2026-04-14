let lastTickTime = performance.now();
const TICK_RATE = 50; 

function updateUI() {
    const dirElement = document.getElementById('dirfacing');
    const coordsElement = document.getElementById('coords');
    const speedElement = document.getElementById('speed');
    
    if (!window.mainPlayer) return;

    let yaw = window.mainPlayer.yaw % (Math.PI * 2);
    if (yaw < 0) yaw += Math.PI * 2;
    const directions = ['South', 'East', 'North', 'West'];
    const index = Math.round(yaw / (Math.PI / 2)) % 4;
    
    let status = "";
    if (window.mainPlayer.crouching) status = " (Crouching)";
    else if (window.mainPlayer.sprinting) status = " (Sprinting)";
    dirElement.innerText = directions[index] + status;

    const p = window.mainPlayer.position;
    coordsElement.innerText = `${Math.floor(p.x)} / ${Math.floor(p.y)} / ${Math.floor(p.z)}`;

    const horizontalVelocity = Math.sqrt(
        window.mainPlayer.velocity.x ** 2 + 
        window.mainPlayer.velocity.z ** 2
    );
    const blocksPerSecond = horizontalVelocity * 20;
    speedElement.innerText = blocksPerSecond.toFixed(3);
}

setInterval(() => {
    if (window.mainPlayer) {
        window.mainPlayer.tick();
        lastTickTime = performance.now();
    }
}, TICK_RATE);

function animate() {
    requestAnimationFrame(animate);

    if (window.mainPlayer && window.renderer) {
        const now = performance.now();
        let partialTick = (now - lastTickTime) / TICK_RATE;
        if (partialTick > 1.0) partialTick = 1.0;

        window.mainPlayer.renderUpdate(partialTick);

        // --- SKYBOX SYNC ---
        // Keep sky centered on player and update darkening factor
        if (window.skyMesh && window.skyMat) {
            window.skyMesh.position.copy(window.camera.position);
            window.skyMat.uniforms.cameraY.value = window.camera.position.y;
        }

        // 1. Calculate and sync FOV
        const targetFOV = window.mainPlayer.sprinting ? 99 : 90;
        window.camera.fov = THREE.MathUtils.lerp(window.camera.fov, targetFOV, 0.2);
        window.camera.updateProjectionMatrix();

        if (window.uiCam) {
            window.uiCam.fov = window.camera.fov;
            window.uiCam.updateProjectionMatrix();
        }

        // 2. Dual Render Pass
        window.renderer.autoClear = false;
        window.renderer.clear();

        // Render World (Skybox is part of this scene)
        window.renderer.render(window.scene, window.camera);

        // Render Hand
        window.renderer.clearDepth();
        if (window.uiScene && window.uiCam) {
            window.renderer.render(window.uiScene, window.uiCam);
        }

        updateUI();
    }
}
animate();
