// Ground-based static obstacle generator for Bruno Run
// Spawns static crystal pyramids, obelisks and rock formations rooted on the planetary surface

class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.lastSpawnZ = -60;
        this.spawnDistance = 380;
        this.nextSafeZoneDistance = 500;
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;

        // Static crystal materials with emissive highlights
        this.crystalMaterials = [
            new THREE.MeshStandardMaterial({
                color: 0x00e5ff,
                emissive: 0x005577,
                roughness: 0.2,
                metalness: 0.8,
                flatShading: true
            }),
            new THREE.MeshStandardMaterial({
                color: 0xff007f,
                emissive: 0x660033,
                roughness: 0.2,
                metalness: 0.8,
                flatShading: true
            }),
            new THREE.MeshStandardMaterial({
                color: 0x00ffaa,
                emissive: 0x005533,
                roughness: 0.2,
                metalness: 0.8,
                flatShading: true
            }),
            new THREE.MeshStandardMaterial({
                color: 0xffaa00,
                emissive: 0x664400,
                roughness: 0.2,
                metalness: 0.8,
                flatShading: true
            }),
            new THREE.MeshStandardMaterial({
                color: 0x9c27b0,
                emissive: 0x4a148c,
                roughness: 0.2,
                metalness: 0.8,
                flatShading: true
            })
        ];

        // Dark obsidian stone base for crystal roots
        this.stoneBaseMat = new THREE.MeshStandardMaterial({
            color: 0x263238,
            roughness: 0.9,
            metalness: 0.1
        });
    }

    reset() {
        for (let obs of this.obstacles) {
            this.scene.remove(obs.mesh);
        }
        this.obstacles = [];
        this.lastSpawnZ = -60;
        this.nextSafeZoneDistance = 500;
        this.inSafeZone = false;
        this.safeZoneEndDistance = 0;
    }

    update(shipPosition, currentDistance) {
        // Safe Zone Check
        if (!this.inSafeZone && currentDistance >= this.nextSafeZoneDistance) {
            this.inSafeZone = true;
            this.safeZoneEndDistance = currentDistance + 400; // 400 units of completely empty flat runway
            this.nextSafeZoneDistance = this.safeZoneEndDistance + (550 + Math.random() * 200);

            if (window.onSafeZoneEntered) {
                window.onSafeZoneEntered();
            }
        }

        if (this.inSafeZone && currentDistance >= this.safeZoneEndDistance) {
            this.inSafeZone = false;
            if (window.onSafeZoneExited) {
                window.onSafeZoneExited();
            }
        }

        // Spawn static ground obstacles ahead (Generous spacing so it starts easy and clean!)
        const spacing = 55; // 55 units between obstacle rows
        while (this.lastSpawnZ > shipPosition.z - this.spawnDistance) {
            if (!this.inSafeZone) {
                this.spawnGroundPattern(this.lastSpawnZ);
            }
            this.lastSpawnZ -= spacing;
        }

        // Remove obstacles that the ship has passed
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            if (obs.mesh.position.z > shipPosition.z + 40) {
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }

    getRandomMaterial() {
        return this.crystalMaterials[Math.floor(Math.random() * this.crystalMaterials.length)];
    }

    spawnGroundPattern(targetZ) {
        const rand = Math.random();

        if (rand < 0.40) {
            // Pattern 1: Single crystal pyramid on left or right, leaving center completely open
            const side = Math.random() < 0.5 ? -1 : 1;
            const xPos = side * (5 + Math.random() * 8);
            this.createStaticPyramid(xPos, targetZ);
        } else if (rand < 0.70) {
            // Pattern 2: Two crystal pyramids on far sides with wide passage in the middle
            const gap = 16 + Math.random() * 4; // Wide 16-20 units gap
            const centerOffset = (Math.random() - 0.5) * 6;
            this.createStaticPyramid(centerOffset - gap / 2, targetZ);
            this.createStaticPyramid(centerOffset + gap / 2, targetZ);
        } else if (rand < 0.90) {
            // Pattern 3: Tall Crystal Obelisk / Needle standing on terrain
            const xPos = (Math.random() - 0.5) * 20;
            this.createStaticObelisk(xPos, targetZ);
        } else {
            // Pattern 4: Low crystal cluster
            const xPos = (Math.random() - 0.5) * 18;
            this.createStaticCluster(xPos, targetZ);
        }
    }

    // Static Crystal Pyramid rooted firmly on the ground (y = 0)
    createStaticPyramid(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const radius = 3.0 + Math.random() * 1.5;
        const height = radius * 2.4;
        const mat = this.getRandomMaterial();

        // 4-sided pyramid
        const geo = new THREE.ConeGeometry(radius, height, 4);
        geo.translate(0, height / 2, 0); // Base sits exactly at y = 0
        const pyramid = new THREE.Mesh(geo, mat);
        pyramid.rotation.y = Math.PI / 4;
        group.add(pyramid);

        // Stone pediment base
        const baseGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.6, 8);
        baseGeo.translate(0, 0.3, 0);
        const base = new THREE.Mesh(baseGeo, this.stoneBaseMat);
        group.add(base);

        this.scene.add(group);
        this.obstacles.push({
            mesh: group,
            pos: { x: x, y: height * 0.4, z: z },
            radius: radius * 0.95,
            height: height
        });
    }

    // Static Tall Crystal Obelisk / Tower
    createStaticObelisk(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const radius = 1.6 + Math.random() * 0.8;
        const height = 10.0 + Math.random() * 4.0;
        const mat = this.getRandomMaterial();

        // Hexagonal tall prism with pointed top
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
            height: height
        });
    }

    // Static Crystal Cluster on the ground
    createStaticCluster(x, z) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);

        const count = 3;
        const mat = this.getRandomMaterial();

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
            height: 7.0
        });
    }

    // Accurate collision detection: check cylinder/sphere collision with ship
    checkCollisions(shipPos, shipRadius = 1.2) {
        for (let obs of this.obstacles) {
            const dx = obs.pos.x - shipPos.x;
            const dz = obs.pos.z - shipPos.z;
            const horizontalDistSq = dx * dx + dz * dz;

            const collideRadius = obs.radius + shipRadius;
            if (horizontalDistSq < collideRadius * collideRadius) {
                // Check if ship is within vertical height of the obstacle
                if (shipPos.y >= 0 && shipPos.y <= obs.height + 0.5) {
                    return obs;
                }
            }
        }
        return null;
    }
}

window.ObstacleManager = ObstacleManager;
