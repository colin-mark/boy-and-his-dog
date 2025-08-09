import * as THREE from 'three';

export class Dog {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Position and movement
        this.position = new THREE.Vector3(2, 0, 2); // Start near player
        this.targetPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        
        // AI States
        this.state = 'heel'; // heel, stay, search, retrieve
        this.heelDistance = 2.5; // Distance to maintain from player
        this.heelOffset = new THREE.Vector3(-1.5, 0, 0.5); // Left side, slightly behind
        this.searchRadius = 10;
        this.speed = 4;
        this.maxSpeed = 8;
        
        // Animation
        this.walkCycle = 0;
        this.isMoving = false;
        this.animationSpeed = 6;
        
        // Dynamic speed for smooth heeling
        this.currentSpeed = this.speed;
        this.targetRotation = 0;
        
        // Pathfinding
        this.stuckTimer = 0;
        this.lastPosition = new THREE.Vector3();
        this.avoidanceTimer = 0;
        
        // Search behavior
        this.searchTarget = null;
        this.searchTime = 0;
        this.maxSearchTime = 10; // seconds
        
        // Retrieval behavior
        this.retrieveTarget = null;
        this.isCarryingBird = false;
        
        // Initialize
        this.mesh = null;
        // Model will be created during init()
    }
    
    async init() {
        console.log('Initializing dog...');
        this.createDogModel();
        console.log('Dog initialized');
    }
    
    createDogModel() {
        // Create dog group
        const dogGroup = new THREE.Group();
        
        // Body (main torso) - more realistic dog proportions
        const bodyGeometry = new THREE.CapsuleGeometry(0.25, 1.0, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Black
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2; // Horizontal orientation
        body.position.y = 0.55;
        dogGroup.add(body);
        
        // Chest (broader front)
        const chestGeometry = new THREE.SphereGeometry(0.28, 12, 8);
        const chest = new THREE.Mesh(chestGeometry, bodyMaterial);
        chest.position.set(0.35, 0.55, 0);
        chest.scale.set(1.2, 0.9, 1.1);
        dogGroup.add(chest);
        
        // Head - more realistic Lab head shape
        const headGeometry = new THREE.SphereGeometry(0.28, 12, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a }); // Slightly lighter black
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.75, 0.7, 0);
        head.scale.set(1.1, 0.85, 1.15); // More realistic Lab head proportions
        dogGroup.add(head);
        
        // Snout - more prominent Lab snout
        const snoutGeometry = new THREE.CapsuleGeometry(0.12, 0.35, 4, 6);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.rotation.z = Math.PI / 2;
        snout.position.set(1.05, 0.65, 0);
        snout.scale.set(1, 0.9, 1.1);
        dogGroup.add(snout);
        
        // Muzzle area - lighter colored
        const muzzleGeometry = new THREE.SphereGeometry(0.08, 8, 6);
        const muzzleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
        muzzle.position.set(1.15, 0.62, 0);
        muzzle.scale.set(1.2, 0.8, 1.1);
        dogGroup.add(muzzle);
        
        // Ears (floppy lab ears) - more realistic
        const earGeometry = new THREE.SphereGeometry(0.18, 8, 6);
        const earMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(0.65, 0.85, 0.22);
        leftEar.scale.set(0.7, 1.4, 0.25);
        leftEar.rotation.z = -0.3; // Droopy angle
        leftEar.rotation.x = 0.2;
        dogGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.65, 0.85, -0.22);
        rightEar.scale.set(0.7, 1.4, 0.25);
        rightEar.rotation.z = 0.3; // Droopy angle
        rightEar.rotation.x = 0.2;
        dogGroup.add(rightEar);
        
        // Eyes - more realistic
        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 6);
        const eyeWhiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const eyePupilMaterial = new THREE.MeshLambertMaterial({ color: 0x2F1B14 }); // Dark brown pupils
        
        // Eye whites
        const leftEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        leftEye.position.set(0.95, 0.78, 0.12);
        dogGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        rightEye.position.set(0.95, 0.78, -0.12);
        dogGroup.add(rightEye);
        
        // Eye pupils
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), eyePupilMaterial);
        leftPupil.position.set(0.97, 0.78, 0.12);
        dogGroup.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), eyePupilMaterial);
        rightPupil.position.set(0.97, 0.78, -0.12);
        dogGroup.add(rightPupil);
        
        // Nose - more realistic Lab nose
        const noseGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(1.18, 0.62, 0);
        nose.scale.set(1.2, 0.8, 1);
        dogGroup.add(nose);
        
        // Nostrils
        const nostrilGeometry = new THREE.SphereGeometry(0.015, 4, 3);
        const nostrilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
        leftNostril.position.set(1.2, 0.62, 0.02);
        dogGroup.add(leftNostril);
        
        const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
        rightNostril.position.set(1.2, 0.62, -0.02);
        dogGroup.add(rightNostril);
        
        // Legs (4 legs) - more realistic proportions
        const upperLegGeometry = new THREE.CylinderGeometry(0.09, 0.07, 0.4, 8);
        const lowerLegGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // Front legs
        const frontLeftUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        frontLeftUpperLeg.position.set(0.35, 0.4, 0.2);
        dogGroup.add(frontLeftUpperLeg);
        
        const frontLeftLowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        frontLeftLowerLeg.position.set(0.35, 0.15, 0.2);
        dogGroup.add(frontLeftLowerLeg);
        dogGroup.frontLeftLeg = frontLeftLowerLeg; // Store reference for animation
        
        const frontRightUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        frontRightUpperLeg.position.set(0.35, 0.4, -0.2);
        dogGroup.add(frontRightUpperLeg);
        
        const frontRightLowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        frontRightLowerLeg.position.set(0.35, 0.15, -0.2);
        dogGroup.add(frontRightLowerLeg);
        dogGroup.frontRightLeg = frontRightLowerLeg;
        
        // Back legs - slightly different positioning for realistic stance
        const backLeftUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        backLeftUpperLeg.position.set(-0.35, 0.4, 0.2);
        dogGroup.add(backLeftUpperLeg);
        
        const backLeftLowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        backLeftLowerLeg.position.set(-0.35, 0.15, 0.2);
        dogGroup.add(backLeftLowerLeg);
        dogGroup.backLeftLeg = backLeftLowerLeg;
        
        const backRightUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        backRightUpperLeg.position.set(-0.35, 0.4, -0.2);
        dogGroup.add(backRightUpperLeg);
        
        const backRightLowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        backRightLowerLeg.position.set(-0.35, 0.15, -0.2);
        dogGroup.add(backRightLowerLeg);
        dogGroup.backRightLeg = backRightLowerLeg;
        
        // Paws
        const pawGeometry = new THREE.SphereGeometry(0.06, 8, 6);
        const pawMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        const frontLeftPaw = new THREE.Mesh(pawGeometry, pawMaterial);
        frontLeftPaw.position.set(0.35, 0.05, 0.2);
        frontLeftPaw.scale.set(1, 0.6, 1.2);
        dogGroup.add(frontLeftPaw);
        
        const frontRightPaw = new THREE.Mesh(pawGeometry, pawMaterial);
        frontRightPaw.position.set(0.35, 0.05, -0.2);
        frontRightPaw.scale.set(1, 0.6, 1.2);
        dogGroup.add(frontRightPaw);
        
        const backLeftPaw = new THREE.Mesh(pawGeometry, pawMaterial);
        backLeftPaw.position.set(-0.35, 0.05, 0.2);
        backLeftPaw.scale.set(1, 0.6, 1.2);
        dogGroup.add(backLeftPaw);
        
        const backRightPaw = new THREE.Mesh(pawGeometry, pawMaterial);
        backRightPaw.position.set(-0.35, 0.05, -0.2);
        backRightPaw.scale.set(1, 0.6, 1.2);
        dogGroup.add(backRightPaw);
        
        // Tail - more realistic Lab tail
        const tailBaseGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.3, 8);
        const tailMidGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.25, 8);
        const tailTipGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.2, 8);
        const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        const tailBase = new THREE.Mesh(tailBaseGeometry, tailMaterial);
        tailBase.position.set(-0.65, 0.7, 0);
        tailBase.rotation.z = Math.PI / 6; // Slightly raised
        dogGroup.add(tailBase);
        
        const tailMid = new THREE.Mesh(tailMidGeometry, tailMaterial);
        tailMid.position.set(-0.8, 0.85, 0);
        tailMid.rotation.z = Math.PI / 4;
        dogGroup.add(tailMid);
        
        const tailTip = new THREE.Mesh(tailTipGeometry, tailMaterial);
        tailTip.position.set(-0.9, 1.0, 0);
        tailTip.rotation.z = Math.PI / 3;
        dogGroup.add(tailTip);
        
        dogGroup.tail = tailBase; // Store reference for animation
        
        // Add shadows
        dogGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Base rotation is handled in updateMesh() method
        
        this.mesh = dogGroup;
        this.scene.add(this.mesh);
        
        console.log('Black Labrador created');
    }
    
    update(deltaTime, terrainSystem) {
        this.updateAI(deltaTime);
        this.updateMovement(deltaTime, terrainSystem);
        this.updateAnimation(deltaTime);
        this.updateMesh();
    }
    
    updateAI(deltaTime) {
        switch (this.state) {
            case 'heel':
                this.heelWithPlayer();
                break;
            case 'stay':
                this.stayInPlace();
                break;
            case 'search':
                this.searchForBirds(deltaTime);
                break;
            case 'retrieve':
                this.retrieveBird();
                break;
        }
    }
    
    heelWithPlayer() {
        // Calculate ideal heel position (left side of player)
        const playerRotation = this.player.rotation.y;
        
        // Create heel offset relative to player's facing direction
        const heelOffset = new THREE.Vector3(-1.5, 0, 0.5); // Left side, slightly behind
        
        // Rotate the offset based on player's rotation
        heelOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation);
        
        // Calculate target position
        this.targetPosition.copy(this.player.position).add(heelOffset);
        
        // Set dog's rotation to match player's rotation (face same direction)
        // Note: We use the exact same rotation as the player
        this.targetRotation = this.player.rotation.y;
        
        // Check distance to ideal heel position
        const distanceToHeelPosition = this.position.distanceTo(this.targetPosition);
        
        // If too far from heel position, move towards it
        if (distanceToHeelPosition > 0.5) {
            // Adjust speed based on how far we are
            if (distanceToHeelPosition > 4) {
                // If very far, run to catch up
                this.currentSpeed = this.maxSpeed;
            } else if (distanceToHeelPosition > 2) {
                // If moderately far, walk quickly
                this.currentSpeed = this.speed * 1.2;
            } else {
                // If close, match player's speed
                const playerSpeed = Math.sqrt(this.player.velocity.x * this.player.velocity.x + this.player.velocity.z * this.player.velocity.z);
                this.currentSpeed = Math.max(playerSpeed * 1.1, this.speed * 0.8);
            }
        } else {
            // Close enough to heel position, move gently
            this.currentSpeed = this.speed * 0.6;
        }
    }
    
    stayInPlace() {
        // Dog stays where it is, minimal movement
        this.targetPosition.copy(this.position);
    }
    
    searchForBirds(deltaTime) {
        this.searchTime += deltaTime;
        
        if (this.searchTime > this.maxSearchTime) {
            // Return to heeling after search time expires
            this.setState('heel');
            return;
        }
        
        // Move in search pattern - prioritize corn fields
        if (!this.searchTarget || this.position.distanceTo(this.searchTarget) < 1) {
            // Get reference to terrain system for corn fields
            const game = this.scene.userData.game;
            
            // 70% chance to search in corn fields if available
            if (Math.random() < 0.7 && game && game.terrainSystem && game.terrainSystem.cornFields.length > 0) {
                // Search in a random corn field
                this.searchTarget = game.terrainSystem.getRandomCornFieldPosition();
                console.log('Dog searching in corn field at:', this.searchTarget);
            } else {
                // Random search pattern around player (original behavior)
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.searchRadius;
                
                this.searchTarget = new THREE.Vector3(
                    this.player.position.x + Math.cos(angle) * distance,
                    0,
                    this.player.position.z + Math.sin(angle) * distance
                );
                console.log('Dog searching in tall grass at:', this.searchTarget);
            }
        }
        
        this.targetPosition.copy(this.searchTarget);
    }
    
    retrieveBird() {
        // Get reference to game for shot pheasants
        const game = this.scene.userData.game;
        if (!game || !game.pheasantSystem) {
            this.setState('follow');
            return;
        }
        
        // Find the nearest shot pheasant
        if (!this.retrieveTarget || this.retrieveTarget.isDead) {
            const shotPheasants = game.pheasantSystem.getShotPheasants();
            
            if (shotPheasants.length === 0) {
                // No birds to retrieve, go back to heeling
                this.setState('heel');
                return;
            }
            
            // Find closest shot pheasant
            let closest = null;
            let closestDistance = Infinity;
            
            for (const pheasant of shotPheasants) {
                const distance = this.position.distanceTo(pheasant.position);
                if (distance < closestDistance) {
                    closest = pheasant;
                    closestDistance = distance;
                }
            }
            
            this.retrieveTarget = closest;
        }
        
        if (!this.retrieveTarget) {
            this.setState('heel');
            return;
        }
        
        // Move towards the downed bird
        const distanceToBird = this.position.distanceTo(this.retrieveTarget.position);
        
        if (!this.isCarryingBird && distanceToBird < 1) {
            // Pick up the bird
            console.log('Dog picked up bird!');
            this.isCarryingBird = true;
            this.retrieveTarget.retrieve(); // Mark bird as retrieved
        }
        
        if (this.isCarryingBird) {
            // Return to player
            this.targetPosition.copy(this.player.position);
            
            const distanceToPlayer = this.position.distanceTo(this.player.position);
            if (distanceToPlayer < 2) {
                // Deliver bird to player
                console.log('Dog delivered bird to player!');
                this.isCarryingBird = false;
                this.retrieveTarget = null;
                
                // Award points for successful retrieval (shooting alone gives no points)
                this.player.addScore(15);
                
                // Return to heeling
                this.setState('heel');
            }
        } else {
            // Move towards bird
            this.targetPosition.copy(this.retrieveTarget.position);
        }
    }
    
    updateMovement(deltaTime, terrainSystem) {
        // Calculate direction to target
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.position)
            .normalize();
        
        // Calculate distance to target
        const distanceToTarget = this.position.distanceTo(this.targetPosition);
        
        // Only move if we're not close to target
        if (distanceToTarget > 0.3) {
            // Use the speed determined by AI state
            let moveSpeed = this.currentSpeed;
            
            // Special case for search - move slower
            if (this.state === 'search') {
                moveSpeed = this.speed * 0.7;
            }
            
            // Apply movement
            this.velocity.copy(direction).multiplyScalar(moveSpeed * deltaTime);
            this.position.add(this.velocity);
            
            // Handle rotation based on state
            if (this.state === 'heel') {
                // When heeling, face the same direction as player
                // Use direct assignment for more accurate matching
                const rotationDiff = this.targetRotation - this.rotation.y;
                
                // Handle rotation wrapping
                let adjustedDiff = rotationDiff;
                if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
                if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;
                
                // Faster rotation to match player direction more accurately
                this.rotation.y += adjustedDiff * 0.25;
            } else {
                // For other states, face movement direction
                const movementRotation = Math.atan2(direction.x, direction.z);
                const rotationDiff = movementRotation - this.rotation.y;
                
                // Handle rotation wrapping
                let adjustedDiff = rotationDiff;
                if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
                if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;
                
                // Smooth rotation towards movement direction
                this.rotation.y += adjustedDiff * 0.1;
            }
            
            this.isMoving = true;
        } else {
            // Even when not moving, if heeling, face same direction as player
            if (this.state === 'heel') {
                const rotationDiff = this.targetRotation - this.rotation.y;
                
                // Handle rotation wrapping
                let adjustedDiff = rotationDiff;
                if (adjustedDiff > Math.PI) adjustedDiff -= Math.PI * 2;
                if (adjustedDiff < -Math.PI) adjustedDiff += Math.PI * 2;
                
                // Faster rotation to match player even when stationary
                this.rotation.y += adjustedDiff * 0.2;
            }
            
            this.isMoving = false;
        }
        
        // Keep dog on terrain
        if (terrainSystem) {
            const terrainHeight = terrainSystem.getHeightAt(this.position.x, this.position.z);
            this.position.y = terrainHeight;
        }
        
        // Bounds checking
        const maxDistance = 100;
        if (this.position.length() > maxDistance) {
            this.position.normalize().multiplyScalar(maxDistance);
        }
    }
    
    updateAnimation(deltaTime) {
        if (!this.mesh) return;
        
        if (this.isMoving) {
            // Walking animation
            this.walkCycle += deltaTime * this.animationSpeed;
            
            // Leg animation (opposite legs move together)
            const legSwing = Math.sin(this.walkCycle) * 0.3;
            
            if (this.mesh.frontLeftLeg && this.mesh.frontRightLeg) {
                this.mesh.frontLeftLeg.rotation.x = legSwing;
                this.mesh.frontRightLeg.rotation.x = -legSwing;
            }
            
            if (this.mesh.backLeftLeg && this.mesh.backRightLeg) {
                this.mesh.backLeftLeg.rotation.x = -legSwing;
                this.mesh.backRightLeg.rotation.x = legSwing;
            }
            
            // Tail wagging (more active when moving)
            if (this.mesh.tail) {
                const tailWag = Math.sin(this.walkCycle * 2) * 0.4;
                this.mesh.tail.rotation.z = Math.PI / 4 + tailWag;
            }
        } else {
            // Idle animation - gentle tail wag
            if (this.mesh.tail) {
                const idleTailWag = Math.sin(Date.now() * 0.003) * 0.2;
                this.mesh.tail.rotation.z = Math.PI / 4 + idleTailWag;
            }
            
            // Reset leg positions
            const resetSpeed = 3;
            if (this.mesh.frontLeftLeg) {
                this.mesh.frontLeftLeg.rotation.x *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.frontRightLeg.rotation.x *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.backLeftLeg.rotation.x *= Math.exp(-resetSpeed * deltaTime);
                this.mesh.backRightLeg.rotation.x *= Math.exp(-resetSpeed * deltaTime);
            }
        }
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            // Apply rotation so dog faces same direction as hunter (away from camera)
            // Dog model was created facing +X, so we need to add rotation to make it face away from camera
            this.mesh.rotation.y = this.rotation.y + Math.PI / 2; // +90 degrees to face forward instead of left
        }
    }
    
    setState(newState) {
        console.log(`Dog state changed from ${this.state} to ${newState}`);
        this.state = newState;
        
        // Reset state-specific variables
        if (newState === 'search') {
            this.searchTime = 0;
            this.searchTarget = null;
        }
    }
    
    // Command methods (called by player input)
    commandHeel() {
        this.setState('heel');
    }
    
    commandRetrieve() {
        this.setState('retrieve');
    }
    
    commandSearch() {
        this.setState('search');
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}
