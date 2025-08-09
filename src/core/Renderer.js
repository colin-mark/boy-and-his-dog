import * as THREE from 'three';

export class Renderer {
    constructor() {
        this.renderer = null;
        this.canvas = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
    
    async init() {
        console.log('Initializing renderer...');
        
        // Get canvas element
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element with id "game-canvas" not found');
        }
        
        // Create WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        
        // Configure renderer
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Set output encoding for better colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Enable physically correct lights
        this.renderer.physicallyCorrectLights = true;
        
        // Set tone mapping for better HDR handling
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Clear color - match plains sky
        this.renderer.setClearColor(0xB5C7D3, 1.0);
        
        console.log('Renderer initialized');
        console.log(`Canvas size: ${this.width}x${this.height}`);
        console.log(`Pixel ratio: ${this.renderer.getPixelRatio()}`);
    }
    
    render(scene, camera) {
        if (this.renderer && scene && camera) {
            this.renderer.render(scene, camera);
        }
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    getAspect() {
        return this.width / this.height;
    }
    
    getSize() {
        return { width: this.width, height: this.height };
    }
    
    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        
        console.log(`Renderer resized to: ${this.width}x${this.height}`);
    }
    
    // Performance monitoring
    getInfo() {
        if (this.renderer) {
            return this.renderer.info;
        }
        return null;
    }
    
    // Screenshot functionality (for future use)
    takeScreenshot() {
        if (this.renderer) {
            return this.renderer.domElement.toDataURL();
        }
        return null;
    }
    
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
            console.log('Renderer disposed');
        }
    }
}
