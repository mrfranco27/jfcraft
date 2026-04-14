// ============================================================
// WORLD DATA (GLOBAL FOR RENDERER)
// ============================================================

window.WorldData = {};


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

        this.blocks = new Uint16Array(
            this.width * this.height * this.depth
        );
    }

    index(x, y, z) {
        return (y * 16 + z) * 16 + x;
    }

    setBlock(x, y, z, id) {
        this.blocks[this.index(x, y, z)] = id;
    }

    getBlock(x, y, z) {
        return this.blocks[this.index(x, y, z)];
    }
}


// ============================================================
// Chunk Generator (FLAT WORLD)
// ============================================================

class ChunkGenerator {

    constructor(seed) {
        this.seed = seed;
    }

    generateChunk(chunkX, chunkZ) {

        const chunk = new Chunk(chunkX, chunkZ);

        const height = 99; // 👈 flat surface height

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {

                const worldX = chunkX * 16 + x;
                const worldZ = chunkZ * 16 + z;

                for (let y = 0; y <= height; y++) {

                    let blockId = 1;

                    if (y === height) blockId = 2;

                    chunk.setBlock(x, y, z, blockId);

                    // 🔥 CONNECT TO RENDERER
                    window.WorldData[`${worldX},${y},${worldZ}`] = {
                        type: (y === height) ? "GRASS" : "DIRT"
                    };
                }
            }
        }

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

    key(x, z) {
        return x + "," + z;
    }

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
// Example (generate spawn chunk)
// ============================================================

const world = new World(12345);
world.getChunk(0, 0);