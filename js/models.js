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
    const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x355e3b }); // Dark green
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Tank tracks
    const trackGeometry = new THREE.BoxGeometry(0.4, 0.4, 3.2);
    const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a }); // Dark gray
    
    const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
    leftTrack.position.set(-1, -0.2, 0);
    leftTrack.castShadow = true;
    leftTrack.receiveShadow = true;
    body.add(leftTrack);
    
    const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
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
    const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    
    // Front wheel
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.z = 1.2;
    frontWheel.castShadow = true;
    track.add(frontWheel);
    
    // Back wheel
    const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    backWheel.rotation.z = Math.PI / 2;
    backWheel.position.z = -1.2;
    backWheel.castShadow = true;
    track.add(backWheel);
    
    // Middle wheel
    const middleWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    middleWheel.rotation.z = Math.PI / 2;
    middleWheel.position.z = 0;
    middleWheel.castShadow = true;
    track.add(middleWheel);
}

// Create the tank turret
function createTankTurret() {
    // Turret base
    const turretGeometry = new THREE.CylinderGeometry(0.7, 0.8, 0.5, 8);
    const turretMaterial = new THREE.MeshPhongMaterial({ color: 0x2d4f2d }); // Slightly lighter green
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.castShadow = true;
    
    // Turret top
    const topGeometry = new THREE.SphereGeometry(0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMaterial = new THREE.MeshPhongMaterial({ color: 0x2d4f2d });
    const top = new THREE.Mesh(topGeometry, topMaterial);
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
    const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 1;
    barrel.castShadow = true;
    cannon.add(barrel);
    
    // Cannon base
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
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
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
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
    // Add windows
    const windowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    const windowMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    // Front windows
    const frontWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow1.position.set(-width/4, 0, depth/2 + 0.01);
    building.add(frontWindow1);
    
    const frontWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    frontWindow2.position.set(width/4, 0, depth/2 + 0.01);
    building.add(frontWindow2);
    
    // Back windows
    const backWindow1 = new THREE.Mesh(windowGeometry, windowMaterial);
    backWindow1.position.set(-width/4, 0, -depth/2 - 0.01);
    backWindow1.rotation.y = Math.PI;
    building.add(backWindow1);
    
    const backWindow2 = new THREE.Mesh(windowGeometry, windowMaterial);
    backWindow2.position.set(width/4, 0, -depth/2 - 0.01);
    backWindow2.rotation.y = Math.PI;
    building.add(backWindow2);
    
    // Add door
    const doorGeometry = new THREE.PlaneGeometry(0.6, 1);
    const doorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8b4513,
        side: THREE.DoubleSide
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -height/4, depth/2 + 0.01);
    building.add(door);
}

// Create a tree
function createTree(height) {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, height, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(height / 2, height, 8);
    const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x2e8b57 }); // Green
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
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