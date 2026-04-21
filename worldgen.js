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
        
        // Fast typed array for block data storage
        this.blocks = new Uint16Array(this.width * this.height * this.depth);
    }

    // Convert local x, y, z to array index
    index(x, y, z) {
        return (y * 16 + z) * 16 + x;
    }

    setBlock(x, y, z, id) {
        this.blocks[this.index(x, y, z)] = id;
    }

    getBlock(x, y, z) {
        return this.blocks[this.index(x, y, z)];
    }

    // Fills WorldData so Block.js can see the blocks for AO and meshing
    generateData() {
        const height = 99; // Flat world surface height
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const worldX = this.chunkX * 16 + x;
                const worldZ = this.chunkZ * 16 + z;
                
                for (let y = 0; y <= height; y++) {
                    const block = (y === height) ? 
                        window.BlockRegistry.SOLID.GRASS : 
                        window.BlockRegistry.SOLID.DIRT;

                    // Set in local chunk array
                    this.setBlock(x, y, z, block.blockID);
                    
                    // Mirror to global WorldData for renderer/AO logic
                    window.WorldData[`${worldX},${y},${worldZ}`] = { id: block.blockID };
                }
            }
        }
    }
}

// ============================================================
// Chunk Generator
// ============================================================
class ChunkGenerator {
    constructor(seed) {
        this.seed = seed;
    }

    generateChunk(chunkX, chunkZ) {
        const chunk = new Chunk(chunkX, chunkZ);
        chunk.generateData(); 
        return chunk;
    }
}

// ============================================================
// World (Manages the grid of 16x256x16 chunks)
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

    // Returns existing chunk or generates a new one at grid coordinates
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
// Startup Logic
// ============================================================

