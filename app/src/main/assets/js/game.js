// Main Game Controller for Bruno Run - Planetary Surface & 3 Suns Edition

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
        this.totalDistance = 0;
        this.phaseDistance = 0; // Distance inside current phase for speed ramp

        // Progressive Speed per Phase (Starts easy and drops on upgrade!)
        this.baseSpeeds = { 1: 30.0, 2: 32.0, 3: 34.0 };
        this.currentSpeed = this.baseSpeeds[1];
        this.targetSpeed = this.baseSpeeds[1];
        this.currentStage = 1;

        // Boost Mechanics
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.boostMultiplier = 2.2;

        // Ship Position & Altitude (Flying above planetary surface at y=0)
        this.shipPos = { x: 0, y: 2.2, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.bounds = { minX: -14, maxX: 14, minY: 1.2, maxY: 6.8 };

        // Ship & Shadow Mesh
        this.shipGroup = null;
        this.currentShipMesh = null;
        this.shipShadow = null;

        // Planetary Environment & 3 Suns Day/Night Cycle
        this.ground = null;
        this.canyonLeft = null;
        this.canyonRight = null;
        this.sunsGroup = null;
        this.sunCenter = null;
        this.sunTwin1 = null;
        this.sunTwin2 = null;
        this.dayTime = 0.15; // 0.0 to 1.0 (0.1: morning, 0.35: day, 0.65: sunset, 0.85: night)
        this.daySpeed = 0.008; // Smooth 120s full cycle

        // Lighting & Atmosphere
        this.dirLight = null;
        this.ambientLight = null;
        this.skyStars = null;

        // Systems
        this.obstacleManager = null;
        this.plasmaParticles = null;

        // Inputs
        this.keys = {};
        this.touch = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };

        // Camera follow
        this.cameraOffset = new THREE.Vector3(0, 2.8, 9.2);
        this.shakeIntensity = 0;

        this.initThree();
        this.initPlanetaryEnvironment();
        this.initSunsAndSky();
        this.initShip();
        this.initParticles();
        this.initObstacles();
        this.initEvents();
        this.updateUI();

        // Animation loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();

        // Initial Morning Atmosphere
        const initialFogColor = new THREE.Color(0xd97d34);
        this.scene.fog = new THREE.FogExp2(initialFogColor, 0.0038);
        this.scene.background = initialFogColor;

        this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 1400);
        this.camera.position.set(0, 4.5, 11);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        // Ambient & Directional Sun Lights
        this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfff4e6, 1.3);
        this.dirLight.position.set(30, 80, -40);
        this.scene.add(this.dirLight);
    }

    initPlanetaryEnvironment() {
        // Planetary Ground Terrain (Tatooine / Alien Desert Canyon surface at y = 0)
        const groundGeo = new THREE.PlaneGeometry(350, 1200, 32, 64);
        groundGeo.rotateX(-Math.PI / 2);

        // Ground Material with warm alien planetary hues
        this.groundMat = new THREE.MeshStandardMaterial({
            color: 0xc47e45, // Sandstone / desert rock
            roughness: 0.85,
            metalness: 0.15,
            flatShading: true
        });

        this.ground = new THREE.Mesh(groundGeo, this.groundMat);
        this.ground.position.set(0, 0, -400);
        this.scene.add(this.ground);

        // Canyon Ridge / Mesa walls framing the sides
        const createCanyonRidge = (xPos) => {
            const ridgeGeo = new THREE.BoxGeometry(30, 24, 1200);
            const ridgeMat = new THREE.MeshStandardMaterial({
                color: 0x8d512a,
                roughness: 0.9,
                flatShading: true
            });
            const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
            ridge.position.set(xPos, 8, -400);
            return ridge;
        };

        this.canyonLeft = createCanyonRidge(-36);
        this.canyonRight = createCanyonRidge(36);
        this.scene.add(this.canyonLeft);
        this.scene.add(this.canyonRight);

        // Surface Grid Lines / Dunes
        const gridGeo = new THREE.GridHelper(300, 60, 0xffaa00, 0x8d512a);
        gridGeo.position.set(0, 0.08, -400);
        this.groundGrid = gridGeo;
        this.scene.add(gridGeo);
    }

    initSunsAndSky() {
        // Celestial Group for the 3 Suns
        this.sunsGroup = new THREE.Group();
        this.scene.add(this.sunsGroup);

        // 1. Center Grand Sun (Big bright golden-white sun)
        const grandSunGeo = new THREE.SphereGeometry(26, 24, 24);
        const grandSunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
        this.sunCenter = new THREE.Mesh(grandSunGeo, grandSunMat);
        this.sunsGroup.add(this.sunCenter);

        // Outer glow corona for Grand Sun
        const coronaGeo = new THREE.SphereGeometry(32, 16, 16);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0xffc107,
            transparent: true,
            opacity: 0.45
        });
        const corona = new THREE.Mesh(coronaGeo, coronaMat);
        this.sunCenter.add(corona);

        // 2. Twin Sun #1 (Warm Coral/Orange Companion)
        const twin1Geo = new THREE.SphereGeometry(11, 16, 16);
        const twin1Mat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
        this.sunTwin1 = new THREE.Mesh(twin1Geo, twin1Mat);
        this.sunTwin1.position.set(-42, 16, -10);
        this.sunsGroup.add(this.sunTwin1);

        // 3. Twin Sun #2 (Electric Cyan/Amber Companion)
        const twin2Geo = new THREE.SphereGeometry(8, 16, 16);
        const twin2Mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        this.sunTwin2 = new THREE.Mesh(twin2Geo, twin2Mat);
        this.sunTwin2.position.set(38, -12, 10);
        this.sunsGroup.add(this.sunTwin2);

        // Night Sky Stars (Visible when sun sets)
        const starCount = 800;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 800;
            starPos[i * 3 + 1] = 60 + Math.random() * 300;
            starPos[i * 3 + 2] = -200 - Math.random() * 800;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.starMat = new THREE.PointsMaterial({
            size: 2.2,
            color: 0xffffff,
            transparent: true,
            opacity: 0.0 // starts 0 in morning
        });
        this.skyStars = new THREE.Points(starGeo, this.starMat);
        this.scene.add(this.skyStars);
    }

    initShip() {
        this.shipGroup = new THREE.Group();
        this.scene.add(this.shipGroup);

        // Dynamic Ship Shadow on the ground surface (y = 0.04)
        const shadowGeo = new THREE.CircleGeometry(1.6, 16);
        shadowGeo.rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.55
        });
        this.shipShadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.shipShadow.position.y = 0.04;
        this.scene.add(this.shipShadow);

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
        // Plasma Boost Exhaust
        const plasmaCount = 120;
        const plasmaGeo = new THREE.BufferGeometry();
        this.plasmaPositions = new Float32Array(plasmaCount * 3);
        for (let i = 0; i < plasmaCount; i++) {
            this.plasmaPositions[i * 3 + 1] = -1000;
        }
        plasmaGeo.setAttribute('position', new THREE.BufferAttribute(this.plasmaPositions, 3));
        const plasmaMat = new THREE.PointsMaterial({
            size: 3.2,
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
            banner.innerHTML = "⚡ PLANÍCIE LIVRE • ÁREA SEGURA ⚡<br><small>SEM OBSTÁCULOS: ACIONE O TURBO DE PLASMA!</small>";
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

        // Touch Steering on screen
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

            this.touch.moveX = Math.max(-1, Math.min(1, dx / 65));
            this.touch.moveY = Math.max(-1, Math.min(1, dy / 65));
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
        this.totalDistance = 0;
        this.phaseDistance = 0;
        this.shipPos = { x: 0, y: 2.2, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.currentSpeed = this.baseSpeeds[1];
        this.targetSpeed = this.baseSpeeds[1];
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.dayTime = 0.15; // Start in fresh morning!
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
        this.shakeIntensity = 1.0;

        soundCtrl.playCrashSound();

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('bruno_run_high_score', this.highScore.toString());
        }

        this.triggerExplosion(this.shipPos.x, this.shipPos.y, this.shipPos.z);
        this.shipGroup.position.y = -999;
        this.shipShadow.position.y = -999;

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
        const count = 50;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vels = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;
            vels.push(new THREE.Vector3(
                (Math.random() - 0.5) * 30,
                Math.random() * 25 + 5,
                (Math.random() - 0.5) * 30
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 4.0,
            color: 0xff5722,
            blending: THREE.AdditiveBlending
        });

        const burst = new THREE.Points(geo, mat);
        burst.vels = vels;
        this.scene.add(burst);

        let frame = 0;
        const animBurst = () => {
            frame++;
            const arr = burst.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                arr[i * 3] += burst.vels[i].x * 0.04;
                arr[i * 3 + 1] += burst.vels[i].y * 0.04;
                arr[i * 3 + 2] += burst.vels[i].z * 0.04;
            }
            burst.geometry.attributes.position.needsUpdate = true;
            burst.material.opacity = 1 - (frame / 35);

            if (frame < 35) {
                requestAnimationFrame(animBurst);
            } else {
                this.scene.remove(burst);
            }
        };
        animBurst();
    }

    checkStageUpgrade() {
        const current = Math.floor(this.score);
        let targetStage = 1;

        if (current >= 2500) {
            targetStage = 3;
        } else if (current >= 1000) {
            targetStage = 2;
        }

        // When unlocking new ship: reset speed back to cruise speed & reset phase distance!
        if (targetStage !== this.currentStage) {
            this.loadShipStage(targetStage);
            soundCtrl.playUpgradeSound();

            // SPEED DROPS BACK to baseline for the new ship phase!
            this.phaseDistance = 0;
            this.currentSpeed = this.baseSpeeds[targetStage];
            this.targetSpeed = this.baseSpeeds[targetStage];

            const banner = document.getElementById('upgrade-banner');
            const name = targetStage === 2 ? "RAZOR CREST (MANDALORIANO)" : "N-1 STARFIGHTER MODIFICADA!";
            banner.innerHTML = `🚀 NOVA NAVE DESBLOQUEADA!<br><strong style="color:#00ffff">${name}</strong><br><small style="font-size:12px; color:#ffffff;">Velocidade reiniciada: Acelere com a nova nave!</small>`;
            banner.classList.add('visible');

            setTimeout(() => {
                banner.classList.remove('visible');
            }, 3500);
        }
    }

    updateDayNightCycle(delta) {
        // Increment day cycle smoothly (0.0 to 1.0)
        this.dayTime = (this.dayTime + delta * this.daySpeed) % 1.0;

        // Position the 3 Suns in an arc across the sky
        // Sun elevation angle: 0 (horizon) -> PI/2 (zenith) -> PI (sunset) -> night
        const sunAngle = this.dayTime * Math.PI * 2;
        const sunX = Math.cos(sunAngle) * 350;
        const sunY = Math.sin(sunAngle) * 220;
        const sunZ = this.shipPos.z - 420;

        this.sunsGroup.position.set(sunX, sunY, sunZ);

        // Rotate companion twin suns slowly around the central grand sun
        const t = this.clock.getElapsedTime();
        this.sunTwin1.position.x = Math.cos(t * 0.8) * 44;
        this.sunTwin1.position.y = Math.sin(t * 0.8) * 20;

        this.sunTwin2.position.x = Math.cos(t * 0.6 + Math.PI) * 40;
        this.sunTwin2.position.y = Math.sin(t * 0.6 + Math.PI) * 18;

        // Smooth color interpolation between time phases:
        // 0.0 - 0.25: Morning (warm peach / golden)
        // 0.25 - 0.50: Day (bright alien blue)
        // 0.50 - 0.75: Sunset / Twilight (deep crimson / violet)
        // 0.75 - 1.00: Night / Dawn (dark deep cosmic indigo)
        let skyColor = new THREE.Color();
        let groundTint = new THREE.Color();
        let lightIntensity = 1.0;
        let starOpacity = 0.0;

        if (this.dayTime < 0.25) {
            // Morning
            const f = this.dayTime / 0.25;
            skyColor.setRGB(0.85, 0.49, 0.24).lerp(new THREE.Color(0.38, 0.68, 0.95), f);
            groundTint.setRGB(0.77, 0.49, 0.27).lerp(new THREE.Color(0.85, 0.60, 0.35), f);
            lightIntensity = 0.9 + f * 0.4;
            starOpacity = (1 - f) * 0.3;
        } else if (this.dayTime < 0.50) {
            // Day
            const f = (this.dayTime - 0.25) / 0.25;
            skyColor.setRGB(0.38, 0.68, 0.95).lerp(new THREE.Color(0.88, 0.42, 0.18), f);
            groundTint.setRGB(0.85, 0.60, 0.35).lerp(new THREE.Color(0.75, 0.38, 0.22), f);
            lightIntensity = 1.3 - f * 0.3;
            starOpacity = 0.0;
        } else if (this.dayTime < 0.75) {
            // Sunset / Twilight
            const f = (this.dayTime - 0.50) / 0.25;
            skyColor.setRGB(0.88, 0.42, 0.18).lerp(new THREE.Color(0.06, 0.08, 0.18), f);
            groundTint.setRGB(0.75, 0.38, 0.22).lerp(new THREE.Color(0.20, 0.16, 0.25), f);
            lightIntensity = 1.0 - f * 0.7;
            starOpacity = f * 0.85;
        } else {
            // Night / Madrugada
            const f = (this.dayTime - 0.75) / 0.25;
            skyColor.setRGB(0.06, 0.08, 0.18).lerp(new THREE.Color(0.85, 0.49, 0.24), f);
            groundTint.setRGB(0.20, 0.16, 0.25).lerp(new THREE.Color(0.77, 0.49, 0.27), f);
            lightIntensity = 0.3 + f * 0.6;
            starOpacity = (1 - f) * 0.85;
        }

        // Apply interpolated atmosphere
        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
        this.groundMat.color = groundTint;
        this.dirLight.intensity = lightIntensity;
        this.starMat.opacity = starOpacity;
    }

    update(delta) {
        if (this.state !== 'PLAYING') return;

        // Progressive Speed inside Current Phase:
        // Starts calm at baseSpeed and gently grows with distance traveled in this phase!
        const base = this.baseSpeeds[this.currentStage];
        const maxRamp = this.currentStage === 1 ? 20 : (this.currentStage === 2 ? 24 : 30);
        const ramp = Math.min(maxRamp, this.phaseDistance * 0.012);
        let desiredSpeed = base + ramp;

        // Plasma Turbo Boost
        if (this.isBoosting) {
            this.boostEnergy -= delta * 30;
            if (this.boostEnergy <= 0) {
                this.boostEnergy = 0;
                this.isBoosting = false;
            }
            desiredSpeed *= this.boostMultiplier;
            this.score += delta * 42 * 3.0; // 3x multiplier during boost
        } else {
            this.boostEnergy = Math.min(100, this.boostEnergy + delta * 15);
            this.score += delta * 25;
        }

        // Smooth speed transition
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, desiredSpeed, 0.08);

        const travelStep = this.currentSpeed * delta;
        this.totalDistance += travelStep;
        this.phaseDistance += travelStep;

        // Steering Input
        let inputX = 0;
        let inputY = 0;

        if (this.keys['arrowleft'] || this.keys['a']) inputX -= 1;
        if (this.keys['arrowright'] || this.keys['d']) inputX += 1;
        if (this.keys['arrowup'] || this.keys['w']) inputY += 1;
        if (this.keys['arrowdown'] || this.keys['s']) inputY -= 1;

        if (this.touch.active) {
            inputX = this.touch.moveX;
            inputY = -this.touch.moveY;
        }

        const moveSpeed = 22;
        this.shipVelocity.x = THREE.MathUtils.lerp(this.shipVelocity.x, inputX * moveSpeed, 0.12);
        this.shipVelocity.y = THREE.MathUtils.lerp(this.shipVelocity.y, inputY * moveSpeed, 0.12);

        this.shipPos.x += this.shipVelocity.x * delta;
        this.shipPos.y += this.shipVelocity.y * delta;
        this.shipPos.z -= travelStep;

        // Clamp inside flight corridor and above ground (y >= 1.2)
        this.shipPos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.shipPos.x));
        this.shipPos.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.shipPos.y));

        // Update Ship Mesh Position and Banking
        this.shipGroup.position.set(this.shipPos.x, this.shipPos.y, this.shipPos.z);

        const rollTarget = -this.shipVelocity.x * 0.038;
        const pitchTarget = this.shipVelocity.y * 0.024;
        this.shipGroup.rotation.z = THREE.MathUtils.lerp(this.shipGroup.rotation.z, rollTarget, 0.12);
        this.shipGroup.rotation.x = THREE.MathUtils.lerp(this.shipGroup.rotation.x, pitchTarget, 0.12);

        // Update Dynamic Ground Shadow
        this.shipShadow.position.set(this.shipPos.x, 0.05, this.shipPos.z);
        const altitudeScale = Math.max(0.6, 1.6 - (this.shipPos.y * 0.12));
        this.shipShadow.scale.set(altitudeScale, altitudeScale, altitudeScale);
        this.shipShadow.material.opacity = Math.max(0.25, 0.65 - (this.shipPos.y * 0.07));

        // Move Ground, Canyons & Grid with ship forward
        this.ground.position.z = this.shipPos.z - 300;
        this.canyonLeft.position.z = this.shipPos.z - 300;
        this.canyonRight.position.z = this.shipPos.z - 300;
        this.groundGrid.position.z = this.shipPos.z - 300;
        this.skyStars.position.z = this.shipPos.z;

        // Camera Follow & FOV
        const targetFOV = this.isBoosting ? 80 : 65;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, 0.08);
        this.camera.updateProjectionMatrix();

        const camTargetX = this.shipPos.x * 0.5;
        const camTargetY = this.shipPos.y * 0.5 + this.cameraOffset.y;
        const camTargetZ = this.shipPos.z + this.cameraOffset.z;

        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, camTargetX, 0.14);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, camTargetY, 0.14);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, camTargetZ, 0.18);

        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.5);
        }

        this.camera.lookAt(this.shipPos.x * 0.25, this.shipPos.y * 0.25 + 0.8, this.shipPos.z - 25);

        // Day/Night Cycle with 3 Suns
        this.updateDayNightCycle(delta);

        // Obstacles & Collision (Static ground obstacles)
        this.obstacleManager.update(this.shipPos, this.totalDistance);

        const hit = this.obstacleManager.checkCollisions(this.shipPos, 1.2);
        if (hit) {
            this.gameOver();
            return;
        }

        // Plasma particles
        this.updatePlasmaParticles();

        // Audio engine hum
        soundCtrl.updateEngine(this.currentSpeed / base, this.isBoosting);

        // Check ship stage unlock & speed reset
        this.checkStageUpgrade();

        // Update UI
        this.updateUI();
    }

    updatePlasmaParticles() {
        if (!this.plasmaParticles) return;
        const pos = this.plasmaParticles.geometry.attributes.position.array;
        const count = pos.length / 3;

        for (let i = 0; i < count; i++) {
            if (this.isBoosting && Math.random() < 0.45) {
                pos[i * 3] = this.shipPos.x + (Math.random() - 0.5) * 1.4;
                pos[i * 3 + 1] = this.shipPos.y + (Math.random() - 0.5) * 0.6;
                pos[i * 3 + 2] = this.shipPos.z + 1.6;
            } else {
                pos[i * 3 + 2] += 2.8;
            }
        }
        this.plasmaParticles.geometry.attributes.position.needsUpdate = true;
    }

    updateUI() {
        document.getElementById('score-value').innerText = Math.floor(this.score).toString();
        document.getElementById('speed-value').innerText = Math.floor(this.currentSpeed * 2.6).toString() + " KM/H";
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

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
