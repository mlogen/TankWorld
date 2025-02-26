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
    objects: [],
    keys: {}, // Add keys object for controls
    mouseMovement: { x: 0, y: 0 }, // Add mouse movement tracking
    mouseDown: false // Add mouse down state
};

// Expose gameState to window object
window.gameState = gameState;

// DOM Elements
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const exitButton = document.getElementById('exit-button');
const healthFill = document.querySelector('.health-fill');
const gameCanvas = document.getElementById('game-canvas');

// Check WebGL compatibility
function checkWebGLCompatibility() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        // Check if WebGL is available
        if (!gl) {
            showWebGLWarning('WebGL is not supported by your browser. The game may run slowly or not at all.');
            return false;
        }
        
        // Check for hardware acceleration
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer.indexOf('SwiftShader') !== -1 || 
                renderer.indexOf('Software') !== -1 || 
                renderer.indexOf('llvmpipe') !== -1) {
                showWebGLWarning('Hardware acceleration is not enabled. The game will run slowly. Please enable hardware acceleration in your browser settings.');
                return false;
            }
        }
        
        return true;
    } catch (e) {
        console.warn('Error checking WebGL compatibility:', e);
        showWebGLWarning('Could not check WebGL compatibility. The game may run slowly.');
        return false;
    }
}

// Show WebGL warning message
function showWebGLWarning(message) {
    // Create warning element if it doesn't exist
    if (!document.getElementById('webgl-warning')) {
        const warning = document.createElement('div');
        warning.id = 'webgl-warning';
        warning.style.position = 'absolute';
        warning.style.bottom = '10px';
        warning.style.left = '10px';
        warning.style.right = '10px';
        warning.style.backgroundColor = 'rgba(255, 50, 50, 0.8)';
        warning.style.color = 'white';
        warning.style.padding = '10px';
        warning.style.borderRadius = '5px';
        warning.style.zIndex = '1000';
        warning.style.textAlign = 'center';
        warning.style.fontSize = '14px';
        
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '5px';
        closeButton.style.top = '5px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function() {
            warning.style.display = 'none';
        };
        
        warning.appendChild(closeButton);
        document.body.appendChild(warning);
    }
    
    // Update warning message
    const warningElement = document.getElementById('webgl-warning');
    warningElement.textContent = message;
    warningElement.style.display = 'block';
    
    // Add the close button back after changing text content
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.right = '5px';
    closeButton.style.top = '5px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        warningElement.style.display = 'none';
    };
    warningElement.appendChild(closeButton);
}

// Event Listeners
startButton.addEventListener('click', startGame);
exitButton.addEventListener('click', exitGame);
window.addEventListener('resize', onWindowResize);

// Initialize the game
function init() {
    // Check WebGL compatibility before initializing
    checkWebGLCompatibility();
    
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
        antialias: true,
        powerPreference: 'high-performance'
    });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better quality shadows
    
    // Performance optimizations
    gameState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio for better performance
    
    // Check if we're running in software mode and adjust settings
    const gl = gameState.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer.indexOf('SwiftShader') !== -1 || 
            renderer.indexOf('Software') !== -1 || 
            renderer.indexOf('llvmpipe') !== -1) {
            
            // Reduce quality for software rendering
            gameState.renderer.setPixelRatio(1);
            gameState.renderer.shadowMap.enabled = false;
            gameState.renderer.antialias = false;
            
            // Show performance mode message
            console.log("Running in low-performance mode due to software rendering");
        }
    }
    
    // Add lighting
    addLighting();
    
    // Create environment
    gameState.environment = createEnvironment(gameState.scene);
    
    // Create tank
    gameState.tank = createTank(gameState.scene);
    gameState.tank.position.set(0, 1.0, 0);
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
    requestAnimationFrame(animate);
}

// Reset tank position and rotation
function resetTankPosition() {
    if (gameState.tank) {
        // Reset position
        gameState.tank.position.set(0, 1.0, 0);
        
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
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = performance.now();
    const delta = (currentTime - gameState.lastTime) / 1000; // Convert to seconds
    gameState.lastTime = currentTime;
    
    // Update tank and controls
    if (window.updateTank) {
        window.updateTank(delta);
    }
    
    // Update debris - only if scene is defined and valid
    if (window.updateDebris && gameState.scene && typeof gameState.scene.traverse === 'function') {
        window.updateDebris(gameState.scene, delta);
    }
    
    // Render the scene
    if (gameState.renderer && gameState.scene && gameState.camera) {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
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

// Expose damageTank function to window object
window.damageTank = damageTank; 