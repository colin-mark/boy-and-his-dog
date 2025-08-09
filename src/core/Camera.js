import * as THREE from 'three';

export class Camera {
    constructor(aspect = window.innerWidth / window.innerHeight) {
        this.camera = null;
        this.target = null;
        this.aspect = aspect;
        
        // Camera settings
        this.fov = 75;
        this.near = 0.1;
        this.far = 1000;
        
        // Third-person camera settings
        this.distance = 8;        // Distance behind the player
        this.height = 3;          // Height above the player
        this.smoothness = 0.1;    // Camera smoothing factor
        
        // Mouse look settings
        this.mouseSensitivity = 0.005;
        this.verticalAngle = 0;   // Up/down rotation
        this.horizontalAngle = 0; // Left/right rotation
        this.minVerticalAngle = -Math.PI / 6;  // -30 degrees (less downward)
        this.maxVerticalAngle = Math.PI / 4;   // 45 degrees
        
        // Camera state
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.desiredPosition = new THREE.Vector3();
        this.desiredLookAt = new THREE.Vector3();
        
        // Temporary vectors for calculations
        this.tempVector = new THREE.Vector3();
        this.tempQuaternion = new THREE.Quaternion();
    }
    
    async init() {
        console.log('Initializing camera...');
        
        // Create perspective camera
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            this.aspect,
            this.near,
            this.far
        );
        
        // Set initial position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        console.log('Camera initialized');
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    update(deltaTime) {
        if (!this.target) return;
        
        const targetPosition = this.target.getPosition();
        const targetRotation = this.target.getRotation();
        
        // Calculate desired camera position based on player position and rotation
        this.calculateDesiredPosition(targetPosition, targetRotation);
        
        // Smoothly interpolate to desired position
        this.currentPosition.lerp(this.desiredPosition, this.smoothness);
        this.currentLookAt.lerp(this.desiredLookAt, this.smoothness);
        
        // Update camera
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    calculateDesiredPosition(targetPosition, targetRotation) {
        // Calculate the offset behind the player
        const offset = new THREE.Vector3(0, this.height, this.distance);
        
        // Apply player's Y rotation (no additional horizontal angle)
        const playerYRotation = targetRotation.y;
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYRotation);
        
        // Apply vertical rotation (camera pitch)
        const rightVector = new THREE.Vector3(1, 0, 0);
        rightVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYRotation);
        offset.applyAxisAngle(rightVector, this.verticalAngle);
        
        // Set desired camera position
        this.desiredPosition.copy(targetPosition).add(offset);
        
        // Calculate look-at point (slightly ahead and above the player)
        this.desiredLookAt.copy(targetPosition);
        this.desiredLookAt.y += 1.5; // Look at player's chest level
        
        // Add forward offset for better view
        const forward = new THREE.Vector3(0, 0, -2);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYRotation);
        this.desiredLookAt.add(forward);
    }
    
    handleMouseMove(movementX, movementY) {
        // Only handle vertical mouse movement (up/down camera pitch)
        // Horizontal movement is now handled by the player rotation
        
        // Update vertical angle (clamped)
        this.verticalAngle -= movementY * this.mouseSensitivity;
        this.verticalAngle = Math.max(
            this.minVerticalAngle,
            Math.min(this.maxVerticalAngle, this.verticalAngle)
        );
    }
    
    getCamera() {
        return this.camera;
    }
    
    getPosition() {
        return this.camera.position;
    }
    
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
    
    // Get the forward direction projected on the XZ plane (for movement)
    getForwardDirection() {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        return forward;
    }
    
    // Get the right direction projected on the XZ plane (for strafing)
    getRightDirection() {
        const right = new THREE.Vector3();
        right.crossVectors(this.getForwardDirection(), new THREE.Vector3(0, 1, 0));
        return right;
    }
    
    onWindowResize() {
        this.aspect = window.innerWidth / window.innerHeight;
        if (this.camera) {
            this.camera.aspect = this.aspect;
            this.camera.updateProjectionMatrix();
        }
    }
    
    // Zoom in/out (for future use)
    zoom(delta) {
        this.distance = Math.max(3, Math.min(15, this.distance + delta));
    }
    
    dispose() {
        // Nothing to dispose for camera
    }
}
