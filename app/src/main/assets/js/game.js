// Main Game Controller for Bruno Run

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Game State
        this.state = 'START'; // START, PLAYING, GAMEOVER
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('bruno_run_high_score') || '0', 10);
        this.distance = 0;
        this.baseSpeed = 48.0;
        this.currentSpeed = this.baseSpeed;
        this.currentStage = 1; // 1: Anakin, 2: Razor Crest, 3: N-1

        // Boost Mechanics
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.boostMultiplier = 2.4;

        // Ship Position & Physics
        this.shipPos = { x: 0, y: 0, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0, z: 0 };
        this.bounds = { minX: -16, maxX: 16, minY: -7, maxY: 7 };

        // Ship Mesh Reference
        this.shipGroup = null;
        this.currentShipMesh = null;

        // Systems
        this.obstacleManager = null;
        this.stars = null;
        this.plasmaParticles = null;
        this.explosionParticles = null;

        // Inputs
        this.keys = {};
        this.touch = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };

        // Camera follow & shake
        this.cameraOffset = new THREE.Vector3(0, 3.8, 10.5);
        this.shakeIntensity = 0;

        this.initThree();
        this.initEnvironment();
        this.initShip();
        this.initParticles();
        this.initObstacles();
        this.initEvents();
        this.updateUI();

        // Animation clock
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050814, 0.0035);

        this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 1200);
        this.camera.position.set(0, 4, 12);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x445577, 1.2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
        dirLight.position.set(20, 40, 20);
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x00e5ff, 0.8);
        backLight.position.set(-20, -20, -40);
        this.scene.add(backLight);
    }

    initEnvironment() {
        // Starfield Particles
        const starCount = 2000;
        const starGeo = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        const color1 = new THREE.Color(0x00e5ff);
        const color2 = new THREE.Color(0xffffff);
        const color3 = new THREE.Color(0xff4081);

        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 600;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
            starPositions[i * 3 + 2] = -Math.random() * 1200;

            const c = Math.random() < 0.6 ? color2 : (Math.random() < 0.5 ? color1 : color3);
            starColors[i * 3] = c.r;
            starColors[i * 3 + 1] = c.g;
            starColors[i * 3 + 2] = c.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 2.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);

        // Neon Grid Horizon Line
        const gridHelper = new THREE.GridHelper(800, 80, 0x00e5ff, 0x112244);
        gridHelper.position.y = -18;
        gridHelper.position.z = -300;
        this.gridHelper = gridHelper;
        this.scene.add(gridHelper);
    }

    initShip() {
        this.shipGroup = new THREE.Group();
        this.scene.add(this.shipGroup);
        this.loadShipStage(1);
    }

    loadShipStage(stage) {
        if (this.currentShipMesh) {
            this.shipGroup.remove(this.currentShipMesh);
        }

        this.currentStage = stage;
        if (stage === 1) {
            this.currentShipMesh = ShipBuilder.createAnakinPodracer();
            document.getElementById('ship-name-hud').innerText = "PODRACER (ANAKIN)";
        } else if (stage === 2) {
            this.currentShipMesh = ShipBuilder.createRazorCrest();
            document.getElementById('ship-name-hud').innerText = "RAZOR CREST";
        } else {
            this.currentShipMesh = ShipBuilder.createMandalorianN1();
            document.getElementById('ship-name-hud').innerText = "N-1 STARFIGHTER (MANDO)";
        }

        this.shipGroup.add(this.currentShipMesh);
    }

    initParticles() {
        // Plasma Boost Exhaust Trail
        const plasmaCount = 150;
        const plasmaGeo = new THREE.BufferGeometry();
        this.plasmaPositions = new Float32Array(plasmaCount * 3);
        this.plasmaVels = [];

        for (let i = 0; i < plasmaCount; i++) {
            this.plasmaPositions[i * 3] = 0;
            this.plasmaPositions[i * 3 + 1] = -1000;
            this.plasmaPositions[i * 3 + 2] = 0;
            this.plasmaVels.push(new THREE.Vector3());
        }

        plasmaGeo.setAttribute('position', new THREE.BufferAttribute(this.plasmaPositions, 3));
        const plasmaMat = new THREE.PointsMaterial({
            size: 3.5,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.plasmaParticles = new THREE.Points(plasmaGeo, plasmaMat);
        this.scene.add(this.plasmaParticles);
    }

    initObstacles() {
        this.obstacleManager = new ObstacleManager(this.scene);

        window.onSafeZoneEntered = () => {
            const banner = document.getElementById('safe-zone-banner');
            banner.classList.add('visible');
            banner.innerHTML = "⚡ SETOR LIVRE • ESPAÇO VAZIO ⚡<br><small>ATIVE O TURBO DE PLASMA AGORA!</small>";
        };

        window.onSafeZoneExited = () => {
            const banner = document.getElementById('safe-zone-banner');
            banner.classList.remove('visible');
        };
    }

    initEvents() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') {
                this.setBoosting(true);
            }
            if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startRun();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.code === 'Space') {
                this.setBoosting(false);
            }
        });

        // Touch Steering anywhere on screen
        const touchZone = document.getElementById('game-touch-zone');
        touchZone.addEventListener('touchstart', (e) => {
            if (this.state === 'START') {
                this.startRun();
                return;
            }
            const t = e.touches[0];
            this.touch.active = true;
            this.touch.startX = t.clientX;
            this.touch.startY = t.clientY;
            this.touch.moveX = 0;
            this.touch.moveY = 0;
        }, { passive: false });

        touchZone.addEventListener('touchmove', (e) => {
            if (!this.touch.active) return;
            const t = e.touches[0];
            const dx = t.clientX - this.touch.startX;
            const dy = t.clientY - this.touch.startY;

            // Sensitivity scaling
            this.touch.moveX = Math.max(-1, Math.min(1, dx / 70));
            this.touch.moveY = Math.max(-1, Math.min(1, dy / 70));
        }, { passive: false });

        const endTouch = () => {
            this.touch.active = false;
            this.touch.moveX = 0;
            this.touch.moveY = 0;
        };
        touchZone.addEventListener('touchend', endTouch);
        touchZone.addEventListener('touchcancel', endTouch);

        // Boost Touch Button
        const boostBtn = document.getElementById('btn-boost');
        boostBtn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.setBoosting(true);
        }, { passive: false });
        boostBtn.addEventListener('touchend', (e) => {
            e.stopPropagation();
            this.setBoosting(false);
        });
        boostBtn.addEventListener('mousedown', () => this.setBoosting(true));
        boostBtn.addEventListener('mouseup', () => this.setBoosting(false));

        // Start / Restart Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.startRun());
        document.getElementById('btn-restart').addEventListener('click', () => this.startRun());

        // Mute button
        const muteBtn = document.getElementById('btn-mute');
        muteBtn.addEventListener('click', () => {
            const isMuted = soundCtrl.toggleMute();
            muteBtn.innerText = isMuted ? "🔇" : "🔊";
        });
    }

    setBoosting(boost) {
        if (boost && this.boostEnergy > 20 && this.state === 'PLAYING') {
            if (!this.isBoosting) {
                soundCtrl.playBoostSound();
            }
            this.isBoosting = true;
        } else {
            this.isBoosting = false;
        }
    }

    startRun() {
        soundCtrl.init();
        this.state = 'PLAYING';
        this.score = 0;
        this.distance = 0;
        this.shipPos = { x: 0, y: 0, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.currentSpeed = this.baseSpeed;
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.loadShipStage(1);

        this.obstacleManager.reset();

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('safe-zone-banner').classList.remove('visible');

        this.updateUI();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.isBoosting = false;
        this.shakeIntensity = 1.2;

        soundCtrl.playCrashSound();

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('bruno_run_high_score', this.highScore.toString());
        }

        // Trigger Explosion effect
        this.triggerExplosion(this.shipPos.x, this.shipPos.y, this.shipPos.z);

        // Hide ship momentarily
        this.shipGroup.position.y = -999;

        setTimeout(() => {
            document.getElementById('final-score').innerText = Math.floor(this.score).toString();
            document.getElementById('best-score-final').innerText = this.highScore.toString();

            let shipAchieved = "PODRACER (ANAKIN)";
            if (this.currentStage === 2) shipAchieved = "RAZOR CREST";
            if (this.currentStage === 3) shipAchieved = "N-1 STARFIGHTER (MANDO)";
            document.getElementById('ship-unlocked-info').innerText = `Nave atingida: ${shipAchieved}`;

            document.getElementById('game-over-screen').style.display = 'flex';
        }, 800);
    }

    triggerExplosion(x, y, z) {
        // Shatter burst effect
        const count = 60;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vels = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 35
            );
            vels.push(vel);
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 4.5,
            color: 0xff5722,
            blending: THREE.AdditiveBlending
        });

        const burst = new THREE.Points(geo, mat);
        burst.vels = vels;
        this.scene.add(burst);

        // Animate explosion burst
        let frame = 0;
        const animBurst = () => {
            frame++;
            const arr = burst.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                arr[i * 3] += burst.vels[i].x * 0.05;
                arr[i * 3 + 1] += burst.vels[i].y * 0.05;
                arr[i * 3 + 2] += burst.vels[i].z * 0.05;
            }
            burst.geometry.attributes.position.needsUpdate = true;
            burst.material.opacity = 1 - (frame / 40);

            if (frame < 40) {
                requestAnimationFrame(animBurst);
            } else {
                this.scene.remove(burst);
            }
        };
        animBurst();
    }

    updateStage() {
        const current = Math.floor(this.score);
        let targetStage = 1;

        if (current >= 2500) {
            targetStage = 3;
        } else if (current >= 1000) {
            targetStage = 2;
        }

        if (targetStage !== this.currentStage) {
            this.loadShipStage(targetStage);
            soundCtrl.playUpgradeSound();

            const banner = document.getElementById('upgrade-banner');
            const name = targetStage === 2 ? "RAZOR CREST (O MANDALORIANO)" : "N-1 STARFIGHTER MODIFICADA!";
            banner.innerHTML = `🚀 NAVE DESBLOQUEADA!<br><strong style="color:#00ffff">${name}</strong>`;
            banner.classList.add('visible');

            setTimeout(() => {
                banner.classList.remove('visible');
            }, 3000);
        }
    }

    update(delta) {
        if (this.state !== 'PLAYING') return;

        // Progressive Speed (increases with distance)
        const speedRamp = Math.min(55, this.distance * 0.022);
        let targetSpeed = this.baseSpeed + speedRamp;

        // Boost logic
        if (this.isBoosting) {
            this.boostEnergy -= delta * 32;
            if (this.boostEnergy <= 0) {
                this.boostEnergy = 0;
                this.isBoosting = false;
            }
            targetSpeed *= this.boostMultiplier;
            this.score += delta * 45 * 3.0; // 3x score multiplier during boost!
        } else {
            // Recharge boost
            this.boostEnergy = Math.min(100, this.boostEnergy + delta * 14);
            this.score += delta * 30;
        }

        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, 0.1);
        this.distance += this.currentSpeed * delta;

        // Steering input processing
        let inputX = 0;
        let inputY = 0;

        if (this.keys['arrowleft'] || this.keys['a']) inputX -= 1;
        if (this.keys['arrowright'] || this.keys['d']) inputX += 1;
        if (this.keys['arrowup'] || this.keys['w']) inputY += 1;
        if (this.keys['arrowdown'] || this.keys['s']) inputY -= 1;

        if (this.touch.active) {
            inputX = this.touch.moveX;
            inputY = -this.touch.moveY; // Invert touch drag for intuitive flight stick
        }

        // Apply movement velocity
        const moveSpeed = 26;
        this.shipVelocity.x = THREE.MathUtils.lerp(this.shipVelocity.x, inputX * moveSpeed, 0.14);
        this.shipVelocity.y = THREE.MathUtils.lerp(this.shipVelocity.y, inputY * moveSpeed, 0.14);

        this.shipPos.x += this.shipVelocity.x * delta;
        this.shipPos.y += this.shipVelocity.y * delta;
        this.shipPos.z -= this.currentSpeed * delta;

        // Clamp inside flight corridor
        this.shipPos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.shipPos.x));
        this.shipPos.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.shipPos.y));

        // Update Ship Mesh Position and Banking
        this.shipGroup.position.set(this.shipPos.x, this.shipPos.y, this.shipPos.z);

        const rollTarget = -this.shipVelocity.x * 0.035;
        const pitchTarget = this.shipVelocity.y * 0.025;
        this.shipGroup.rotation.z = THREE.MathUtils.lerp(this.shipGroup.rotation.z, rollTarget, 0.12);
        this.shipGroup.rotation.x = THREE.MathUtils.lerp(this.shipGroup.rotation.x, pitchTarget, 0.12);

        // Update Camera Position & FOV
        const targetFOV = this.isBoosting ? 82 : 65;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.08);
        this.camera.updateProjectionMatrix();

        const camTargetX = this.shipPos.x * 0.55;
        const camTargetY = this.shipPos.y * 0.45 + this.cameraOffset.y;
        const camTargetZ = this.shipPos.z + this.cameraOffset.z;

        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camTargetX, 0.15);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camTargetY, 0.15);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, camTargetZ, 0.2);

        // Screen Shake
        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.5);
        }

        this.camera.lookAt(this.shipPos.x * 0.3, this.shipPos.y * 0.3, this.shipPos.z - 25);

        // Update Obstacles and check collisions
        this.obstacleManager.update(this.shipPos, this.distance);

        const hit = this.obstacleManager.checkCollisions(this.shipPos, 1.4);
        if (hit) {
            this.gameOver();
            return;
        }

        // Update Stars and Ground Grid to follow ship forward
        this.stars.position.z = this.shipPos.z;
        this.gridHelper.position.z = this.shipPos.z - 150;

        // Plasma exhaust particle animation
        this.updatePlasmaParticles();

        // Update sound frequency with speed
        soundCtrl.updateEngine(this.currentSpeed / this.baseSpeed, this.isBoosting);

        // Check ship stage unlocks
        this.updateStage();

        // Update HUD
        this.updateUI();
    }

    updatePlasmaParticles() {
        if (!this.plasmaParticles) return;
        const pos = this.plasmaParticles.geometry.attributes.position.array;
        const count = pos.length / 3;

        for (let i = 0; i < count; i++) {
            if (this.isBoosting && Math.random() < 0.45) {
                // Spawn new particle behind ship
                pos[i * 3] = this.shipPos.x + (Math.random() - 0.5) * 1.5;
                pos[i * 3 + 1] = this.shipPos.y + (Math.random() - 0.5) * 0.8;
                pos[i * 3 + 2] = this.shipPos.z + 1.8;
            } else {
                // Move particle backwards
                pos[i * 3 + 2] += 2.5;
            }
        }
        this.plasmaParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateUI() {
        document.getElementById('score-value').innerText = Math.floor(this.score).toString();
        document.getElementById('speed-value').innerText = Math.floor(this.currentSpeed * 2.5).toString() + " KM/H";
        document.getElementById('energy-bar-fill').style.width = `${Math.floor(this.boostEnergy)}%`;

        const boostBtn = document.getElementById('btn-boost');
        if (this.boostEnergy > 20) {
            boostBtn.classList.remove('disabled');
        } else {
            boostBtn.classList.add('disabled');
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
