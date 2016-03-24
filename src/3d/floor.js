var settings = require('../core/settings');
var THREE = require('three');

var undef;

exports.mesh = undef;
exports.init = init;

function init() {
    var geometry = new THREE.PlaneBufferGeometry( 4500, 4500, 10, 10 );
    var planeMaterial = new THREE.MeshStandardMaterial( {
        color: 0x000000,
        roughness: 0.7,
        metalness: 0.2
    } );
    // var planeMaterial = new THREE.MeshNormalMaterial();
    // planeMaterial.color = new THREE.Color();
    var mesh = exports.mesh = new THREE.Mesh( geometry, planeMaterial );

    mesh.rotation.x = -1.57;
    // mesh.castShadow = false;
    mesh.receiveShadow = true;

    // var fn = mesh.render
    // mesh.render = function() {

    // }
}
