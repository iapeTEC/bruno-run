const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyUVrMaTqy2g70wuF_o8uB75JOvQOf1dxeJ4ovXnZjZdLV_64phNNhWho5yQ0iAsfn8/exec";

// Main Game Controller for Bruno Run - Planet + Boss Deep Space Edition

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Player Name
        this.playerName = localStorage.getItem('bruno_run_player_name') || '';

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Game State
        this.state = 'START';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('bruno_run_high_score') || '0', 10);
        this.totalDistance = 0;
        this.phaseDistance = 0;

        // Stages: 1: Anakin (Planet), 2: Razor Crest (Planet), 3: N-1 (Planet Night), 4: BOSS PHASE (Deep Space & Meteorites)
        this.currentStage = 1;
        this.isBossPhase = false;

        // Cruise Speeds per Stage (resets on stage transition)
        this.baseSpeeds = { 1: 30.0, 2: 32.0, 3: 34.0, 4: 36.0 };
        this.currentSpeed = this.baseSpeeds[1];

        // Boost Mechanics
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.boostMultiplier = 2.2;

        // Ship Position & Altitude
        this.shipPos = { x: 0, y: 2.2, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.bounds = { minX: -14, maxX: 14, minY: 1.2, maxY: 6.8 };

        // Ship & Shadow Mesh
        this.shipGroup = null;
        this.currentShipMesh = null;
        this.shipShadow = null;

        // Planetary Environment
        this.ground = null;
        this.canyonLeft = null;
        this.canyonRight = null;
        this.groundGrid = null;
        this.sunsGroup = null;
        this.sunCenter = null;
        this.sunTwin1 = null;
        this.sunTwin2 = null;
        this.dayTime = 0.15;
        this.daySpeed = 0.008;

        // Deep Space Boss Atmosphere
        this.deepSpaceStars = null;
        this.nebulaDust = null;

        // Systems
        this.obstacleManager = null;
        this.plasmaParticles = null;

        // Inputs
        this.keys = {};
        this.touch = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };

        // Camera follow & shake
        this.cameraOffset = new THREE.Vector3(0, 2.8, 9.2);
        this.shakeIntensity = 0;

        this.initThree();
        this.initPlanetaryEnvironment();
        this.initDeepSpaceEnvironment();
        this.initSunsAndSky();
        this.initShip();
        this.initParticles();
        this.initObstacles();
        this.initEvents();
        this.updateUI();

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.scene = new THREE.Scene();
        const initialFog = new THREE.Color(0xd97d34);
        this.scene.fog = new THREE.FogExp2(initialFog, 0.0038);
        this.scene.background = initialFog;

        this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 1400);
        this.camera.position.set(0, 4.5, 11);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0xffeedd, 0.85);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfff4e6, 1.3);
        this.dirLight.position.set(30, 80, -40);
        this.scene.add(this.dirLight);
    }

    initPlanetaryEnvironment() {
        // Planetary Ground Terrain (y = 0)
        const groundGeo = new THREE.PlaneGeometry(350, 1200, 32, 64);
        groundGeo.rotateX(-Math.PI / 2);

        this.groundMat = new THREE.MeshStandardMaterial({
            color: 0xc47e45,
            roughness: 0.85,
            metalness: 0.15,
            flatShading: true
        });

        this.ground = new THREE.Mesh(groundGeo, this.groundMat);
        this.ground.position.set(0, 0, -400);
        this.scene.add(this.ground);

        // Canyon Mesa Ridge Walls
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

        // Ground Dunes Grid
        const gridGeo = new THREE.GridHelper(300, 60, 0xffaa00, 0x8d512a);
        gridGeo.position.set(0, 0.08, -400);
        this.groundGrid = gridGeo;
        this.scene.add(gridGeo);
    }

    initDeepSpaceEnvironment() {
        // Distant twinkling stars for Deep Space Boss Phase
        const count = 1800;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(count * 3);
        const starColors = new Float32Array(count * 3);

        const colWhite = new THREE.Color(0xffffff);
        const colCyan = new THREE.Color(0x00e5ff);
        const colMagenta = new THREE.Color(0xff4081);

        for (let i = 0; i < count; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 800;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 600;
            starPos[i * 3 + 2] = -Math.random() * 1200;

            const c = Math.random() < 0.7 ? colWhite : (Math.random() < 0.5 ? colCyan : colMagenta);
            starColors[i * 3] = c.r;
            starColors[i * 3 + 1] = c.g;
            starColors[i * 3 + 2] = c.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        this.deepSpaceStarMat = new THREE.PointsMaterial({
            size: 2.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.0 // starts invisible on planet
        });

        this.deepSpaceStars = new THREE.Points(starGeo, this.deepSpaceStarMat);
        this.scene.add(this.deepSpaceStars);
    }

    initSunsAndSky() {
        this.sunsGroup = new THREE.Group();
        this.scene.add(this.sunsGroup);

        // Center Grand Sun
        const grandSunGeo = new THREE.SphereGeometry(26, 24, 24);
        const grandSunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
        this.sunCenter = new THREE.Mesh(grandSunGeo, grandSunMat);
        this.sunsGroup.add(this.sunCenter);

        // Corona
        const coronaGeo = new THREE.SphereGeometry(32, 16, 16);
        const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.45 });
        this.sunCenter.add(new THREE.Mesh(coronaGeo, coronaMat));

        // Twin Sun #1
        const twin1Geo = new THREE.SphereGeometry(11, 16, 16);
        const twin1Mat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
        this.sunTwin1 = new THREE.Mesh(twin1Geo, twin1Mat);
        this.sunTwin1.position.set(-42, 16, -10);
        this.sunsGroup.add(this.sunTwin1);

        // Twin Sun #2
        const twin2Geo = new THREE.SphereGeometry(8, 16, 16);
        const twin2Mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        this.sunTwin2 = new THREE.Mesh(twin2Geo, twin2Mat);
        this.sunTwin2.position.set(38, -12, 10);
        this.sunsGroup.add(this.sunTwin2);
    }

    initShip() {
        this.shipGroup = new THREE.Group();
        this.scene.add(this.shipGroup);

        const shadowGeo = new THREE.CircleGeometry(1.6, 16);
        shadowGeo.rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
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
            // Stage 3 & 4 (Boss): Mando's N-1 Starfighter
            this.currentShipMesh = ShipBuilder.createMandalorianN1();
            document.getElementById('ship-name-hud').innerText = stage === 4 ? "N-1 (FASE CHEFÃO)" : "N-1 STARFIGHTER (MANDO)";
        }

        this.shipGroup.add(this.currentShipMesh);
    }

    initParticles() {
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

        window.onSafeZoneEntered = (mode) => {
            const banner = document.getElementById('safe-zone-banner');
            banner.classList.add('visible');
            if (mode === 'boss_space') {
                banner.innerHTML = "⚡ VÁCUO CÓSMICO LIVRE • SEM METEORITOS ⚡<br><small>ACIE O TURBO DE PLASMA NO ESPAÇO PROFUNDO!</small>";
            } else {
                banner.innerHTML = "⚡ PLANÍCIE LIVRE • ÁREA SEGURA ⚡<br><small>SEM OBSTÁCULOS: ACIONE O TURBO DE PLASMA!</small>";
            }
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

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') {
                this.setBoosting(true);
            }
            if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startRun(1);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.code === 'Space') {
                this.setBoosting(false);
            }
        });

        const touchZone = document.getElementById('game-touch-zone');
        touchZone.addEventListener('touchstart', (e) => {
            if (this.state === 'START') {
                this.startRun(1);
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

        // Player Name Input Setup
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.value = this.playerName;
            nameInput.addEventListener('input', (e) => {
                this.playerName = e.target.value.trim();
                localStorage.setItem('bruno_run_player_name', this.playerName);
            });
        }

        // Leaderboard modal listeners
        const btnOpenLeaderboard = document.getElementById('btn-open-leaderboard');
        if (btnOpenLeaderboard) {
            btnOpenLeaderboard.addEventListener('click', () => this.showLeaderboard());
        }

        const btnGameOverRanking = document.getElementById('btn-gameover-ranking');
        if (btnGameOverRanking) {
            btnGameOverRanking.addEventListener('click', () => this.showLeaderboard());
        }

        const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
        if (btnCloseLeaderboard) {
            btnCloseLeaderboard.addEventListener('click', () => {
                document.getElementById('leaderboard-modal').style.display = 'none';
            });
        }

        // Start from beginning
        document.getElementById('btn-start').addEventListener('click', () => this.startRun(1));

        // Direct shortcut to Boss Phase for instant play/testing!
        const btnBoss = document.getElementById('btn-start-boss');
        if (btnBoss) {
            btnBoss.addEventListener('click', () => this.startRun(4));
        }

        // Restart button
        document.getElementById('btn-restart').addEventListener('click', () => this.startRun(1));

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

    startRun(startStage = 1) {
        soundCtrl.init();

        // Read or fallback player name
        const nameInput = document.getElementById('player-name-input');
        if (nameInput && nameInput.value.trim()) {
            this.playerName = nameInput.value.trim();
        } else if (!this.playerName) {
            this.playerName = "Piloto " + Math.floor(100 + Math.random() * 900);
            if (nameInput) nameInput.value = this.playerName;
        }
        localStorage.setItem('bruno_run_player_name', this.playerName);

        this.state = 'PLAYING';
        this.currentStage = startStage;
        this.score = startStage === 4 ? 4500 : 0;
        this.totalDistance = 0;
        this.phaseDistance = 0;
        this.shipPos = { x: 0, y: 2.2, z: 0 };
        this.shipVelocity = { x: 0, y: 0 };
        this.currentSpeed = this.baseSpeeds[startStage];
        this.boostEnergy = 100;
        this.isBoosting = false;
        this.dayTime = 0.15;

        this.obstacleManager.reset();
        this.loadShipStage(startStage);

        if (startStage === 4) {
            this.enterBossPhase();
        } else {
            this.exitBossPhase();
        }

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('safe-zone-banner').classList.remove('visible');

        this.updateUI();
    }

    enterBossPhase() {
        this.isBossPhase = true;
        this.obstacleManager.setMode('boss_space');

        // Hide planetary ground & canyons
        this.ground.visible = false;
        this.canyonLeft.visible = false;
        this.canyonRight.visible = false;
        this.groundGrid.visible = false;
        this.shipShadow.visible = false;
        this.sunsGroup.visible = false;

        // Transition atmosphere to Pitch Black Deep Space with glowing distant stars
        const deepSpaceColor = new THREE.Color(0x02040a);
        this.scene.background = deepSpaceColor;
        this.scene.fog.color = deepSpaceColor;
        this.scene.fog.density = 0.0018; // clearer deep space visibility
        this.deepSpaceStarMat.opacity = 1.0;

        this.ambientLight.intensity = 0.65;
        this.dirLight.color.setHex(0x00e5ff);
        this.dirLight.intensity = 1.1;

        // Expand flight bounds in space
        this.bounds = { minX: -16, maxX: 16, minY: -7, maxY: 7 };
    }

    exitBossPhase() {
        this.isBossPhase = false;
        this.obstacleManager.setMode('planet');

        this.ground.visible = true;
        this.canyonLeft.visible = true;
        this.canyonRight.visible = true;
        this.groundGrid.visible = true;
        this.shipShadow.visible = true;
        this.sunsGroup.visible = true;
        this.deepSpaceStarMat.opacity = 0.0;
        this.scene.fog.density = 0.0038;

        this.bounds = { minX: -14, maxX: 14, minY: 1.2, maxY: 6.8 };
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
            const finalScoreVal = Math.floor(this.score);
            document.getElementById('final-score').innerText = finalScoreVal.toString();
            document.getElementById('best-score-final').innerText = this.highScore.toString();

            let shipAchieved = "Podracer (Anakin)";
            if (this.currentStage === 2) shipAchieved = "Razor Crest";
            if (this.currentStage === 3) shipAchieved = "N-1 Starfighter";
            if (this.currentStage === 4) shipAchieved = "Fase Chefão (Espaço Profundo)";
            document.getElementById('ship-unlocked-info').innerText = `Piloto: ${this.playerName} • Fase: ${shipAchieved}`;

            document.getElementById('game-over-screen').style.display = 'flex';

            // Auto-save to Google Apps Script / Google Sheets Database
            this.saveScoreToDatabase(finalScoreVal, shipAchieved, this.totalDistance);
        }, 800);
    }

    saveScoreToDatabase(score, stageName, distance) {
        const dbStatus = document.getElementById('db-status');
        if (dbStatus) {
            dbStatus.innerText = "⏳ Gravando pontuação no Google Sheets...";
            dbStatus.style.color = "#ffb300";
        }

        // 1. Save to local ranking cache
        try {
            const localList = JSON.parse(localStorage.getItem('bruno_run_ranking') || '[]');
            localList.push({
                player: this.playerName,
                score: score,
                stage: stageName,
                date: new Date().toLocaleDateString('pt-BR')
            });
            localList.sort((a, b) => b.score - a.score);
            localStorage.setItem('bruno_run_ranking', JSON.stringify(localList.slice(0, 15)));
        } catch (e) {}

        // 2. Transmit to Google Apps Script Web App
        const url = `${APPS_SCRIPT_URL}?action=save&player=${encodeURIComponent(this.playerName)}&score=${score}&stage=${encodeURIComponent(stageName)}&distance=${Math.floor(distance)}`;

        fetch(url, { mode: 'no-cors' })
            .then(() => {
                if (dbStatus) {
                    dbStatus.innerText = "✅ Pontuação salva com sucesso no Google Sheets!";
                    dbStatus.style.color = "#81c784";
                }
            })
            .catch(() => {
                if (dbStatus) {
                    dbStatus.innerText = "✅ Pontuação salva no ranking!";
                    dbStatus.style.color = "#81c784";
                }
            });
    }

    showLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        const body = document.getElementById('leaderboard-body');
        modal.style.display = 'flex';
        body.innerHTML = '<tr><td colspan="4" style="color:#00e5ff;">Carregando ranking do Google Sheets...</td></tr>';

        const renderTable = (list) => {
            if (!list || list.length === 0) {
                body.innerHTML = '<tr><td colspan="4" style="color:#90caf9;">Nenhum registro ainda. Jogue para pontuar!</td></tr>';
                return;
            }
            let html = '';
            list.forEach((item, idx) => {
                html += `
                    <tr>
                        <td style="font-weight:900; color:#ffb300;">#${item.rank || idx + 1}</td>
                        <td style="font-weight:700; color:#ffffff;">${item.player}</td>
                        <td style="font-family:monospace; font-weight:900; color:#00e5ff;">${item.score}</td>
                        <td style="color:#90caf9; font-size:11px;">${item.stage || '-'}</td>
                    </tr>
                `;
            });
            body.innerHTML = html;
        };

        // Fetch from Google Apps Script with fallback to localStorage
        fetch(`${APPS_SCRIPT_URL}?action=leaderboard`)
            .then(res => res.json())
            .then(data => {
                if (data && data.leaderboard && data.leaderboard.length > 0) {
                    renderTable(data.leaderboard);
                } else {
                    const local = JSON.parse(localStorage.getItem('bruno_run_ranking') || '[]');
                    renderTable(local);
                }
            })
            .catch(() => {
                const local = JSON.parse(localStorage.getItem('bruno_run_ranking') || '[]');
                renderTable(local);
            });
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
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ size: 4.0, color: 0xff5722, blending: THREE.AdditiveBlending });
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

        if (current >= 4500) {
            targetStage = 4; // FASE CHEFÃO!
        } else if (current >= 2500) {
            targetStage = 3;
        } else if (current >= 1000) {
            targetStage = 2;
        }

        if (targetStage !== this.currentStage) {
            this.loadShipStage(targetStage);
            soundCtrl.playUpgradeSound();

            // SPEED RESET back to cruise speed for the new phase!
            this.phaseDistance = 0;
            this.currentSpeed = this.baseSpeeds[targetStage];

            const banner = document.getElementById('upgrade-banner');

            if (targetStage === 4) {
                // Enter Boss Phase!
                this.enterBossPhase();
                banner.innerHTML = `⚠️ FASE CHEFÃO ATIVADA! ⚠️<br><strong style="color:#ff0055">ESPAÇO PROFUNDO & CAMPO DE METEORITOS!</strong><br><small style="font-size:12px; color:#ffffff;">Velocidade reiniciada: Desvie dos asteroides!</small>`;
            } else {
                const name = targetStage === 2 ? "RAZOR CREST (MANDALORIANO)" : "N-1 STARFIGHTER (MANDO & GROGU)";
                banner.innerHTML = `🚀 NOVA NAVE DESBLOQUEADA!<br><strong style="color:#00ffff">${name}</strong><br><small style="font-size:12px; color:#ffffff;">Velocidade reiniciada: Acelere com a nova nave!</small>`;
            }

            banner.classList.add('visible');
            setTimeout(() => {
                banner.classList.remove('visible');
            }, 3800);
        }
    }

    updateDayNightCycle(delta) {
        if (this.isBossPhase) return; // In Deep Space, no planetary sun cycle

        this.dayTime = (this.dayTime + delta * this.daySpeed) % 1.0;
        const sunAngle = this.dayTime * Math.PI * 2;
        const sunX = Math.cos(sunAngle) * 350;
        const sunY = Math.sin(sunAngle) * 220;
        const sunZ = this.shipPos.z - 420;

        this.sunsGroup.position.set(sunX, sunY, sunZ);

        const t = this.clock.getElapsedTime();
        this.sunTwin1.position.x = Math.cos(t * 0.8) * 44;
        this.sunTwin1.position.y = Math.sin(t * 0.8) * 20;

        this.sunTwin2.position.x = Math.cos(t * 0.6 + Math.PI) * 40;
        this.sunTwin2.position.y = Math.sin(t * 0.6 + Math.PI) * 18;

        let skyColor = new THREE.Color();
        let groundTint = new THREE.Color();
        let lightIntensity = 1.0;

        if (this.dayTime < 0.25) {
            const f = this.dayTime / 0.25;
            skyColor.setRGB(0.85, 0.49, 0.24).lerp(new THREE.Color(0.38, 0.68, 0.95), f);
            groundTint.setRGB(0.77, 0.49, 0.27).lerp(new THREE.Color(0.85, 0.60, 0.35), f);
            lightIntensity = 0.9 + f * 0.4;
        } else if (this.dayTime < 0.50) {
            const f = (this.dayTime - 0.25) / 0.25;
            skyColor.setRGB(0.38, 0.68, 0.95).lerp(new THREE.Color(0.88, 0.42, 0.18), f);
            groundTint.setRGB(0.85, 0.60, 0.35).lerp(new THREE.Color(0.75, 0.38, 0.22), f);
            lightIntensity = 1.3 - f * 0.3;
        } else if (this.dayTime < 0.75) {
            const f = (this.dayTime - 0.50) / 0.25;
            skyColor.setRGB(0.88, 0.42, 0.18).lerp(new THREE.Color(0.06, 0.08, 0.18), f);
            groundTint.setRGB(0.75, 0.38, 0.22).lerp(new THREE.Color(0.20, 0.16, 0.25), f);
            lightIntensity = 1.0 - f * 0.7;
        } else {
            const f = (this.dayTime - 0.75) / 0.25;
            skyColor.setRGB(0.06, 0.08, 0.18).lerp(new THREE.Color(0.85, 0.49, 0.24), f);
            groundTint.setRGB(0.20, 0.16, 0.25).lerp(new THREE.Color(0.77, 0.49, 0.27), f);
            lightIntensity = 0.3 + f * 0.6;
        }

        this.scene.background = skyColor;
        this.scene.fog.color = skyColor;
        this.groundMat.color = groundTint;
        this.dirLight.intensity = lightIntensity;
    }

    update(delta) {
        if (this.state !== 'PLAYING') return;

        // Progressive Speed inside Phase
        const base = this.baseSpeeds[this.currentStage];
        const maxRamp = this.currentStage === 4 ? 32 : (this.currentStage === 3 ? 28 : (this.currentStage === 2 ? 24 : 20));
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
            this.score += delta * 45 * 3.0;
        } else {
            this.boostEnergy = Math.min(100, this.boostEnergy + delta * 15);
            this.score += delta * 26;
        }

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

        const moveSpeed = this.isBossPhase ? 26 : 22;
        this.shipVelocity.x = THREE.MathUtils.lerp(this.shipVelocity.x, inputX * moveSpeed, 0.12);
        this.shipVelocity.y = THREE.MathUtils.lerp(this.shipVelocity.y, inputY * moveSpeed, 0.12);

        this.shipPos.x += this.shipVelocity.x * delta;
        this.shipPos.y += this.shipVelocity.y * delta;
        this.shipPos.z -= travelStep;

        // Clamp
        this.shipPos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.shipPos.x));
        this.shipPos.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.shipPos.y));

        // Update Ship Mesh Position and Banking
        this.shipGroup.position.set(this.shipPos.x, this.shipPos.y, this.shipPos.z);

        const rollTarget = -this.shipVelocity.x * 0.038;
        const pitchTarget = this.shipVelocity.y * 0.024;
        this.shipGroup.rotation.z = THREE.MathUtils.lerp(this.shipGroup.rotation.z, rollTarget, 0.12);
        this.shipGroup.rotation.x = THREE.MathUtils.lerp(this.shipGroup.rotation.x, pitchTarget, 0.12);

        // Update Ground Shadow if on planet
        if (!this.isBossPhase) {
            this.shipShadow.position.set(this.shipPos.x, 0.05, this.shipPos.z);
            const altitudeScale = Math.max(0.6, 1.6 - (this.shipPos.y * 0.12));
            this.shipShadow.scale.set(altitudeScale, altitudeScale, altitudeScale);
            this.shipShadow.material.opacity = Math.max(0.25, 0.65 - (this.shipPos.y * 0.07));

            this.ground.position.z = this.shipPos.z - 300;
            this.canyonLeft.position.z = this.shipPos.z - 300;
            this.canyonRight.position.z = this.shipPos.z - 300;
            this.groundGrid.position.z = this.shipPos.z - 300;
        } else {
            // Keep Deep Space Stars following ship forward
            this.deepSpaceStars.position.z = this.shipPos.z;
        }

        // Camera Follow
        const targetFOV = this.isBoosting ? 82 : 65;
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

        // Day/Night Cycle
        this.updateDayNightCycle(delta);

        // Obstacles & Collision Check
        this.obstacleManager.update(this.shipPos, this.totalDistance);

        const hit = this.obstacleManager.checkCollisions(this.shipPos, 1.2);
        if (hit) {
            this.gameOver();
            return;
        }

        // Particles & Audio
        this.updatePlasmaParticles();
        soundCtrl.updateEngine(this.currentSpeed / base, this.isBoosting);

        // Stage Check
        this.checkStageUpgrade();

        // UI
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
