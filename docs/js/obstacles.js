// Obstacle Generator for Bruno Run
// Supports Planetary Surface (Crystals & Pyramids) and Boss Deep Space (3D Scattered Asteroids & Meteorites)

class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.mode = 'planet'; // 'planet' or 'boss_space'
        this.lastSpawnZ = -60;
        this.spawnDistance = 400;
        this.nextSafeZoneDistance = 500;
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;

        // Planetary Crystal Materials
        this.crystalMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x005577, roughness: 0.2, metalness: 0.8, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0xff007f, emissive: 0x660033, roughness: 0.2, metalness: 0.8, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x005533, roughness: 0.2, metalness: 0.8, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x664400, roughness: 0.2, metalness: 0.8, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x9c27b0, emissive: 0x4a148c, roughness: 0.2, metalness: 0.8, flatShading: true })
        ];

        this.stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9, metalness: 0.1 });

        // Deep Space Meteorite Materials (Rocky, craggy asteroid surface with crater shading)
        this.meteoriteMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x544037, roughness: 0.9, metalness: 0.15, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.92, metalness: 0.2, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.85, metalness: 0.3, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.95, metalness: 0.1, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.88, metalness: 0.25, flatShading: true })
        ];
    }

    setMode(mode) {
        if (this.mode !== mode) {
            this.mode = mode;
            for (let obs of this.obstacles) {
                this.scene.remove(obs.mesh);
            }
            this.obstacles = [];
        }
    }

    reset() {
        for (let obs of this.obstacles) {
            this.scene.remove(obs.mesh);
        }
        this.obstacles = [];
        this.mode = 'planet';
        this.lastSpawnZ = -60;
        this.nextSafeZoneDistance = 500;
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;
    }

    update(shipPosition, currentDistance) {
        // Safe Zone Check
        if (!this.inSafeZone && currentDistance >= this.nextSafeZoneDistance) {
            this.inSafeZone = true;
            this.safeZoneEndDistance = currentDistance + (this.mode === 'boss_space' ? 420 : 380);
            this.nextSafeZoneDistance = this.safeZoneEndDistance + (500 + Math.random() * 200);

            if (window.onSafeZoneEntered) {
                window.onSafeZoneEntered(this.mode);
            }
        }

        if (this.inSafeZone && currentDistance >= this.safeZoneEndDistance) {
            this.inSafeZone = false;
            if (window.onSafeZoneExited) {
                window.onSafeZoneExited();
            }
        }

        // Spacing between obstacle rows
        const spacing = this.mode === 'boss_space' ? 65 : 55;
        while (this.lastSpawnZ > shipPosition.z - this.spawnDistance) {
            if (!this.inSafeZone) {
                if (this.mode === 'boss_space') {
                    this.spawnSpaceMeteoritePattern(this.lastSpawnZ);
                } else {
                    this.spawnGroundPattern(this.lastSpawnZ);
                }
            }
            this.lastSpawnZ -= spacing;
        }

        // Tumble meteorites in zero gravity and clean up passed obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            if (obs.rotSpeed) {
                obs.mesh.rotation.x += obs.rotSpeed.x;
                obs.mesh.rotation.y += obs.rotSpeed.y;
                obs.mesh.rotation.z += obs.rotSpeed.z;
            }

            if (obs.mesh.position.z > shipPosition.z + 40) {
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    // ==========================================
    // PLANETARY OBSTACLES (Static on ground)
    // ==========================================
    getRandomCrystalMaterial() {
        return this.crystalMaterials[Math.floor(Math.random() * this.crystalMaterials.length)];
    }

    spawnGroundPattern(targetZ) {
        const rand = Math.random();
        if (rand < 0.40) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const xPos = side * (5 + Math.random() * 8);
            this.createStaticPyramid(xPos, targetZ);
        } else if (rand < 0.70) {
            const gap = 16 + Math.random() * 4;
            const centerOffset = (Math.random() - 0.5) * 6;
            this.createStaticPyramid(centerOffset - gap / 2, targetZ);
            this.createStaticPyramid(centerOffset + gap / 2, targetZ);
        } else if (rand < 0.90) {
            const xPos = (Math.random() - 0.5) * 20;
            this.createStaticObelisk(xPos, targetZ);
        } else {
            const xPos = (Math.random() - 0.5) * 18;
            this.createStaticCluster(xPos, targetZ);
        }
    }

    createStaticPyramid(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const radius = 3.0 + Math.random() * 1.5;
        const height = radius * 2.4;
        const mat = this.getRandomCrystalMaterial();

        const geo = new THREE.ConeGeometry(radius, height, 4);
        geo.translate(0, height / 2, 0);
        const pyramid = new THREE.Mesh(geo, mat);
        pyramid.rotation.y = Math.PI / 4;
        group.add(pyramid);

        const baseGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.6, 8);
        baseGeo.translate(0, 0.3, 0);
        const base = new THREE.Mesh(baseGeo, this.stoneBaseMat);
        group.add(base);

        this.scene.add(group);
        this.obstacles.push({
            mesh: group,
            pos: { x: x, y: height * 0.4, z: z },
            radius: radius * 0.95,
            height: height,
            type: 'ground_pyramid'
        });
    }

    createStaticObelisk(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const radius = 1.6 + Math.random() * 0.8;
        const height = 10.0 + Math.random() * 4.0;
        const mat = this.getRandomCrystalMaterial();

        const prismGeo = new THREE.CylinderGeometry(radius * 0.7, radius, height * 0.85, 6);
        prismGeo.translate(0, (height * 0.85) / 2, 0);
        const prism = new THREE.Mesh(prismGeo, mat);
        group.add(prism);

        const tipGeo = new THREE.ConeGeometry(radius * 0.7, height * 0.25, 6);
        tipGeo.translate(0, (height * 0.85) + (height * 0.25) / 2, 0);
        const tip = new THREE.Mesh(tipGeo, mat);
        group.add(tip);

        this.scene.add(group);
        this.obstacles.push({
            mesh: group,
            pos: { x: x, y: height * 0.4, z: z },
            radius: radius * 1.1,
            height: height,
            type: 'ground_obelisk'
        });
    }

    createStaticCluster(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const count = 3;
        const mat = this.getRandomCrystalMaterial();

        for (let i = 0; i < count; i++) {
            const h = 4.0 + Math.random() * 3.0;
            const r = 0.9 + Math.random() * 0.4;
            const geo = new THREE.ConeGeometry(r, h, 5);
            geo.translate(0, h / 2, 0);
            const spike = new THREE.Mesh(geo, mat);

            const offsetX = (i - 1) * 1.4;
            const offsetZ = (Math.random() - 0.5) * 1.5;
            spike.position.set(offsetX, 0, offsetZ);
            spike.rotation.z = (Math.random() - 0.5) * 0.2;
            group.add(spike);
        }

        this.scene.add(group);
        this.obstacles.push({
            mesh: group,
            pos: { x: x, y: 2.5, z: z },
            radius: 2.4,
            height: 7.0,
            type: 'ground_cluster'
        });
    }

    // ==========================================
    // BOSS PHASE: 3D SCATTERED METEORITES
    // Pass Under, Over, or to the Sides!
    // ==========================================
    getRandomMeteoriteMaterial() {
        return this.meteoriteMaterials[Math.floor(Math.random() * this.meteoriteMaterials.length)];
    }

    createAsteroidGeometry(radius) {
        const geo = new THREE.DodecahedronGeometry(radius, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const vz = pos.getZ(i);

            // Crater deformation noise
            const noise = 1.0 + (Math.sin(vx * 2.8) * Math.cos(vy * 2.8) * 0.24);
            pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
        }
        geo.computeVertexNormals();
        return geo;
    }

    spawnSpaceMeteoritePattern(targetZ) {
        const pattern = Math.random();

        if (pattern < 0.28) {
            // Pattern 1: GIANT HIGH ASTEROID -> Pass UNDER it!
            // Asteroid hangs high at y = 4.8 to 6.2, player can dive under at y = -2 to 1!
            const x = (Math.random() - 0.5) * 8;
            const y = 4.8 + Math.random() * 1.6;
            const size = 5.0 + Math.random() * 2.0; // Giant
            this.createMeteorite(x, y, targetZ, size);

            // A tiny escort meteorite off to the far side
            if (Math.random() < 0.5) {
                const sideX = x > 0 ? -12 : 12;
                this.createMeteorite(sideX, -2.5, targetZ + 15, 1.8);
            }
        } else if (pattern < 0.56) {
            // Pattern 2: GIANT LOW ASTEROID -> Pass OVER it!
            // Asteroid floats low at y = -4.5 to -3.0, player can ascend and soar over at y = 2 to 5!
            const x = (Math.random() - 0.5) * 8;
            const y = -4.2 - Math.random() * 1.5;
            const size = 5.2 + Math.random() * 2.0; // Giant
            this.createMeteorite(x, y, targetZ, size);

            // A tiny floating rock up high on far side
            if (Math.random() < 0.5) {
                const sideX = x > 0 ? -12 : 12;
                this.createMeteorite(sideX, 3.5, targetZ + 15, 1.8);
            }
        } else if (pattern < 0.80) {
            // Pattern 3: SIDE MONOLITH ASTEROIDS -> Pass to the SIDES or CENTER!
            // One big on the left, one medium on the right, large center corridor to weave
            const gap = 16 + Math.random() * 4;
            const yCenter = (Math.random() - 0.5) * 4;
            this.createMeteorite(-gap / 2, yCenter, targetZ, 4.2 + Math.random() * 1.5);
            this.createMeteorite(gap / 2, yCenter, targetZ, 3.2 + Math.random() * 1.2);
        } else {
            // Pattern 4: SCATTERED FIELD of mixed small and medium stones
            // Player weaves between them 3D (up/down/left/right)
            const count = 3;
            for (let i = 0; i < count; i++) {
                const x = ((i - 1) * 11) + (Math.random() - 0.5) * 3;
                const y = ((i % 2 === 0 ? 1 : -1) * 3.8) + (Math.random() - 0.5) * 2;
                const size = 2.0 + Math.random() * 1.8;
                this.createMeteorite(x, y, targetZ + (i * 12), size);
            }
        }
    }

    createMeteorite(x, y, z, radius) {
        const mat = this.getRandomMeteoriteMaterial();
        const geo = this.createAsteroidGeometry(radius);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);

        this.scene.add(mesh);
        this.obstacles.push({
            mesh: mesh,
            pos: { x: x, y: y, z: z },
            radius: radius * 1.05,
            height: radius * 2,
            type: 'space_meteorite',
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.012,
                y: (Math.random() - 0.5) * 0.018,
                z: (Math.random() - 0.5) * 0.012
            }
        });
    }

    // Universal Collision Check (Accurate 3D Sphere & Cylinder)
    checkCollisions(shipPos, shipRadius = 1.2) {
        for (let obs of this.obstacles) {
            if (obs.type === 'space_meteorite') {
                const dx = obs.mesh.position.x - shipPos.x;
                const dy = obs.mesh.position.y - shipPos.y;
                const dz = obs.mesh.position.z - shipPos.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                const hitRadius = obs.radius + shipRadius;
                if (distSq < hitRadius * hitRadius) {
                    return obs;
                }
            } else {
                const dx = obs.pos.x - shipPos.x;
                const dz = obs.pos.z - shipPos.z;
                const horizontalDistSq = dx * dx + dz * dz;

                const collideRadius = obs.radius + shipRadius;
                if (horizontalDistSq < collideRadius * collideRadius) {
                    if (shipPos.y >= 0 && shipPos.y <= obs.height + 0.5) {
                        return obs;
                    }
                }
            }
        }
        return null;
    }
}

window.ObstacleManager = ObstacleManager;
