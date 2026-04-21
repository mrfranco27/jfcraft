window.BlockRegistry = {
    AIR: {
        AIR: {
            blockID: 0,
            textures: [null, null, null, null, null, null],
            overlays: [null, null, null, null, null, null],
            tint: null
        }
    },

    SOLID: {
        GRASS: {
            blockID: 2,
            opacity: 15,
            tint: { top: true },
            textures: [
                'assets/minecraft/textures/block/grass_block_side.png',
                'assets/minecraft/textures/block/grass_block_side.png',
                'assets/minecraft/textures/block/grass_block_top.png',
                'assets/minecraft/textures/block/dirt.png',
                'assets/minecraft/textures/block/grass_block_side.png',
                'assets/minecraft/textures/block/grass_block_side.png'
            ],
            overlays: [
                'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/textures/block/grass_block_side_overlay.png',
                'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/textures/block/grass_block_side_overlay.png',
                null,
                null,
                'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/textures/block/grass_block_side_overlay.png',
                'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/textures/block/grass_block_side_overlay.png'
            ]
        },

        DIRT: {
            blockID: 3,
            opacity: 15,
            tint: null,
            textures: Array(6).fill(
                'assets/minecraft/textures/block/dirt.png'
            ),
            overlays: Array(6).fill(null)
        },

        COBBLESTONE: {
            blockID: 4,
            opacity: 15,
            tint: null,
            textures: Array(6).fill(
                'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20/assets/minecraft/textures/block/cobblestone.png'
            ),
            overlays: Array(6).fill(null)
        }
    }
};

window.BlockById = {};

for (const typeKey in window.BlockRegistry) {
    const type = window.BlockRegistry[typeKey];

    for (const blockKey in type) {
        const block = type[blockKey];
        window.BlockById[block.blockID] = block;
    }
}