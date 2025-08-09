import * as THREE from 'three';
import { Scene } from './Scene.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { Player } from '../entities/Player.js';
import { Dog } from '../entities/Dog.js';
import { PheasantSystem } from '../entities/Pheasant.js';
import { TerrainSystem } from '../systems/TerrainSystem.js';

export class Game {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 0;
        
        // Core systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.input = null;
        
        // Game systems
        this.terrainSystem = null;
        this.pheasantSystem = null;
        
        // Entities
        this.player = null;
        this.dog = null;
        
        // Game state
        this.score = 0;
        this.gameTime = 300; // 5 minutes in seconds
        this.gameStarted = false;
        this.gameEnded = false;
        
        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    
    async init() {
        try {
            console.log('Initializing Boy and His Dog...');
            
            // Initialize core systems
            console.log('Creating Scene...');
            this.scene = new Scene();
            console.log('Creating Renderer...');
            this.renderer = new Renderer();
            console.log('Creating Camera...');
            this.camera = new Camera(this.renderer.getAspect());
            console.log('Creating InputManager...');
            this.input = new InputManager();
            
            // Initialize game systems
            console.log('Creating TerrainSystem...');
            this.terrainSystem = new TerrainSystem(this.scene);
            
            // Create player
            console.log('Creating Player...');
            this.player = new Player(this.scene, this.camera);
            
            // Set up event listeners
            window.addEventListener('resize', this.onWindowResize);
            
            // Initialize all systems
            await this.scene.init();
            await this.renderer.init();
            await this.camera.init();
            await this.input.init();
            await this.terrainSystem.init();
            
            // Create pheasant system after scene is ready
            console.log('Creating PheasantSystem...');
            this.pheasantSystem = new PheasantSystem(this.scene.scene, this.terrainSystem);
            await this.pheasantSystem.init();
            await this.player.init();
            
            // Create dog companion after scene is ready
            console.log('Creating Dog...');
            this.dog = new Dog(this.scene.scene, this.player);
            
            // Initialize dog after scene is ready
            console.log('Initializing dog...');
            await this.dog.init();
            
            // Set input reference for player after initialization
            this.player.setInput(this.input);
            
            console.log('Dog companion created');
            
            // Set initial camera position
            this.camera.setTarget(this.player);
            
            // Set game reference in scene for player access
            this.scene.scene.userData.game = this;
            
            // Now spawn pheasants after everything is ready
            console.log('Spawning pheasants...');
            await this.pheasantSystem.spawnPheasants();
            
            this.isInitialized = true;
            console.log('Game initialized successfully!');
            
            // Hide loading screen
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }
    
    start() {
        if (!this.isInitialized) {
            throw new Error('Game must be initialized before starting');
        }
        
        console.log('Starting game loop...');
        this.isRunning = true;
        this.gameStarted = true;
        this.clock.start();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        console.log('Game stopped');
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.deltaTime = this.clock.getDelta();
        this.update(this.deltaTime);
        this.render();
        
        // Update FPS counter
        this.updateFPS();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update input first
        this.input.update(deltaTime);
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        // Update dog
        if (this.dog) {
            this.dog.update(deltaTime, this.terrainSystem);
        }
        
        // Update pheasants
        if (this.pheasantSystem) {
            this.pheasantSystem.update(deltaTime, this.dog, this.player);
        }
        
        // Update game timer
        this.updateGameTimer(deltaTime);
        
        // Update camera
        if (this.camera) {
            this.camera.update(deltaTime);
        }
        
        // Update terrain system
        if (this.terrainSystem) {
            this.terrainSystem.update(deltaTime);
        }
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene.getScene(), this.camera.getCamera());
        }
    }
    
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Update FPS display
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;
            }
        }
    }
    
    updateGameTimer(deltaTime) {
        if (!this.gameStarted || this.gameEnded) return;
        
        this.gameTime -= deltaTime;
        
        // Update timer display
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${timeString}`;
        }
        
        // Check if time is up
        if (this.gameTime <= 0) {
            this.endGame();
        }
    }
    
    endGame() {
        this.gameEnded = true;
        this.gameTime = 0;
        
        console.log(`Game Over! Final Score: ${this.score}`);
        
        // Update timer display to show 0:00
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = 'Time: 0:00';
            timerElement.style.color = '#ff0000'; // Red for game over
        }
        
        // Could add game over screen here
        alert(`Game Over!\n\nFinal Score: ${this.score} points\n\nThanks for hunting with your dog!`);
    }
    
    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.onWindowResize();
            this.renderer.onWindowResize();
        }
    }
    
    dispose() {
        this.stop();
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        // Dispose of systems
        if (this.input) this.input.dispose();
        if (this.renderer) this.renderer.dispose();
        if (this.terrainSystem) this.terrainSystem.dispose();
        if (this.pheasantSystem) this.pheasantSystem.dispose();
        if (this.player) this.player.dispose();
        if (this.dog) this.dog.dispose();
        
        console.log('Game disposed');
    }
}
