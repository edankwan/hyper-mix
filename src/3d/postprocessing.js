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
exports.renderDof = renderDof;
exports.renderMaterial = renderMaterial;

var vignette = exports.vignette = undef;
var fxaa = exports.fxaa = undef;
var dof = exports.dof = undef;
var depth1 = exports.depth1 = undef;

var vs = exports.vs = undef;

var _to;
var _from;
var _renderer;

var _mesh;
var _scene;
var _camera;

var _depth1;
var _depth1Buffer;

function init(renderer) {

    _to = _createRenderTarget();
    _from = _createRenderTarget();
    _depth1 = _createRenderTarget(true, true);

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

    dof = exports.dof = new THREE.RawShaderMaterial({
        uniforms: {
            uResolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
            uDiffuse: { type: 't', value: undef },
            uDistance: { type: 't', value: undef },
            uDofDistance: { type: 'f', value: 0 },
            uDelta: { type: 'v2', value: new THREE.Vector2() },
            uMouse: { type: 'v2', value: settings.mouse },
            uAmount: { type: 'f', value: 1 }
        },
        vertexShader: vs,
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/dof.frag'))
    });

    _depth1Buffer = new Float32Array(4);
    depth1 = exports.depth1 = new THREE.RawShaderMaterial({
        uniforms: {
            uResolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
            uDistance: { type: 't', value: undef },
            uMouse: { type: 'v2', value: settings.mouse }
        },
        vertexShader: vs,
        transparent: true,
        blending: THREE.NoBlending,
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/depth1.frag'))
    });
}

function _createRenderTarget(isRGBA, isFloat) {
    return new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: isRGBA ? THREE.RGBAFormat : THREE.RGBFormat,
        type: isFloat ? THREE.FloatType : THREE.UnsignedByteType
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

function renderDof(toScreen) {
    // var uniforms = dof.uniforms;
    // uniforms.uDiffuse.value = _from;
    // uniforms.uFocusZ.value = settings.dofFocusZ;
    // uniforms.uAmount.value = settings.dof;
    // uniforms.uDistance.value = settings.distanceMap;
    // uniforms.uDelta.value.set(1, 0);
    // renderMaterial(dof);
    // uniforms.uDiffuse.value = _from;
    // uniforms.uDelta.value.set(0, 1);
    // renderMaterial(dof, toScreen);

    var cameraDistance = settings.camera.position.length();
    var distance = cameraDistance;

    if(settings.dofMouse) {
        _mesh.material = depth1;
        depth1.uniforms.uDistance.value = settings.distanceMap;
        _renderer.render( _scene, _camera, _depth1 );
        _renderer.readRenderTargetPixels ( _depth1, 0, 0, 1, 1, _depth1Buffer );
        distance = _depth1Buffer[0] || distance;
    } else {
        distance = settings.dofFocusZ;
    }

    var uniforms = dof.uniforms;
    var prevDistance = uniforms.uDofDistance.value;
    uniforms.uDofDistance.value += (distance - prevDistance) * 0.1;

    uniforms.uDiffuse.value = _from;
    uniforms.uAmount.value = settings.dof;
    uniforms.uDistance.value = settings.distanceMap;
    uniforms.uDelta.value.set(1, 0);
    renderMaterial(dof);
    uniforms.uDiffuse.value = _from;
    uniforms.uDelta.value.set(0, 1);
    renderMaterial(dof, toScreen);
}

function resize(width, height) {
    _to.setSize(width, height);
    _from.setSize(width, height);

    fxaa.uniforms.uResolution.value.set(width, height);
    vignette.uniforms.uResolution.value.set(width, height);
    dof.uniforms.uResolution.value.set(width, height);
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
