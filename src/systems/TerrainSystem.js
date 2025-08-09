import * as THREE from 'three';

export class TerrainSystem {
    constructor(scene) {
        this.scene = scene;
        this.terrain = null;
        this.rollingHills = [];
        this.mountains = [];
        this.grass = [];
        this.cornFields = [];
        
        // Main terrain settings (immediate area)
        this.terrainSize = 200;
        this.terrainSegments = 128; // Increased for more detail
        this.maxHeight = 3; // Gentle rolling for immediate area
        
        // Rolling hills settings
        this.hillsDistance = 400;
        this.hillsHeight = 20;
        this.hillsCount = 8;
        
        // Mountain settings
        this.mountainDistance = 800;
        this.mountainHeight = 80;
        this.mountainCount = 12;
        
        // Grass settings
        this.grassCount = 3000;
        this.grassSpread = 100;
        this.tallGrassCount = 500;
        this.tallGrassSpread = 30; // Closer to player
        
        // Corn field settings
        this.cornFieldCount = 3;
        this.cornFieldWidth = 30;  // Width of field
        this.cornFieldLength = 60; // Length of field (longer dimension)
        this.cornPlantsPerField = 600;
        
        // Noise settings for terrain generation
        this.noiseScale = 0.08;
        this.octaves = 3;
        this.persistence = 0.6;
        this.lacunarity = 2.0;
    }
    
    async init() {
        console.log('Initializing terrain system...');
        
        // Generate main terrain (immediate area)
        await this.generateTerrain();
        
        // Generate rolling hills in middle distance
        await this.generateRollingHills();
        
        // Generate distant mountains
        await this.generateMountains();
        
        // Generate intermediate terrain features
        await this.generateIntermediateTerrain();
        
        // Generate grass
        await this.generateGrass();
        
        // Generate tall grass around player
        await this.generateTallGrass();
        
        // Generate corn fields
        await this.generateCornFields();
        
        console.log('Terrain system initialized');
    }
    
    async generateTerrain() {
        // Create terrain geometry
        const geometry = new THREE.PlaneGeometry(
            this.terrainSize, 
            this.terrainSize, 
            this.terrainSegments, 
            this.terrainSegments
        );
        
        // Rotate to be horizontal
        geometry.rotateX(-Math.PI / 2);
        
        // Generate height data using noise
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Generate height using simple noise function
            const height = this.generateHeight(x, z);
            vertices[i + 1] = height;
        }
        
        // Recompute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create terrain material - lighter fall plains grass
        const material = new THREE.MeshLambertMaterial({
            color: 0xC2B280, // Light fall plains grass color
            wireframe: false
        });
        
        // Create terrain mesh
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = false;
        
        // Add to scene
        this.scene.add(this.terrain);
        
        console.log('Terrain generated');
    }
    
    async generateRollingHills() {
        // Create rolling hills in the middle distance
        for (let i = 0; i < this.hillsCount; i++) {
            const angle = (i / this.hillsCount) * Math.PI * 2;
            const distance = this.hillsDistance + (Math.random() - 0.5) * 100;
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create hill geometry
            const hillGeometry = new THREE.SphereGeometry(
                60 + Math.random() * 40, // Random size
                16, 8
            );
            
            // Flatten the bottom
            const vertices = hillGeometry.attributes.position.array;
            for (let j = 0; j < vertices.length; j += 3) {
                if (vertices[j + 1] < 0) {
                    vertices[j + 1] = 0;
                }
            }
            hillGeometry.computeVertexNormals();
            
            // Hill material - complementary fall color for distance
            const hillMaterial = new THREE.MeshLambertMaterial({
                color: 0xA69973, // Darker fall color for hills
                transparent: true,
                opacity: 0.8
            });
            
            const hill = new THREE.Mesh(hillGeometry, hillMaterial);
            hill.position.set(x, this.hillsHeight * Math.random(), z);
            hill.scale.y = 0.3 + Math.random() * 0.4; // Vary height
            hill.receiveShadow = true;
            hill.castShadow = true;
            
            this.scene.add(hill);
            this.rollingHills.push(hill);
        }
        
        console.log(`Generated ${this.hillsCount} rolling hills`);
    }
    
    async generateMountains() {
        // Create distant mountain silhouettes
        for (let i = 0; i < this.mountainCount; i++) {
            const angle = (i / this.mountainCount) * Math.PI * 2;
            const distance = this.mountainDistance + (Math.random() - 0.5) * 200;
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create mountain geometry - more angular
            const mountainGeometry = new THREE.ConeGeometry(
                80 + Math.random() * 60, // Base width
                this.mountainHeight + Math.random() * 40, // Height
                6 + Math.floor(Math.random() * 3) // Sides for angular look
            );
            
            // Mountain material - blue-gray for distance atmospheric perspective
            const mountainMaterial = new THREE.MeshLambertMaterial({
                color: 0x4A5A6A, // Blue-gray mountain color
                transparent: true,
                opacity: 0.6,
                fog: true
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(x, this.mountainHeight / 2, z);
            
            // Add some random rotation and scaling
            mountain.rotation.y = Math.random() * Math.PI * 2;
            mountain.scale.x = 0.8 + Math.random() * 0.4;
            mountain.scale.z = 0.8 + Math.random() * 0.4;
            
            mountain.receiveShadow = false; // Too far for shadows
            mountain.castShadow = false;
            
            this.scene.add(mountain);
            this.mountains.push(mountain);
        }
        
        console.log(`Generated ${this.mountainCount} distant mountains`);
    }
    
    async generateIntermediateTerrain() {
        // Create intermediate terrain features to fill the space between hills and mountains
        const intermediateFeatureCount = 15;
        
        for (let i = 0; i < intermediateFeatureCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 400; // Between hills and mountains
            
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create varied terrain features
            const featureType = Math.random();
            
            if (featureType < 0.6) {
                // Small rolling mounds
                const moundGeometry = new THREE.SphereGeometry(
                    20 + Math.random() * 25, // Radius
                    12, 8
                );
                
                // Flatten bottom
                const vertices = moundGeometry.attributes.position.array;
                for (let j = 0; j < vertices.length; j += 3) {
                    if (vertices[j + 1] < 0) {
                        vertices[j + 1] = Math.max(vertices[j + 1], -5);
                    }
                }
                moundGeometry.computeVertexNormals();
                
                const moundMaterial = new THREE.MeshLambertMaterial({
                    color: 0xA69973, // Same as hills but varied
                    transparent: true,
                    opacity: 0.7
                });
                
                const mound = new THREE.Mesh(moundGeometry, moundMaterial);
                mound.position.set(x, Math.random() * 5, z);
                mound.scale.y = 0.2 + Math.random() * 0.3;
                mound.receiveShadow = true;
                mound.castShadow = true;
                
                this.scene.add(mound);
                this.rollingHills.push(mound);
                
            } else {
                // Elongated ridges
                const ridgeGeometry = new THREE.BoxGeometry(
                    40 + Math.random() * 30, // Width
                    8 + Math.random() * 6,   // Height
                    15 + Math.random() * 10  // Depth
                );
                
                const ridgeMaterial = new THREE.MeshLambertMaterial({
                    color: 0x9A8B73, // Slightly different brown
                    transparent: true,
                    opacity: 0.6
                });
                
                const ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
                ridge.position.set(x, 4 + Math.random() * 3, z);
                ridge.rotation.y = Math.random() * Math.PI * 2;
                ridge.receiveShadow = true;
                ridge.castShadow = true;
                
                this.scene.add(ridge);
                this.rollingHills.push(ridge);
            }
        }
        
        console.log(`Generated ${intermediateFeatureCount} intermediate terrain features`);
    }
    
    generateHeight(x, z) {
        // Enhanced terrain generation for more natural variation
        let height = 0;
        let amplitude = this.maxHeight;
        let frequency = this.noiseScale;
        
        // Multiple octaves for natural terrain
        for (let i = 0; i < this.octaves; i++) {
            height += Math.sin(x * frequency) * Math.cos(z * frequency) * amplitude;
            amplitude *= this.persistence;
            frequency *= this.lacunarity;
        }
        
        // Add larger scale variations for rolling terrain
        const largeScale = 0.02;
        height += Math.sin(x * largeScale) * Math.cos(z * largeScale) * 2;
        height += Math.sin(x * largeScale * 1.3) * Math.cos(z * largeScale * 0.7) * 1.5;
        
        // Add medium scale variations
        const mediumScale = 0.05;
        height += Math.sin(x * mediumScale) * Math.cos(z * mediumScale) * 1;
        
        // Distance-based height variation (higher towards edges)
        const distance = Math.sqrt(x * x + z * z);
        const distanceEffect = Math.min(distance * 0.01, 2);
        height += distanceEffect;
        
        // Add some fine detail randomness
        height += (Math.random() - 0.5) * 0.3;
        
        return Math.max(0, height);
    }
    
    async generateGrass() {
        // Create switchgrass patches with different colors
        const grassColors = [
            0xC2B280, // Original fall color
            0xC8A951, // Golden brown
            0xB9A66B, // Muted brown
            0xBDAE6B  // Light brown
        ];
        
        // Create different grass patch types
        for (let colorIndex = 0; colorIndex < grassColors.length; colorIndex++) {
            const patchCount = Math.floor(this.grassCount / grassColors.length);
            
            // Create tall switchgrass blade geometry
            const grassGeometry = new THREE.BoxGeometry(0.02, 1.5, 0.02);
            grassGeometry.translate(0, 0.75, 0); // Move pivot to base
            
            // Create grass material for this color
            const grassMaterial = new THREE.MeshLambertMaterial({
                color: grassColors[colorIndex],
                transparent: true,
                alphaTest: 0.3
            });
            
            // Create instanced mesh for this color
            const instancedGrass = new THREE.InstancedMesh(
                grassGeometry, 
                grassMaterial, 
                patchCount
            );
            
            instancedGrass.castShadow = true;
            instancedGrass.receiveShadow = false;
            
            // Position grass instances in patches
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const rotation = new THREE.Euler();
            const scale = new THREE.Vector3();
            
            for (let i = 0; i < patchCount; i++) {
                // Create patches by grouping grass blades
                const patchCenterX = (Math.random() - 0.5) * this.grassSpread * 2;
                const patchCenterZ = (Math.random() - 0.5) * this.grassSpread * 2;
                
                // Random offset within patch
                const patchRadius = 2;
                const offsetX = (Math.random() - 0.5) * patchRadius;
                const offsetZ = (Math.random() - 0.5) * patchRadius;
                
                position.set(
                    patchCenterX + offsetX,
                    0,
                    patchCenterZ + offsetZ
                );
                
                // Get terrain height at this position
                const terrainHeight = this.getTerrainHeightAt(position.x, position.z);
                position.y = terrainHeight;
                
                // Random rotation for natural look
                rotation.set(
                    (Math.random() - 0.5) * 0.3, // Slight lean
                    Math.random() * Math.PI * 2, // Random Y rotation
                    (Math.random() - 0.5) * 0.3  // Slight lean
                );
                
                // Varied scale for natural variation
                const scaleValue = 0.7 + Math.random() * 0.6;
                scale.set(scaleValue, scaleValue * (0.8 + Math.random() * 0.4), scaleValue);
                
                // Create transformation matrix
                matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
                
                // Set instance matrix
                instancedGrass.setMatrixAt(i, matrix);
            }
            
            // Update instance matrices
            instancedGrass.instanceMatrix.needsUpdate = true;
            
            // Add to scene
            this.scene.add(instancedGrass);
            this.grass.push(instancedGrass);
        }
        
        console.log(`Generated ${this.grassCount} switchgrass blades in ${grassColors.length} colors`);
    }
    
    async generateTallGrass() {
        // Create tall grass blade geometry - taller and thicker
        const tallGrassGeometry = new THREE.ConeGeometry(0.15, 2.5, 4);
        tallGrassGeometry.translate(0, 1.25, 0); // Move pivot to base
        
        // Create tall grass material - same fall color but slightly varied
        const tallGrassMaterial = new THREE.MeshLambertMaterial({
            color: 0xC2B280, // Same fall plains grass color
            transparent: true,
            alphaTest: 0.5
        });
        
        // Create instanced mesh for performance
        const instancedTallGrass = new THREE.InstancedMesh(
            tallGrassGeometry, 
            tallGrassMaterial, 
            this.tallGrassCount
        );
        
        instancedTallGrass.castShadow = true;
        instancedTallGrass.receiveShadow = false;
        
        // Position tall grass instances closer to player
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const scale = new THREE.Vector3();
        
        for (let i = 0; i < this.tallGrassCount; i++) {
            // Random position within tall grass spread (closer to player)
            position.set(
                (Math.random() - 0.5) * this.tallGrassSpread * 2,
                0,
                (Math.random() - 0.5) * this.tallGrassSpread * 2
            );
            
            // Get terrain height at this position
            const terrainHeight = this.getTerrainHeightAt(position.x, position.z);
            position.y = terrainHeight;
            
            // Random rotation
            rotation.set(
                (Math.random() - 0.5) * 0.2, // Slight tilt
                Math.random() * Math.PI * 2, // Random Y rotation
                (Math.random() - 0.5) * 0.1  // Slight Z tilt
            );
            
            // Random scale for variety
            const scaleValue = 0.7 + Math.random() * 0.6; // Taller variation
            scale.set(scaleValue, scaleValue * (0.8 + Math.random() * 0.4), scaleValue);
            
            // Create transformation matrix
            matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
            
            // Set instance matrix
            instancedTallGrass.setMatrixAt(i, matrix);
        }
        
        // Update instance matrices
        instancedTallGrass.instanceMatrix.needsUpdate = true;
        
        // Add to scene
        this.scene.add(instancedTallGrass);
        this.grass.push(instancedTallGrass);
        
        console.log(`Generated ${this.tallGrassCount} tall grass instances around player`);
    }
    
    async generateCornFields() {
        // Create corn field patches around the landscape
        for (let fieldIndex = 0; fieldIndex < this.cornFieldCount; fieldIndex++) {
            // Position corn fields away from player spawn
            const angle = (fieldIndex / this.cornFieldCount) * Math.PI * 2;
            const distance = 60 + Math.random() * 30; // 60-90 units from center
            
            const fieldCenterX = Math.cos(angle) * distance;
            const fieldCenterZ = Math.sin(angle) * distance;
            
            // Store corn field bounds for pheasant spawning
            const fieldBounds = {
                centerX: fieldCenterX,
                centerZ: fieldCenterZ,
                width: this.cornFieldWidth,
                length: this.cornFieldLength,
                minX: fieldCenterX - this.cornFieldWidth / 2,
                maxX: fieldCenterX + this.cornFieldWidth / 2,
                minZ: fieldCenterZ - this.cornFieldLength / 2,
                maxZ: fieldCenterZ + this.cornFieldLength / 2
            };
            this.cornFields.push(fieldBounds);
            
            // Create corn stalk geometry - tall and leafy
            const cornStalkGeometry = new THREE.CylinderGeometry(0.05, 0.08, 3, 6);
            cornStalkGeometry.translate(0, 1.5, 0); // Move pivot to base
            
            // Corn stalk material - green/brown
            const cornMaterial = new THREE.MeshLambertMaterial({
                color: 0x4B8B3B, // Updated green corn color
                transparent: false
            });
            
            // Create corn leaves geometry
            const leafGeometry = new THREE.PlaneGeometry(0.8, 2.5);
            leafGeometry.translate(0, 1.25, 0);
            
            const leafMaterial = new THREE.MeshLambertMaterial({
                color: 0x5D7A2A, // Lighter green for leaves
                transparent: true,
                alphaTest: 0.5,
                side: THREE.DoubleSide
            });
            
            // Create instanced meshes for this field
            const instancedStalks = new THREE.InstancedMesh(
                cornStalkGeometry,
                cornMaterial,
                this.cornPlantsPerField
            );
            
            const instancedLeaves = new THREE.InstancedMesh(
                leafGeometry,
                leafMaterial,
                this.cornPlantsPerField * 2 // 2 leaves per plant
            );
            
            instancedStalks.castShadow = true;
            instancedStalks.receiveShadow = true;
            instancedLeaves.castShadow = true;
            instancedLeaves.receiveShadow = true;
            
            // Position corn plants in rectangular rows
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const rotation = new THREE.Euler();
            const scale = new THREE.Vector3();
            
            const rowSpacing = 1.2;
            const plantSpacing = 0.8;
            
            // Calculate rows and columns for rectangular field
            const numRows = Math.floor(this.cornFieldLength / rowSpacing);
            const numCols = Math.floor(this.cornFieldWidth / plantSpacing);
            const totalPlants = Math.min(numRows * numCols, this.cornPlantsPerField);
            
            let plantIndex = 0;
            let leafIndex = 0;
            
            for (let row = 0; row < numRows && plantIndex < totalPlants; row++) {
                for (let col = 0; col < numCols && plantIndex < totalPlants; col++) {
                    // Calculate position within rectangular field
                    const localX = (col - numCols / 2) * plantSpacing;
                    const localZ = (row - numRows / 2) * rowSpacing;
                    
                    // Add some randomness to avoid perfect grid
                    const offsetX = (Math.random() - 0.5) * 0.3;
                    const offsetZ = (Math.random() - 0.5) * 0.3;
                    
                    position.set(
                        fieldCenterX + localX + offsetX,
                        0,
                        fieldCenterZ + localZ + offsetZ
                    );
                    
                    // Get terrain height
                    const terrainHeight = this.getTerrainHeightAt(position.x, position.z);
                    position.y = terrainHeight;
                    
                    // Corn stalk
                    rotation.set(0, Math.random() * 0.2, 0);
                    const scaleValue = 0.8 + Math.random() * 0.4;
                    scale.set(scaleValue, scaleValue, scaleValue);
                    
                    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
                    instancedStalks.setMatrixAt(plantIndex, matrix);
                    
                    // Add leaves (2 per plant)
                    for (let leafIdx = 0; leafIdx < 2; leafIdx++) {
                        if (leafIndex >= this.cornPlantsPerField * 2) break;
                        
                        const leafRotY = (leafIdx * Math.PI / 2) + Math.random() * 0.5;
                        const leafHeight = 0.3 + leafIdx * 0.4;
                        
                        const leafPos = position.clone();
                        leafPos.y += leafHeight;
                        
                        rotation.set(0, leafRotY, Math.random() * 0.3 - 0.15);
                        scale.set(scaleValue * 0.8, scaleValue, scaleValue * 0.8);
                        
                        matrix.compose(leafPos, new THREE.Quaternion().setFromEuler(rotation), scale);
                        instancedLeaves.setMatrixAt(leafIndex, matrix);
                        leafIndex++;
                    }
                    
                    plantIndex++;
                }
            }
            
            // Update matrices
            instancedStalks.instanceMatrix.needsUpdate = true;
            instancedLeaves.instanceMatrix.needsUpdate = true;
            
            // Add to scene
            this.scene.add(instancedStalks);
            this.scene.add(instancedLeaves);
            this.cornFields.push(instancedStalks);
            this.cornFields.push(instancedLeaves);
        }
        
        console.log(`Generated ${this.cornFieldCount} corn fields`);
    }
    
    getTerrainHeightAt(x, z) {
        // Simple height calculation - in a real implementation, 
        // you'd sample the actual terrain geometry
        return Math.max(0, this.generateHeight(x, z));
    }
    
    // Get the terrain height at world coordinates (for player collision)
    getHeightAt(worldX, worldZ) {
        let height = this.getTerrainHeightAt(worldX, worldZ);
        
        // Check if player is near any rolling hills and adjust height accordingly
        for (let i = 0; i < this.rollingHills.length; i++) {
            const hill = this.rollingHills[i];
            const hillX = hill.position.x;
            const hillZ = hill.position.z;
            const hillRadius = 60 * hill.scale.x; // Approximate radius
            const hillHeight = this.hillsHeight * hill.scale.y;
            
            const distance = Math.sqrt((worldX - hillX) ** 2 + (worldZ - hillZ) ** 2);
            
            if (distance < hillRadius) {
                // Calculate hill height at this position using a smooth falloff
                const hillInfluence = Math.cos((distance / hillRadius) * Math.PI * 0.5);
                const additionalHeight = hillHeight * hillInfluence * hillInfluence;
                height = Math.max(height, hill.position.y + additionalHeight);
            }
        }
        
        return height;
    }
    
    // Check if a position is within any corn field
    isInCornField(x, z) {
        return this.cornFields.some(field => 
            x >= field.minX && x <= field.maxX && 
            z >= field.minZ && z <= field.maxZ
        );
    }
    
    // Get a random position within a corn field
    getRandomCornFieldPosition() {
        if (this.cornFields.length === 0) return null;
        
        const field = this.cornFields[Math.floor(Math.random() * this.cornFields.length)];
        const x = field.minX + Math.random() * field.width;
        const z = field.minZ + Math.random() * field.length;
        const y = this.getHeightAt(x, z) + 0.3;
        
        return new THREE.Vector3(x, y, z);
    }
    
    update(deltaTime) {
        // Animate grass in wind (simple wave effect)
        if (this.grass.length > 0) {
            const time = performance.now() * 0.001;
            
            this.grass.forEach(grassMesh => {
                // Simple wind animation would go here
                // For now, grass is static
            });
        }
    }
    
    dispose() {
        // Dispose terrain
        if (this.terrain) {
            this.scene.remove(this.terrain);
            if (this.terrain.geometry) {
                this.terrain.geometry.dispose();
            }
            if (this.terrain.material) {
                this.terrain.material.dispose();
            }
        }
        
        // Dispose rolling hills
        this.rollingHills.forEach(hill => {
            this.scene.remove(hill);
            if (hill.geometry) {
                hill.geometry.dispose();
            }
            if (hill.material) {
                hill.material.dispose();
            }
        });
        
        // Dispose mountains
        this.mountains.forEach(mountain => {
            this.scene.remove(mountain);
            if (mountain.geometry) {
                mountain.geometry.dispose();
            }
            if (mountain.material) {
                mountain.material.dispose();
            }
        });
        
        // Dispose grass
        this.grass.forEach(grassMesh => {
            this.scene.remove(grassMesh);
            if (grassMesh.geometry) {
                grassMesh.geometry.dispose();
            }
            if (grassMesh.material) {
                grassMesh.material.dispose();
            }
        });
        
        // Dispose corn fields
        this.cornFields.forEach(cornField => {
            this.scene.remove(cornField);
            if (cornField.geometry) {
                cornField.geometry.dispose();
            }
            if (cornField.material) {
                cornField.material.dispose();
            }
        });
        
        this.grass = [];
        this.rollingHills = [];
        this.mountains = [];
        this.cornFields = [];
        
        console.log('Terrain system disposed');
    }
}
