import * as THREE from 'three';

export class Pheasant {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.originalPosition = position.clone();
        
        // Flight properties
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.isFlying = false;
        this.isHidden = true; // Start hidden in grass
        this.isShot = false;
        this.isDead = false;
        
        // Flight behavior
        this.flightSpeed = 5; // Further reduced for much easier shooting
        this.flightHeight = 8 + Math.random() * 5;
        this.flightDirection = new THREE.Vector3();
        this.flightTime = 0;
        this.maxFlightTime = 8 + Math.random() * 4; // Fly for 8-12 seconds
        
        // Animation
        this.wingCycle = 0;
        this.wingSpeed = 15; // Fast wing beats
        
        // Detection
        this.flushDistance = 4.0; // How close dog needs to get (increased for easier encounters)
        this.hasBeenFlushed = false;
        
        // Mesh
        this.mesh = null;
        // Model will be created when spawned
    }
    
    createPheasantModel() {
        const pheasantGroup = new THREE.Group();
        
        // Body (main torso)
        const bodyGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513 // Brown body
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2; // Horizontal
        pheasantGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.12, 8, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321 // Darker brown head
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.4, 0.1, 0);
        pheasantGroup.add(head);
        
        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
        const beakMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFA500 // Orange beak
        });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.5, 0.1, 0);
        pheasantGroup.add(beak);
        
        // Wings (will animate)
        const wingGeometry = new THREE.SphereGeometry(0.25, 6, 4);
        const wingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.scale.set(1.2, 0.3, 0.8);
        leftWing.position.set(0, 0.1, 0.2);
        pheasantGroup.add(leftWing);
        pheasantGroup.leftWing = leftWing; // Store reference
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.scale.set(1.2, 0.3, 0.8);
        rightWing.position.set(0, 0.1, -0.2);
        pheasantGroup.add(rightWing);
        pheasantGroup.rightWing = rightWing; // Store reference
        
        // Tail feathers (distinctive pheasant feature)
        const tailGeometry = new THREE.ConeGeometry(0.05, 0.8, 6);
        const tailMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 // Green tail
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.rotation.z = Math.PI / 2;
        tail.position.set(-0.5, 0.15, 0);
        pheasantGroup.add(tail);
        
        // Legs (when on ground)
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4);
        const legMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFA500 // Orange legs
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.1, -0.25, 0.08);
        pheasantGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.1, -0.25, -0.08);
        pheasantGroup.add(rightLeg);
        
        // Add shadows
        pheasantGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Start visible but small, hiding in corn/grass
        pheasantGroup.scale.setScalar(0.8); // Smaller but visible
        pheasantGroup.visible = true;
        
        this.mesh = pheasantGroup;
        this.scene.add(this.mesh);
        
        console.log('Pheasant created at position:', this.position);
    }
    
    update(deltaTime, dog, terrainSystem, player) {
        if (this.isDead) return;
        
        // Debug: Log player position occasionally for first pheasant
        if (!this.lastPlayerDebug) this.lastPlayerDebug = 0;
        this.lastPlayerDebug += deltaTime;
        if (this.lastPlayerDebug > 10) { // Every 10 seconds
            if (player) {
                console.log(`Player position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)})`);
                console.log(`This pheasant position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)})`);
            } else {
                console.log('Player is null in pheasant update');
            }
            this.lastPlayerDebug = 0;
        }
        
        // Check if dog is close enough to flush
        if (!this.hasBeenFlushed && !this.isFlying && dog) {
            const distanceToDog = this.position.distanceTo(dog.position);
            
            if (distanceToDog < this.flushDistance && dog.state === 'search') {
                console.log(`Dog flushing pheasant! Distance: ${distanceToDog.toFixed(2)}, Dog state: ${dog.state}`);
                this.flush();
            }
        }
        
        // Check if player is close enough to flush
        if (!this.hasBeenFlushed && !this.isFlying && player) {
            const distanceToPlayer = this.position.distanceTo(player.position);
            
            // Debug every few seconds for close encounters
            if (distanceToPlayer < this.flushDistance * 2) {
                console.log(`Pheasant near player: distance=${distanceToPlayer.toFixed(2)}, flushDistance=${this.flushDistance}, hasBeenFlushed=${this.hasBeenFlushed}, isFlying=${this.isFlying}`);
            }
            
            if (distanceToPlayer < this.flushDistance * 1.5) { // Player needs to be closer than dog
                console.log(`Player flushing pheasant! Distance: ${distanceToPlayer.toFixed(2)}`);
                this.flush();
            }
        }
        
        if (this.isFlying) {
            this.updateFlight(deltaTime);
            this.updateWingAnimation(deltaTime);
        }
        
        // Keep on terrain when not flying
        if (!this.isFlying && terrainSystem) {
            const terrainHeight = terrainSystem.getHeightAt(this.position.x, this.position.z);
            this.position.y = terrainHeight + 0.3; // Slightly above ground
        }
        
        this.updateMesh();
    }
    
    flush() {
        console.log('Pheasant flushed!');
        this.hasBeenFlushed = true;
        this.isFlying = true;
        this.isHidden = false;
        
        // Play flush sound
        this.playFlushSound();
        
        // Make visible and scale up quickly
        if (this.mesh) {
            this.mesh.visible = true;
            this.mesh.scale.setScalar(1.2); // Make slightly larger when flying
        }
        
        // Set random flight direction (mostly away from dog)
        const angle = Math.random() * Math.PI * 2;
        this.flightDirection.set(
            Math.cos(angle),
            0.5 + Math.random() * 0.3, // Upward component
            Math.sin(angle)
        ).normalize();
        
        // Initial upward velocity for dramatic flush
        this.velocity.copy(this.flightDirection).multiplyScalar(this.flightSpeed);
        this.velocity.y = 4; // Further reduced from 6 for easier tracking
        
        // Set rotation to face flight direction
        this.rotation.y = Math.atan2(this.flightDirection.x, this.flightDirection.z);
    }
    
    updateFlight(deltaTime) {
        this.flightTime += deltaTime;
        
        // Apply flight physics
        this.velocity.y -= 1 * deltaTime; // Even gentler gravity for easier shooting
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Adjust flight direction over time (realistic bird behavior)
        if (this.flightTime > 2) {
            // After initial burst, level out flight
            this.velocity.y = Math.max(this.velocity.y, -2);
            
            // Gradually reduce speed (less reduction for more consistent shooting)
            const speedReduction = 0.995;
            this.velocity.multiplyScalar(speedReduction);
        }
        
        // Update rotation to match flight direction
        if (this.velocity.length() > 0.1) {
            const direction = this.velocity.clone().normalize();
            this.rotation.y = Math.atan2(direction.x, direction.z);
            this.rotation.x = -Math.asin(direction.y) * 0.5; // Subtle pitch
        }
        
        // Land or disappear after flight time
        if (this.flightTime > this.maxFlightTime || this.position.y < 1) {
            this.land();
        }
        
        // Remove if too far away
        if (this.position.length() > 200) {
            this.dispose();
        }
    }
    
    updateWingAnimation(deltaTime) {
        if (!this.mesh || !this.isFlying) return;
        
        this.wingCycle += deltaTime * this.wingSpeed;
        
        const wingFlap = Math.sin(this.wingCycle) * 0.6;
        
        if (this.mesh.leftWing && this.mesh.rightWing) {
            this.mesh.leftWing.rotation.z = wingFlap;
            this.mesh.rightWing.rotation.z = -wingFlap;
        }
    }
    
    land() {
        this.isFlying = false;
        this.flightTime = 0;
        this.velocity.set(0, 0, 0);
        
        // Find safe landing spot
        this.position.y = Math.max(this.position.y, 1);
        
        console.log('Pheasant landed at:', this.position);
    }
    
    shoot() {
        if (this.isShot || this.isDead) {
            console.log('Pheasant already shot or dead, cannot shoot again');
            return false;
        }
        
        console.log('Pheasant shot!');
        this.isShot = true;
        this.isFlying = false;
        console.log(`Pheasant status after shot: isShot=${this.isShot}, isFlying=${this.isFlying}, isDead=${this.isDead}`);
        
        // Stop wing animation
        if (this.mesh && this.mesh.leftWing && this.mesh.rightWing) {
            this.mesh.leftWing.rotation.z = 0;
            this.mesh.rightWing.rotation.z = 0;
        }
        
        // Add falling physics
        this.velocity.set(
            (Math.random() - 0.5) * 5,
            -2,
            (Math.random() - 0.5) * 5
        );
        
        return true; // Hit confirmed
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
    }
    
    playFlushSound() {
        // Create a bird flush sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Create a rapid flutter sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not available');
        }
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    isAvailableForRetrieval() {
        return this.isShot && !this.isFlying && !this.isDead;
    }
    
    retrieve() {
        this.isDead = true;
        if (this.mesh) {
            this.mesh.visible = false;
        }
        console.log('Pheasant retrieved');
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
        this.isDead = true;
    }
}

export class PheasantSystem {
    constructor(scene, terrainSystem) {
        this.scene = scene;
        this.terrainSystem = terrainSystem;
        this.pheasants = [];
        
        // Spawn settings  
        this.maxPheasants = 25; // Increased for ~5 per corn field + scattered ones
        this.spawnRadius = 50;
        this.minSpawnDistance = 10;
        this.respawnTime = 30; // seconds
        this.lastSpawn = 0;
    }
    
    async init() {
        console.log('Initializing pheasant system...');
        // Don't spawn pheasants immediately - wait for scene to be fully ready
        console.log('Pheasant system initialized (spawning deferred)');
    }
    
    // Call this after all systems are initialized
    async spawnPheasants() {
        console.log('Spawning initial pheasants...');
        await this.spawnInitialPheasants();
        console.log('Initial pheasants spawned');
    }
    
    async spawnInitialPheasants() {
        const cornFields = this.terrainSystem.cornFields;
        const pheasantsPerField = 5;
        const scatteredPheasants = 5;
        
        // Spawn 5 pheasants in each corn field
        for (let fieldIndex = 0; fieldIndex < cornFields.length; fieldIndex++) {
            console.log(`Spawning ${pheasantsPerField} pheasants in corn field ${fieldIndex + 1}`);
            for (let i = 0; i < pheasantsPerField; i++) {
                this.spawnPheasantInCornField(fieldIndex);
            }
        }
        
        // Spawn some scattered pheasants outside corn fields
        console.log(`Spawning ${scatteredPheasants} scattered pheasants`);
        for (let i = 0; i < scatteredPheasants; i++) {
            this.spawnPheasantInTallGrass();
        }
        
        console.log(`Total pheasants spawned: ${this.pheasants.length}`);
    }
    
    spawnPheasantInCornField(fieldIndex) {
        const cornFields = this.terrainSystem.cornFields;
        if (fieldIndex >= cornFields.length) return;
        
        const field = cornFields[fieldIndex];
        
        // Generate random position within the specific corn field
        const x = field.minX + Math.random() * (field.maxX - field.minX);
        const z = field.minZ + Math.random() * (field.maxZ - field.minZ);
        const terrainHeight = this.terrainSystem.getHeightAt(x, z);
        
        const position = new THREE.Vector3(x, terrainHeight + 0.3, z);
        
        // Create pheasant
        const pheasant = new Pheasant(this.scene, position);
        pheasant.createPheasantModel();
        this.pheasants.push(pheasant);
        
        console.log(`Pheasant spawned in corn field ${fieldIndex + 1} at:`, position);
        console.log(`Pheasant status: flying=${this.pheasants[this.pheasants.length-1].isFlying}, flushed=${this.pheasants[this.pheasants.length-1].hasBeenFlushed}`);
    }
    
    spawnPheasantInTallGrass() {
        // Spawn in tall grass around player (scattered)
        const angle = Math.random() * Math.PI * 2;
        const distance = this.minSpawnDistance + Math.random() * (this.spawnRadius - this.minSpawnDistance);
        
        const position = new THREE.Vector3(
            Math.cos(angle) * distance,
            0.3, // Just above ground
            Math.sin(angle) * distance
        );
        
        // Adjust to terrain height
        const terrainHeight = this.terrainSystem.getHeightAt(position.x, position.z);
        position.y = terrainHeight + 0.3;
        
        // Create pheasant
        const pheasant = new Pheasant(this.scene, position);
        pheasant.createPheasantModel();
        this.pheasants.push(pheasant);
        
        console.log(`Scattered pheasant spawned at:`, position);
        console.log(`Scattered pheasant status: flying=${this.pheasants[this.pheasants.length-1].isFlying}, flushed=${this.pheasants[this.pheasants.length-1].hasBeenFlushed}`);
    }
    
    spawnPheasant() {
        let position;
        
        // 80% chance to spawn in corn fields, 20% in tall grass
        if (Math.random() < 0.8 && this.terrainSystem.cornFields.length > 0) {
            // Spawn in corn field
            position = this.terrainSystem.getRandomCornFieldPosition();
            console.log(`Spawning pheasant in corn field at:`, position);
        } else {
            // Spawn in tall grass (original behavior)
            let attempts = 0;
            
            do {
                const angle = Math.random() * Math.PI * 2;
                const distance = this.minSpawnDistance + Math.random() * (this.spawnRadius - this.minSpawnDistance);
                
                position = new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                );
                
                // Get terrain height
                if (this.terrainSystem) {
                    position.y = this.terrainSystem.getHeightAt(position.x, position.z) + 0.3;
                }
                
                attempts++;
            } while (attempts < 10 && this.isTooCloseToOtherPheasants(position));
            
            console.log(`Spawning pheasant in tall grass at:`, position);
        }
        
        const pheasant = new Pheasant(this.scene, position);
        pheasant.createPheasantModel(); // Create model after construction
        this.pheasants.push(pheasant);
        
        console.log(`Spawned pheasant ${this.pheasants.length} at:`, position);
    }
    
    isTooCloseToOtherPheasants(position) {
        const minDistance = 5;
        return this.pheasants.some(pheasant => 
            !pheasant.isDead && pheasant.position.distanceTo(position) < minDistance
        );
    }
    
    update(deltaTime, dog, player) {
        // Update all pheasants
        let alivePheasants = 0;
        this.pheasants.forEach(pheasant => {
            if (!pheasant.isDead) {
                alivePheasants++;
                pheasant.update(deltaTime, dog, this.terrainSystem, player);
            }
        });
        
        // Debug: Log pheasant count every 5 seconds
        if (!this.lastDebugTime) this.lastDebugTime = 0;
        this.lastDebugTime += deltaTime;
        if (this.lastDebugTime > 5) {
            console.log(`PheasantSystem: ${alivePheasants} alive pheasants, ${this.pheasants.length} total`);
            // Also log details about first few pheasants
            for (let i = 0; i < Math.min(3, this.pheasants.length); i++) {
                const p = this.pheasants[i];
                console.log(`  Pheasant ${i}: isDead=${p.isDead}, hasBeenFlushed=${p.hasBeenFlushed}, isFlying=${p.isFlying}, position=(${p.position.x.toFixed(1)}, ${p.position.y.toFixed(1)}, ${p.position.z.toFixed(1)})`);
            }
            this.lastDebugTime = 0;
        }
        
        // Remove dead pheasants
        this.pheasants = this.pheasants.filter(pheasant => {
            if (pheasant.isDead) {
                pheasant.dispose();
                return false;
            }
            return true;
        });
        
        // Spawn new pheasants periodically
        this.lastSpawn += deltaTime;
        if (this.lastSpawn > this.respawnTime && this.pheasants.length < this.maxPheasants) {
            this.spawnPheasant();
            this.lastSpawn = 0;
        }
    }
    
    // Get pheasant for shooting raycast
    getPheasantAt(position, radius = 1) {
        return this.pheasants.find(pheasant => 
            pheasant.isFlying && 
            !pheasant.isShot && 
            pheasant.position.distanceTo(position) < radius
        );
    }
    
    // Get shot pheasants for dog retrieval
    getShotPheasants() {
        const shotPheasants = this.pheasants.filter(pheasant => pheasant.isAvailableForRetrieval());
        console.log(`getShotPheasants: Found ${shotPheasants.length} shot pheasants out of ${this.pheasants.length} total`);
        
        // Debug: Show status of all pheasants
        this.pheasants.forEach((pheasant, index) => {
            console.log(`Pheasant ${index}: isShot=${pheasant.isShot}, isFlying=${pheasant.isFlying}, isDead=${pheasant.isDead}`);
        });
        
        return shotPheasants;
    }
    
    dispose() {
        this.pheasants.forEach(pheasant => pheasant.dispose());
        this.pheasants = [];
    }
}
