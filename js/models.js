// Reusable geometries and materials for better performance
const MODEL_GEOMETRIES = {
    tankBody: new THREE.BoxGeometry(2, 0.8, 3),
    tankTrack: new THREE.BoxGeometry(0.4, 0.4, 3.2),
    wheel: new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8),
    turretBase: new THREE.CylinderGeometry(0.7, 0.8, 0.5, 8),
    turretTop: new THREE.SphereGeometry(0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    cannonBarrel: new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
    cannonBase: new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8),
    window: new THREE.PlaneGeometry(0.5, 0.5),
    door: new THREE.PlaneGeometry(0.6, 1)
};

const MODEL_MATERIALS = {
    tankBody: new THREE.MeshPhongMaterial({ color: 0x355e3b }), // Dark green
    tankTrack: new THREE.MeshPhongMaterial({ color: 0x1a1a1a }), // Dark gray
    turret: new THREE.MeshPhongMaterial({ color: 0x2d4f2d }), // Slightly lighter green
    cannon: new THREE.MeshPhongMaterial({ color: 0x1a1a1a }),
    wheel: new THREE.MeshPhongMaterial({ color: 0x0a0a0a }),
    window: new THREE.MeshPhongMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    }),
    door: new THREE.MeshPhongMaterial({ 
        color: 0x8b4513,
        side: THREE.DoubleSide
    }),
    trunk: new THREE.MeshPhongMaterial({ color: 0x8b4513 }), // Brown
    foliage: new THREE.MeshPhongMaterial({ color: 0x2e8b57 }) // Green
};

// Expose MODEL_MATERIALS to window object for use in other files
window.MODEL_MATERIALS = MODEL_MATERIALS;
window.createTank = createTank;
window.createBuilding = createBuilding;
window.createTree = createTree;
window.createRock = createRock;

// Create a tank model
function createTank() {
    // Create a group to hold all tank parts
    const tank = new THREE.Group();
    
    // Create tank body
    const tankBody = createTankBody();
    tankBody.name = 'tankBody';
    tank.add(tankBody);
    
    // Create tank turret
    const turret = createTankTurret();
    turret.name = 'turret';
    turret.position.y = 0.6;
    tankBody.add(turret);
    
    // Create tank cannon
    const cannon = createTankCannon();
    cannon.name = 'cannon';
    cannon.position.z = 0.5;
    turret.add(cannon);
    
    return tank;
}

// Create the tank body
function createTankBody() {
    // Main body
    const body = new THREE.Mesh(MODEL_GEOMETRIES.tankBody, MODEL_MATERIALS.tankBody);
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Tank tracks
    const leftTrack = new THREE.Mesh(MODEL_GEOMETRIES.tankTrack, MODEL_MATERIALS.tankTrack);
    leftTrack.position.set(-1, -0.2, 0);
    leftTrack.castShadow = true;
    leftTrack.receiveShadow = true;
    body.add(leftTrack);
    
    const rightTrack = new THREE.Mesh(MODEL_GEOMETRIES.tankTrack, MODEL_MATERIALS.tankTrack);
    rightTrack.position.set(1, -0.2, 0);
    rightTrack.castShadow = true;
    rightTrack.receiveShadow = true;
    body.add(rightTrack);
    
    // Add track details (wheels)
    addTrackDetails(leftTrack);
    addTrackDetails(rightTrack);
    
    return body;
}

// Add details to tank tracks
function addTrackDetails(track) {
    // Front wheel
    const frontWheel = new THREE.Mesh(MODEL_GEOMETRIES.wheel, MODEL_MATERIALS.wheel);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.z = 1.2;
    frontWheel.castShadow = true;
    track.add(frontWheel);
    
    // Back wheel
    const backWheel = new THREE.Mesh(MODEL_GEOMETRIES.wheel, MODEL_MATERIALS.wheel);
    backWheel.rotation.z = Math.PI / 2;
    backWheel.position.z = -1.2;
    backWheel.castShadow = true;
    track.add(backWheel);
    
    // Middle wheel
    const middleWheel = new THREE.Mesh(MODEL_GEOMETRIES.wheel, MODEL_MATERIALS.wheel);
    middleWheel.rotation.z = Math.PI / 2;
    middleWheel.position.z = 0;
    middleWheel.castShadow = true;
    track.add(middleWheel);
}

// Create the tank turret
function createTankTurret() {
    // Turret base
    const turret = new THREE.Mesh(MODEL_GEOMETRIES.turretBase, MODEL_MATERIALS.turret);
    turret.castShadow = true;
    
    // Turret top
    const top = new THREE.Mesh(MODEL_GEOMETRIES.turretTop, MODEL_MATERIALS.turret);
    top.position.y = 0.25;
    top.castShadow = true;
    turret.add(top);
    
    return turret;
}

// Create the tank cannon
function createTankCannon() {
    // Cannon group
    const cannon = new THREE.Group();
    
    // Main cannon barrel
    const barrel = new THREE.Mesh(MODEL_GEOMETRIES.cannonBarrel, MODEL_MATERIALS.cannon);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 1;
    barrel.castShadow = true;
    cannon.add(barrel);
    
    // Cannon base
    const base = new THREE.Mesh(MODEL_GEOMETRIES.cannonBase, MODEL_MATERIALS.cannon);
    base.rotation.x = Math.PI / 2;
    base.castShadow = true;
    cannon.add(base);
    
    return cannon;
}

// Create a simple building
function createBuilding(width, height, depth, color) {
    const buildingGroup = new THREE.Group();
    
    // Main structure
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: color || 0xcccccc });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.castShadow = true;
    building.receiveShadow = true;
    building.position.y = height / 2;
    buildingGroup.add(building);
    
    // Add roof
    const roofGeometry = new THREE.BoxGeometry(width + 0.2, 0.2, depth + 0.2);
    const roof = new THREE.Mesh(roofGeometry, MODEL_MATERIALS.door); // Reuse the brown material
    roof.position.y = height + 0.1;
    roof.castShadow = true;
    buildingGroup.add(roof);
    
    // Add windows and doors
    addBuildingDetails(building, width, height, depth);
    
    // Add destructible property
    buildingGroup.userData.destructible = true;
    buildingGroup.userData.health = 100;
    
    return buildingGroup;
}

// Add details to buildings
function addBuildingDetails(building, width, height, depth) {
    // Front windows
    const frontWindow1 = new THREE.Mesh(MODEL_GEOMETRIES.window, MODEL_MATERIALS.window);
    frontWindow1.position.set(-width/4, 0, depth/2 + 0.01);
    building.add(frontWindow1);
    
    const frontWindow2 = new THREE.Mesh(MODEL_GEOMETRIES.window, MODEL_MATERIALS.window);
    frontWindow2.position.set(width/4, 0, depth/2 + 0.01);
    building.add(frontWindow2);
    
    // Back windows
    const backWindow1 = new THREE.Mesh(MODEL_GEOMETRIES.window, MODEL_MATERIALS.window);
    backWindow1.position.set(-width/4, 0, -depth/2 - 0.01);
    backWindow1.rotation.y = Math.PI;
    building.add(backWindow1);
    
    const backWindow2 = new THREE.Mesh(MODEL_GEOMETRIES.window, MODEL_MATERIALS.window);
    backWindow2.position.set(width/4, 0, -depth/2 - 0.01);
    backWindow2.rotation.y = Math.PI;
    building.add(backWindow2);
    
    // Add door
    const door = new THREE.Mesh(MODEL_GEOMETRIES.door, MODEL_MATERIALS.door);
    door.position.set(0, -height/4, depth/2 + 0.01);
    building.add(door);
}

// Create a tree
function createTree(height) {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
    const trunk = new THREE.Mesh(trunkGeometry, MODEL_MATERIALS.trunk);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(height / 2, height, 8);
    const foliage = new THREE.Mesh(foliageGeometry, MODEL_MATERIALS.foliage);
    foliage.position.y = height + (height / 4);
    foliage.castShadow = true;
    treeGroup.add(foliage);
    
    // Add destructible property
    treeGroup.userData.destructible = true;
    treeGroup.userData.health = 50;
    
    return treeGroup;
}

// Create a rock
function createRock(size) {
    const rockGeometry = new THREE.DodecahedronGeometry(size, 1);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Gray
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.y = size / 2;
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    // Randomize the rock shape a bit
    const vertices = rockGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        vertices.setXYZ(
            i,
            vertices.getX(i) * (0.8 + Math.random() * 0.4),
            vertices.getY(i) * (0.8 + Math.random() * 0.4),
            vertices.getZ(i) * (0.8 + Math.random() * 0.4)
        );
    }
    vertices.needsUpdate = true;
    
    // Add destructible property
    rock.userData.destructible = false;
    
    return rock;
} 