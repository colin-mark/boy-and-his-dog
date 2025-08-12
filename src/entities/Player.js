import * as THREE from 'three';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Player object
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Movement settings
        this.walkSpeed = 5;
        this.runSpeed = 8;
        this.crouchSpeed = 2;
        // Jump removed - spacebar now used for shooting
        this.gravity = -25;
        
        // Player state
        this.isOnGround = true;
        this.isRunning = false;
        this.isCrouching = false;
        this.health = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        
        // Smooth terrain following
        this.targetY = 0;
        this.terrainSmoothness = 0.08; // Reduced for less jittery movement
        
        // Walking animation
        this.walkCycle = 0;
        this.isMoving = false;
        
        // Ammo system
        this.maxAmmo = 5;
        this.currentAmmo = 5;
        this.isReloading = false;
        this.reloadTime = 2.0; // 2 seconds to reload
        this.reloadTimer = 0;
        
        // Bullet visuals
        this.bullets = [];
        this.bulletSpeed = 100;
        this.bulletLifetime = 2.0; // 2 seconds
        
        // Input reference (will be set by game)
        this.input = null;
        
        // Temporary vectors for calculations
        this.tempVector = new THREE.Vector3();
        this.tempQuaternion = new THREE.Quaternion();
    }
    
    async init() {
        console.log('Initializing player...');
        
        // Create a detailed hunter character
        this.mesh = this.createHunterModel();
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        
        // Rotation is handled in updateMesh() method
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Get input reference from the game
        // This is a bit of a hack - in a better architecture, this would be injected
        this.input = window.game?.input;
        
        // Initialize ammo display
        this.updateAmmoDisplay();
        
        console.log('Player initialized');
    }
    
    createHunterModel() {
        // Create a group to hold all parts of the hunter
        const hunterGroup = new THREE.Group();
        
        // Materials
        const tanMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Tan overalls
        const orangeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 }); // Hunter orange
        const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 }); // Skin tone
        const brownMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown boots
        const darkTanMaterial = new THREE.MeshLambertMaterial({ color: 0xB8A082 }); // Darker tan for sleeves
        
        // Head - more realistic proportions
        const headGeometry = new THREE.SphereGeometry(0.12, 12, 12);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.set(0, 1.68, 0);
        head.scale.set(1, 1.1, 0.9); // Slightly elongated
        hunterGroup.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 6);
        const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const eyePupilMaterial = new THREE.MeshLambertMaterial({ color: 0x4A90E2 }); // Blue eyes
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        leftEye.position.set(-0.05, 1.7, 0.095);
        hunterGroup.add(leftEye);
        
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), eyePupilMaterial);
        leftPupil.position.set(-0.05, 1.7, 0.105);
        hunterGroup.add(leftPupil);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        rightEye.position.set(0.05, 1.7, 0.095);
        hunterGroup.add(rightEye);
        
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), eyePupilMaterial);
        rightPupil.position.set(0.05, 1.7, 0.105);
        hunterGroup.add(rightPupil);
        
        // Nose
        const noseGeometry = new THREE.SphereGeometry(0.015, 6, 4);
        const nose = new THREE.Mesh(noseGeometry, skinMaterial);
        nose.position.set(0, 1.65, 0.1);
        nose.scale.set(0.8, 0.6, 1.2);
        hunterGroup.add(nose);
        
        // Mouth
        const mouthGeometry = new THREE.CapsuleGeometry(0.01, 0.06, 4, 6);
        const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0xCC6666 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.rotation.z = Math.PI / 2;
        mouth.position.set(0, 1.62, 0.095);
        hunterGroup.add(mouth);
        
        // Eyebrows
        const eyebrowGeometry = new THREE.CapsuleGeometry(0.008, 0.05, 4, 4);
        const eyebrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
        
        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        leftEyebrow.rotation.z = Math.PI / 2;
        leftEyebrow.position.set(-0.05, 1.73, 0.1);
        hunterGroup.add(leftEyebrow);
        
        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        rightEyebrow.rotation.z = Math.PI / 2;
        rightEyebrow.position.set(0.05, 1.73, 0.1);
        hunterGroup.add(rightEyebrow);
        
        // Neck
        const neckGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8);
        const neck = new THREE.Mesh(neckGeometry, skinMaterial);
        neck.position.set(0, 1.57, 0);
        hunterGroup.add(neck);
        
        // Orange hunting hat
        const hatGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12);
        const hat = new THREE.Mesh(hatGeometry, orangeMaterial);
        hat.position.set(0, 1.76, 0);
        hunterGroup.add(hat);
        
        // Hat brim
        const brimGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.015, 12);
        const brim = new THREE.Mesh(brimGeometry, orangeMaterial);
        brim.position.set(0, 1.71, 0);
        hunterGroup.add(brim);
        
        // Torso - more realistic chest shape with wider shoulders
        const torsoGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.65, 12);
        const torso = new THREE.Mesh(torsoGeometry, tanMaterial);
        torso.position.set(0, 1.2, 0);
        hunterGroup.add(torso);
        
        // Orange hunting vest (over the overalls) - better fit
        const vestGeometry = new THREE.CylinderGeometry(0.2, 0.24, 0.5, 12);
        const vest = new THREE.Mesh(vestGeometry, orangeMaterial);
        vest.position.set(0, 1.25, 0);
        hunterGroup.add(vest);
        
        // Simple straight arms - just clean cylinders hanging down
        const armGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
        
        // Left arm - straight down
        const leftArm = new THREE.Mesh(armGeometry, darkTanMaterial);
        leftArm.position.set(-0.3, 1.1, 0);
        hunterGroup.add(leftArm);
        
        // Right arm - straight down  
        const rightArm = new THREE.Mesh(armGeometry, darkTanMaterial);
        rightArm.position.set(0.3, 1.1, 0);
        hunterGroup.add(rightArm);
        
        // Simple hands
        const handGeometry = new THREE.SphereGeometry(0.04, 6, 6);
        
        const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
        leftHand.position.set(-0.3, 0.75, 0);
        hunterGroup.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
        rightHand.position.set(0.3, 0.75, 0);
        hunterGroup.add(rightHand);
        
        // Store references for animation
        hunterGroup.leftArm = leftArm;
        hunterGroup.rightArm = rightArm;
        hunterGroup.leftHand = leftHand;
        hunterGroup.rightHand = rightHand;
        
        // Waist/belt area
        const waistGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12);
        const waist = new THREE.Mesh(waistGeometry, brownMaterial);
        waist.position.set(0, 0.88, 0);
        hunterGroup.add(waist);
        
        // Smooth thighs using capsule geometry
        const leftThighGeometry = new THREE.CapsuleGeometry(0.08, 0.32, 4, 8);
        const leftThigh = new THREE.Mesh(leftThighGeometry, tanMaterial);
        leftThigh.position.set(-0.12, 0.66, 0);
        hunterGroup.add(leftThigh);
        
        const rightThighGeometry = new THREE.CapsuleGeometry(0.08, 0.32, 4, 8);
        const rightThigh = new THREE.Mesh(rightThighGeometry, tanMaterial);
        rightThigh.position.set(0.12, 0.66, 0);
        hunterGroup.add(rightThigh);
        
        // Smooth calves/shins using capsule geometry
        const leftCalfGeometry = new THREE.CapsuleGeometry(0.06, 0.28, 4, 8);
        const leftCalf = new THREE.Mesh(leftCalfGeometry, tanMaterial);
        leftCalf.position.set(-0.12, 0.24, 0);
        hunterGroup.add(leftCalf);
        
        const rightCalfGeometry = new THREE.CapsuleGeometry(0.06, 0.28, 4, 8);
        const rightCalf = new THREE.Mesh(rightCalfGeometry, tanMaterial);
        rightCalf.position.set(0.12, 0.24, 0);
        hunterGroup.add(rightCalf);
        
        // Store leg references for animation
        hunterGroup.leftThigh = leftThigh;
        hunterGroup.rightThigh = rightThigh;
        hunterGroup.leftCalf = leftCalf;
        hunterGroup.rightCalf = rightCalf;
        
        // Boots - more realistic shape
        const bootGeometry = new THREE.BoxGeometry(0.16, 0.12, 0.28);
        
        const leftBoot = new THREE.Mesh(bootGeometry, brownMaterial);
        leftBoot.position.set(-0.12, 0.06, 0.04);
        leftBoot.scale.set(1, 1, 1.1);
        hunterGroup.add(leftBoot);
        
        const rightBoot = new THREE.Mesh(bootGeometry, brownMaterial);
        rightBoot.position.set(0.12, 0.06, 0.04);
        rightBoot.scale.set(1, 1, 1.1);
        hunterGroup.add(rightBoot);
        
        // Overall straps (more realistic)
        const strapGeometry = new THREE.BoxGeometry(0.04, 0.35, 0.015);
        
        const leftStrap = new THREE.Mesh(strapGeometry, tanMaterial);
        leftStrap.position.set(-0.08, 1.3, 0.22);
        hunterGroup.add(leftStrap);
        
        const rightStrap = new THREE.Mesh(strapGeometry, tanMaterial);
        rightStrap.position.set(0.08, 1.3, 0.22);
        hunterGroup.add(rightStrap);
        
        // Shotgun
        const shotgunGroup = new THREE.Group();
        
        // Shotgun barrel (main tube)
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
        const gunMetalMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark metal
        const barrel = new THREE.Mesh(barrelGeometry, gunMetalMaterial);
        barrel.rotation.z = Math.PI / 2; // Horizontal
        barrel.position.set(0.4, 0, 0);
        shotgunGroup.add(barrel);
        
        // Shotgun stock (wooden part)
        const stockGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.4);
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown wood
        const stock = new THREE.Mesh(stockGeometry, woodMaterial);
        stock.position.set(-0.15, -0.05, 0);
        shotgunGroup.add(stock);
        
        // Trigger guard
        const triggerGuardGeometry = new THREE.TorusGeometry(0.03, 0.008, 6, 12);
        const triggerGuard = new THREE.Mesh(triggerGuardGeometry, gunMetalMaterial);
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.position.set(0.05, -0.03, 0);
        shotgunGroup.add(triggerGuard);
        
        // Position shotgun in hunter's hands
        shotgunGroup.position.set(0.2, 1.1, 0.1); // Slightly forward and to the right
        shotgunGroup.rotation.y = -0.1; // Slight angle
        shotgunGroup.rotation.z = -0.05; // Slight downward angle
        
        hunterGroup.add(shotgunGroup);
        hunterGroup.shotgun = shotgunGroup; // Store reference
        
        // Set shadows for all parts
        hunterGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        
        return hunterGroup;
    }
    
    update(deltaTime) {
        if (!this.input) return;
        
        // Handle input
        this.handleMovementInput(deltaTime);
        this.handleMouseInput(deltaTime);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update stamina
        this.updateStamina(deltaTime);
        
        // Update walking animation
        this.updateWalkingAnimation(deltaTime);
        
        // Update reload system
        this.updateReload(deltaTime);
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update mesh position and rotation
        this.updateMesh();
    }
    
    handleMovementInput(deltaTime) {
        // Get movement input
        const movement = this.input.getMovementVector();
        this.isRunning = this.input.isRunning();
        this.isCrouching = this.input.isCrouching();
        
        // Calculate movement speed
        let speed = this.walkSpeed;
        if (this.isRunning && this.stamina > 0) {
            speed = this.runSpeed;
        } else if (this.isCrouching) {
            speed = this.crouchSpeed;
        }
        
        // Calculate movement direction based on player's current rotation
        const moveDirection = new THREE.Vector3();
        
        // Forward/backward movement (local Z axis)
        if (movement.z !== 0) {
            const forward = new THREE.Vector3(0, 0, movement.z);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            moveDirection.add(forward);
        }
        
        // Left/right movement (local X axis)  
        if (movement.x !== 0) {
            const right = new THREE.Vector3(movement.x, 0, 0);
            right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            moveDirection.add(right);
        }
        
        // Normalize and apply movement
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.velocity.x = moveDirection.x * speed;
            this.velocity.z = moveDirection.z * speed;
        } else {
            // Apply friction when not moving
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        
        // Spacebar is now used for shooting, not jumping
        
        // Dog commands
        this.handleDogCommands();
        
        // Shooting
        this.handleShooting();
    }
    
    handleMouseInput(deltaTime) {
        if (!this.input.isPointerLocked) return;
        
        const mouseDelta = this.input.getMouseDelta();
        
        // Rotate player based on horizontal mouse movement
        this.rotation.y -= mouseDelta.x * 0.005; // Increased mouse sensitivity for turning
        
        // Pass mouse movement to camera for vertical look (up/down)
        this.camera.handleMouseMove(0, mouseDelta.y);
    }
    
    handleDogCommands() {
        // Get reference to game and dog
        const game = this.scene.scene.userData.game; // Access Three.js scene through Scene wrapper
        if (!game || !game.dog) return;
        
        // Search command (F key)
        if (this.input.isKeyPressed('KeyF')) {
            game.dog.commandSearch();
        }
        
        // Retrieve command (G key) 
        if (this.input.isKeyPressed('KeyG')) {
            console.log('Player: G key pressed - calling commandRetrieve()');
            game.dog.commandRetrieve();
        }
        
        // Heel command (H key)
        if (this.input.isKeyPressed('KeyH')) {
            console.log('Player: H key pressed - calling commandHeel()');
            game.dog.commandHeel();
        }
    }
    
    handleShooting() {
        // Check if spacebar shoot was requested
        if (this.input.isShootRequested()) {
            this.shoot();
        }
        
        // Check if reload was requested
        if (this.input.isReloadRequested() && !this.isReloading && this.currentAmmo < this.maxAmmo) {
            this.startReload();
        }
    }
    
    shoot() {
        // Check if we can shoot
        if (this.currentAmmo <= 0 || this.isReloading) {
            console.log('Cannot shoot - no ammo or reloading');
            return;
        }
        
        // Get reference to game and pheasant system
        const game = this.scene.scene.userData.game;
        if (!game || !game.pheasantSystem) return;
        
        // Use one bullet
        this.currentAmmo--;
        this.updateAmmoDisplay();
        
        // Play shooting sound
        this.playShootingSound();
        
        // Create bullet visual
        this.createBulletVisual();
        
        console.log(`BANG! Player shot! Ammo remaining: ${this.currentAmmo}`);
        
        // Create raycast from crosshair position
        const raycaster = new THREE.Raycaster();
        const camera = this.camera.getCamera();
        
        // Set raycast from crosshair position (not camera center)
        const crosshairMouse = new THREE.Vector2(this.input.crosshair.normalizedX, this.input.crosshair.normalizedY);
        raycaster.setFromCamera(crosshairMouse, camera);
        
        // Check for pheasant hits within reasonable range
        const pheasants = game.pheasantSystem.pheasants;
        let closestHit = null;
        let closestDistance = Infinity;
        
        try {
            for (const pheasant of pheasants) {
                if (!pheasant || !pheasant.isFlying || pheasant.isShot) continue;
                
                // Check if raycast intersects with pheasant
                const distance = raycaster.ray.distanceToPoint(pheasant.position);
                
                if (distance < 2 && pheasant.position.distanceTo(camera.position) < 50) {
                    if (distance < closestDistance) {
                        closestHit = pheasant;
                        closestDistance = distance;
                    }
                }
            }
        } catch (error) {
            console.error('Error in shooting raycast:', error);
            return;
        }
        
        // If we hit a pheasant
        if (closestHit) {
            try {
                const wasHit = closestHit.shoot();
                if (wasHit) {
                    console.log('Hit! Pheasant down! Send dog to retrieve for points.');
                    
                    // Don't award points yet - only when dog retrieves
                    // Tell dog about the downed bird automatically
                    if (game.dog && typeof game.dog.setState === 'function') {
                        game.dog.setState('retrieve');
                    }
                }
            } catch (error) {
                console.error('Error shooting pheasant:', error);
            }
        } else {
            console.log('Miss!');
        }
    }
    
    addScore(points) {
        const game = this.scene.scene.userData.game;
        if (game) {
            const oldScore = game.score || 0;
            game.score = oldScore + points;
            console.log(`Score updated: +${points} points = ${game.score} total`);
            
            // Update score display
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                scoreElement.textContent = `Score: ${game.score}`;
            }
        }
    }
    
    startReload() {
        if (this.currentAmmo >= this.maxAmmo || this.isReloading) return;
        
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        console.log('Reloading...');
        this.updateAmmoDisplay();
    }
    
    updateReload(deltaTime) {
        if (!this.isReloading) return;
        
        this.reloadTimer -= deltaTime;
        if (this.reloadTimer <= 0) {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
            console.log('Reload complete!');
            this.updateAmmoDisplay();
        }
    }
    
    updateAmmoDisplay() {
        const ammoElement = document.getElementById('ammo');
        if (ammoElement) {
            if (this.isReloading) {
                const reloadProgress = Math.ceil(this.reloadTimer * 10) / 10;
                ammoElement.textContent = `Ammo: Reloading... ${reloadProgress.toFixed(1)}s`;
            } else {
                ammoElement.textContent = `Ammo: ${this.currentAmmo}/${this.maxAmmo}`;
            }
        }
    }
    
    playShootingSound() {
        // Create audio element and play shooting sound
        const audio = new Audio();
        // Using a simple sound generation for now - in a real game you'd load an audio file
        // For now, we'll create a simple programmatic bang sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a sharp bang sound
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    createBulletVisual() {
        const camera = this.camera.getCamera();
        
        // Get direction from crosshair position instead of camera center
        const crosshairMouse = new THREE.Vector2(this.input.crosshair.normalizedX, this.input.crosshair.normalizedY);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(crosshairMouse, camera);
        const direction = raycaster.ray.direction.clone();
        
        // Create bullet geometry and material
        const bulletGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00, // Yellow bullet
            emissive: 0x444400 
        });
        
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(camera.position);
        bullet.position.add(direction.clone().multiplyScalar(2)); // Start slightly in front
        
        // Store bullet data
        const bulletData = {
            mesh: bullet,
            velocity: direction.clone().multiplyScalar(this.bulletSpeed),
            lifetime: this.bulletLifetime
        };
        
        this.bullets.push(bulletData);
        this.scene.add(bullet);
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Move bullet
            bullet.mesh.position.add(bullet.velocity.clone().multiplyScalar(deltaTime));
            
            // Update lifetime
            bullet.lifetime -= deltaTime;
            
            // Remove bullet if lifetime expired
            if (bullet.lifetime <= 0) {
                this.scene.remove(bullet.mesh);
                bullet.mesh.geometry.dispose();
                bullet.mesh.material.dispose();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updatePhysics(deltaTime) {
        // Update horizontal position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Get terrain height at current position
        const terrainHeight = this.getTerrainHeightAt(this.position.x, this.position.z);
        this.targetY = terrainHeight;
        
        // Handle jumping and falling
        if (this.velocity.y > 0 || this.position.y > terrainHeight + 0.2) {
            // Player is jumping or falling
            this.position.y += this.velocity.y * deltaTime;
            this.velocity.y += this.gravity * deltaTime;
            this.isOnGround = false;
            
            // Land on terrain
            if (this.position.y <= terrainHeight && this.velocity.y <= 0) {
                this.position.y = terrainHeight;
                this.velocity.y = 0;
                this.isOnGround = true;
            }
        } else {
            // Smoothly follow terrain when walking (with deadzone to prevent jitter)
            const heightDiff = this.targetY - this.position.y;
            if (Math.abs(heightDiff) > 0.01) { // Only adjust if difference is significant
                this.position.y += heightDiff * this.terrainSmoothness;
            }
            this.isOnGround = true;
        }
        
        // Keep player within reasonable bounds
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));
    }
    
    getTerrainHeightAt(x, z) {
        // Get terrain height from the terrain system
        if (window.game && window.game.terrainSystem) {
            return window.game.terrainSystem.getHeightAt(x, z);
        }
        return 0; // Fallback to ground level
    }
    
    updateStamina(deltaTime) {
        if (this.isRunning && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
            // Drain stamina when running
            this.stamina = Math.max(0, this.stamina - 30 * deltaTime);
        } else {
            // Regenerate stamina when not running
            this.stamina = Math.min(this.maxStamina, this.stamina + 20 * deltaTime);
        }
    }
    
    updateWalkingAnimation(deltaTime) {
        // Check if player is moving
        this.isMoving = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1;
        
        if (this.isMoving && this.mesh) {
            // Update walk cycle based on movement speed
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            const walkSpeed = this.isRunning ? 8 : 4; // Animation speed
            this.walkCycle += deltaTime * walkSpeed;
            
            // Arm swing - opposite to legs
            const armSwing = Math.sin(this.walkCycle) * 0.3;
            if (this.mesh.leftArm && this.mesh.rightArm) {
                this.mesh.leftArm.rotation.x = armSwing;
                this.mesh.rightArm.rotation.x = -armSwing;
            }
            
            // Leg movement - subtle forward/back swing
            const legSwing = Math.sin(this.walkCycle) * 0.2;
            if (this.mesh.leftThigh && this.mesh.rightThigh) {
                this.mesh.leftThigh.rotation.x = -legSwing;
                this.mesh.rightThigh.rotation.x = legSwing;
            }
            
            // Hand positions follow arms
            if (this.mesh.leftHand && this.mesh.rightHand) {
                this.mesh.leftHand.position.z = Math.sin(this.walkCycle) * 0.1;
                this.mesh.rightHand.position.z = -Math.sin(this.walkCycle) * 0.1;
            }
            
        } else if (this.mesh) {
            // Reset to neutral position when not moving
            const resetSpeed = 5;
            if (this.mesh.leftArm && this.mesh.rightArm) {
                this.mesh.leftArm.rotation.x *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.rightArm.rotation.x *= Math.exp(-resetSpeed * deltaTime);
            }
            if (this.mesh.leftThigh && this.mesh.rightThigh) {
                this.mesh.leftThigh.rotation.x *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.rightThigh.rotation.x *= Math.exp(-resetSpeed * deltaTime);
            }
            if (this.mesh.leftHand && this.mesh.rightHand) {
                this.mesh.leftHand.position.z *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.rightHand.position.z *= Math.exp(-resetSpeed * deltaTime);
            }
        }
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            // Apply 180 degree rotation so camera sees the hunter's back
            this.mesh.rotation.y = this.rotation.y + Math.PI;
            this.mesh.rotation.x = this.rotation.x;
            this.mesh.rotation.z = this.rotation.z;
            
            // Adjust height when crouching
            if (this.isCrouching) {
                this.mesh.scale.y = 0.7;
            } else {
                this.mesh.scale.y = 1.0;
            }
        }
    }
    
    // Getters for camera and other systems
    getPosition() {
        return this.position.clone();
    }
    
    getRotation() {
        return this.rotation.clone();
    }
    
    getVelocity() {
        return this.velocity.clone();
    }
    
    getHealth() {
        return this.health;
    }
    
    getStamina() {
        return this.stamina;
    }
    
    getStaminaPercentage() {
        return this.stamina / this.maxStamina;
    }
    
    // Actions
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        console.log(`Player took ${amount} damage. Health: ${this.health}`);
    }
    
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }
    
    // Set input reference (called by game)
    setInput(input) {
        this.input = input;
    }
    
    dispose() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            
            // Dispose geometry and material
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }
        
        console.log('Player disposed');
    }
}
