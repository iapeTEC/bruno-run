// Obstacle & Crystal Generator for Bruno Run
// Spawns 3D crystal pyramids, floating crystal shards, clusters and safe empty zones

class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.safeZoneRings = [];
        this.lastSpawnZ = -50;
        this.spawnDistance = 350; // Distance ahead of ship to spawn
        this.nextSafeZoneDistance = 600; // Next safe zone trigger distance
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;

        // Crystal Materials with emissive glow
        this.crystalMaterials = [
            new THREE.MeshStandardMaterial({
                color: 0x00f0ff,
                emissive: 0x006688,
                roughness: 0.15,
                metalness: 0.85,
                flatShading: true,
                transparent: true,
                opacity: 0.92
            }),
            new THREE.MeshStandardMaterial({
                color: 0xff00d4,
                emissive: 0x770055,
                roughness: 0.15,
                metalness: 0.85,
                flatShading: true,
                transparent: true,
                opacity: 0.92
            }),
            new THREE.MeshStandardMaterial({
                color: 0x00ff88,
                emissive: 0x006633,
                roughness: 0.15,
                metalness: 0.85,
                flatShading: true,
                transparent: true,
                opacity: 0.92
            }),
            new THREE.MeshStandardMaterial({
                color: 0xaa00ff,
                emissive: 0x550088,
                roughness: 0.15,
                metalness: 0.85,
                flatShading: true,
                transparent: true,
                opacity: 0.92
            })
        ];

        // Safe zone ring material
        this.ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
    }

    reset() {
        for (let obs of this.obstacles) {
            this.scene.remove(obs.mesh);
        }
        this.obstacles = [];

        for (let ring of this.safeZoneRings) {
            this.scene.remove(ring);
        }
        this.safeZoneRings = [];

        this.lastSpawnZ = -50;
        this.nextSafeZoneDistance = 600;
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;
    }

    update(shipPosition, currentDistance) {
        // Check if entering safe zone
        if (!this.inSafeZone && currentDistance >= this.nextSafeZoneDistance) {
            this.inSafeZone = true;
            this.safeZoneEndDistance = currentDistance + 350; // 350 units of empty runway!
            this.nextSafeZoneDistance = this.safeZoneEndDistance + (500 + Math.random() * 200);

            // Spawn visual safe zone waypoint rings
            for (let i = 0; i < 7; i++) {
                const ringGeo = new THREE.TorusGeometry(12, 0.25, 8, 24);
                const ring = new THREE.Mesh(ringGeo, this.ringMaterial);
                ring.position.set(0, 0, shipPosition.z - (i * 50) - 80);
                this.scene.add(ring);
                this.safeZoneRings.push(ring);
            }

            if (window.onSafeZoneEntered) {
                window.onSafeZoneEntered();
            }
        }

        // Check if exiting safe zone
        if (this.inSafeZone && currentDistance >= this.safeZoneEndDistance) {
            this.inSafeZone = false;
            if (window.onSafeZoneExited) {
                window.onSafeZoneExited();
            }
        }

        // Clean up passed rings
        for (let i = this.safeZoneRings.length - 1; i >= 0; i--) {
            const ring = this.safeZoneRings[i];
            if (ring.position.z > shipPosition.z + 30) {
                this.scene.remove(ring);
                this.safeZoneRings.splice(i, 1);
            }
        }

        // Spawn new obstacles ahead if not in safe zone
        while (this.lastSpawnZ > shipPosition.z - this.spawnDistance) {
            if (!this.inSafeZone) {
                this.spawnPattern(this.lastSpawnZ);
            }
            this.lastSpawnZ -= 35; // Spacing between rows
        }

        // Rotate & animate obstacles and clean up behind ship
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];

            // Animate floating rotation
            obs.mesh.rotation.x += obs.rotSpeed.x;
            obs.mesh.rotation.y += obs.rotSpeed.y;
            obs.mesh.rotation.z += obs.rotSpeed.z;

            // Remove if far behind
            if (obs.mesh.position.z > shipPosition.z + 40) {
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    spawnPattern(targetZ) {
        const rand = Math.random();

        if (rand < 0.35) {
            // Pattern 1: Gate of giant crystal pyramids on sides with center gap to pass
            const gapWidth = 14 + Math.random() * 4;
            const xOffset = (Math.random() - 0.5) * 8;
            this.createGiantPyramid(xOffset - gapWidth / 2 - 4, targetZ);
            this.createGiantPyramid(xOffset + gapWidth / 2 + 4, targetZ);

            // Small crystal floating in vicinity
            if (Math.random() < 0.4) {
                this.createSmallCrystal(xOffset + (Math.random() - 0.5) * 4, targetZ + 15);
            }
        } else if (rand < 0.65) {
            // Pattern 2: Floating crystal pyramid in lane + small crystals
            const xPos = (Math.random() - 0.5) * 22;
            const yPos = (Math.random() - 0.5) * 12;
            this.createCrystalPyramid(xPos, yPos, targetZ);

            // Another small shard nearby
            const xOther = xPos > 0 ? xPos - 12 : xPos + 12;
            this.createSmallCrystal(xOther, targetZ - 10);
        } else if (rand < 0.85) {
            // Pattern 3: Crystal cluster (multiple jagged crystals)
            const xPos = (Math.random() - 0.5) * 20;
            const yPos = (Math.random() - 0.5) * 10;
            this.createCrystalCluster(xPos, yPos, targetZ);
        } else {
            // Pattern 4: Multiple small crystal shards across lanes
            const count = 3;
            for (let i = 0; i < count; i++) {
                const x = ((i - 1) * 9) + (Math.random() - 0.5) * 3;
                const y = (Math.random() - 0.5) * 12;
                this.createSmallCrystal(x, targetZ + (Math.random() - 0.5) * 15, y);
            }
        }
    }

    getRandomMaterial() {
        return this.crystalMaterials[Math.floor(Math.random() * this.crystalMaterials.length)];
    }

    // Small floating crystal
    createSmallCrystal(x, z, y = null) {
        const mat = this.getRandomMaterial();
        const size = 1.4 + Math.random() * 0.8;
        const geo = Math.random() > 0.5 ?
            new THREE.OctahedronGeometry(size, 0) :
            new THREE.IcosahedronGeometry(size, 0);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y !== null ? y : (Math.random() - 0.5) * 12, z);

        this.scene.add(mesh);
        this.obstacles.push({
            mesh: mesh,
            radius: size * 1.05,
            type: 'small',
            rotSpeed: {
                x: 0.015 + Math.random() * 0.02,
                y: 0.02 + Math.random() * 0.02,
                z: 0.01 + Math.random() * 0.01
            }
        });
    }

    // Medium crystal pyramid
    createCrystalPyramid(x, y, z) {
        const mat = this.getRandomMaterial();
        const radius = 2.8 + Math.random() * 1.4;
        const height = radius * 2.2;
        const geo = new THREE.ConeGeometry(radius, height, 4);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = Math.PI / 4; // Diamond orientation

        this.scene.add(mesh);
        this.obstacles.push({
            mesh: mesh,
            radius: radius * 1.15,
            type: 'pyramid',
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: 0.015,
                z: (Math.random() - 0.5) * 0.01
            }
        });
    }

    // Giant towering crystal pyramid (for passes/gates)
    createGiantPyramid(x, z) {
        const mat = this.getRandomMaterial();
        const radius = 7.0 + Math.random() * 3.0;
        const height = radius * 3.0;
        const geo = new THREE.ConeGeometry(radius, height, 4);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0, z);
        mesh.rotation.y = Math.PI / 4;

        this.scene.add(mesh);
        this.obstacles.push({
            mesh: mesh,
            radius: radius * 0.85,
            type: 'giant',
            rotSpeed: { x: 0, y: 0.005, z: 0 }
        });
    }

    // Crystal cluster
    createCrystalCluster(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const count = 3 + Math.floor(Math.random() * 3);
        const mat = this.getRandomMaterial();

        for (let i = 0; i < count; i++) {
            const h = 3.5 + Math.random() * 2.5;
            const r = 0.8 + Math.random() * 0.5;
            const geo = new THREE.ConeGeometry(r, h, 5);
            const spike = new THREE.Mesh(geo, mat);

            spike.position.set((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2.5);
            spike.rotation.set((Math.random() - 0.5) * 0.8, Math.random() * Math.PI, (Math.random() - 0.5) * 0.8);
            group.add(spike);
        }

        this.scene.add(group);
        this.obstacles.push({
            mesh: group,
            radius: 3.2,
            type: 'cluster',
            rotSpeed: {
                x: 0.008,
                y: 0.012,
                z: 0.006
            }
        });
    }

    // Check collision with ship
    checkCollisions(shipPos, shipRadius = 1.3) {
        for (let obs of this.obstacles) {
            const dx = obs.mesh.position.x - shipPos.x;
            const dy = obs.mesh.position.y - shipPos.y;
            const dz = obs.mesh.position.z - shipPos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            const totalRadius = obs.radius + shipRadius;
            if (distSq < totalRadius * totalRadius) {
                return obs;
            }
        }
        return null;
    }
}

window.ObstacleManager = ObstacleManager;
