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
    mouseDown: false, // Add mouse down state
    lowPerformanceMode: false,
    projectiles: [],
    debris: [],
    explosions: [],
    muzzleFlashes: [],
    trees: [],
    buildings: [],
    rocks: [],
    deltaTime: 0,
    mousePosition: { x: 0, y: 0 },
    isMouseDown: false,
    score: 0,
    health: 100,
    ammo: 30,
    gameOver: false,
    paused: false,
    softwareRendering: false
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
        
        // Get detailed renderer information
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        let rendererInfo = "Unknown";
        let vendorInfo = "Unknown";
        
        if (debugInfo) {
            rendererInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            vendorInfo = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            
            // Log detailed GPU information
            console.log("WebGL Renderer:", rendererInfo);
            console.log("WebGL Vendor:", vendorInfo);
            
            // Check for software rendering indicators
            const isSoftwareRenderer = 
                rendererInfo.indexOf('SwiftShader') !== -1 || 
                rendererInfo.indexOf('Software') !== -1 || 
                rendererInfo.indexOf('llvmpipe') !== -1 ||
                rendererInfo.indexOf('Microsoft Basic Render') !== -1 ||
                rendererInfo.indexOf('ANGLE') !== -1 && rendererInfo.indexOf('Direct3D11') === -1;
            
            if (isSoftwareRenderer) {
                showWebGLWarning(`
                    Hardware acceleration may not be fully enabled. 
                    Detected renderer: ${rendererInfo}.
                    Please check your graphics drivers and browser settings.
                    Click "Show Solutions" for troubleshooting steps.
                `, true);
                return false;
            }
        } else {
            console.warn("WEBGL_debug_renderer_info extension not available");
        }
        
        // Check WebGL capabilities
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
        
        console.log("WebGL Capabilities:");
        console.log("- Max Texture Size:", maxTextureSize);
        console.log("- Max Viewport Dimensions:", maxViewportDims);
        
        // Check for WebGL2 support
        const gl2 = canvas.getContext('webgl2');
        console.log("WebGL2 Support:", gl2 ? "Yes" : "No");
        
        return true;
    } catch (e) {
        console.warn('Error checking WebGL compatibility:', e);
        showWebGLWarning('Could not check WebGL compatibility. The game may run slowly.');
        return false;
    }
}

// Show WebGL warning message
function showWebGLWarning(message, showSolutions = false) {
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
        
        document.body.appendChild(warning);
    }
    
    // Update warning message
    const warningElement = document.getElementById('webgl-warning');
    
    // Clear previous content
    warningElement.innerHTML = '';
    
    // Add message
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = message;
    warningElement.appendChild(messageDiv);
    
    // Add solutions button if requested
    if (showSolutions) {
        const solutionsButton = document.createElement('button');
        solutionsButton.textContent = 'Show Solutions';
        solutionsButton.style.marginTop = '10px';
        solutionsButton.style.padding = '5px 10px';
        solutionsButton.style.backgroundColor = '#4a8';
        solutionsButton.style.color = 'white';
        solutionsButton.style.border = 'none';
        solutionsButton.style.borderRadius = '3px';
        solutionsButton.style.cursor = 'pointer';
        
        solutionsButton.onclick = function() {
            showWebGLSolutions();
        };
        
        warningElement.appendChild(solutionsButton);
    }
    
    // Add close button
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
    warningElement.style.display = 'block';
}

// Show WebGL solutions dialog
function showWebGLSolutions() {
    // Create solutions dialog if it doesn't exist
    if (!document.getElementById('webgl-solutions')) {
        const solutions = document.createElement('div');
        solutions.id = 'webgl-solutions';
        solutions.style.position = 'fixed';
        solutions.style.top = '50%';
        solutions.style.left = '50%';
        solutions.style.transform = 'translate(-50%, -50%)';
        solutions.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        solutions.style.color = 'white';
        solutions.style.padding = '20px';
        solutions.style.borderRadius = '10px';
        solutions.style.zIndex = '2000';
        solutions.style.width = '80%';
        solutions.style.maxWidth = '600px';
        solutions.style.maxHeight = '80%';
        solutions.style.overflow = 'auto';
        solutions.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        
        // Add solutions content
        solutions.innerHTML = `
            <h2 style="color: #4a8; text-align: center; margin-top: 0;">WebGL Troubleshooting</h2>
            
            <h3>1. Update Graphics Drivers</h3>
            <p>Outdated graphics drivers are the most common cause of WebGL issues:</p>
            <ul>
                <li><a href="https://www.nvidia.com/Download/index.aspx" target="_blank" style="color: #4a8;">NVIDIA Drivers</a></li>
                <li><a href="https://www.amd.com/en/support" target="_blank" style="color: #4a8;">AMD Drivers</a></li>
                <li><a href="https://www.intel.com/content/www/us/en/download-center/home.html" target="_blank" style="color: #4a8;">Intel Drivers</a></li>
            </ul>
            
            <h3>2. Check Browser Settings</h3>
            <p>Ensure hardware acceleration is properly enabled:</p>
            <ul>
                <li><strong>Chrome:</strong> Settings → System → "Use hardware acceleration when available"</li>
                <li><strong>Edge:</strong> Settings → System and performance → "Use hardware acceleration when available"</li>
                <li><strong>Firefox:</strong> Settings → Performance → "Use hardware acceleration when available"</li>
            </ul>
            
            <h3>3. Check Windows Settings</h3>
            <p>Make sure your browser is using your dedicated GPU:</p>
            <ol>
                <li>Right-click on desktop → NVIDIA Control Panel or AMD Radeon Settings</li>
                <li>Find program settings and add your browser</li>
                <li>Set it to use the high-performance GPU</li>
            </ol>
            
            <h3>4. Try a Different Browser</h3>
            <p>Some browsers have better WebGL support than others. Try Chrome, Firefox, or Edge.</p>
            
            <h3>5. Disable Browser Extensions</h3>
            <p>Some extensions can interfere with WebGL. Try disabling them or using incognito mode.</p>
            
            <h3>6. Check for Hardware Issues</h3>
            <p>Run the <a href="https://get.webgl.org/" target="_blank" style="color: #4a8;">WebGL test page</a> to see if your system supports WebGL properly.</p>
            
            <h3>7. Force Hardware Acceleration in Chrome</h3>
            <p>Type <code>chrome://flags</code> in the address bar and enable:</p>
            <ul>
                <li>"Override software rendering list"</li>
                <li>"GPU rasterization"</li>
                <li>"Zero-copy rasterizer"</li>
            </ul>
            
            <h3>8. Check System Information</h3>
            <p>Your detected renderer: <span id="renderer-info" style="color: yellow;">Checking...</span></p>
            <p>Your detected vendor: <span id="vendor-info" style="color: yellow;">Checking...</span></p>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.display = 'block';
        closeButton.style.margin = '20px auto 0';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#4a8';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.onclick = function() {
            solutions.style.display = 'none';
        };
        
        solutions.appendChild(closeButton);
        document.body.appendChild(solutions);
        
        // Update renderer info
        setTimeout(() => {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        document.getElementById('renderer-info').textContent = renderer;
                        document.getElementById('vendor-info').textContent = vendor;
                    } else {
                        document.getElementById('renderer-info').textContent = "Could not detect (WEBGL_debug_renderer_info not available)";
                        document.getElementById('vendor-info').textContent = "Could not detect (WEBGL_debug_renderer_info not available)";
                    }
                }
            } catch (e) {
                console.error("Error getting WebGL info:", e);
            }
        }, 100);
    }
    
    // Show the solutions dialog
    document.getElementById('webgl-solutions').style.display = 'block';
}

// Event Listeners
startButton.addEventListener('click', startGame);
exitButton.addEventListener('click', exitGame);
window.addEventListener('resize', onWindowResize);

// Initialize the game
function init() {
    try {
        // Check WebGL compatibility first
        checkWebGLCompatibility();
        
        // Set up Three.js scene
        gameState.scene = new THREE.Scene();
        gameState.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
        
        // Set up camera
        const aspect = window.innerWidth / window.innerHeight;
        gameState.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        
        // Initial camera position will be set after tank is created
        
        // Set up renderer with better error handling
        try {
            gameState.renderer = new THREE.WebGLRenderer({ 
                canvas: gameCanvas,
                antialias: true,
                powerPreference: 'high-performance',
                failIfMajorPerformanceCaveat: false // Don't fail on performance issues
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
                console.log("Using renderer:", renderer);
                
                // Check for software rendering or other problematic renderers
                if (renderer.indexOf('SwiftShader') !== -1 || 
                    renderer.indexOf('Software') !== -1 || 
                    renderer.indexOf('llvmpipe') !== -1 ||
                    renderer.indexOf('Microsoft Basic Render') !== -1) {
                    
                    // Reduce quality for software rendering
                    gameState.softwareRendering = true;
                    gameState.lowPerformanceMode = true;
                    enableLowPerformanceMode();
                    console.log("Automatically enabled low-performance mode due to software rendering");
                }
            }
            
        } catch (e) {
            console.error("Error creating WebGL renderer:", e);
            showWebGLWarning("Failed to create WebGL renderer. Your browser may not support WebGL.", true);
            
            // Try to create a simpler renderer as fallback
            try {
                gameState.renderer = new THREE.WebGLRenderer({ 
                    canvas: gameCanvas,
                    antialias: false,
                    precision: 'lowp',
                    powerPreference: 'low-power'
                });
                gameState.renderer.setSize(window.innerWidth, window.innerHeight);
                gameState.renderer.shadowMap.enabled = false;
                gameState.renderer.setPixelRatio(1);
                
                gameState.softwareRendering = true;
                gameState.lowPerformanceMode = true;
                enableLowPerformanceMode();
                console.log("Using fallback renderer with minimal settings");
            } catch (fallbackError) {
                console.error("Failed to create fallback renderer:", fallbackError);
                showWebGLWarning("Your browser does not support WebGL. The game cannot run.", true);
                return; // Exit initialization
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
        
        // Add performance mode toggle
        addPerformanceModeToggle();
        
        // Start animation loop if we're playing
        if (gameState.isPlaying) {
            gameState.lastTime = performance.now();
            requestAnimationFrame(animate);
        }
    } catch (error) {
        console.error("Error initializing game:", error);
        showWebGLWarning("Failed to initialize game: " + error.message, true);
    }
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

// Add performance mode toggle to the HUD
function addPerformanceModeToggle() {
    const performanceToggle = document.createElement('div');
    performanceToggle.id = 'performance-toggle';
    performanceToggle.style.position = 'absolute';
    performanceToggle.style.bottom = '10px';
    performanceToggle.style.right = '10px';
    performanceToggle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    performanceToggle.style.color = 'white';
    performanceToggle.style.padding = '5px 10px';
    performanceToggle.style.borderRadius = '5px';
    performanceToggle.style.cursor = 'pointer';
    performanceToggle.style.zIndex = '100';
    performanceToggle.style.fontSize = '12px';
    performanceToggle.style.userSelect = 'none';
    performanceToggle.textContent = 'Performance Mode: ' + (gameState.lowPerformanceMode ? 'ON' : 'OFF');
    
    performanceToggle.addEventListener('click', function() {
        gameState.lowPerformanceMode = !gameState.lowPerformanceMode;
        
        if (gameState.lowPerformanceMode) {
            enableLowPerformanceMode();
        } else {
            disableLowPerformanceMode();
        }
        
        performanceToggle.textContent = 'Performance Mode: ' + (gameState.lowPerformanceMode ? 'ON' : 'OFF');
    });
    
    document.body.appendChild(performanceToggle);
}

// Enable low performance mode
function enableLowPerformanceMode() {
    gameState.lowPerformanceMode = true;
    
    if (gameState.renderer) {
        // Reduce pixel ratio
        gameState.renderer.setPixelRatio(1);
        
        // Disable shadows
        gameState.renderer.shadowMap.enabled = false;
        
        // Disable antialiasing if possible
        if (gameState.renderer.getContext) {
            try {
                const gl = gameState.renderer.getContext();
                gl.disable(gl.SAMPLE_COVERAGE);
                gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
            } catch (e) {
                console.warn("Could not disable antialiasing:", e);
            }
        }
    }
    
    // Reduce scene complexity
    if (gameState.scene) {
        // Reduce draw distance by adding fog
        gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
        
        // Reduce shadow quality
        gameState.scene.traverse(function(object) {
            if (object.isMesh) {
                object.castShadow = false;
                object.receiveShadow = false;
            }
            if (object.isLight) {
                object.castShadow = false;
            }
        });
    }
    
    // Show performance mode indicator
    const indicator = document.createElement('div');
    indicator.id = 'performance-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '10px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '100';
    indicator.style.fontSize = '12px';
    indicator.style.pointerEvents = 'none';
    indicator.textContent = 'Low Performance Mode Active';
    
    // Remove existing indicator if present
    const existingIndicator = document.getElementById('performance-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    document.body.appendChild(indicator);
    
    console.log("Low performance mode enabled");
}

// Disable low performance mode
function disableLowPerformanceMode() {
    gameState.lowPerformanceMode = false;
    
    if (gameState.renderer) {
        // Restore pixel ratio
        gameState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        // Enable shadows
        gameState.renderer.shadowMap.enabled = true;
    }
    
    // Restore scene complexity
    if (gameState.scene) {
        // Remove fog
        gameState.scene.fog = null;
        
        // Restore shadow quality
        gameState.scene.traverse(function(object) {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
            if (object.isLight && object.type === 'DirectionalLight') {
                object.castShadow = true;
            }
        });
    }
    
    // Remove performance mode indicator
    const indicator = document.getElementById('performance-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    console.log("Low performance mode disabled");
} 