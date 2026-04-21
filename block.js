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
                if (block.textures) allPaths.push(...block.textures);
                if (block.overlays) allPaths.push(...block.overlays.filter(p => p !== null));
            }
        }
        allPaths.forEach(path => {
            if (!path || this.textures[path]) return;
            this.textures[path] = this.loader.load(path);
            this.textures[path].magFilter = THREE.NearestFilter;
        });
    },

    // HELPER: Convert world coordinates to chunk coordinates
    getChunkCoords: function(x, z) {
        return {
            cx: Math.floor(x / 16),
            cz: Math.floor(z / 16)
        };
    },

    NEIGHBORS: [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
    ],

    getAO: function(x, y, z, s1Off, s2Off, cOff) {
        const s1 = window.WorldData[`${x + s1Off[0]},${y + s1Off[1]},${z + s1Off[2]}`] ? 1 : 0;
        const s2 = window.WorldData[`${x + s2Off[0]},${y + s2Off[1]},${z + s2Off[2]}`] ? 1 : 0;
        const c = window.WorldData[`${x + cOff[0]},${y + cOff[1]},${z + cOff[2]}`] ? 1 : 0;
        if (s1 && s2) return 0;
        return 3 - (s1 + s2 + c);
    },

    getFaceAO: function(faceIdx, x, y, z) {
        const res = [];
        const check = (s1, s2, c) => this.getAO(x, y, z, s1, s2, c);
        
        if (faceIdx === 0) { // Right (+X)
            res.push(check([1,-1,0],[1,0,1],[1,-1,1]), check([1,-1,0],[1,0,-1],[1,-1,-1]), check([1,1,0],[1,0,1],[1,1,1]), check([1,1,0],[1,0,-1],[1,1,-1]));
        } else if (faceIdx === 1) { // Left (-X)
            res.push(check([-1,-1,0],[-1,0,-1],[-1,-1,-1]), check([-1,-1,0],[-1,0,1],[-1,-1,1]), check([-1,1,0],[-1,0,-1],[-1,1,-1]), check([-1,1,0],[-1,0,1],[-1,1,1]));
        } else if (faceIdx === 2) { // Top (+Y)
            res.push(check([-1,1,0],[0,1,1],[-1,1,1]), check([1,1,0],[0,1,1],[1,1,1]), check([-1,1,0],[0,1,-1],[-1,1,-1]), check([1,1,0],[0,1,-1],[1,1,-1]));
        } else if (faceIdx === 3) { // Bottom (-Y)
            res.push(check([-1,-1,0],[0,-1,-1],[-1,-1,-1]), check([1,-1,0],[0,-1,-1],[1,-1,-1]), check([-1,-1,0],[0,-1,1],[-1,-1,1]), check([1,-1,0],[0,-1,1],[1,-1,1]));
        } else if (faceIdx === 4) { // Front (+Z)
            res.push(check([-1,0,1],[0,-1,1],[-1,-1,1]), check([1,0,1],[0,-1,1],[1,-1,1]), check([-1,0,1],[0,1,1],[-1,1,1]), check([1,0,1],[0,1,1],[1,1,1]));
        } else if (faceIdx === 5) { // Back (-Z)
            res.push(check([1,0,-1],[0,-1,-1],[1,-1,-1]), check([-1,0,-1],[0,-1,-1],[-1,-1,-1]), check([1,0,-1],[0,1,-1],[1,1,-1]), check([-1,0,-1],[0,1,-1],[-1,1,-1]));
        }
        return res;
    },

    shouldTintFace: function(def, faceIdx) {
        if (!def.tint) return false;
        if (def.tint === "all") return true;
        const map = { 0: "right", 1: "left", 2: "top", 3: "bottom", 4: "front", 5: "back" };
        return !!def.tint[map[faceIdx]];
    },

    generateChunkMesh: function(cx, cz) {
        const chunkGroup = new THREE.Group();
        chunkGroup.userData = { cx, cz };
        chunkGroup.name = `chunk_${cx}_${cz}`; // Essential for finding/replacing
        
        const buckets = {};
        const biomeColor = new THREE.Color(Biomes.TYPES.PLAINS.color);
        const brightness = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8];

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                for (let y = 0; y < 256; y++) {
                    const wx = cx * 16 + x, wz = cz * 16 + z;
                    const id = window.WorldData[`${wx},${y},${wz}`]?.id ?? 0;
                    if (id === 0) continue;
                    const def = window.BlockById[id];

                    this.NEIGHBORS.forEach((off, i) => {
                        const nx = wx + off[0], ny = y + off[1], nz = wz + off[2];
                        if (window.WorldData[`${nx},${ny},${nz}`]) return;

                        const tex = def.textures[i];
                        const ovl = def.overlays ? def.overlays[i] : null;

                        [tex, ovl].forEach((path, isOvlIdx) => {
                            if (!path) return;
                            if (!buckets[path]) buckets[path] = { pos: [], col: [], uv: [], idx: [], vCount: 0 };
                            this.addFaceToArrays(i, wx, y, wz, isOvlIdx === 1, buckets[path], def, biomeColor, brightness[i]);
                        });
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
            [p,n,p, p,n,n, p,p,p, p,p,n], [n,n,n, n,n,p, n,p,n, n,p,p],
            [n,p,p, p,p,p, n,p,n, p,p,n], [n,n,n, p,n,n, n,n,p, p,n,p],
            [n,n,p, p,n,p, n,p,p, p,p,p], [p,n,n, n,n,n, p,p,n, n,p,n]
        ];

        const base = bucket.vCount;
        faces[faceIdx].forEach((v, i) => {
            bucket.pos.push(v + (i % 3 === 0 ? x + 0.5 : i % 3 === 1 ? y + 0.5 : z + 0.5));
        });

        const aoLevels = this.getFaceAO(faceIdx, x, y, z);
        const aoCurve = [0.4, 0.6, 0.8, 1.0];

        for (let i = 0; i < 4; i++) {
            let c = (isOverlay || this.shouldTintFace(def, faceIdx)) ? biomeColor.clone() : new THREE.Color(0xffffff);
            c.multiplyScalar(brightnessVal * aoCurve[aoLevels[i]]);
            bucket.col.push(c.r, c.g, c.b);
        }

        bucket.uv.push(0,0, 1,0, 0,1, 1,1);

        if (aoLevels[0] + aoLevels[3] < aoLevels[1] + aoLevels[2]) {
            bucket.idx.push(base, base + 1, base + 3, base, base + 3, base + 2);
        } else {
            bucket.idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        }
        bucket.vCount += 4;
    }
};

Block.init();
window.Block = Block;
