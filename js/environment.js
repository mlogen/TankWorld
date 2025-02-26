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

// Create the ground
function createGround(width, depth) {
    // Create ground geometry
    const groundGeometry = new THREE.PlaneGeometry(width, depth, 32, 32);
    
    // Create ground material with grass texture
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2e8b57,  // Dark sea green (darker than the previous 0x7cfc00 lawn green)
        side: THREE.DoubleSide,
        flatShading: true
    });
    
    // Create ground mesh
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
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
    const boundaryMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown
    
    // North boundary
    const northBoundary = new THREE.Mesh(
        new THREE.BoxGeometry(100, 5, 2),
        boundaryMaterial
    );
    northBoundary.position.set(0, 2.5, -50);
    northBoundary.receiveShadow = true;
    northBoundary.castShadow = true;
    northBoundary.userData.type = 'boundary';
    northBoundary.userData.destructible = false;
    environment.add(northBoundary);
    
    // South boundary
    const southBoundary = new THREE.Mesh(
        new THREE.BoxGeometry(100, 5, 2),
        boundaryMaterial
    );
    southBoundary.position.set(0, 2.5, 50);
    southBoundary.receiveShadow = true;
    southBoundary.castShadow = true;
    southBoundary.userData.type = 'boundary';
    southBoundary.userData.destructible = false;
    environment.add(southBoundary);
    
    // East boundary
    const eastBoundary = new THREE.Mesh(
        new THREE.BoxGeometry(2, 5, 100),
        boundaryMaterial
    );
    eastBoundary.position.set(50, 2.5, 0);
    eastBoundary.receiveShadow = true;
    eastBoundary.castShadow = true;
    eastBoundary.userData.type = 'boundary';
    eastBoundary.userData.destructible = false;
    environment.add(eastBoundary);
    
    // West boundary
    const westBoundary = new THREE.Mesh(
        new THREE.BoxGeometry(2, 5, 100),
        boundaryMaterial
    );
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

// Update environment objects (for destructible objects)
function updateEnvironment(environment, deltaTime) {
    // This function will be used to update any dynamic environment elements
    // For example, animations for destroyed buildings, falling trees, etc.
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
            createExplosion(projectile.position.clone(), scene);
            
            // Damage the object
            destroyObject(object, scene);
            
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
    // If object has a geometry with a bounding sphere, use that
    if (object.geometry && object.geometry.boundingSphere) {
        return object.geometry.boundingSphere.radius;
    }
    
    // Otherwise estimate based on object type
    switch (object.userData.type) {
        case 'building':
            return 3;
        case 'tree':
            return 2;
        case 'rock':
            return 1;
        case 'boundary':
            return 1;
        default:
            return 1;
    }
}

// Create explosion effect at position
function createExplosion(position, scene) {
    // Create explosion particle group
    const explosionGroup = new THREE.Group();
    explosionGroup.position.copy(position);
    
    // Create several particles for the explosion
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const size = 0.1 + Math.random() * 0.2;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xff4500 : 0xffcc00,
            transparent: true,
            opacity: 0.8
        });
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
    if (!object.userData.destructible) return;
    
    // Reduce health
    object.userData.health -= 20;
    
    // If health is depleted, destroy the object
    if (object.userData.health <= 0) {
        // For buildings, replace with rubble
        if (object.userData.type === 'building') {
            createRubble(object.position, scene);
        }
        
        // Remove the object from the scene
        scene.remove(object);
    }
}

// Create rubble after destroying a building
function createRubble(position, scene) {
    const rubbleGroup = new THREE.Group();
    rubbleGroup.position.copy(position);
    
    // Create several small pieces of rubble
    for (let i = 0; i < 10; i++) {
        const size = 0.3 + Math.random() * 0.5;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const piece = new THREE.Mesh(geometry, material);
        
        // Randomize position within the building footprint
        piece.position.set(
            (Math.random() - 0.5) * 3,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 3
        );
        
        piece.castShadow = true;
        piece.receiveShadow = true;
        rubbleGroup.add(piece);
    }
    
    scene.add(rubbleGroup);
} 