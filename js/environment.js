// Create the game environment
function createEnvironment(scene) {
    // Create a group to hold all environment objects
    const environment = new THREE.Group();
    scene.add(environment);
    
    // Create ground
    const ground = createGround(100, 100);
    environment.add(ground);
    
    // Add buildings
    addBuildings(environment);
    
    // Add trees
    addTrees(environment);
    
    // Add rocks
    addRocks(environment);
    
    // Add boundaries
    addBoundaries(environment);
    
    return environment;
}

// Reference to MODEL_MATERIALS from models.js
// This will be used for debris creation
// Use existing MODEL_MATERIALS if available, otherwise create default materials
if (!window.MODEL_MATERIALS) {
    window.MODEL_MATERIALS = {
        trunk: new THREE.MeshPhongMaterial({ color: 0x8b4513 }), // Brown
        foliage: new THREE.MeshPhongMaterial({ color: 0x2e8b57 }) // Green
    };
}

// Reusable geometries and materials for better performance
const ENVIRONMENT_MATERIALS = {
    ground: new THREE.MeshPhongMaterial({ 
        color: 0x2e8b57,  // Dark sea green
        side: THREE.DoubleSide,
        flatShading: true
    }),
    boundary: new THREE.MeshPhongMaterial({ color: 0x8b4513 }), // Brown
    rock: new THREE.MeshPhongMaterial({ color: 0x808080 }), // Gray
    rubble: new THREE.MeshPhongMaterial({ color: 0x808080 }),
    roof: new THREE.MeshPhongMaterial({ color: 0x8b4513 }) // Brown
};

// Create the ground
function createGround(width, depth) {
    // Create ground geometry
    const groundGeometry = new THREE.PlaneGeometry(width, depth, 32, 32);
    
    // Create ground mesh
    const ground = new THREE.Mesh(groundGeometry, ENVIRONMENT_MATERIALS.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Add some terrain variation
    addTerrainVariation(groundGeometry);
    
    return ground;
}

// Add variation to the terrain
function addTerrainVariation(geometry) {
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        // Skip the edges to keep them flat
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        // Calculate distance from center
        const distance = Math.sqrt(x * x + z * z);
        
        // Only modify points away from the center playing area
        if (distance > 20) {
            // Add some gentle hills
            const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
            positions.setY(i, height);
        }
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
}

// Add buildings to the environment
function addBuildings(environment) {
    // Add a few buildings around the map
    const buildingPositions = [
        { x: 15, z: 15, width: 5, height: 4, depth: 5, color: 0xd3d3d3 },
        { x: -15, z: 15, width: 4, height: 3, depth: 4, color: 0xdeb887 },
        { x: 15, z: -15, width: 6, height: 5, depth: 4, color: 0xbc8f8f },
        { x: -15, z: -15, width: 5, height: 4, depth: 5, color: 0xf5f5dc }
    ];
    
    buildingPositions.forEach(pos => {
        const building = createBuilding(pos.width, pos.height, pos.depth, pos.color);
        building.position.set(pos.x, 0, pos.z);
        building.userData.type = 'building';
        environment.add(building);
    });
}

// Add trees to the environment
function addTrees(environment) {
    // Add trees in various positions
    for (let i = 0; i < 20; i++) {
        // Generate random position (avoiding center area)
        let x, z;
        do {
            x = (Math.random() - 0.5) * 80;
            z = (Math.random() - 0.5) * 80;
        } while (Math.abs(x) < 10 && Math.abs(z) < 10);
        
        const height = 2 + Math.random() * 2;
        const tree = createTree(height);
        tree.position.set(x, 0, z);
        tree.userData.type = 'tree';
        environment.add(tree);
    }
}

// Add rocks to the environment
function addRocks(environment) {
    // Add rocks in various positions
    for (let i = 0; i < 15; i++) {
        // Generate random position (avoiding center area)
        let x, z;
        do {
            x = (Math.random() - 0.5) * 80;
            z = (Math.random() - 0.5) * 80;
        } while (Math.abs(x) < 10 && Math.abs(z) < 10);
        
        const size = 0.5 + Math.random() * 1.5;
        const rock = createRock(size);
        rock.position.x = x;
        rock.position.z = z;
        rock.userData.type = 'rock';
        environment.add(rock);
    }
}

// Add boundaries to the environment
function addBoundaries(environment) {
    // Create geometries for boundaries
    const northSouthGeometry = new THREE.BoxGeometry(100, 5, 2);
    const eastWestGeometry = new THREE.BoxGeometry(2, 5, 100);
    
    // North boundary
    const northBoundary = new THREE.Mesh(northSouthGeometry, ENVIRONMENT_MATERIALS.boundary);
    northBoundary.position.set(0, 2.5, -50);
    northBoundary.receiveShadow = true;
    northBoundary.castShadow = true;
    northBoundary.userData.type = 'boundary';
    northBoundary.userData.destructible = false;
    environment.add(northBoundary);
    
    // South boundary
    const southBoundary = new THREE.Mesh(northSouthGeometry, ENVIRONMENT_MATERIALS.boundary);
    southBoundary.position.set(0, 2.5, 50);
    southBoundary.receiveShadow = true;
    southBoundary.castShadow = true;
    southBoundary.userData.type = 'boundary';
    southBoundary.userData.destructible = false;
    environment.add(southBoundary);
    
    // East boundary
    const eastBoundary = new THREE.Mesh(eastWestGeometry, ENVIRONMENT_MATERIALS.boundary);
    eastBoundary.position.set(50, 2.5, 0);
    eastBoundary.receiveShadow = true;
    eastBoundary.castShadow = true;
    eastBoundary.userData.type = 'boundary';
    eastBoundary.userData.destructible = false;
    environment.add(eastBoundary);
    
    // West boundary
    const westBoundary = new THREE.Mesh(eastWestGeometry, ENVIRONMENT_MATERIALS.boundary);
    westBoundary.position.set(-50, 2.5, 0);
    westBoundary.receiveShadow = true;
    westBoundary.castShadow = true;
    westBoundary.userData.type = 'boundary';
    westBoundary.userData.destructible = false;
    environment.add(westBoundary);
}

// Check if a position is within the game boundaries
function isWithinBoundaries(position, margin = 0) {
    return (
        position.x > -50 + margin &&
        position.x < 50 - margin &&
        position.z > -50 + margin &&
        position.z < 50 - margin
    );
}

// Check for projectile collisions with environment objects
function checkProjectileCollisions(projectile, scene) {
    // Create a small sphere for collision detection
    const projectileRadius = 0.3;
    
    // Get all objects in the scene that could be hit
    const collidableObjects = [];
    scene.traverse(function(object) {
        if (object.userData && (object.userData.destructible !== undefined || object.userData.type === 'boundary')) {
            collidableObjects.push(object);
        }
    });
    
    // Check each object for collision
    for (let i = 0; i < collidableObjects.length; i++) {
        const object = collidableObjects[i];
        
        // Skip if it's not a mesh or doesn't have a position
        if (!object.position) continue;
        
        // Calculate distance between projectile and object center
        const distance = projectile.position.distanceTo(object.position);
        
        // Simple collision detection based on distance
        // This is a simplified approach - for more accuracy, use bounding boxes or spheres
        const objectSize = getObjectSize(object);
        
        if (distance < (projectileRadius + objectSize)) {
            // Collision detected
            console.log("Collision detected in checkProjectileCollisions with:", object);
            
            // Find the parent object if this is a child (like a window or door)
            let targetObject = object;
            while (targetObject.parent && !targetObject.userData.destructible && targetObject.parent.userData) {
                targetObject = targetObject.parent;
            }
            
            createExplosion(projectile.position.clone(), scene);
            
            // Damage the object
            destroyObject(targetObject, scene);
            
            // Remove the projectile
            scene.remove(projectile);
            
            // Return true to indicate collision
            return true;
        }
    }
    
    // No collision
    return false;
}

// Get approximate size of an object for collision detection
function getObjectSize(object) {
    // Get object size based on type
    if (object.userData.type === 'building') return 3.0;
    if (object.userData.type === 'tree') return 1.5;
    if (object.userData.type === 'boundary') return 5.0;
    
    // If no type, try to calculate from geometry
    if (object.geometry && object.geometry.boundingSphere) {
        return object.geometry.boundingSphere.radius;
    }
    
    // Default size
    return 1.0;
}

// Expose functions to window object
window.destroyObject = destroyObject;
window.createExplosion = createExplosion;
window.createDebris = createDebris;
window.updateDebris = updateDebris;
window.getObjectSize = getObjectSize;

// Reusable geometries for explosion particles
const explosionGeometries = [];
for (let i = 0; i < 5; i++) {
    const size = 0.1 + Math.random() * 0.2;
    explosionGeometries.push(new THREE.SphereGeometry(size, 8, 8));
}

// Create explosion effect at position
function createExplosion(position, scene) {
    // Create explosion particle group
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);
    
    // Create several particles for the explosion
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const material = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xff4500 : 0xffcc00,
            transparent: true,
            opacity: 0.8
        });
        // Use a pre-created geometry from the pool
        const geometry = explosionGeometries[i % explosionGeometries.length];
        const particle = new THREE.Mesh(geometry, material);
        
        // Random position within explosion radius
        const radius = 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        // Add random velocity for animation
        particle.userData.velocity = particle.position.clone().normalize().multiplyScalar(2 + Math.random() * 3);
        particle.userData.lifetime = 1; // seconds
        particle.userData.timeAlive = 0;
        
        explosionGroup.add(particle);
    }
    
    // Add to scene
    scene.add(explosionGroup);
    
    // Add to objects array for animation updates
    if (scene.userData.explosions === undefined) {
        scene.userData.explosions = [];
    }
    scene.userData.explosions.push(explosionGroup);
    
    // Set timeout to remove explosion after animation
    setTimeout(() => {
        scene.remove(explosionGroup);
        const index = scene.userData.explosions.indexOf(explosionGroup);
        if (index !== -1) {
            scene.userData.explosions.splice(index, 1);
        }
    }, 1000);
}

// Update explosions
function updateExplosions(scene, deltaTime) {
    if (!scene.userData.explosions) return;
    
    for (let i = 0; i < scene.userData.explosions.length; i++) {
        const explosion = scene.userData.explosions[i];
        
        // Update each particle
        explosion.children.forEach(particle => {
            // Update lifetime
            particle.userData.timeAlive += deltaTime;
            
            // Update position based on velocity
            particle.position.x += particle.userData.velocity.x * deltaTime;
            particle.position.y += particle.userData.velocity.y * deltaTime;
            particle.position.z += particle.userData.velocity.z * deltaTime;
            
            // Fade out based on lifetime
            const lifeRatio = particle.userData.timeAlive / particle.userData.lifetime;
            particle.material.opacity = 0.8 * (1 - lifeRatio);
            
            // Add gravity effect
            particle.userData.velocity.y -= 5 * deltaTime;
        });
    }
}

// Handle object destruction
function destroyObject(object, scene) {
    // Check if the object is destructible and scene is valid
    if (!scene || typeof scene.add !== 'function') {
        console.warn("Invalid scene in destroyObject");
        return false;
    }
    
    if (!object) {
        console.warn("Invalid object in destroyObject");
        return false;
    }
    
    console.log("destroyObject called for:", object.userData ? object.userData.type : "unknown");
    
    if (object && object.userData && object.userData.destructible) {
        // Store object properties before removal
        const position = object.position.clone();
        const scale = object.scale ? object.scale.clone() : new THREE.Vector3(1, 1, 1);
        const type = object.userData.type;
        
        console.log("Object health before damage:", object.userData.health);
        
        // Reduce health
        object.userData.health = (object.userData.health || 100) - 20;
        
        console.log("Object health after damage:", object.userData.health);
        
        // If health is zero or below, destroy the object
        if (object.userData.health <= 0) {
            console.log("Object destroyed completely:", type);
            
            // Create debris based on object type
            if (type === 'building') {
                // Use the advanced building debris function
                createBuildingDebris(position, scale, scene);
            } else if (type === 'tree') {
                // Collect tree parts for more realistic debris
                const treeParts = [];
                object.traverse(function(child) {
                    if (child.isMesh) {
                        treeParts.push(child);
                    }
                });
                
                // Use the advanced tree debris function
                createTreeDebris(position, treeParts, scene);
            }
            
            // Create explosion
            if (typeof createExplosion === 'function') {
                createExplosion(position, scene);
            }
            
            // Remove the object from the scene
            try {
                if (object.parent) {
                    object.parent.remove(object);
                } else {
                    scene.remove(object);
                }
                
                console.log("Object removed from scene");
                
                // Dispose of geometries and materials to free memory
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
                
                // Force garbage collection hint
                if (window.gc) window.gc();
            } catch (error) {
                console.warn("Error removing object from scene:", error);
            }
            
            return true; // Object was destroyed
        } else {
            console.log("Object damaged but not destroyed. Health:", object.userData.health);
            return false; // Object was damaged but not destroyed
        }
    } else {
        console.log("Object is not destructible:", object.userData ? object.userData.type : "unknown");
        return false;
    }
}

// Create debris for destroyed objects
function createDebris(position, size, color) {
    // Create a small cube for debris
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const debris = new THREE.Mesh(geometry, material);
    
    // Position debris near the destroyed object with some randomness
    debris.position.set(
        position.x + (Math.random() - 0.5) * 2,
        position.y + Math.random() * 2,
        position.z + (Math.random() - 0.5) * 2
    );
    
    // Add random rotation
    debris.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    
    // Add physics properties for animation
    debris.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.1
    );
    
    debris.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
    );
    
    debris.userData.gravity = 0.01;
    debris.userData.lifespan = 100; // Frames until removal
    debris.userData.type = 'debris';
    
    return debris;
}

// Update debris physics and animation
function updateDebris(scene, delta) {
    try {
        // Check if scene is defined before trying to traverse it
        if (!scene) {
            console.warn("Scene is undefined in updateDebris");
            return;
        }
        
        // Check if scene.traverse is a function
        if (typeof scene.traverse !== 'function') {
            console.warn("scene.traverse is not a function in updateDebris");
            return;
        }
        
        // Create a safe copy of debris objects to avoid issues with modifying during traversal
        const debrisObjects = [];
        
        try {
            scene.traverse(function(object) {
                if (object && object.userData && object.userData.type === 'debris') {
                    debrisObjects.push(object);
                }
            });
        } catch (error) {
            console.warn("Error traversing scene for debris:", error);
            return;
        }
        
        // Update each debris object
        for (let i = 0; i < debrisObjects.length; i++) {
            const object = debrisObjects[i];
            
            // Skip if object is no longer valid
            if (!object || !object.userData) continue;
            
            try {
                // Apply gravity
                object.userData.velocity.y -= object.userData.gravity;
                
                // Update position
                object.position.x += object.userData.velocity.x;
                object.position.y += object.userData.velocity.y;
                object.position.z += object.userData.velocity.z;
                
                // Update rotation
                object.rotation.x += object.userData.rotationSpeed.x;
                object.rotation.y += object.userData.rotationSpeed.y;
                object.rotation.z += object.userData.rotationSpeed.z;
                
                // Check for ground collision
                if (object.position.y < 0) {
                    object.position.y = 0;
                    object.userData.velocity.y = -object.userData.velocity.y * 0.3; // Bounce with damping
                    object.userData.velocity.x *= 0.8; // Friction
                    object.userData.velocity.z *= 0.8; // Friction
                }
                
                // Reduce lifespan
                object.userData.lifespan--;
                
                // Remove if lifespan is over
                if (object.userData.lifespan <= 0) {
                    try {
                        scene.remove(object);
                        
                        // Dispose of geometry and material
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    } catch (error) {
                        console.warn("Error removing debris:", error);
                    }
                }
            } catch (error) {
                console.warn("Error updating debris object:", error);
                // Try to remove problematic object
                try {
                    scene.remove(object);
                } catch (e) {
                    // Ignore errors when trying to clean up
                }
            }
        }
    } catch (error) {
        console.warn("Critical error in updateDebris:", error);
    }
}

// Create tree debris when a tree is destroyed
function createTreeDebris(position, treeParts, scene) {
    const debrisGroup = new THREE.Group();
    debrisGroup.position.copy(position);
    
    // Create debris for trunk
    const trunkPieces = 5; // Number of trunk pieces
    const trunkMaterial = MODEL_MATERIALS.trunk.clone();
    
    for (let i = 0; i < trunkPieces; i++) {
        // Find the trunk in the tree parts
        let trunkGeometry = null;
        let trunkHeight = 0;
        let trunkRadius = 0.2;
        
        // Use the first cylinder-like geometry as the trunk reference
        treeParts.forEach(part => {
            if (part.geometry && part.geometry.type.includes('Cylinder')) {
                trunkGeometry = part.geometry;
                trunkHeight = part.geometry.parameters.height;
                trunkRadius = part.geometry.parameters.radiusTop;
            }
        });
        
        if (!trunkGeometry) {
            // Default trunk piece if we couldn't find the original
            const pieceGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
            const piece = new THREE.Mesh(pieceGeometry, trunkMaterial);
            
            // Random position and rotation
            piece.position.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Add physics properties
            piece.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 5
            );
            piece.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            );
            piece.userData.lifetime = 3 + Math.random() * 2;
            piece.userData.timeAlive = 0;
            
            debrisGroup.add(piece);
        } else {
            // Create a piece of the trunk
            const pieceHeight = trunkHeight / trunkPieces;
            const pieceGeometry = new THREE.CylinderGeometry(
                trunkRadius, 
                trunkRadius * 0.8, 
                pieceHeight, 
                8
            );
            const piece = new THREE.Mesh(pieceGeometry, trunkMaterial);
            
            // Random position and rotation
            piece.position.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Add physics properties
            piece.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 5
            );
            piece.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            );
            piece.userData.lifetime = 3 + Math.random() * 2;
            piece.userData.timeAlive = 0;
            
            debrisGroup.add(piece);
        }
    }
    
    // Create debris for foliage
    const foliagePieces = 8; // Number of foliage pieces
    const foliageMaterial = MODEL_MATERIALS.foliage.clone();
    
    for (let i = 0; i < foliagePieces; i++) {
        // Create a piece of foliage
        const size = 0.3 + Math.random() * 0.5;
        const pieceGeometry = new THREE.TetrahedronGeometry(size, 1);
        const piece = new THREE.Mesh(pieceGeometry, foliageMaterial);
        
        // Random position and rotation
        piece.position.set(
            (Math.random() - 0.5) * 3,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 3
        );
        piece.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Add physics properties
        piece.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 6 + 3,
            (Math.random() - 0.5) * 6
        );
        piece.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 3 - 1.5,
            Math.random() * 3 - 1.5,
            Math.random() * 3 - 1.5
        );
        piece.userData.lifetime = 2 + Math.random() * 2;
        piece.userData.timeAlive = 0;
        
        debrisGroup.add(piece);
    }
    
    // Add to scene
    scene.add(debrisGroup);
    
    // Add to debris array for animation
    if (!scene.userData.debris) {
        scene.userData.debris = [];
    }
    scene.userData.debris.push(debrisGroup);
}

// Create building debris when a building is destroyed
function createBuildingDebris(position, scale, scene) {
    const debrisGroup = new THREE.Group();
    debrisGroup.position.copy(position);
    
    // Get building dimensions from scale or use defaults
    const width = scale ? scale.x * 5 : 5;
    const height = scale ? scale.y * 4 : 4;
    const depth = scale ? scale.z * 5 : 5;
    
    // Create concrete chunks
    const chunkCount = 15;
    for (let i = 0; i < chunkCount; i++) {
        // Create a concrete chunk
        const size = 0.4 + Math.random() * 0.8;
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Distort the geometry for more realistic debris
        const positions = geometry.attributes.position;
        for (let j = 0; j < positions.count; j++) {
            positions.setXYZ(
                j,
                positions.getX(j) * (0.8 + Math.random() * 0.4),
                positions.getY(j) * (0.8 + Math.random() * 0.4),
                positions.getZ(j) * (0.8 + Math.random() * 0.4)
            );
        }
        positions.needsUpdate = true;
        
        // Create the mesh with a concrete-like material
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc, 
            flatShading: true 
        });
        const chunk = new THREE.Mesh(geometry, material);
        
        // Random position within building dimensions
        chunk.position.set(
            (Math.random() - 0.5) * width,
            Math.random() * height,
            (Math.random() - 0.5) * depth
        );
        
        // Random rotation
        chunk.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Add physics properties
        chunk.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 10 + 5,
            (Math.random() - 0.5) * 8
        );
        chunk.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
        chunk.userData.lifetime = 3 + Math.random() * 2;
        chunk.userData.timeAlive = 0;
        
        chunk.castShadow = true;
        chunk.receiveShadow = true;
        
        debrisGroup.add(chunk);
    }
    
    // Add some window glass shards
    const glassCount = 10;
    for (let i = 0; i < glassCount; i++) {
        // Create a glass shard
        const geometry = new THREE.PlaneGeometry(0.3 + Math.random() * 0.5, 0.3 + Math.random() * 0.5);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            shininess: 100
        });
        const shard = new THREE.Mesh(geometry, material);
        
        // Random position
        shard.position.set(
            (Math.random() - 0.5) * width * 1.5,
            Math.random() * height * 1.5,
            (Math.random() - 0.5) * depth * 1.5
        );
        
        // Random rotation
        shard.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Add physics properties
        shard.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            Math.random() * 8 + 4,
            (Math.random() - 0.5) * 10
        );
        shard.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 3 - 1.5,
            Math.random() * 3 - 1.5,
            Math.random() * 3 - 1.5
        );
        shard.userData.lifetime = 2 + Math.random() * 1;
        shard.userData.timeAlive = 0;
        
        shard.castShadow = true;
        
        debrisGroup.add(shard);
    }
    
    // Add to scene
    scene.add(debrisGroup);
    
    // Add to debris array for animation
    if (!scene.userData.debris) {
        scene.userData.debris = [];
    }
    scene.userData.debris.push(debrisGroup);
} 