var settings = require('../core/settings');
var THREE = require('three');

var undef;

var mesh = exports.mesh = undef;
var pointLight = exports.pointLight = undef;
var spot = exports.spot = undef;
exports.init = init;
exports.update = update;

var _moveTime = 0;

function init() {

    mesh = exports.mesh = new THREE.Object3D();
    // mesh.position.set(0, 0, -1000);
    mesh.position.set(0, 1000, 1000);

    var ambient = new THREE.AmbientLight( 0x333333 );
    mesh.add( ambient );

    // pointLight = exports.pointLight = new THREE.PointLight( 0xffffff, 1, 1000 );
    // pointLight.castShadow = true;
    // pointLight.shadow.camera.near = 10;
    // pointLight.shadow.camera.far = 700;
    // // pointLight.shadow.camera.fov = 90;
    // pointLight.shadow.bias = 0.1;
    // pointLight.shadow.darkness = 0.5;
    // pointLight.shadow.mapSize.width = 4096;
    // pointLight.shadow.mapSize.height = 2048;
    // mesh.add( pointLight );


    spot = exports.spot = new THREE.SpotLight( 0xffffff, 1, 0, Math.PI / 2, 1 );
    spot.target.position.set( 0, -1000, -1000 );

    spot.castShadow = true;

    spot.shadow.camera.near = 50;
    spot.shadow.camera.far = 2500;
    spot.shadow.camera.fov = 120;

    spot.shadow.bias = 0.0003;
    spot.shadow.darkness = 1;

    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 2048;
    mesh.add( spot );


    var directionalLight = new THREE.DirectionalLight( 0xba8b8b, 0.5 );
    directionalLight.position.set( 1, 1, 1 );
    mesh.add( directionalLight );

    var directionalLight2 = new THREE.DirectionalLight( 0x8bbab4, 0.3 );
    directionalLight2.position.set( 1, 1, -1 );
    mesh.add( directionalLight2 );
}

function update(dt, camera) {
    _moveTime += dt * 1.0;
    // mesh.position.z = (1 + Math.sin(_moveTime * 0.002)) * -3000;
}
