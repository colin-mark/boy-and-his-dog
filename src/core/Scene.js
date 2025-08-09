import * as THREE from 'three';

export class Scene {
    constructor() {
        this.scene = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.fog = null;
    }
    
    async init() {
        console.log('Initializing scene...');
        
        // Create the main scene
        this.scene = new THREE.Scene();
        
        // Set up lighting
        this.setupLighting();
        
        // Set up fog for atmosphere
        this.setupFog();
        
        // Set background color - warmer plains sky
        this.scene.background = new THREE.Color(0xB5C7D3); // Pale blue-gray plains sky
        
        console.log('Scene initialized');
    }
    
    setupLighting() {
        // Ambient light for general illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun) - warm sunrise lighting
        this.directionalLight = new THREE.DirectionalLight(0xFFB366, 0.8); // Warm orange sunrise
        this.directionalLight.position.set(50, 30, 50); // Lower angle for sunrise
        this.directionalLight.castShadow = true;
        
        // Configure shadow settings
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.directionalLight);
        
        // Add a subtle helper to visualize the light direction (for debugging)
        // const lightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
        // this.scene.add(lightHelper);
    }
    
    setupFog() {
        // Add atmospheric fog - matches the plains sky
        this.fog = new THREE.Fog(0xB5C7D3, 100, 600); // Longer distance for plains visibility
        this.scene.fog = this.fog;
    }
    
    add(object) {
        if (this.scene) {
            this.scene.add(object);
        }
    }
    
    remove(object) {
        if (this.scene) {
            this.scene.remove(object);
        }
    }
    
    getScene() {
        return this.scene;
    }
    
    // Update lighting based on time of day (future feature)
    updateLighting(timeOfDay = 0.5) {
        if (!this.directionalLight) return;
        
        // timeOfDay: 0 = dawn, 0.5 = noon, 1 = dusk
        const sunAngle = (timeOfDay - 0.5) * Math.PI;
        const sunHeight = Math.sin(timeOfDay * Math.PI);
        
        // Update sun position
        this.directionalLight.position.set(
            Math.cos(sunAngle) * 100,
            sunHeight * 100 + 20,
            Math.sin(sunAngle) * 100
        );
        
        // Update light intensity based on sun height
        const intensity = Math.max(0.2, sunHeight * 0.8 + 0.2);
        this.directionalLight.intensity = intensity;
        
        // Update light color (warmer at dawn/dusk)
        const warmth = Math.abs(timeOfDay - 0.5) * 2;
        const color = new THREE.Color(1, 1 - warmth * 0.2, 1 - warmth * 0.4);
        this.directionalLight.color = color;
        
        // Update ambient light
        this.ambientLight.intensity = Math.max(0.2, sunHeight * 0.4 + 0.2);
    }
    
    dispose() {
        if (this.scene) {
            // Dispose of all objects in the scene
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            
            this.scene.clear();
        }
    }
}
