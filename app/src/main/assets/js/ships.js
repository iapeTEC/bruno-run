// 3D Ship models for Bruno Run
// Ship 1: Anakin's Red Podracer (Score 0 - 999)
// Ship 2: The Mandalorian's Razor Crest (Score 1000 - 2499)
// Ship 3: The Mandalorian's Modified N-1 Starfighter (Score 2500+)

const ShipBuilder = {
    // Shared materials
    materials: {
        anakinRed: new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.3, metalness: 0.6 }),
        anakinYellow: new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.4, metalness: 0.3 }),
        darkMetal: new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5, metalness: 0.8 }),
        chrome: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.1, metalness: 0.95 }),
        cockpitGlass: new THREE.MeshPhysicalMaterial({ color: 0x112233, roughness: 0.1, transmission: 0.9, transparent: true, opacity: 0.8 }),
        energyArc: new THREE.MeshBasicMaterial({ color: 0x7c4dff, wireframe: true }),
        engineGlowCyan: new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
        engineGlowOrange: new THREE.MeshBasicMaterial({ color: 0xff6d00 }),
        engineGlowBlue: new THREE.MeshBasicMaterial({ color: 0x2979ff }),
        beskarSilver: new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.2, metalness: 0.9 })
    },

    // Build Anakin's Red Podracer
    createAnakinPodracer() {
        const ship = new THREE.Group();
        ship.name = "AnakinPodracer";

        const m = this.materials;

        // --- Twin Turbine Engines (Front Left & Right) ---
        const createTurbine = (xOffset) => {
            const engine = new THREE.Group();
            engine.position.set(xOffset, 0, -2.5);

            // Main cylindrical body
            const bodyGeo = new THREE.CylinderGeometry(0.5, 0.55, 3.2, 16);
            bodyGeo.rotateX(Math.PI / 2);
            const body = new THREE.Mesh(bodyGeo, m.anakinRed);
            engine.add(body);

            // Yellow racing stripes
            const stripeGeo = new THREE.CylinderGeometry(0.51, 0.51, 0.4, 16);
            stripeGeo.rotateX(Math.PI / 2);
            const stripe = new THREE.Mesh(stripeGeo, m.anakinYellow);
            stripe.position.z = 0.4;
            engine.add(stripe);

            // Front intake cone
            const intakeGeo = new THREE.ConeGeometry(0.48, 0.8, 16);
            intakeGeo.rotateX(-Math.PI / 2);
            const intake = new THREE.Mesh(intakeGeo, m.darkMetal);
            intake.position.z = -1.7;
            engine.add(intake);

            // Intake stabilizer fins
            for (let i = 0; i < 3; i++) {
                const finGeo = new THREE.BoxGeometry(0.1, 0.6, 0.8);
                const fin = new THREE.Mesh(finGeo, m.anakinYellow);
                fin.rotation.z = (i * Math.PI * 2) / 3;
                fin.position.z = -1.2;
                engine.add(fin);
            }

            // Rear exhaust nozzle
            const nozzleGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.6, 16);
            nozzleGeo.rotateX(Math.PI / 2);
            const nozzle = new THREE.Mesh(nozzleGeo, m.darkMetal);
            nozzle.position.z = 1.7;
            engine.add(nozzle);

            // Thruster glow
            const glowGeo = new THREE.SphereGeometry(0.35, 12, 12);
            const glow = new THREE.Mesh(glowGeo, m.engineGlowOrange);
            glow.position.z = 1.9;
            glow.name = "thrusterGlow";
            engine.add(glow);

            return engine;
        };

        const leftTurbine = createTurbine(-1.8);
        const rightTurbine = createTurbine(1.8);
        ship.add(leftTurbine);
        ship.add(rightTurbine);

        // Purple Energy Beam / Arc between engines
        const energyGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8);
        energyGeo.rotateZ(Math.PI / 2);
        const energyBeam = new THREE.Mesh(energyGeo, m.energyArc);
        energyBeam.position.set(0, 0, -2.5);
        energyBeam.name = "energyBeam";
        ship.add(energyBeam);

        // Energy binder rings
        const ringGeo = new THREE.TorusGeometry(0.55, 0.05, 8, 16);
        const leftRing = new THREE.Mesh(ringGeo, m.energyArc);
        leftRing.position.set(-1.8, 0, -2.5);
        const rightRing = new THREE.Mesh(ringGeo, m.energyArc);
        rightRing.position.set(1.8, 0, -2.5);
        ship.add(leftRing);
        ship.add(rightRing);

        // --- Cockpit Pod (Trailing Behind) ---
        const pod = new THREE.Group();
        pod.position.set(0, 0.2, 2.4);

        // Pod Body
        const podGeo = new THREE.ConeGeometry(0.7, 2.2, 12);
        podGeo.rotateX(Math.PI / 2);
        const podMesh = new THREE.Mesh(podGeo, m.anakinRed);
        pod.add(podMesh);

        // Cockpit canopy / windshield
        const canopyGeo = new THREE.SphereGeometry(0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const canopy = new THREE.Mesh(canopyGeo, m.cockpitGlass);
        canopy.position.set(0, 0.25, 0.1);
        canopy.scale.set(0.9, 0.6, 1.4);
        pod.add(canopy);

        // Pilot helmet silhouette
        const pilotGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const pilot = new THREE.Mesh(pilotGeo, m.darkMetal);
        pilot.position.set(0, 0.2, 0.1);
        pod.add(pilot);

        // Pod rear stabilizer fins
        const finLeftGeo = new THREE.BoxGeometry(0.7, 0.08, 0.6);
        const finLeft = new THREE.Mesh(finLeftGeo, m.anakinYellow);
        finLeft.position.set(-0.6, -0.1, 0.6);
        finLeft.rotation.z = -0.3;
        pod.add(finLeft);

        const finRightGeo = new THREE.BoxGeometry(0.7, 0.08, 0.6);
        const finRight = new THREE.Mesh(finRightGeo, m.anakinYellow);
        finRight.position.set(0.6, -0.1, 0.6);
        finRight.rotation.z = 0.3;
        pod.add(finRight);

        ship.add(pod);

        // Control Cables connecting turbines to cockpit
        const cableMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
        const createCable = (fromX) => {
            const points = [
                new THREE.Vector3(fromX, 0, -1.0),
                new THREE.Vector3(fromX * 0.5, 0.1, 0.6),
                new THREE.Vector3(fromX * 0.2, 0.2, 1.8)
            ];
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.03, 6, false);
            return new THREE.Mesh(tubeGeo, m.darkMetal);
        };
        ship.add(createCable(-1.7));
        ship.add(createCable(1.7));

        ship.scale.set(0.85, 0.85, 0.85);
        return ship;
    },

    // Build The Mandalorian's Razor Crest
    createRazorCrest() {
        const ship = new THREE.Group();
        ship.name = "RazorCrest";
        const m = this.materials;

        // Main Hull (Bulky gunship body)
        const hullGeo = new THREE.BoxGeometry(1.6, 1.1, 3.8);
        const hull = new THREE.Mesh(hullGeo, m.beskarSilver);
        hull.position.set(0, 0, 0);
        ship.add(hull);

        // Angled cockpit nose
        const noseGeo = new THREE.CylinderGeometry(0.3, 0.8, 1.5, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, m.beskarSilver);
        nose.position.set(0, -0.05, -2.4);
        nose.scale.set(1.4, 0.9, 1);
        ship.add(nose);

        // Cockpit canopy windows
        const winGeo = new THREE.BoxGeometry(0.9, 0.5, 0.7);
        const win = new THREE.Mesh(winGeo, m.cockpitGlass);
        win.position.set(0, 0.3, -2.1);
        ship.add(win);

        // Twin chin blaster cannons
        const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
        cannonGeo.rotateX(Math.PI / 2);
        const leftCannon = new THREE.Mesh(cannonGeo, m.darkMetal);
        leftCannon.position.set(-0.55, -0.4, -2.5);
        const rightCannon = new THREE.Mesh(cannonGeo, m.darkMetal);
        rightCannon.position.set(0.55, -0.4, -2.5);
        ship.add(leftCannon);
        ship.add(rightCannon);

        // Stubby Wings
        const wingGeo = new THREE.BoxGeometry(4.2, 0.18, 1.4);
        const wings = new THREE.Mesh(wingGeo, m.beskarSilver);
        wings.position.set(0, 0.4, -0.2);
        ship.add(wings);

        // Massive Twin Cylindrical Engines mounted on wings
        const createCrestEngine = (xPos) => {
            const engGroup = new THREE.Group();
            engGroup.position.set(xPos, 0.7, -0.2);

            // Engine nacelle
            const nacelleGeo = new THREE.CylinderGeometry(0.65, 0.65, 3.2, 16);
            nacelleGeo.rotateX(Math.PI / 2);
            const nacelle = new THREE.Mesh(nacelleGeo, m.beskarSilver);
            engGroup.add(nacelle);

            // Front intake ring
            const intakeGeo = new THREE.TorusGeometry(0.6, 0.08, 8, 16);
            const intake = new THREE.Mesh(intakeGeo, m.darkMetal);
            intake.position.z = -1.6;
            engGroup.add(intake);

            // Exhaust nozzle
            const exhaustGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.5, 16);
            exhaustGeo.rotateX(Math.PI / 2);
            const exhaust = new THREE.Mesh(exhaustGeo, m.darkMetal);
            exhaust.position.z = 1.7;
            engGroup.add(exhaust);

            // Glow
            const glowGeo = new THREE.SphereGeometry(0.42, 12, 12);
            const glow = new THREE.Mesh(glowGeo, m.engineGlowOrange);
            glow.position.z = 1.85;
            glow.name = "thrusterGlow";
            engGroup.add(glow);

            return engGroup;
        };

        ship.add(createCrestEngine(-1.9));
        ship.add(createCrestEngine(1.9));

        // Rear loading ramp silhouette
        const rampGeo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
        const ramp = new THREE.Mesh(rampGeo, m.darkMetal);
        ramp.position.set(0, -0.1, 1.9);
        ship.add(ramp);

        ship.scale.set(0.85, 0.85, 0.85);
        return ship;
    },

    // Build The Mandalorian's Modified Naboo N-1 Starfighter
    createMandalorianN1() {
        const ship = new THREE.Group();
        ship.name = "MandoN1";
        const m = this.materials;

        // Long sleek main fuselage (Polished Chrome / Beskar)
        const fuseGeo = new THREE.ConeGeometry(0.5, 5.0, 16);
        fuseGeo.rotateX(Math.PI / 2);
        const fuse = new THREE.Mesh(fuseGeo, m.chrome);
        fuse.position.set(0, 0, -0.2);
        ship.add(fuse);

        // Yellow racing decals / exposed turbinic intake covers
        const stripeGeo = new THREE.CylinderGeometry(0.42, 0.48, 1.0, 16);
        stripeGeo.rotateX(Math.PI / 2);
        const stripe = new THREE.Mesh(stripeGeo, m.anakinYellow);
        stripe.position.set(0, 0.02, -0.8);
        ship.add(stripe);

        // Sharp needle tail fin
        const tailGeo = new THREE.ConeGeometry(0.12, 2.2, 8);
        tailGeo.rotateX(-Math.PI / 2);
        const tail = new THREE.Mesh(tailGeo, m.chrome);
        tail.position.set(0, 0, 2.6);
        ship.add(tail);

        // Cockpit canopy (Pilot bubble)
        const canopyGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const canopy = new THREE.Mesh(canopyGeo, m.cockpitGlass);
        canopy.position.set(0, 0.28, 0.2);
        canopy.scale.set(0.8, 0.6, 1.3);
        ship.add(canopy);

        // Mandalorian helmet inside
        const helmetGeo = new THREE.SphereGeometry(0.16, 8, 8);
        const helmet = new THREE.Mesh(helmetGeo, m.beskarSilver);
        helmet.position.set(0, 0.25, 0.2);
        ship.add(helmet);

        // Grogu / Droid dome behind cockpit!
        const groguDomeGeo = new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const groguDome = new THREE.Mesh(groguDomeGeo, m.cockpitGlass);
        groguDome.position.set(0, 0.22, 1.1);
        ship.add(groguDome);

        // Tiny green Grogu inside dome
        const groguGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const groguMat = new THREE.MeshStandardMaterial({ color: 0x81c784 });
        const grogu = new THREE.Mesh(groguGeo, groguMat);
        grogu.position.set(0, 0.22, 1.1);
        ship.add(grogu);

        // Swept delta wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(2.4, -0.6);
        wingShape.lineTo(2.2, -1.2);
        wingShape.lineTo(0, -0.8);
        wingShape.closePath();

        const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
        wingGeo.rotateX(Math.PI / 2);

        const leftWing = new THREE.Mesh(wingGeo, m.chrome);
        leftWing.position.set(0, 0, 0.4);
        ship.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, m.chrome);
        rightWing.scale.set(-1, 1, 1);
        rightWing.position.set(0, 0, 0.4);
        ship.add(rightWing);

        // Wingtip Engines (Twin Turbinic pods)
        const createN1Engine = (xPos) => {
            const eng = new THREE.Group();
            eng.position.set(xPos, -0.05, -0.4);

            // Engine torpedo fuselage
            const bodyGeo = new THREE.CylinderGeometry(0.24, 0.28, 2.6, 12);
            bodyGeo.rotateX(Math.PI / 2);
            const body = new THREE.Mesh(bodyGeo, m.chrome);
            eng.add(body);

            // Exposed turbinic yellow intake
            const intakeGeo = new THREE.ConeGeometry(0.24, 0.6, 12);
            intakeGeo.rotateX(-Math.PI / 2);
            const intake = new THREE.Mesh(intakeGeo, m.anakinYellow);
            intake.position.z = -1.5;
            eng.add(intake);

            // Engine pointed needle tail
            const needleGeo = new THREE.ConeGeometry(0.08, 1.2, 8);
            needleGeo.rotateX(-Math.PI / 2);
            const needle = new THREE.Mesh(needleGeo, m.darkMetal);
            needle.position.z = 1.6;
            eng.add(needle);

            // High-velocity cyan thruster glow
            const glowGeo = new THREE.SphereGeometry(0.22, 12, 12);
            const glow = new THREE.Mesh(glowGeo, m.engineGlowCyan);
            glow.position.z = 1.3;
            glow.name = "thrusterGlow";
            eng.add(glow);

            return eng;
        };

        ship.add(createN1Engine(-2.3));
        ship.add(createN1Engine(2.3));

        ship.scale.set(0.9, 0.9, 0.9);
        return ship;
    }
};

window.ShipBuilder = ShipBuilder;
