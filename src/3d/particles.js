var settings = require('../core/settings');
var THREE = require('three');
var shaderParse = require('../helpers/shaderParse');
var glslify = require('glslify');
var simulator = require('./simulator');
var lights = require('./lights');
var floor = require('./floor');
var postprocessing = require('./postprocessing');
var math = require('../utils/math');

var undef;

var mesh = exports.mesh = undef;
exports.init = init;
exports.resize = resize;
exports.preRender = preRender;
exports.update = update;

var _renderer;
var _camera;
var _scene;
var _particleGeometry;

var _quadScene;
var _quadCamera;
var _shadowMatrial;

var _particles;
var _particlesMaterial;
var _particlesScene;
var _depthRenderTarget;
var _additiveRenderTarget;

var _blurHMaterial;
var _blurVMaterial;
var _blurRenderTarget;

var _resolution;
var _width;
var _height;

var TEXTURE_WIDTH = settings.simulatorTextureWidth;
var TEXTURE_HEIGHT = settings.simulatorTextureHeight;
var AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT;

function init(renderer, camera, scene) {

    _quadCamera = new THREE.Camera();
    _quadCamera.position.z = 1;
    _particlesScene = new THREE.Scene();
    _quadScene = new THREE.Scene();
    _camera = camera;
    _scene = scene;
    _renderer = renderer;
    _resolution = new THREE.Vector2();

    _initGeometry();
    _initDepthRenderTarget();
    _initAdditiveRenderTarget();
    _initBlurRenderTarget();

    _particles = new THREE.Points(_particleGeometry, _additiveRenderTarget.material);
    _particles.frustumCulled = false;

    var geomtry =  new THREE.PlaneBufferGeometry( 2, 2 );
    var uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.ambient, THREE.UniformsLib.lights]);
    uniforms.uTime = {type: 't', value: 0};
    uniforms.uDepth = {type: 't', value: _depthRenderTarget};
    uniforms.uAdditive = {type: 't', value: _additiveRenderTarget};
    // uniforms.uSphereMap = {type: 't', value: new THREE.Texture(settings.sphereMap)};
    uniforms.uResolution = {type: 'v2', value: _resolution};
    uniforms.uCameraInverse = {type: 'm4', value: _camera.matrixWorld};
    uniforms.uCameraRotationInverse = {type: 'm4', value: new THREE.Matrix4()};
    uniforms.uProjectMatrix = {type: 'm4', value: _camera.projectionMatrix};
    uniforms.uProjectMatrixInverse = {type: 'm4', value: new THREE.Matrix4()};
    uniforms.uFogColor = {type: 'c', value: new THREE.Color()};
    uniforms.uColor1 = {type: 'c', value: new THREE.Color()};
    uniforms.uColor2 = {type: 'c', value: new THREE.Color()};
    uniforms.uLightPosition = {type: 'v3', value: lights.mesh.position};

    _particlesMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: shaderParse(glslify('../glsl/particles.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particles.frag'))
    });


    // _particlesMaterial.uniforms.uSphereMap.value.anisotropy = 16;
    // _particlesMaterial.uniforms.uSphereMap.value.needsUpdate = true;
    // _particlesMaterial.uniforms.uSphereMap.value.flipY = false;
    mesh = exports.mesh = new THREE.Mesh(geomtry, _particlesMaterial);
    _quadScene.add(mesh);

    _shadowMatrial = new THREE.ShaderMaterial( {
        uniforms: {
            uTexturePosition: {type: 't', value: null},
            uParticleSize: { type: 'f', value: 1 }
        },
        vertexShader: shaderParse(glslify('../glsl/shadow.vert')),
        fragmentShader: shaderParse(glslify('../glsl/shadow.frag')),
        blending: THREE.NoBlending,
        depthTest: true,
        depthWrite: true
    });
    _particles.castShadow = true;
    _particles.customDepthMaterial = _shadowMatrial;

}

function _initGeometry() {

    var position = new Float32Array(AMOUNT * 3);
    var i3;
    var baseSize = settings.particleSize;
    for(var i = 0; i < AMOUNT; i++ ) {
        i3 = i * 3;
        position[i3 + 0] = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
        position[i3 + 1] = ~~(i / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
        position[i3 + 2] = (20000 + Math.pow(Math.random(), 5) * 24000) / baseSize; // size
    }
    _particleGeometry = new THREE.BufferGeometry();
    _particleGeometry.addAttribute( 'position', new THREE.BufferAttribute( position, 3 ));

}

function _initDepthRenderTarget() {
    var material = new THREE.ShaderMaterial({
        uniforms: {
            uTexturePosition: { type: 't', value: null },
            uParticleSize: { type: 'f', value: 1 }
        },
        vertexShader: shaderParse(glslify('../glsl/particlesDepth.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particlesDepth.frag')),
        blending: THREE.NoBlending
    });

    _depthRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        transparent: true
    });
    _depthRenderTarget.material = material;
}

function _initAdditiveRenderTarget() {
    var material = new THREE.ShaderMaterial({
        uniforms: {
            uTexturePosition: {type: 't', value: null},
            uDepth: {type: 't', value: _depthRenderTarget},
            uResolution: {type: 'v2', value: _resolution},
            uParticleSize: { type: 'f', value: 1 }
        },
        vertexShader: shaderParse(glslify('../glsl/particlesAdditive.vert')),
        fragmentShader: shaderParse(glslify('../glsl/particlesAdditive.frag')),

        blending : THREE.CustomBlending,
        blendEquation : THREE.AddEquation,
        blendSrc : THREE.OneFactor,
        blendDst : THREE.OneFactor ,
        // blendEquationAlpha : THREE.MinEquation,
        blendEquationAlpha : THREE.AddEquation,
        blendSrcAlpha : THREE.OneFactor,
        blendDstAlpha : THREE.OneFactor,
        transparent: true
    });

    _additiveRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
    });
    _additiveRenderTarget.material = material;
}

function _initBlurRenderTarget() {

    _blurHMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse : {type: 't', value: _additiveRenderTarget},
            uResolution : {type: 'v2', value: _resolution},
            uOffset : {type: 'f', value: 0}
        },
        vertexShader: shaderParse(glslify('../glsl/blur.vert')),
        fragmentShader: shaderParse(glslify('../glsl/blurH.frag')),
        transparent: true,
        blending: THREE.NoBlending
    });

    _blurRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        stencilBuffer: false
    });

    _blurVMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse : {type: 't', value: _blurRenderTarget},
            uResolution : {type: 'v2', value: _resolution},
            uOffset : {type: 'f', value: 0}
        },
        vertexShader: shaderParse(glslify('../glsl/blur.vert')),
        fragmentShader: shaderParse(glslify('../glsl/blurV.frag')),
        transparent: true,
        blending: THREE.NoBlending
    });

}

function resize(width, height) {
    _width = width;
    _height = height;
    _resolution.set(width, height);
    _depthRenderTarget.setSize(width, height);
    _additiveRenderTarget.setSize(width, height);
    _blurRenderTarget.setSize(width, height);
}

function preRender() {

    _particlesScene.add(_particles);
    var autoClearColor = _renderer.autoClearColor;
    var clearColor = _renderer.getClearColor().getHex();
    var clearAlpha = _renderer.getClearAlpha();

    _renderer.setClearColor(0, 0);
    _renderer.clearTarget(_depthRenderTarget, true, true, true);
    _particles.material = _depthRenderTarget.material;
    _depthRenderTarget.material.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
    _depthRenderTarget.material.uniforms.uParticleSize.value = settings.particleSize;
    _renderer.render( _particlesScene, _camera, _depthRenderTarget );

    _renderer.setClearColor(0, 0);
    _renderer.clearTarget(_additiveRenderTarget, true, true, true);

    _particles.material = _additiveRenderTarget.material;
    _additiveRenderTarget.material.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
    _additiveRenderTarget.material.uniforms.uParticleSize.value = settings.particleSize;
    _renderer.render( _particlesScene, _camera, _additiveRenderTarget );

    var blurRadius = settings.blur;

    if(blurRadius) {
        _blurHMaterial.uniforms.uOffset.value = blurRadius / _width;
        _blurVMaterial.uniforms.uOffset.value = blurRadius / _height;

        _renderer.clearTarget(_blurRenderTarget, true, true, true);
        mesh.material = _blurHMaterial;
        _renderer.render( _quadScene, _quadCamera, _blurRenderTarget );

        _renderer.clearTarget(_additiveRenderTarget, true, true, true);
        mesh.material = _blurVMaterial;
        _renderer.render( _quadScene, _quadCamera, _additiveRenderTarget );
        mesh.material = _particlesMaterial;
    }

    _renderer.setClearColor(clearColor, clearAlpha);
    _renderer.autoClearColor = autoClearColor;
    _renderer.setViewport(0, 0, _width, _height);

    _particles.material = settings.ignoredMaterial;
    _shadowMatrial.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
    _shadowMatrial.uniforms.uParticleSize.value = settings.particleSize;
    _scene.add(_particles);
}

function update(renderTarget, dt) {
    var autoClearColor = _renderer.autoClearColor;
    var clearColor = _renderer.getClearColor().getHex();
    var clearAlpha = _renderer.getClearAlpha();
    _renderer.autoClearColor = false;

    _particlesMaterial.uniforms.uColor1.value.setStyle(settings.color1);
    _particlesMaterial.uniforms.uColor2.value.setStyle(settings.color2);

    _particlesMaterial.uniforms.spotShadowMap.value = [lights.spot.shadow.map];
    _particlesMaterial.uniforms.spotShadowMatrix.value = [lights.spot.shadow.matrix];

    _particlesMaterial.uniforms.uCameraRotationInverse.value.extractRotation(_camera.matrixWorld);
    _particlesMaterial.uniforms.uProjectMatrixInverse.value.getInverse(_camera.projectionMatrix);

    _renderer.render( _quadScene, _quadCamera, renderTarget );

    _renderer.setClearColor(clearColor, clearAlpha);
    _renderer.autoClearColor = autoClearColor;

}
