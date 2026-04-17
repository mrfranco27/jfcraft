// ============================================================
// WORLD DATA (GLOBAL FOR RENDERER)
// ============================================================
window.WorldData = {};

// ============================================================
// JAVA RANDOM EMULATOR (Required for 1:1 MC 1.12.2 Logic)
// ============================================================
class JavaRandom {
    constructor(seed) {
        this.seed = (BigInt(seed) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
    }
    next(bits) {
        this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
        return Number(this.seed >> (48n - BigInt(bits)));
    }
    nextInt(n) {
        if (!n) return this.next(31);
        if ((n & -n) === n) return Number((BigInt(n) * BigInt(this.next(31))) >> 31n);
        let bits, val;
        do {
            bits = this.next(31);
            val = bits % n;
        } while (bits - val + (n - 1) < 0);
        return val;
    }
    nextFloat() { return this.next(24) / (1 << 24); }
}

// ============================================================
// MC 1.12.2 CAVE GENERATOR (The "Carver")
// ============================================================
class CaveGenerator {
    constructor(worldSeed) {
        this.worldSeed = worldSeed;
        this.range = 8; 
    }

    generate(chunkX, chunkZ, chunk) {
        const rand = new JavaRandom(this.worldSeed);
        const j = rand.nextInt();
        const k = rand.nextInt();

        for (let x = chunkX - this.range; x <= chunkX + this.range; x++) {
            for (let z = chunkZ - this.range; z <= chunkZ + this.range; z++) {
                const chunkSeed = BigInt(x) * BigInt(j) ^ BigInt(z) * BigInt(k) ^ BigInt(this.worldSeed);
                const chunkRand = new JavaRandom(Number(chunkSeed & 0xFFFFFFFFn));
                this.recursiveGenerate(x, z, chunkX, chunkZ, chunk, chunkRand);
            }
        }
    }

    recursiveGenerate(cx, cz, targetX, targetZ, chunk, rand) {
        let count = rand.nextInt(rand.nextInt(rand.nextInt(15) + 1) + 1);
        if (rand.nextInt(7) !== 0) count = 0;

        for (let i = 0; i < count; i++) {
            const startX = cx * 16 + rand.nextInt(16);
            const startY = rand.nextInt(rand.nextInt(120) + 8);
            const startZ = cz * 16 + rand.nextInt(16);
            
            let branches = 1;
            if (rand.nextInt(4) === 0) {
                this.addTunnel(rand.nextInt(), targetX, targetZ, chunk, startX, startY, startZ, rand.nextFloat() * 0.5 + 0.5, 0, 0, -1, -1, 0.5);
                branches = 2 + rand.nextInt(4);
            }

            for (let j = 0; j < branches; j++) {
                const yaw = rand.nextFloat() * Math.PI * 2;
                const pitch = (rand.nextFloat() - 0.5) * 2 / 8;
                const width = rand.nextFloat() * 2 + rand.nextFloat();
                this.addTunnel(rand.nextInt(), targetX, targetZ, chunk, startX, startY, startZ, width, yaw, pitch, 0, 0, 1.0);
            }
        }
    }

    addTunnel(seed, targetX, targetZ, chunk, x, y, z, width, yaw, pitch, startNode, endNode, scale) {
        const rand = new JavaRandom(seed);
        const length = 128; // Standard MC tunnel length
        for (let i = 0; i < length; i++) {
            x += Math.cos(yaw) * Math.cos(pitch);
            y += Math.sin(pitch);
            z += Math.sin(yaw) * Math.cos(pitch);
            
            // Subtle adjustments to yaw/pitch make the "worm" curve
            yaw += (rand.nextFloat() - rand.nextFloat()) * 0.2;
            pitch = pitch * 0.9 + (rand.nextFloat() - rand.nextFloat()) * 0.1;

            this.carveSphere(chunk, x, y, z, width, targetX, targetZ);
            if (y < 0) break;
        }
    }

    carveSphere(chunk, x, y, z, radius, tx, tz) {
        const localX = Math.floor(x - tx * 16);
        const localZ = Math.floor(z - tz * 16);
        const localY = Math.floor(y);

        // Check 3x3x3 area around the point
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                for (let dy = -4; dy <= 4; dy++) {
                    const realX = localX + dx;
                    const realZ = localZ + dz;
                    const realY = localY + dy;

                    if (realX >= 0 && realX < 16 && realZ >= 0 && realZ < 16 && realY > 0 && realY < 256) {
                        const distSq = dx*dx + dy*dy + dz*dz;
                        if (distSq < radius * radius) {
                            chunk.setBlock(realX, realY, realZ, 0); // Air
                            const worldX = tx * 16 + realX;
                            const worldZ = tz * 16 + realZ;
                            // 🔥 REMOVE from renderer data
                            delete window.WorldData[`${worldX},${realY},${worldZ}`];
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// Chunk
// ============================================================
class Chunk {
    constructor(chunkX, chunkZ) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.width = 16;
        this.height = 256;
        this.depth = 16;
        this.blocks = new Uint16Array(this.width * this.height * this.depth);
    }
    index(x, y, z) { return (y * 16 + z) * 16 + x; }
    setBlock(x, y, z, id) { this.blocks[this.index(x, y, z)] = id; }
    getBlock(x, y, z) { return this.blocks[this.index(x, y, z)]; }
}

// ============================================================
// Chunk Generator (FLAT WORLD + CAVES)
// ============================================================
class ChunkGenerator {
    constructor(seed) {
        this.seed = seed;
        this.caveGen = new CaveGenerator(seed);
    }

    generateChunk(chunkX, chunkZ) {
        const chunk = new Chunk(chunkX, chunkZ);
        const height = 29;

        // 1. Fill Terrain
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const worldX = chunkX * 16 + x;
                const worldZ = chunkZ * 16 + z;
                for (let y = 0; y <= height; y++) {
                    let blockId = (y === height) ? 2 : 1;
                    chunk.setBlock(x, y, z, blockId);
                    window.WorldData[`${worldX},${y},${worldZ}`] = { 
                        type: (y === height) ? "GRASS" : "DIRT" 
                    };
                }
            }
        }

        // 2. Carve Caves (1.12.2 Logic)
        this.caveGen.generate(chunkX, chunkZ, chunk);

        return chunk;
    }
}

// ============================================================
// World
// ============================================================
class World {
    constructor(seed) {
        this.seed = seed;
        this.generator = new ChunkGenerator(seed);
        this.chunks = new Map();
    }
    key(x, z) { return x + "," + z; }
    getChunk(x, z) {
        const k = this.key(x, z);
        if (!this.chunks.has(k)) {
            const chunk = this.generator.generateChunk(x, z);
            this.chunks.set(k, chunk);
        }
        return this.chunks.get(k);
    }
}

// ============================================================
// Example Execution
// ============================================================
const world = new World(12345);
world.getChunk(0, 0);
