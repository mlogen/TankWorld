# Tank World

A 3D tank game built with vanilla HTML, CSS, and JavaScript using Three.js.

## Version
v0.18

## Description
Tank World is a simple 3D tank game where you control a tank in a countryside environment. The game features basic 3D models for the tank and environment, including destroyable objects like buildings.

## Controls
- **W**: Move forward
- **S**: Move backward
- **A**: Rotate left
- **D**: Rotate right
- **Mouse (Left/Right)**: Rotate turret
- **Mouse Click**: Fire the cannon
- **Exit Button**: Return to main menu

## Features
- 3D tank model with rotating turret
- Basic countryside environment with buildings, trees, and rocks
- Destroyable objects with explosion effects
- Tank armor health system
- Projectile physics with realistic ballistic trajectories
- Camera follows the tank for better gameplay experience
- Muzzle flash and projectile trail effects

## How to Play
1. Open the `index.html` file in a modern web browser
2. Click "Start Game" on the main menu
3. Use WASD to move the tank around the environment
4. Move your mouse left/right to aim the turret and click to fire
5. Destroy buildings and other objects in the environment
6. Click the "Exit" button to return to the main menu

## Technical Details
- Built with vanilla HTML, CSS, and JavaScript
- Uses Three.js for 3D rendering
- No additional dependencies required

## Changelog
### v0.18
- Added performance mode toggle for manual quality adjustments
- Implemented low performance mode with reduced graphics settings
- Added visual indicator when performance mode is active
- Reduced shadow quality and disabled shadows in low performance mode
- Added fog effect in low performance mode to reduce draw distance
- Optimized scene complexity with dynamic mesh quality settings
- Improved renderer settings with automatic pixel ratio adjustment

### v0.17
- Added WebGL compatibility detection to improve performance
- Added warning message when hardware acceleration is not available
- Implemented automatic quality adjustments for software rendering
- Optimized renderer settings with high-performance preference
- Limited pixel ratio for better performance on high-DPI displays
- Added better shadow mapping for improved visual quality
- Improved error handling for WebGL context issues

### v0.16
- Significant performance improvements by reducing excessive logging
- Removed unnecessary console.log statements throughout the codebase
- Reduced the number of debris objects created when destroying buildings and trees
- Added a maximum limit to the number of debris objects that can exist simultaneously
- Optimized the updateDebris function to handle excess debris more efficiently
- Reduced building debris chunks from 15 to 8 and glass shards from 10 to 5
- Reduced tree debris trunk pieces from 5 to 3 and foliage pieces from 8 to 4

### v0.15
- Fixed projectile collision detection to properly destroy objects
- Increased projectile collision radius from 0.3 to 0.5 units
- Added detailed position tracking for projectiles and objects
- Increased projectile damage from 20 to 40 points
- Extended projectile lifetime from 10 to 15 seconds
- Improved projectile orientation to match direction of travel
- Enhanced error handling in object destruction logic

### v0.14
- Added realistic destruction effects for buildings and trees
- Buildings now break into concrete chunks and glass shards when destroyed
- Trees break into trunk pieces and foliage fragments when destroyed
- Added physics simulation for debris with gravity, bouncing, and rotation
- Tank now takes damage when colliding with destructible objects
- Implemented tank collision detection with environment objects
- Added push-back effect when tank collides with objects

### v0.13
- Significant performance optimizations throughout the codebase
- Implemented reusable geometries and materials to reduce memory usage
- Removed unused functions and redundant code
- Optimized object creation with shared resources
- Improved explosion particle system with geometry pooling
- Reduced unnecessary object instantiation during gameplay

### v0.12
- Dramatically increased projectile travel distance by 500%
- Increased initial velocity from 15 to 75 units per second
- Reduced gravity effect for longer projectile arcs
- Maintained realistic parabolic trajectory
- Extended projectile lifetime to 15 seconds
- Adjusted upward angle component for optimal distance
- Enhanced debug logging to show projectile velocity

### v0.11
- Completely redesigned projectile to match realistic tank shell appearance
- Changed projectile color to realistic tan/golden shell colors
- Adjusted projectile size to proper scale relative to tank
- Modified trail effect to look like a subtle smoke trail
- Reduced upward trajectory for more realistic shell path
- Removed excessive glow effects for better realism
- Shortened minimum flight time for more responsive gameplay

### v0.10
- Dramatically improved projectile visibility with pure red color
- Increased projectile size by 3.5x for maximum visibility
- Reduced projectile speed for better tracking
- Added minimum flight time of 0.5 seconds to ensure projectiles are visible
- Enhanced projectile arc with higher trajectory
- Changed grass color to darker green for better contrast
- Improved trail effect with slower fade and longer trail
- Added time alive tracking in debug messages

### v0.09
- Dramatically improved projectile visibility with bright orange-red color
- Increased projectile size by 2.5x for maximum visibility
- Added bright yellow trail effect with longer trail
- Added glowing sphere around projectile for better tracking
- Enhanced lighting with stronger colored lights
- Added position tracking in console for debugging
- Improved trail effect with longer persistence

### v0.08
- Fixed critical bug in projectile detection logic
- Adjusted projectile size to match the tank muzzle width
- Improved projectile model with higher polygon count
- Fixed trail effect detection condition
- Removed glow sphere for more realistic appearance
- Scaled projectile to proper proportions (1.5x)

### v0.07
- Implemented realistic ballistic trajectories for projectiles
- Projectiles now follow a parabolic arc affected by gravity
- Projectiles automatically explode on ground impact
- Increased projectile size to 3x for maximum visibility
- Added a translucent glow sphere around projectiles
- Enhanced muzzle flash with more particles and light
- Improved projectile orientation to follow its trajectory

### v0.06
- Fixed turret rotation to stop when mouse stops moving
- Changed projectile color to black to match the cannon
- Increased projectile size to 2x for better visibility
- Added white lights to projectiles for better contrast
- Improved trail effect detection for more consistent animation

### v0.05
- Fixed turret rotation to only respond to horizontal mouse movement
- Greatly improved projectile visibility with larger, brighter shells
- Added second light source to projectiles for better visibility
- Increased projectile size by 50% for easier tracking
- Adjusted projectile colors to high-contrast gold and orange
- Extended projectile lifetime for better visibility of travel path

### v0.04
- Improved projectile visibility with larger shell model
- Added emissive materials to make projectiles glow
- Adjusted projectile speed for better visibility
- Enhanced projectile trail for better tracking

### v0.03
- Game now resets properly when exiting to menu
- Improved projectile visibility with larger trail effects
- Added muzzle flash effect when firing
- Added point light to projectiles for better visibility
- Increased projectile speed for better gameplay
- Dynamic trail effects that change over time

### v0.02
- Fixed tank movement controls (S now moves backward)
- Fixed tank rotation controls (A/D now rotate correctly)
- Added 3D model for projectiles with trail effects
- Added explosion effects when projectiles hit objects
- Camera now follows the tank for better gameplay experience
- Added collision detection for projectiles

### v0.01
- Initial release
- Basic tank model and controls
- Simple environment with buildings, trees, and rocks
- Basic UI with menu and HUD

## Future Updates
- Enemy tanks
- Game objectives and missions
- Power-ups and upgrades
- Improved physics and collision detection
- Enhanced graphics and effects

## Development
This game is in early development. Future versions will include more features and gameplay elements.

## Credits
Created by [Your Name] 