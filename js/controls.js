// Reference to the global gameState object
let controlsGameState = window.gameState || {};

// Initialize gameState.keys if it doesn't exist
if (!window.gameState || !window.gameState.keys) {
    if (window.gameState) {
        window.gameState.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false
        };
    }
}

// Mouse state
const mouse = {
    x: 0,
    y: 0,
    isDown: false,
    lastX: 0, // Track previous X position for horizontal movement only
    moved: false // Flag to track if mouse has moved this frame
};

// Tank movement parameters
const TANK_SPEED = 5; // units per second
const TANK_ROTATION_SPEED = 2; // radians per second
const TURRET_ROTATION_SPEED = 3; // radians per second
const CANNON_COOLDOWN = 1000; // milliseconds
let lastFireTime = 0;

// Physics parameters
const GRAVITY = 9.8; // Standard gravity (was 2.0)
const INITIAL_VELOCITY = 50; // Adjusted velocity for better trajectory

// Reusable geometries and materials for better performance
const PROJECTILE_GEOMETRIES = {
    shellBody: new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16),
    shellTip: new THREE.ConeGeometry(0.1, 0.4, 16),
    trail: new THREE.CylinderGeometry(0.05, 0.15, 1.0, 16),
    flash: new THREE.SphereGeometry(0.5, 8, 8),
    particle: new THREE.SphereGeometry(0.2, 8, 8)
};

const PROJECTILE_MATERIALS = {
    shellBody: new THREE.MeshPhongMaterial({ 
        color: 0xD2B48C, // Tan color for shell body
        emissive: 0xA0522D, // Brown emissive for subtle glow
        emissiveIntensity: 0.3,
        shininess: 30
    }),
    shellTip: new THREE.MeshPhongMaterial({ 
        color: 0xB8860B, // Dark golden color for shell tip
        shininess: 50
    }),
    trail: new THREE.MeshBasicMaterial({ 
        color: 0xDDDDDD, // Light gray smoke
        transparent: true,
        opacity: 0.7
    }),
    flash: new THREE.MeshBasicMaterial({ 
        color: 0xffcc00,
        transparent: true,
        opacity: 0.8
    }),
    particle: new THREE.MeshBasicMaterial({ 
        color: 0xff4500,
        transparent: true,
        opacity: 0.7
    })
};

// Set up controls
function setupControls(gameState) {
    // Keyboard event listeners
    document.addEventListener('keydown', (event) => {
        updateKeyState(event.key.toLowerCase(), true);
    });
    
    document.addEventListener('keyup', (event) => {
        updateKeyState(event.key.toLowerCase(), false);
    });
    
    // Mouse event listeners
    document.addEventListener('mousemove', (event) => {
        // Store previous X position before updating
        mouse.lastX = mouse.x;
        
        // Update mouse coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update gameState mouse movement
        gameState.mouseMovement.x = mouse.x - mouse.lastX;
        
        // Set moved flag to true
        mouse.moved = true;
    });
    
    document.addEventListener('mousedown', () => {
        mouse.isDown = true;
        gameState.mouseDown = true;
        fireTank(gameState);
    });
    
    document.addEventListener('mouseup', () => {
        mouse.isDown = false;
        gameState.mouseDown = false;
    });
    
    // Return the controls object
    return {
        update: (deltaTime) => updateControls(deltaTime, gameState)
    };
}

// Update key state
function updateKeyState(key, isPressed) {
    if (!window.gameState || !window.gameState.keys) return;
    
    switch (key) {
        case 'w':
            window.gameState.keys.w = isPressed;
            break;
        case 'a':
            window.gameState.keys.a = isPressed;
            break;
        case 's':
            window.gameState.keys.s = isPressed;
            break;
        case 'd':
            window.gameState.keys.d = isPressed;
            break;
        case ' ':
            window.gameState.keys.space = isPressed;
            break;
    }
}

// Update controls
function updateControls(deltaTime, gameState) {
    // Check if gameState is defined
    if (!gameState || !gameState.tank) {
        console.warn("gameState or gameState.tank is undefined in updateControls");
        return;
    }
    
    // Get tank components
    const tankBody = gameState.tank.getObjectByName('tankBody');
    const turret = gameState.tank.getObjectByName('turret');
    
    // Handle tank movement
    let moveForward = 0;
    let rotateAmount = 0;
    
    // Forward/backward movement
    if (gameState.keys.w) moveForward += 1;
    if (gameState.keys.s) moveForward -= 1;
    
    // Left/right rotation
    if (gameState.keys.a) rotateAmount += 1; // Rotate left (positive)
    if (gameState.keys.d) rotateAmount -= 1; // Rotate right (negative)
    
    // Apply tank rotation
    if (rotateAmount !== 0) {
        tankBody.rotation.y += rotateAmount * TANK_ROTATION_SPEED * deltaTime;
    }
    
    // Apply tank movement in its facing direction
    if (moveForward !== 0) {
        // Calculate movement speed based on input and delta time
        const speed = TANK_SPEED * deltaTime * moveForward;
        
        // Calculate movement vector based on tank's rotation
        const moveX = Math.sin(tankBody.rotation.y) * speed;
        const moveZ = Math.cos(tankBody.rotation.y) * speed;
        
        // Store original position in case we need to revert
        const originalPosition = gameState.tank.position.clone();
        
        // Apply movement
        gameState.tank.position.x += moveX;
        gameState.tank.position.z += moveZ;
        
        // Ensure tank stays at correct height
        gameState.tank.position.y = 1.0;
        
        // Check for collisions with environment
        checkEnvironmentCollisions(gameState, originalPosition);
    }
    
    // Ensure tank stays at correct height even if not moving
    gameState.tank.position.y = 1.0;
    
    // Update camera to follow tank
    updateCameraPosition(gameState);
    
    // Handle turret rotation based on horizontal mouse movement only
    if (turret && mouse.moved) {
        // Calculate horizontal mouse movement
        const mouseDeltaX = mouse.x - mouse.lastX;
        
        // Only rotate if there's significant horizontal movement
        if (Math.abs(mouseDeltaX) > 0.001) {
            // Apply rotation based on horizontal movement direction
            turret.rotation.y += mouseDeltaX * TURRET_ROTATION_SPEED;
        }
        
        // Reset the moved flag after processing
        mouse.moved = false;
    }
    
    // Handle continuous firing if mouse is held down
    if (mouse.isDown) {
        fireTank(gameState);
    }
    
    // Update projectiles - pass gameState.scene instead of gameState
    updateProjectiles(gameState.scene, deltaTime);
}

// Handle tank movement and controls
function updateTank(delta) {
    // Check if window.gameState and window.gameState.scene are defined
    if (!window.gameState) {
        console.warn("window.gameState is undefined in updateTank");
        return;
    }
    
    // Update controls
    updateControls(delta, window.gameState);
    
    // Only call functions that require scene if scene is defined and valid
    if (window.gameState.scene && typeof window.gameState.scene.traverse === 'function') {
        updateProjectiles(window.gameState.scene, delta);
        updateExplosions(window.gameState.scene, delta);
        if (window.updateDebris) {
            try {
                window.updateDebris(window.gameState.scene, delta);
            } catch (error) {
                console.warn("Error in updateDebris:", error);
            }
        }
    } else {
        console.warn("window.gameState.scene is undefined or invalid in updateTank");
    }
}

// Update camera position to follow the tank
function updateCameraPosition(gameState) {
    if (!gameState.camera || !gameState.tank) return;
    
    // Position camera behind and above the tank
    const tankBody = gameState.tank.getObjectByName('tankBody');
    if (!tankBody) return;
    
    // Calculate camera position relative to tank
    const cameraHeight = 8;
    const cameraDistance = 15;
    
    // Calculate position behind the tank based on its rotation
    const angle = tankBody.rotation.y;
    const cameraX = gameState.tank.position.x - Math.sin(angle) * cameraDistance;
    const cameraZ = gameState.tank.position.z - Math.cos(angle) * cameraDistance;
    
    // Update camera position
    gameState.camera.position.set(cameraX, cameraHeight, cameraZ);
    gameState.camera.lookAt(gameState.tank.position);
}

// Fire the tank's cannon
function fireTank(gameState) {
    try {
        const currentTime = performance.now();
        
        // Check cooldown
        if (currentTime - lastFireTime < CANNON_COOLDOWN) {
            return;
        }
        
        lastFireTime = currentTime;
        
        // Get turret position and direction
        const turret = gameState.tank.getObjectByName('turret');
        const cannon = gameState.tank.getObjectByName('cannon');
        
        if (!turret || !cannon) {
            console.warn("Turret or cannon not found in fireTank");
            return;
        }
        
        // Get the world position and rotation of the cannon
        const cannonWorldPosition = new THREE.Vector3();
        cannon.getWorldPosition(cannonWorldPosition);
        
        const cannonWorldQuaternion = new THREE.Quaternion();
        cannon.getWorldQuaternion(cannonWorldQuaternion);
        
        // Calculate the tip of the cannon (2 units forward from the cannon's position)
        const cannonTip = new THREE.Vector3(0, 0, 2);
        cannonTip.applyQuaternion(cannonWorldQuaternion);
        cannonTip.add(cannonWorldPosition);
        
        console.log("Firing projectile from position:", cannonTip.x, cannonTip.y, cannonTip.z);
        
        // Create projectile
        const projectile = createProjectile();
        projectile.position.copy(cannonTip);
        
        // Set projectile direction based on cannon orientation with more upward angle for better arc
        const direction = new THREE.Vector3(0, 0.2, 1); // Increased upward component for better arc
        direction.normalize();
        direction.applyQuaternion(cannonWorldQuaternion);
        
        // Store initial position and velocity for ballistic calculation
        projectile.userData.initialPosition = cannonTip.clone();
        projectile.userData.initialVelocity = direction.clone().multiplyScalar(INITIAL_VELOCITY);
        projectile.userData.direction = direction;
        projectile.userData.lifetime = 15; // Increased lifetime for longer travel
        projectile.userData.damage = 40; // Increased damage
        projectile.userData.timeAlive = 0;
        projectile.userData.minimumFlightTime = 0.2;
        
        // Add to scene
        gameState.scene.add(projectile);
        gameState.objects.push(projectile);
        
        // Add muzzle flash effect at the cannon tip
        createMuzzleFlash(cannonTip, direction, gameState.scene);
        
        // Debug message to confirm projectile creation
        console.log("Projectile fired with velocity:", INITIAL_VELOCITY, "and direction:", direction.x, direction.y, direction.z);
    } catch (error) {
        console.warn("Error in fireTank:", error);
    }
}

// Create a muzzle flash effect
function createMuzzleFlash(position, direction, scene) {
    // Create a group for the muzzle flash
    const muzzleFlash = new THREE.Group();
    muzzleFlash.position.copy(position);
    
    // Create the flash light
    const flash = new THREE.Mesh(PROJECTILE_GEOMETRIES.flash, PROJECTILE_MATERIALS.flash.clone());
    muzzleFlash.add(flash);
    
    // Add some particles
    for (let i = 0; i < 10; i++) {
        const particle = new THREE.Mesh(PROJECTILE_GEOMETRIES.particle, PROJECTILE_MATERIALS.particle.clone());
        
        // Random position within flash radius
        particle.position.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        // Add velocity in direction of cannon
        particle.userData.velocity = direction.clone().multiplyScalar(1 + Math.random() * 3);
        particle.userData.lifetime = 0.3; // longer lifetime
        particle.userData.timeAlive = 0;
        
        muzzleFlash.add(particle);
    }
    
    // Add a point light for the flash
    const flashLight = new THREE.PointLight(0xffcc00, 5, 10);
    muzzleFlash.add(flashLight);
    
    // Add to scene
    scene.add(muzzleFlash);
    
    // Add to muzzle flashes array for animation
    if (!scene.userData.muzzleFlashes) {
        scene.userData.muzzleFlashes = [];
    }
    scene.userData.muzzleFlashes.push(muzzleFlash);
    
    // Remove after short duration
    setTimeout(() => {
        scene.remove(muzzleFlash);
        const index = scene.userData.muzzleFlashes.indexOf(muzzleFlash);
        if (index !== -1) {
            scene.userData.muzzleFlashes.splice(index, 1);
        }
    }, 300);
}

// Create a projectile
function createProjectile() {
    // Create projectile geometry and material
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xff8800,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
    });
    
    // Create mesh
    const projectile = new THREE.Mesh(geometry, material);
    
    // Add user data
    projectile.userData.type = 'projectile';
    
    // Add a point light to make it glow
    const light = new THREE.PointLight(0xff8800, 1, 4);
    light.position.set(0, 0, 0);
    projectile.add(light);
    
    // Create a trail effect
    const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.7
    });
    
    // Add 5 trail segments
    for (let i = 0; i < 5; i++) {
        const trailSegment = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 - i * 0.02, 8, 8),
            trailMaterial.clone()
        );
        trailSegment.material.opacity = 0.7 - (i * 0.1);
        trailSegment.userData.trailIndex = i;
        projectile.add(trailSegment);
    }
    
    return projectile;
}

// Update projectile trail effect
function updateProjectileTrail(projectile, deltaTime) {
    // Find the trail mesh
    projectile.children.forEach(child => {
        if (child.material && child.material.transparent && child.material.opacity !== 0.3 && child.material.opacity !== 0.4) {
            // This is the trail - update its opacity based on time
            child.material.opacity = Math.max(0.3, 0.7 - projectile.userData.timeAlive * 0.2); // Faster fade
            
            // Make the trail longer as the projectile moves faster
            child.scale.z = 1 + projectile.userData.timeAlive * 0.5; // Shorter trail
        }
    });
}

// Update projectiles
function updateProjectiles(scene, delta) {
    try {
        if (!scene) {
            console.warn("Invalid scene in updateProjectiles");
            return;
        }
        
        const projectiles = [];
        scene.traverse(function(object) {
            if (object.userData && object.userData.type === 'projectile') {
                projectiles.push(object);
            }
        });

        console.log("Updating", projectiles.length, "projectiles");
        
        for (let i = 0; i < projectiles.length; i++) {
            const projectile = projectiles[i];
            
            // Skip invalid projectiles
            if (!projectile || !projectile.userData) continue;
            
            // Update time alive
            projectile.userData.timeAlive += delta;
            
            // Calculate position using ballistic trajectory formula
            // p = p0 + v0*t + 0.5*a*t^2
            const t = projectile.userData.timeAlive;
            const p0 = projectile.userData.initialPosition;
            const v0 = projectile.userData.initialVelocity;
            
            // Calculate new position with gravity affecting only Y axis
            const newX = p0.x + v0.x * t;
            const newY = p0.y + v0.y * t - 0.5 * GRAVITY * t * t; // Apply gravity to Y axis
            const newZ = p0.z + v0.z * t;
            
            projectile.position.set(newX, newY, newZ);
            
            // Update projectile orientation to match trajectory
            if (projectile.userData.timeAlive > 0.1) {
                // Calculate velocity vector at current time
                const velocity = new THREE.Vector3(
                    v0.x,
                    v0.y - GRAVITY * t, // Gravity affects Y velocity
                    v0.z
                );
                
                // Make projectile point in direction of travel
                if (velocity.length() > 0.001) {
                    const direction = velocity.clone().normalize();
                    projectile.lookAt(projectile.position.clone().add(direction));
                }
            }
            
            // Update trail effect
            updateProjectileTrail(projectile, delta);
            
            // Check for lifetime expiration
            if (projectile.userData.timeAlive >= projectile.userData.lifetime) {
                // Remove projectile
                scene.remove(projectile);
                
                // Dispose of geometry and material
                if (projectile.geometry) projectile.geometry.dispose();
                if (projectile.material) {
                    if (Array.isArray(projectile.material)) {
                        projectile.material.forEach(material => material.dispose());
                    } else {
                        projectile.material.dispose();
                    }
                }
                
                console.log("Projectile removed due to lifetime expiration");
                continue;
            }
            
            // Skip collision check if minimum flight time hasn't elapsed
            if (projectile.userData.timeAlive < projectile.userData.minimumFlightTime) {
                continue;
            }
            
            // Check for collisions with environment
            const collided = checkProjectileCollisions(projectile, scene);
            
            // If collision occurred, the projectile has been removed from the scene
            if (collided) {
                console.log("Projectile collision detected and handled");
            }
        }
    } catch (error) {
        console.warn("Error in updateProjectiles:", error);
    }
}

// Update muzzle flashes
function updateMuzzleFlashes(scene, deltaTime) {
    if (!scene.userData.muzzleFlashes) return;
    
    for (let i = 0; i < scene.userData.muzzleFlashes.length; i++) {
        const flash = scene.userData.muzzleFlashes[i];
        
        // Update each particle
        flash.children.forEach(particle => {
            if (particle.userData && particle.userData.velocity) {
                // Update lifetime
                particle.userData.timeAlive += deltaTime;
                
                // Update position based on velocity
                particle.position.x += particle.userData.velocity.x * deltaTime;
                particle.position.y += particle.userData.velocity.y * deltaTime;
                particle.position.z += particle.userData.velocity.z * deltaTime;
                
                // Fade out based on lifetime
                if (particle.userData.lifetime > 0) {
                    const lifeRatio = particle.userData.timeAlive / particle.userData.lifetime;
                    particle.material.opacity = 0.7 * (1 - lifeRatio);
                }
            } else if (particle.type === 'Mesh') {
                // This is the main flash - fade it out quickly
                particle.material.opacity *= 0.8;
            }
        });
    }
}

// Check for collisions with the environment
function checkEnvironmentCollisions(gameState, originalPosition) {
    try {
        if (!gameState || !gameState.tank) {
            console.warn("Invalid gameState or tank in checkEnvironmentCollisions");
            return;
        }
        
        if (!gameState.scene || typeof gameState.scene.traverse !== 'function') {
            console.warn("Invalid scene in checkEnvironmentCollisions");
            return;
        }
        
        // Tank collision radius
        const tankRadius = 2.0;
        
        // Get all collidable objects
        const collidableObjects = [];
        try {
            gameState.scene.traverse(function(object) {
                if (object && object.userData && (object.userData.destructible !== undefined || object.userData.type === 'boundary')) {
                    collidableObjects.push(object);
                }
            });
        } catch (error) {
            console.warn("Error traversing scene for collision objects:", error);
            return;
        }
        
        // Check for collisions
        let collisionDetected = false;
        
        for (let i = 0; i < collidableObjects.length; i++) {
            const object = collidableObjects[i];
            
            // Skip if it's not a mesh or doesn't have a position
            if (!object || !object.position) continue;
            
            // Calculate distance between tank and object center
            const distance = gameState.tank.position.distanceTo(object.position);
            
            // Get object size for collision detection
            const objectSize = getDefaultObjectSize(object);
            
            // Check if collision occurs
            if (distance < (tankRadius + objectSize)) {
                // Calculate direction away from object
                const direction = new THREE.Vector3()
                    .subVectors(gameState.tank.position, object.position)
                    .normalize();
                
                // Calculate impact velocity based on tank movement
                const tankBody = gameState.tank.getObjectByName('tankBody');
                const tankRotation = tankBody ? tankBody.rotation.y : 0;
                const tankDirection = new THREE.Vector3(
                    Math.sin(tankRotation),
                    0,
                    Math.cos(tankRotation)
                );
                
                // Calculate dot product to determine impact force
                const impactForce = Math.abs(tankDirection.dot(direction.clone().negate()));
                
                // Push tank away from object with more force for head-on collisions
                const pushForce = 0.3 + (impactForce * 0.2);
                gameState.tank.position.x += direction.x * pushForce;
                gameState.tank.position.z += direction.z * pushForce;
                
                // Ensure tank stays at correct height
                gameState.tank.position.y = 1.0;
                
                // If object is destructible, damage it and the tank
                if (object.userData && object.userData.destructible) {
                    // Damage tank - more damage for higher impact force
                    if (typeof window.damageTank === 'function') {
                        try {
                            const tankDamage = Math.floor(5 + (impactForce * 5)); // 5-10 damage based on impact
                            window.damageTank(tankDamage);
                        } catch (error) {
                            console.warn("Error damaging tank:", error);
                        }
                    }
                    
                    // Damage object - more damage for higher impact force
                    if (window.destroyObject && gameState.scene) {
                        try {
                            // Apply damage based on impact force
                            const objectDamage = Math.floor(20 + (impactForce * 20)); // 20-40 damage based on impact
                            object.userData.health = (object.userData.health || 100) - objectDamage;
                            
                            // Call destroyObject to handle the destruction
                            const destroyed = window.destroyObject(object, gameState.scene);
                            
                            // Create explosion effect at impact point
                            if (typeof createExplosion === 'function' && gameState.scene) {
                                // Calculate impact point
                                const impactPoint = new THREE.Vector3().addVectors(
                                    object.position,
                                    direction.clone().negate().multiplyScalar(objectSize * 0.8)
                                );
                                
                                // Create smaller explosion for minor impacts, larger for major ones
                                if (impactForce > 0.7) {
                                    // Major impact - create multiple explosions
                                    createExplosion(impactPoint, gameState.scene);
                                    
                                    // Add a delayed secondary explosion for dramatic effect
                                    setTimeout(() => {
                                        if (gameState.scene) {
                                            createExplosion(
                                                impactPoint.clone().add(new THREE.Vector3(
                                                    (Math.random() - 0.5) * 2,
                                                    1 + Math.random(),
                                                    (Math.random() - 0.5) * 2
                                                )),
                                                gameState.scene
                                            );
                                        }
                                    }, 150);
                                } else if (impactForce > 0.3) {
                                    // Medium impact - create single explosion
                                    createExplosion(impactPoint, gameState.scene);
                                }
                            }
                        } catch (error) {
                            console.warn("Error destroying object:", error);
                        }
                    }
                }
                
                collisionDetected = true;
            }
        }
        
        // If still in collision after adjustments, revert to original position
        if (collisionDetected) {
            // Check if we're still colliding after adjustments
            let stillColliding = false;
            
            for (let i = 0; i < collidableObjects.length; i++) {
                const object = collidableObjects[i];
                if (!object || !object.position) continue;
                
                const distance = gameState.tank.position.distanceTo(object.position);
                const objectSize = getDefaultObjectSize(object);
                
                if (distance < (tankRadius + objectSize)) {
                    stillColliding = true;
                    break;
                }
            }
            
            // If still colliding, revert to original position
            if (stillColliding && originalPosition) {
                gameState.tank.position.copy(originalPosition);
                gameState.tank.position.y = 1.0; // Ensure correct height
            }
        }
    } catch (error) {
        console.warn("Critical error in checkEnvironmentCollisions:", error);
        // Try to recover by reverting to original position if available
        if (gameState && gameState.tank && originalPosition) {
            gameState.tank.position.copy(originalPosition);
            gameState.tank.position.y = 1.0;
        }
    }
}

// Helper function to get default object size for collision detection
function getDefaultObjectSize(object) {
    try {
        // Default size based on object type
        if (object && object.userData) {
            if (object.userData.type === 'tree') return 1.0;
            if (object.userData.type === 'building') return 3.0;
            if (object.userData.type === 'boundary') return 5.0;
        }
        
        // If we have a bounding box, use that
        if (object && object.geometry && typeof object.geometry.computeBoundingBox === 'function') {
            object.geometry.computeBoundingBox();
            const size = new THREE.Vector3();
            object.geometry.boundingBox.getSize(size);
            return Math.max(size.x, size.z) / 2;
        }
        
        // Default fallback size
        return 2.0;
    } catch (error) {
        console.warn("Error calculating object size:", error);
        return 2.0; // Default fallback
    }
}

// Update explosion effects
function updateExplosions(scene, deltaTime) {
    if (!scene.userData.explosions) return;
    
    for (let i = scene.userData.explosions.length - 1; i >= 0; i--) {
        const explosion = scene.userData.explosions[i];
        
        // Update each particle in the explosion
        explosion.children.forEach(particle => {
            if (particle.userData && particle.userData.velocity) {
                // Update lifetime
                particle.userData.timeAlive += deltaTime;
                
                // Update position based on velocity
                particle.position.x += particle.userData.velocity.x * deltaTime;
                particle.position.y += particle.userData.velocity.y * deltaTime;
                particle.position.z += particle.userData.velocity.z * deltaTime;
                
                // Apply gravity
                particle.userData.velocity.y -= 9.8 * deltaTime;
                
                // Fade out based on lifetime
                if (particle.material.transparent) {
                    particle.material.opacity = 0.8 * (1 - particle.userData.timeAlive / particle.userData.lifetime);
                }
            }
        });
        
        // Check if explosion should be removed
        let removeExplosion = true;
        explosion.children.forEach(particle => {
            if (particle.userData && 
                particle.userData.timeAlive < particle.userData.lifetime) {
                removeExplosion = false;
            }
        });
        
        // Remove explosion if all particles have exceeded their lifetime
        if (removeExplosion) {
            scene.remove(explosion);
            scene.userData.explosions.splice(i, 1);
        }
    }
}

// Create an explosion effect
function createExplosion(position, scene) {
    // Create a group for the explosion
    const explosion = new THREE.Group();
    explosion.position.copy(position);
    
    // Add particles
    for (let i = 0; i < 20; i++) {
        const particle = new THREE.Mesh(
            PROJECTILE_GEOMETRIES.particle,
            PROJECTILE_MATERIALS.particle.clone()
        );
        
        // Random position within explosion radius
        particle.position.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        // Random velocity
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            Math.random() * 5,
            (Math.random() - 0.5) * 5
        );
        
        particle.userData.lifetime = 0.5 + Math.random() * 0.5; // 0.5 to 1 second
        particle.userData.timeAlive = 0;
        
        explosion.add(particle);
    }
    
    // Add a point light for the explosion
    const light = new THREE.PointLight(0xff4500, 5, 10);
    light.userData.timeAlive = 0;
    light.userData.lifetime = 0.5; // Half a second
    explosion.add(light);
    
    // Add to scene
    scene.add(explosion);
    
    // Add to explosions array for animation
    if (!scene.userData.explosions) {
        scene.userData.explosions = [];
    }
    scene.userData.explosions.push(explosion);
    
    // Play explosion sound (if available)
    if (window.playSound) {
        window.playSound('explosion');
    }
    
    return explosion;
}

// Check for projectile collisions with environment objects
function checkProjectileCollisions(projectile, scene) {
    try {
        // Skip if scene or projectile is invalid
        if (!scene || !projectile || !projectile.position) {
            console.warn("Invalid scene or projectile in checkProjectileCollisions");
            return false;
        }
        
        // Check for ground collision (y <= 0)
        if (projectile.position.y <= 0) {
            // Create explosion at impact point
            createExplosion(new THREE.Vector3(projectile.position.x, 0, projectile.position.z), scene);
            
            // Remove projectile
            scene.remove(projectile);
            console.log("Projectile hit ground at:", projectile.position.x, 0, projectile.position.z);
            return true;
        }
        
        // Create a small sphere for collision detection
        const projectileRadius = 0.5; // Increased from 0.3 for better collision detection
        
        // Get all objects in the scene that could be hit
        const collidableObjects = [];
        try {
            scene.traverse(function(object) {
                if (object && object.userData && (object.userData.destructible !== undefined || object.userData.type === 'boundary')) {
                    collidableObjects.push(object);
                }
            });
        } catch (error) {
            console.warn("Error traversing scene for collision objects:", error);
            return false;
        }
        
        console.log("Projectile position:", projectile.position.x, projectile.position.y, projectile.position.z);
        console.log("Checking", collidableObjects.length, "objects for collision");
        
        // Check each object for collision
        for (let i = 0; i < collidableObjects.length; i++) {
            const object = collidableObjects[i];
            
            // Skip if it's not a mesh or doesn't have a position
            if (!object || !object.position) continue;
            
            // Calculate distance between projectile and object center
            const distance = projectile.position.distanceTo(object.position);
            
            // Get object size for collision detection
            const objectSize = getDefaultObjectSize(object);
            
            console.log("Object:", object.userData.type, "at position:", object.position.x, object.position.y, object.position.z, "distance:", distance, "size:", objectSize);
            
            if (distance < (projectileRadius + objectSize)) {
                console.log("COLLISION DETECTED with", object.userData.type, "at distance", distance);
                
                // Create explosion at impact point
                createExplosion(projectile.position.clone(), scene);
                
                // Find the parent object if this is a child (like a window or door)
                let targetObject = object;
                while (targetObject.parent && !targetObject.userData.destructible && targetObject.parent.userData) {
                    targetObject = targetObject.parent;
                }
                
                // Damage the object
                if (window.destroyObject && targetObject.userData && targetObject.userData.destructible) {
                    try {
                        console.log("Attempting to destroy object:", targetObject.userData.type);
                        
                        // Apply more damage from projectiles than from tank collisions
                        // Reduce health by 40 points (instead of the default 20)
                        targetObject.userData.health = (targetObject.userData.health || 100) - 40;
                        
                        // Call destroyObject to handle the destruction
                        const destroyed = window.destroyObject(targetObject, scene);
                        console.log("Object destroyed:", destroyed);
                        
                        // If the object is a building, create a larger explosion
                        if (targetObject.userData.type === 'building') {
                            // Create additional explosion for more dramatic effect
                            setTimeout(() => {
                                if (scene) createExplosion(projectile.position.clone().add(new THREE.Vector3(0, 1, 0)), scene);
                            }, 100);
                        }
                    } catch (error) {
                        console.warn("Error destroying object:", error);
                    }
                }
                
                // Remove the projectile
                scene.remove(projectile);
                
                // Return true to indicate collision
                return true;
            }
        }
        
        // No collision
        return false;
    } catch (error) {
        console.warn("Error in checkProjectileCollisions:", error);
        return false;
    }
}

// Expose functions to window object
window.updateTank = function(delta) {
    // Check if window.gameState and window.gameState.scene are defined
    if (!window.gameState) {
        console.warn("window.gameState is undefined in updateTank");
        return;
    }
    
    // Update controls
    updateControls(delta, window.gameState);
    
    // Only call functions that require scene if scene is defined and valid
    if (window.gameState.scene && typeof window.gameState.scene.traverse === 'function') {
        updateProjectiles(window.gameState.scene, delta);
        updateExplosions(window.gameState.scene, delta);
        if (window.updateDebris) {
            try {
                window.updateDebris(window.gameState.scene, delta);
            } catch (error) {
                console.warn("Error in updateDebris:", error);
            }
        }
    } else {
        console.warn("window.gameState.scene is undefined or invalid in updateTank");
    }
};
window.checkEnvironmentCollisions = checkEnvironmentCollisions;
window.getDefaultObjectSize = getDefaultObjectSize;
window.fireTank = fireTank;
window.updateProjectiles = updateProjectiles;
window.createExplosion = createExplosion;
window.updateExplosions = updateExplosions;
window.createProjectile = createProjectile;
window.checkProjectileCollisions = checkProjectileCollisions; 