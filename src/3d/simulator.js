var settings = require('../core/settings');
var THREE = require('three');

var undef;

var glslify = require('glslify');
var volume = require('./volume');
var fboHelper = require('./fboHelper');
var shaderParse = require('../helpers/shaderParse');

var _copyShader;
var _positionShader;
var _textureDefaultPosition;
var _positionRenderTarget;
var _positionRenderTarget2;

var _renderer;
var _mesh;
var _scene;
var _camera;
var _followPoint;

var TEXTURE_WIDTH = exports.TEXTURE_WIDTH = settings.simulatorTextureWidth;
var TEXTURE_HEIGHT = exports.TEXTURE_HEIGHT = settings.simulatorTextureHeight;
var AMOUNT = exports.AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT;

exports.init = init;
exports.update = update;
exports.positionRenderTarget = undef;
exports.prevPositionRenderTarget = undef;
exports.initAnimation = 0;

function init(renderer) {

    _renderer = renderer;
    _followPoint = new THREE.Vector3();

    var rawShaderPrefix = 'precision ' + settings.capablePrecision + ' float;\n';

    var gl = _renderer.getContext();
    if ( !gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) ) {
        alert( 'No support for vertex shader textures!' );
        return;
    }
    if ( !gl.getExtension( 'OES_texture_float' )) {
        alert( 'No OES_texture_float support for float textures!' );
        return;
    }
    // if ( !gl.getExtension( 'EXT_blend_minmax' )) {
    //     alert( 'No EXT_blend_minmax support!' );
    //     // return;
    // }

    _scene = new THREE.Scene();
    _camera = new THREE.Camera();
    _camera.position.z = 1;

    _copyShader = new THREE.RawShaderMaterial({
        uniforms: {
            resolution: { type: 'v2', value: new THREE.Vector2( TEXTURE_WIDTH, TEXTURE_HEIGHT ) },
            texture: { type: 't', value: undef }
        },
        vertexShader: rawShaderPrefix + shaderParse(glslify('../glsl/quad.vert')),
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/through.frag'))
    });

    _positionShader = new THREE.RawShaderMaterial({
        uniforms: {
            resolution: { type: 'v2', value: new THREE.Vector2( TEXTURE_WIDTH, TEXTURE_HEIGHT ) },
            texturePosition: { type: 't', value: undef },
            textureDefaultPosition: { type: 't', value: undef },
            speed: { type: 'f', value: 0 },
            curlSize: { type: 'f', value: 0 },
            dieSpeed: { type: 'f', value: 0 },
            radius: { type: 'f', value: 0 },
            time: { type: 'f', value: 0 },
            initAnimation: { type: 'f', value: 0 },

            uBoundBox: { type: 'v3', value: volume.boundBox },
            uSliceInfo: {type: 'v4', value: volume.sliceInfo},
            uTextureVolume: {type: 't', value: volume.renderTarget},
            uEmitterDistanceRatio: {type: 'f', value: 0},
            uEmitterSpeed: {type: 'f', value: 0}
        },
        vertexShader: rawShaderPrefix + shaderParse(glslify('../glsl/quad.vert')),
        fragmentShader: rawShaderPrefix + shaderParse(glslify('../glsl/position.frag')),
        blending: THREE.NoBlending,
        transparent: false,
        depthWrite: false,
        depthTest: false
    });

    _mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), _copyShader );
    _scene.add( _mesh );

    _positionRenderTarget = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthWrite: false,
        depthBuffer: false,
        stencilBuffer: false
    });
    _positionRenderTarget2 = _positionRenderTarget.clone();
    _copyTexture(_createPositionTexture(), _positionRenderTarget);
    _copyTexture(_positionRenderTarget, _positionRenderTarget2);

}

function _copyTexture(input, output) {
    _mesh.material = _copyShader;
    _copyShader.uniforms.texture.value = input;
    _renderer.render( _scene, _camera, output );
}

function _updatePosition(dt) {

    // swap
    var tmp = _positionRenderTarget;
    _positionRenderTarget = _positionRenderTarget2;
    _positionRenderTarget2 = tmp;

    _mesh.material = _positionShader;
    _positionShader.uniforms.textureDefaultPosition.value = _textureDefaultPosition;
    _positionShader.uniforms.texturePosition.value = _positionRenderTarget2;
    _positionShader.uniforms.time.value += dt * 0.001;
    _renderer.render( _scene, _camera, _positionRenderTarget );
}

function _createPositionTexture() {
    var positions = new Float32Array( AMOUNT * 4 );
    var i4;
    var r, phi, theta;
    for(var i = 0; i < AMOUNT; i++) {
        i4 = i * 4;
        // r = (0.5 + Math.random() * 0.5) * 150;
        r = Math.random() * 150;
        phi = (Math.random() - 0.5) * Math.PI;
        theta = Math.random() * Math.PI * 2;
        positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
        positions[i4 + 1] = r * Math.sin(phi);
        positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
        positions[i4 + 3] = 0.002 + Math.random() * 0.998;
    }
    var texture = new THREE.DataTexture( positions, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    _textureDefaultPosition = texture;
    return texture;
}

function update(dt) {

    dt = dt * settings.speed;

    if(settings.speed || settings.dieSpeed) {

        var state = fboHelper.getColorState();

        _renderer.autoClearColor = false;

        _positionShader.uniforms.curlSize.value = settings.curlSize;
        _positionShader.uniforms.dieSpeed.value = settings.dieSpeed;
        _positionShader.uniforms.radius.value = settings.radius;
        _positionShader.uniforms.speed.value = settings.speed;
        _positionShader.uniforms.initAnimation.value = exports.initAnimation;
        _positionShader.uniforms.uEmitterDistanceRatio.value = settings.emitterDistanceRatio;
        _positionShader.uniforms.uEmitterSpeed.value = settings.emitterSpeed;

        _updatePosition(dt);

        fboHelper.setColorState(state);
        exports.positionRenderTarget = _positionRenderTarget;
        exports.prevPositionRenderTarget = _positionRenderTarget2;

    }

}


