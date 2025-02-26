// Game state
const gameState = {
    isPlaying: false,
    armorHealth: 100,
    scene: null,
    camera: null,
    renderer: null,
    tank: null,
    controls: null,
    environment: null,
    lastTime: 0,
    objects: []
};

// DOM Elements
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const exitButton = document.getElementById('exit-button');
const healthFill = document.querySelector('.health-fill');
const gameCanvas = document.getElementById('game-canvas');

// Event Listeners
startButton.addEventListener('click', startGame);
exitButton.addEventListener('click', exitGame);
window.addEventListener('resize', onWindowResize);

// Initialize the game
function init() {
    // Set up Three.js scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Set up camera
    const aspect = window.innerWidth / window.innerHeight;
    gameState.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    
    // Initial camera position will be set after tank is created
    
    // Set up renderer
    gameState.renderer = new THREE.WebGLRenderer({ 
        canvas: gameCanvas,
        antialias: true 
    });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    
    // Add lighting
    addLighting();
    
    // Create environment
    gameState.environment = createEnvironment(gameState.scene);
    
    // Create tank
    gameState.tank = createTank(gameState.scene);
    gameState.tank.position.set(0, 0.5, 0);
    gameState.scene.add(gameState.tank);
    
    // Set up camera to follow tank
    const tankBody = gameState.tank.getObjectByName('tankBody');
    const angle = tankBody ? tankBody.rotation.y : 0;
    gameState.camera.position.set(
        gameState.tank.position.x - Math.sin(angle) * 15,
        8,
        gameState.tank.position.z - Math.cos(angle) * 15
    );
    gameState.camera.lookAt(gameState.tank.position);
    
    // Set up controls
    gameState.controls = setupControls(gameState);
}

// Add lighting to the scene
function addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    gameState.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    gameState.scene.add(directionalLight);
}

// Start the game
function startGame() {
    mainMenu.classList.remove('active');
    gameScreen.classList.add('active');
    gameState.isPlaying = true;
    
    // Initialize if first time
    if (!gameState.scene) {
        init();
    } else {
        // Reset tank position and rotation
        resetTankPosition();
    }
    
    // Reset game state
    gameState.armorHealth = 100;
    updateHealthBar();
    
    // Start animation loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Reset tank position and rotation
function resetTankPosition() {
    if (gameState.tank) {
        // Reset position
        gameState.tank.position.set(0, 0.5, 0);
        
        // Reset rotation
        const tankBody = gameState.tank.getObjectByName('tankBody');
        if (tankBody) {
            tankBody.rotation.y = 0;
        }
        
        // Reset turret rotation
        const turret = gameState.tank.getObjectByName('turret');
        if (turret) {
            turret.rotation.y = 0;
        }
        
        // Update camera position
        const angle = tankBody ? tankBody.rotation.y : 0;
        gameState.camera.position.set(
            gameState.tank.position.x - Math.sin(angle) * 15,
            8,
            gameState.tank.position.z - Math.cos(angle) * 15
        );
        gameState.camera.lookAt(gameState.tank.position);
    }
}

// Exit the game
function exitGame() {
    gameScreen.classList.remove('active');
    mainMenu.classList.add('active');
    gameState.isPlaying = false;
    
    // Clear any existing projectiles
    clearProjectiles();
    
    // Clear any explosions
    clearExplosions();
    
    // Reset tank position for next game
    resetTankPosition();
}

// Clear all projectiles from the scene
function clearProjectiles() {
    // Remove all projectiles from the scene and objects array
    for (let i = gameState.objects.length - 1; i >= 0; i--) {
        const obj = gameState.objects[i];
        if (obj.userData && obj.userData.direction) {
            gameState.scene.remove(obj);
            gameState.objects.splice(i, 1);
        }
    }
}

// Clear all explosions from the scene
function clearExplosions() {
    if (gameState.scene) {
        // Clear explosions
        if (gameState.scene.userData.explosions) {
            // Remove all explosion groups
            for (let i = gameState.scene.userData.explosions.length - 1; i >= 0; i--) {
                const explosion = gameState.scene.userData.explosions[i];
                gameState.scene.remove(explosion);
            }
            gameState.scene.userData.explosions = [];
        }
        
        // Clear muzzle flashes
        if (gameState.scene.userData.muzzleFlashes) {
            // Remove all muzzle flash groups
            for (let i = gameState.scene.userData.muzzleFlashes.length - 1; i >= 0; i--) {
                const flash = gameState.scene.userData.muzzleFlashes[i];
                gameState.scene.remove(flash);
            }
            gameState.scene.userData.muzzleFlashes = [];
        }
    }
}

// Update health bar display
function updateHealthBar() {
    healthFill.style.width = `${gameState.armorHealth}%`;
    
    // Change color based on health
    if (gameState.armorHealth > 60) {
        healthFill.style.backgroundColor = '#4a8';
    } else if (gameState.armorHealth > 30) {
        healthFill.style.backgroundColor = '#fa3';
    } else {
        healthFill.style.backgroundColor = '#e33';
    }
}

// Handle window resize
function onWindowResize() {
    if (gameState.camera && gameState.renderer) {
        gameState.camera.aspect = window.innerWidth / window.innerHeight;
        gameState.camera.updateProjectionMatrix();
        gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Main game loop
function gameLoop(currentTime) {
    if (!gameState.isPlaying) return;
    
    const deltaTime = (currentTime - gameState.lastTime) / 1000;
    gameState.lastTime = currentTime;
    
    // Update controls
    if (gameState.controls) {
        gameState.controls.update(deltaTime);
    }
    
    // Render scene
    gameState.renderer.render(gameState.scene, gameState.camera);
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Check for collisions between objects
function checkCollisions() {
    // Simple collision detection will be implemented here
}

// Damage the tank
function damageTank(amount) {
    gameState.armorHealth -= amount;
    
    if (gameState.armorHealth <= 0) {
        gameState.armorHealth = 0;
        // Game over logic would go here
    }
    
    updateHealthBar();
} 