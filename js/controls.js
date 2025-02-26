// Controls state
const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

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
const GRAVITY = 2.0; // Reduced gravity (was 9.8) to make projectiles travel further
const INITIAL_VELOCITY = 75; // Increased velocity by 5x (was 15) for much longer travel distance

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
        
        // Set moved flag to true
        mouse.moved = true;
    });
    
    document.addEventListener('mousedown', () => {
        mouse.isDown = true;
        fireCannon(gameState);
    });
    
    document.addEventListener('mouseup', () => {
        mouse.isDown = false;
    });
    
    // Return the controls object
    return {
        update: (deltaTime) => updateControls(deltaTime, gameState)
    };
}

// Update key state
function updateKeyState(key, isPressed) {
    switch (key) {
        case 'w':
            keysPressed.w = isPressed;
            break;
        case 'a':
            keysPressed.a = isPressed;
            break;
        case 's':
            keysPressed.s = isPressed;
            break;
        case 'd':
            keysPressed.d = isPressed;
            break;
        case ' ':
            keysPressed.space = isPressed;
            break;
    }
}

// Update controls
function updateControls(deltaTime, gameState) {
    if (!gameState.tank) return;
    
    // Get tank components
    const tankBody = gameState.tank.getObjectByName('tankBody');
    const turret = gameState.tank.getObjectByName('turret');
    
    // Handle tank movement
    let moveForward = 0;
    let rotateAmount = 0;
    
    // Forward/backward movement
    if (keysPressed.w) moveForward += 1;
    if (keysPressed.s) moveForward -= 1;
    
    // Left/right rotation
    if (keysPressed.a) rotateAmount += 1; // Rotate left (positive)
    if (keysPressed.d) rotateAmount -= 1; // Rotate right (negative)
    
    // Apply tank rotation
    if (rotateAmount !== 0) {
        tankBody.rotation.y += rotateAmount * TANK_ROTATION_SPEED * deltaTime;
    }
    
    // Apply tank movement in its facing direction
    if (moveForward !== 0) {
        const speed = TANK_SPEED * deltaTime * moveForward;
        // Move in the direction the tank is facing
        gameState.tank.position.x += Math.sin(tankBody.rotation.y) * speed;
        gameState.tank.position.z += Math.cos(tankBody.rotation.y) * speed;
        
        // Check for collisions with environment
        checkEnvironmentCollisions(gameState);
    }
    
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
        fireCannon(gameState);
    }
    
    // Update projectiles
    updateProjectiles(gameState, deltaTime);
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
function fireCannon(gameState) {
    const currentTime = performance.now();
    
    // Check cooldown
    if (currentTime - lastFireTime < CANNON_COOLDOWN) {
        return;
    }
    
    lastFireTime = currentTime;
    
    // Get turret position and direction
    const turret = gameState.tank.getObjectByName('turret');
    const cannon = gameState.tank.getObjectByName('cannon');
    
    if (!turret || !cannon) return;
    
    // Calculate projectile starting position (at the end of the cannon)
    const cannonTip = new THREE.Vector3(0, 0, 2);
    cannonTip.applyQuaternion(cannon.quaternion);
    cannonTip.add(cannon.getWorldPosition(new THREE.Vector3()));
    
    // Create projectile
    const projectile = createProjectile();
    projectile.position.copy(cannonTip);
    
    // Set projectile direction based on cannon orientation with slight upward angle
    const direction = new THREE.Vector3(0, 0.08, 1); // Slightly reduced upward component for longer distance
    direction.normalize();
    direction.applyQuaternion(cannon.getWorldQuaternion(new THREE.Quaternion()));
    
    // Store initial position and velocity for ballistic calculation
    projectile.userData.initialPosition = cannonTip.clone();
    projectile.userData.initialVelocity = direction.clone().multiplyScalar(INITIAL_VELOCITY);
    projectile.userData.direction = direction;
    projectile.userData.lifetime = 15; // Increased lifetime for longer travel distance
    projectile.userData.damage = 20;
    projectile.userData.timeAlive = 0;
    projectile.userData.minimumFlightTime = 0.2;
    
    // Add to scene
    gameState.scene.add(projectile);
    gameState.objects.push(projectile);
    
    // Add muzzle flash effect
    createMuzzleFlash(cannonTip, direction, gameState.scene);
    
    // Debug message to confirm projectile creation
    console.log("Projectile fired from position:", cannonTip, "with velocity:", INITIAL_VELOCITY);
}

// Create a muzzle flash effect
function createMuzzleFlash(position, direction, scene) {
    // Create a group for the muzzle flash
    const muzzleFlash = new THREE.Group();
    muzzleFlash.position.copy(position);
    
    // Create the flash light
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffcc00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    muzzleFlash.add(flash);
    
    // Add some particles
    for (let i = 0; i < 10; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4500,
            transparent: true,
            opacity: 0.7
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
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
    // Create a group for the projectile
    const projectile = new THREE.Group();
    
    // Create the shell body - make it look like a realistic tank shell
    const shellGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16);
    const shellMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xD2B48C, // Tan color for shell body
        emissive: 0xA0522D, // Brown emissive for subtle glow
        emissiveIntensity: 0.3,
        shininess: 30
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.rotation.x = Math.PI / 2; // Rotate to point forward
    shell.castShadow = true;
    projectile.add(shell);
    
    // Create the shell tip - pointed like a real shell
    const tipGeometry = new THREE.ConeGeometry(0.1, 0.4, 16);
    const tipMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xB8860B, // Dark golden color for shell tip
        shininess: 50
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.z = 0.6; // Position at the front
    tip.rotation.x = Math.PI / 2; // Rotate to point forward
    tip.castShadow = true;
    projectile.add(tip);
    
    // Add a small trail effect - more like a smoke trail
    const trailGeometry = new THREE.CylinderGeometry(0.05, 0.15, 1.0, 16);
    const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xDDDDDD, // Light gray smoke
        transparent: true,
        opacity: 0.7
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.z = -0.5; // Position at the back
    trail.rotation.x = Math.PI / 2;
    projectile.add(trail);
    
    // Add a small point light to make the projectile visible
    const light = new THREE.PointLight(0xFF4500, 2, 5); // Subtle light
    light.position.set(0, 0, 0);
    projectile.add(light);
    
    // Scale the projectile to realistic size relative to tank
    projectile.scale.set(1.0, 1.0, 1.0);
    
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
function updateProjectiles(gameState, deltaTime) {
    // Update each projectile in the objects array
    for (let i = gameState.objects.length - 1; i >= 0; i--) {
        const obj = gameState.objects[i];
        
        // Skip if not a projectile
        if (obj.userData.initialVelocity === undefined) continue;
        
        // Debug message to track projectile position
        if (obj.userData.timeAlive % 0.5 < 0.1) {
            console.log("Projectile position:", obj.position, "Time alive:", obj.userData.timeAlive);
        }
        
        // Update lifetime
        obj.userData.timeAlive += deltaTime;
        
        // Remove if lifetime exceeded
        if (obj.userData.timeAlive >= obj.userData.lifetime) {
            gameState.scene.remove(obj);
            gameState.objects.splice(i, 1);
            continue;
        }
        
        // Calculate position based on ballistic trajectory
        const time = obj.userData.timeAlive;
        const initialPos = obj.userData.initialPosition;
        const initialVel = obj.userData.initialVelocity;
        
        // Ballistic equation: position = initialPosition + initialVelocity * time + 0.5 * gravity * time^2
        const newPosition = new THREE.Vector3(
            initialPos.x + initialVel.x * time,
            initialPos.y + initialVel.y * time - 0.5 * GRAVITY * time * time,
            initialPos.z + initialVel.z * time
        );
        
        // Update projectile position
        obj.position.copy(newPosition);
        
        // Calculate current velocity for orientation
        const currentVelocity = new THREE.Vector3(
            initialVel.x,
            initialVel.y - GRAVITY * time,
            initialVel.z
        );
        
        // Orient projectile along velocity vector
        if (currentVelocity.length() > 0) {
            const lookAtPos = new THREE.Vector3().addVectors(newPosition, currentVelocity.normalize());
            obj.lookAt(lookAtPos);
            
            // Adjust rotation to point the projectile along its trajectory
            obj.rotateX(Math.PI / 2);
        }
        
        // Update trail effect
        updateProjectileTrail(obj, deltaTime);
        
        // Check for ground collision (y <= 0)
        if (newPosition.y <= 0 && obj.userData.timeAlive >= obj.userData.minimumFlightTime) {
            // Create explosion at impact point
            createExplosion(new THREE.Vector3(newPosition.x, 0, newPosition.z), gameState.scene);
            
            // Remove projectile
            gameState.scene.remove(obj);
            gameState.objects.splice(i, 1);
            continue;
        } else if (newPosition.y <= 0) {
            // If we hit the ground before minimum flight time, keep the projectile at ground level
            obj.position.y = 0.1;
        }
        
        // Check for collisions with environment objects
        if (obj.userData.timeAlive >= obj.userData.minimumFlightTime && checkProjectileCollisions(obj, gameState.scene)) {
            // Projectile hit something, remove it from the array
            gameState.objects.splice(i, 1);
        }
    }
    
    // Update explosion effects
    updateExplosions(gameState.scene, deltaTime);
    
    // Update muzzle flashes
    updateMuzzleFlashes(gameState.scene, deltaTime);
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
function checkEnvironmentCollisions(gameState) {
    // Simple collision detection will be implemented here
}

// Normalize angle to [-PI, PI]
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
} 