class EntityLiving extends Entity {
    constructor() {
        super();

        this.onGround = false;

        this.sprinting = false;
        this.crouching = false;

        this.yaw = Math.PI;
        this.pitch = 0;
    }

    tick(world) {
        window.Physics.apply(this);
    }
}

window.EntityLiving = EntityLiving;