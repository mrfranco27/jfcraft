const Block = {
    loader: new THREE.TextureLoader(),
    textures: {},

    init: function() {
        this.loader.setCrossOrigin('anonymous');

        const allPaths = [];

        for (const typeKey in window.BlockRegistry) {
            const type = window.BlockRegistry[typeKey];

            for (const blockKey in type) {
                const block = type[blockKey];

                if (block.textures) {
                    allPaths.push(...block.textures);
                }

                if (block.overlays) {
                    allPaths.push(...block.overlays.filter(p => p !== null));
                }
            }
        }

        allPaths.forEach(path => {
            if (!path) return;
            if (!this.textures[path]) {
                this.textures[path] = this.loader.load(path);
                this.textures[path].magFilter = THREE.NearestFilter;
            }
        });
    },

    NEIGHBORS: [
        [1,0,0], [-1,0,0],
        [0,1,0], [0,-1,0],
        [0,0,1], [0,0,-1]
    ],

    shouldTintFace: function(def, faceIdx) {
        if (!def.tint) return false;
        if (def.tint === "all") return true;

        const map = {
            0: "right",
            1: "left",
            2: "top",
            3: "bottom",
            4: "front",
            5: "back"
        };

        const face = map[faceIdx];
        return !!def.tint[face];
    },

    generateChunkMesh: function(cx, cz) {

        const chunkGroup = new THREE.Group();
        chunkGroup.userData = { cx, cz };

        const buckets = {};

        const biome = Biomes.TYPES.PLAINS;
        const biomeColor = new THREE.Color(biome.color);

        const brightness = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8];

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                for (let y = 0; y < 256; y++) {

                    const wx = cx * 16 + x;
                    const wz = cz * 16 + z;

                    const id = window.WorldData[`${wx},${y},${wz}`]?.id ?? 0;

                    if (id === 0) continue;

                    const def = window.BlockById[id];

                    if (!def) continue;

                    this.NEIGHBORS.forEach((off, i) => {

                        const nx = wx + off[0];
                        const ny = y + off[1];
                        const nz = wz + off[2];

                        const neighbor = window.WorldData[`${nx},${ny},${nz}`];
                        if (neighbor) return;

                        const tex = def.textures[i];
                        const ovl = def.overlays[i];

                        if (tex) {
                            if (!buckets[tex]) {
                                buckets[tex] = { pos: [], col: [], uv: [], idx: [], vCount: 0 };
                            }

                            this.addFaceToArrays(
                                i, wx, y, wz,
                                false, buckets[tex],
                                def, biomeColor, brightness[i]
                            );
                        }

                        if (ovl) {
                            if (!buckets[ovl]) {
                                buckets[ovl] = { pos: [], col: [], uv: [], idx: [], vCount: 0 };
                            }

                            this.addFaceToArrays(
                                i, wx, y, wz,
                                true, buckets[ovl],
                                def, biomeColor, brightness[i]
                            );
                        }
                    });
                }
            }
        }

        for (const path in buckets) {

            const b = buckets[path];

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
            geo.setIndex(b.idx);

            const mat = new THREE.MeshBasicMaterial({
                map: this.textures[path],
                vertexColors: true,
                transparent: true,
                side: THREE.FrontSide,
                alphaTest: 0.1
            });

            chunkGroup.add(new THREE.Mesh(geo, mat));
        }

        return chunkGroup;
    },

    addFaceToArrays: function(faceIdx, x, y, z, isOverlay, bucket, def, biomeColor, brightnessVal) {

        const offset = isOverlay ? 0.001 : 0;
        const p = 0.5 + offset, n = -0.5 - offset;

        const faces = [
            [p,n,p, p,n,n, p,p,p, p,p,n],
            [n,n,n, n,n,p, n,p,n, n,p,p],
            [n,p,p, p,p,p, n,p,n, p,p,n],
            [n,n,n, p,n,n, n,n,p, p,n,p],
            [n,n,p, p,n,p, n,p,p, p,p,p],
            [p,n,n, n,n,n, p,p,n, n,p,n]
        ];

        const base = bucket.vCount;

        faces[faceIdx].forEach((v, i) => {
            bucket.pos.push(
                v + (i % 3 === 0 ? x + 0.5 : i % 3 === 1 ? y + 0.5 : z + 0.5)
            );
        });

        // =========================
        // 🌤️ SIMPLE FACE SHADING
        // =========================
        let light = 1; // constant now

        let c = (isOverlay || this.shouldTintFace(def, faceIdx))
            ? biomeColor.clone()
            : new THREE.Color(0xffffff);

        // Apply fake directional shading ONLY
        c.multiplyScalar(brightnessVal * light);

        for (let i = 0; i < 4; i++) {
            bucket.col.push(c.r, c.g, c.b);
        }

        bucket.uv.push(0,0, 1,0, 0,1, 1,1);

        bucket.idx.push(
            base, base+1, base+2,
            base+2, base+1, base+3
        );

        bucket.vCount += 4;
    }
};

Block.init();

window.Block = Block;