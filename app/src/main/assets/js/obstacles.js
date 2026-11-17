// Obstacle Generator for Bruno Run
// Supports both Planetary Surface (Crystals & Pyramids) and Boss Phase (Deep Space Meteorites)

class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.mode = 'planet'; // 'planet' or 'boss_space'
        this.lastSpawnZ = -60;
        this.spawnDistance = 380;
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

        // Deep Space Meteorite Materials
        this.meteoriteMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9, metalness: 0.2, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.85, metalness: 0.35, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.95, metalness: 0.15, flatShading: true }),
            new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.88, metalness: 0.25, flatShading: true })
        ];
    }

    setMode(mode) {
        if (this.mode !== mode) {
            this.mode = mode;
            // Clear current obstacles for clean transition
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
            this.safeZoneEndDistance = currentDistance + (this.mode === 'boss_space' ? 450 : 380);
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

        // Spawn obstacles ahead
        const spacing = this.mode === 'boss_space' ? 45 : 55;
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

        // Update & animate (Meteorites tumble slowly in deep space)
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
    // BOSS PHASE: DEEP SPACE METEORITES
    // ==========================================
    getRandomMeteoriteMaterial() {
        return this.meteoriteMaterials[Math.floor(Math.random() * this.meteoriteMaterials.length)];
    }

    // Creates an irregular jagged 3D asteroid geometry
    createAsteroidGeometry(radius) {
        const geo = new THREE.DodecahedronGeometry(radius, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const vz = pos.getZ(i);

            // Deform vertices for craggy asteroid craters
            const noise = 1.0 + (Math.sin(vx * 3.0) * Math.cos(vy * 3.0) * 0.22);
            pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
        }
        geo.computeVertexNormals();
        return geo;
    }

    spawnSpaceMeteoritePattern(targetZ) {
        const rand = Math.random();

        if (rand < 0.40) {
            // Pattern 1: Colossal Asteroid with a wide flyby zone
            const xPos = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 6);
            const yPos = (Math.random() - 0.5) * 8;
            this.createMeteorite(xPos, yPos, targetZ, 4.5 + Math.random() * 2.5);
        } else if (rand < 0.70) {
            // Pattern 2: Asteroid Gate (two big meteorites with center passage)
            const gap = 15 + Math.random() * 5;
            const centerY = (Math.random() - 0.5) * 6;
            this.createMeteorite(-gap / 2, centerY, targetZ, 3.8);
            this.createMeteorite(gap / 2, centerY, targetZ, 3.8);
        } else {
            // Pattern 3: Cluster of 2-3 medium floating asteroids
            const count = 2;
            for (let i = 0; i < count; i++) {
                const x = ((i - 0.5) * 14) + (Math.random() - 0.5) * 4;
                const y = (Math.random() - 0.5) * 9;
                this.createMeteorite(x, y, targetZ + (i * 12), 2.4 + Math.random() * 1.2);
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
                x: (Math.random() - 0.5) * 0.015,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.015
            }
        });
    }

    // Universal Collision Check (Both Ground & Space Meteorites)
    checkCollisions(shipPos, shipRadius = 1.2) {
        for (let obs of this.obstacles) {
            if (obs.type === 'space_meteorite') {
                // Full 3D Sphere Collision for Meteorites in space
                const dx = obs.mesh.position.x - shipPos.x;
                const dy = obs.mesh.position.y - shipPos.y;
                const dz = obs.mesh.position.z - shipPos.z;
                const distSq = dx * dx + dy * dy + dz * dz;

                const hitRadius = obs.radius + shipRadius;
                if (distSq < hitRadius * hitRadius) {
                    return obs;
                }
            } else {
                // Ground Obstacle Collision (Cylinder height check)
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
