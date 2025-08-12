import * as THREE from 'three';

export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            leftButton: false,
            rightButton: false,
            middleButton: false
        };
        
        this.isPointerLocked = false;
        this.canvas = null;
        
        // Click-and-drag mouse control
        this.isDragging = false;
        this.dragStarted = false;
        
        // Shooting
        this.shootRequested = false;
        this.spaceWasPressed = false;
        
        // Crosshair tracking
        this.crosshair = {
            screenX: window.innerWidth / 2,
            screenY: window.innerHeight / 2,
            normalizedX: 0, // -1 to 1
            normalizedY: 0  // -1 to 1
        };
        
        // Input callbacks
        this.callbacks = {
            keyDown: [],
            keyUp: [],
            mouseMove: [],
            mouseDown: [],
            mouseUp: [],
            wheel: []
        };
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onPointerLockError = this.onPointerLockError.bind(this);
        this.onClick = this.onClick.bind(this);
    }
    
    async init() {
        console.log('Initializing input manager...');
        
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        // Add event listeners
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('wheel', this.onWheel);
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Disable right-click menu
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('pointerlockerror', this.onPointerLockError);
        
        console.log('Input manager initialized');
    }
    
    // Keyboard events
    onKeyDown(event) {
        this.keys.set(event.code, true);
        
        // Debug logging for F, G, H keys
        if (event.code === 'KeyF' || event.code === 'KeyG' || event.code === 'KeyH') {
            console.log(`InputManager: ${event.code} pressed`);
        }
        
        // Prevent default for game keys
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
        
        // Trigger callbacks
        this.callbacks.keyDown.forEach(callback => callback(event));
    }
    
    onKeyUp(event) {
        this.keys.set(event.code, false);
        
        // Prevent default for game keys
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
        
        // Trigger callbacks
        this.callbacks.keyUp.forEach(callback => callback(event));
    }
    
    // Mouse events
    onMouseMove(event) {
        if (this.isPointerLocked && this.isDragging) {
            // Only process mouse movement when actively dragging
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
            this.dragStarted = true; // Mark that dragging has started
        } else {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
        }
        
        // Always update crosshair position (even when pointer locked)
        this.updateCrosshairPosition(event);
        
        // Trigger callbacks
        this.callbacks.mouseMove.forEach(callback => callback(event));
    }
    
    onMouseDown(event) {
        this.updateMouseButton(event.button, true);
        
        // Start dragging for mouse look (left button only)
        if (event.button === 0) {
            this.isDragging = true;
            this.dragStarted = false;
            
            // Request pointer lock for drag control
            if (!this.isPointerLocked) {
                this.requestPointerLock();
            }
        }
        
        // Right-click no longer used for shooting
        
        // Trigger callbacks
        this.callbacks.mouseDown.forEach(callback => callback(event));
    }
    
    onMouseUp(event) {
        this.updateMouseButton(event.button, false);
        
        // End dragging and unlock mouse (left button only)
        if (event.button === 0 && this.isDragging) {
            this.isDragging = false;
            this.dragStarted = false;
            
            // Exit pointer lock when mouse is released
            this.exitPointerLock();
        }
        
        // Trigger callbacks
        this.callbacks.mouseUp.forEach(callback => callback(event));
    }
    
    onWheel(event) {
        event.preventDefault();
        
        // Trigger callbacks
        this.callbacks.wheel.forEach(callback => callback(event));
    }
    
    onClick(event) {
        // Click events are handled by mousedown/mouseup for drag control
        // Shooting is now handled by spacebar
    }
    
    updateMouseButton(button, pressed) {
        switch (button) {
            case 0: // Left button
                this.mouse.leftButton = pressed;
                break;
            case 1: // Middle button
                this.mouse.middleButton = pressed;
                break;
            case 2: // Right button
                this.mouse.rightButton = pressed;
                break;
        }
    }
    
    // Pointer lock
    requestPointerLock() {
        if (this.canvas && !this.isPointerLocked) {
            this.canvas.requestPointerLock();
        }
    }
    
    exitPointerLock() {
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }
    
    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
        console.log('Pointer lock changed:', this.isPointerLocked);
    }
    
    onPointerLockError() {
        console.error('Pointer lock error');
    }
    
    // Input queries
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isKeyJustPressed(keyCode) {
        // This would need to be implemented with a frame-based system
        // For now, just return current state
        return this.isKeyPressed(keyCode);
    }
    
    getMouseDelta() {
        // Only return mouse delta if actively dragging
        if (this.isDragging && this.dragStarted) {
            return { x: this.mouse.deltaX, y: this.mouse.deltaY };
        }
        return { x: 0, y: 0 };
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    isMouseButtonPressed(button) {
        switch (button) {
            case 0: return this.mouse.leftButton;
            case 1: return this.mouse.middleButton;
            case 2: return this.mouse.rightButton;
            default: return false;
        }
    }
    
    // Utility methods
    isGameKey(keyCode) {
        const gameKeys = [
            'KeyW', 'KeyA', 'KeyS', 'KeyD', // Movement (WASD)
            'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', // Movement (Arrow keys)
            'Space', 'ShiftLeft', 'ShiftRight', // Jump, run
            'ControlLeft', 'ControlRight', // Crouch
            'KeyF', 'KeyG', 'KeyH', 'KeyR', 'KeyE', // Dog commands, interact, reload, use
            'Escape', 'Tab' // Menu, inventory
        ];
        return gameKeys.includes(keyCode);
    }
    
    // Movement helper
    getMovementVector() {
        const movement = { x: 0, z: 0 };
        
        // WASD movement
        if (this.isKeyPressed('KeyW')) movement.z -= 1;
        if (this.isKeyPressed('KeyS')) movement.z += 1;
        if (this.isKeyPressed('KeyA')) movement.x -= 1;
        if (this.isKeyPressed('KeyD')) movement.x += 1;
        
        // Arrow key movement (identical functionality)
        if (this.isKeyPressed('ArrowUp')) movement.z -= 1;
        if (this.isKeyPressed('ArrowDown')) movement.z += 1;
        if (this.isKeyPressed('ArrowLeft')) movement.x -= 1;
        if (this.isKeyPressed('ArrowRight')) movement.x += 1;
        
        return movement;
    }
    
    isRunning() {
        return this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
    }
    
    isCrouching() {
        return this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
    }
    
    // Shooting
    isShootRequested() {
        // Check if spacebar was just pressed (not held)
        const spacePressed = this.keys.get('Space');
        if (spacePressed && !this.spaceWasPressed) {
            this.spaceWasPressed = true;
            return true;
        } else if (!spacePressed) {
            this.spaceWasPressed = false;
        }
        return false;
    }
    
    isReloadRequested() {
        return this.keys.get('KeyR');
    }
    
    // Crosshair methods
    updateCrosshairPosition(event) {
        if (this.isPointerLocked) {
            // When pointer locked, accumulate movement to move crosshair
            this.crosshair.screenX += event.movementX || 0;
            this.crosshair.screenY += event.movementY || 0;
            
            // Clamp to screen bounds
            this.crosshair.screenX = Math.max(0, Math.min(window.innerWidth, this.crosshair.screenX));
            this.crosshair.screenY = Math.max(0, Math.min(window.innerHeight, this.crosshair.screenY));
        } else {
            // When not locked, use direct mouse position
            this.crosshair.screenX = event.clientX;
            this.crosshair.screenY = event.clientY;
        }
        
        // Convert to normalized coordinates (-1 to 1)
        this.crosshair.normalizedX = (this.crosshair.screenX / window.innerWidth) * 2 - 1;
        this.crosshair.normalizedY = -((this.crosshair.screenY / window.innerHeight) * 2 - 1); // Flip Y
        
        // Update crosshair DOM element
        this.updateCrosshairDOM();
    }
    
    updateCrosshairDOM() {
        const crosshairElement = document.getElementById('crosshair');
        if (crosshairElement) {
            crosshairElement.style.left = this.crosshair.screenX + 'px';
            crosshairElement.style.top = this.crosshair.screenY + 'px';
        }
    }
    
    getCrosshairDirection(camera) {
        // Convert crosshair screen position to world direction
        const mouse = new THREE.Vector2(this.crosshair.normalizedX, this.crosshair.normalizedY);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        return raycaster.ray.direction.clone();
    }
    
    // Callback system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    update(deltaTime) {
        // Reset mouse delta after each frame
        // (This happens automatically with pointer lock)
        if (!this.isPointerLocked) {
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
        }
    }
    
    dispose() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
            this.canvas.removeEventListener('mousedown', this.onMouseDown);
            this.canvas.removeEventListener('mouseup', this.onMouseUp);
            this.canvas.removeEventListener('wheel', this.onWheel);
            this.canvas.removeEventListener('click', this.onClick);
        }
        
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        document.removeEventListener('pointerlockerror', this.onPointerLockError);
        
        // Exit pointer lock
        this.exitPointerLock();
        
        console.log('Input manager disposed');
    }
}
