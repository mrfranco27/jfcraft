class Entity {
    constructor() {
        this.position = new THREE.Vector3(8, 100, 8);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.remove = false;
    }

    tick(world) {
        this.position.add(this.velocity);
    }
}

window.Entity = Entity;