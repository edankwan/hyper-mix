var settings = require('../core/settings');
var THREE = require('three');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');

var undef;

exports.init = init;
exports.resize = resize;
exports.render = render;
exports.renderFxaa = renderFxaa;
exports.renderVignette = renderVignette;
exports.renderMaterial = renderMaterial;

var vignette = exports.vignette = undef;
var fxaa = exports.fxaa = undef;

var vs = exports.vs = undef;

var _to;
var _from;
var _renderer;

var _mesh;
var _scene;
var _camera;

function init(renderer) {

    _to = _createRenderTarget();
    _from = _createRenderTarget();

    _renderer = renderer;
    _scene = new THREE.Scene();
    _camera = new THREE.Camera();
    _mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), undef );
    _scene.add( _mesh );

    var rawShaderPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n';
    vs = exports.vs =  rawShaderPrefix + shaderParse(glslify('../glsl/quad.vert'));

    fxaa = exports.fxaa = new THREE.RawShaderMaterial({
        uniforms: {
            uResolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
            uDiffuse: { type: 't', value: undef }
        },
        vertexShader: vs,
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/fxaa.frag'))
    });

    vignette = exports.vignette = new THREE.RawShaderMaterial({
        uniforms: {
            uResolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
            uDiffuse: { type: 't', value: undef },
            uReduction: { type: 'f', value: 1.0 },
            uBoost: { type: 'f', value: 1.0 }
        },
        vertexShader: vs,
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/vignette.frag'))
    });
}

function _createRenderTarget() {
    return new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
}

function renderFxaa(toScreen) {
    fxaa.uniforms.uDiffuse.value = _from;
    renderMaterial(fxaa, toScreen);
}

function renderVignette(toScreen) {
    vignette.uniforms.uDiffuse.value = _from;
    renderMaterial(vignette, toScreen);
}

function resize(width, height) {
    _to.setSize(width, height);
    _from.setSize(width, height);

    fxaa.uniforms.uResolution.value.set(width, height);
    vignette.uniforms.uResolution.value.set(width, height);
}

function render(scene, camera, toScreen) {
    if(toScreen) {
        _renderer.render( scene, camera );
    } else {
        _renderer.render( scene, camera, _to );
    }
    var tmp = _to;
    _to = _from;
    _from = tmp;
    return _from;
}

function renderMaterial(material, toScreen) {
    _mesh.material = material;
    render(_scene, _camera, toScreen);;
}
