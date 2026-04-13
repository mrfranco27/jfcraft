class Entity {
    constructor(type, subtype = null) {
        this.type = type; // 'player' or 'mob'
        this.subtype = subtype; // 'passive', 'neutral', 'aggressive'
        
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
    }
}