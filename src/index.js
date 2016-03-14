var quickLoader = require('quick-loader');
var dat = require('dat-gui');
var Stats = require('stats.js');
var css = require('dom-css');
var raf = require('raf');

var THREE = require('three');

var OrbitControls = require('./controls/OrbitControls');
var settings = require('./core/settings');

var math = require('./utils/math');
var ease = require('./utils/ease');
var mobile = require('./fallback/mobile');

var simulator = require('./3d/simulator');
var imageParse = require('./3d/imageParse');
var lights = require('./3d/lights');
var floor = require('./3d/floor');
var particles = require('./3d/particles');
var volume = require('./3d/volume');
var postprocessing = require('./3d/postprocessing');

var _debugPlane;


var undef;
var _gui;
var _stats;

var _width = 0;
var _height = 0;

var _control;
var _camera;
var _scene;
var _renderer;

var _bgColor;

var _time = 0;
var _ray = new THREE.Ray();

var _initAnimation = 0;

var _logo;
var _instruction;
var _footerItems;

function init() {

    if(settings.useStats) {
        _stats = new Stats();
        css(_stats.domElement, {
            position : 'absolute',
            left : '0px',
            top : '0px',
            zIndex : 2048
        });

        document.body.appendChild( _stats.domElement );
    }

    _bgColor = new THREE.Color(settings.bgColor);
    settings.mouse = new THREE.Vector2(0,0);
    settings.mouse3d = _ray.origin;
    settings.ignoredMaterial = new THREE.Material();

    _renderer = new THREE.WebGLRenderer({
        // transparent : true,
        premultipliedAlpha : false,
        // antialias : true
    });

    // hyjack the render call and ignore the dummy rendering
    var fn = _renderer.renderBufferDirect;
    _renderer.renderBufferDirect = function(camera, fog, geometry, material, object, group) {
        if(material !== settings.ignoredMaterial) {
            fn.apply(this, arguments);
        }
    }

    settings.capablePrecision = _renderer.capabilities.precision;
    _renderer.setClearColor(settings.bgColor);
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.shadowMap.enabled = true;
    document.body.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.fog = new THREE.FogExp2( _bgColor, 0.001 );
    _camera = new THREE.PerspectiveCamera( 45, 1, 10, 5000);
    _camera.position.set(1, 1, 2).normalize().multiplyScalar(3000);
    settings.cameraPosition = _camera.position;

    lights.init(_renderer);
    _scene.add(lights.mesh);

    postprocessing.init(_renderer);
    volume.init(_renderer);
    simulator.init(_renderer);
    particles.init(_renderer, _camera, _scene);

    floor.init(_renderer);
    floor.mesh.position.y = -200;
    _scene.add(floor.mesh);

    _control = new OrbitControls( _camera, _renderer.domElement );
    _control.target.y = 100;
    _control.maxDistance = 1700;
    _control.minPolarAngle = 0.3;
    _control.maxPolarAngle = Math.PI / 2 + 0.1;
    // _control.noPan = true;
    _control.update();

    _gui = new dat.GUI();
    var simulatorGui = _gui.addFolder('Simulator');
    simulatorGui.add(settings, 'speed', 0, 0.7).listen();
    simulatorGui.add(settings, 'dieSpeed', 0, 0.02).name('fade speed').listen();
    simulatorGui.add(settings, 'radius', 0.1, 1);
    simulatorGui.add(settings, 'curlSize', 0.0001, 0.003).name('curl size');
    simulatorGui.add(settings, 'emitterDistanceRatio', 0, 1).name('emitter distance');
    simulatorGui.add(settings, 'emitterSpeed', -50, 50).name('emitter speed');
    simulatorGui.add(settings, 'amountValue', settings.amountOptions).name('amount').onChange(function(){
        if (confirm('It will restart the demo')) {
            window.location.href = window.location.href.split('#')[0] + '#' + settings.amountValue;
            window.location.reload();
        }
    });

    var renderingGui = _gui.addFolder('Rendering');
    renderingGui.add(settings, 'blur', 0, 5);
    renderingGui.add(settings, 'particleSize', 1, 64).name('particle size');
    renderingGui.add(settings, 'dof', 0, 3, 0.001).name('dof');
    renderingGui.addColor(settings, 'bgColor');
    renderingGui.addColor(settings, 'color1');
    renderingGui.addColor(settings, 'color2');

    if(!settings.isMobile) {
        simulatorGui.open();
        renderingGui.open();
    }

    _logo = document.querySelector('.logo');
    _instruction = document.querySelector('.instruction');
    document.querySelector('.footer').style.display = 'block';
    _footerItems = document.querySelectorAll('.footer span');

    window.addEventListener('resize', _onResize);
    window.addEventListener('mousemove', _onMove);
    window.addEventListener('touchmove', _bindTouch(_onMove));
    window.addEventListener('keyup', _onKeyUp);

    _time = Date.now();
    _onResize();
    _loop();

}

function _bindTouch(func) {
    return function (evt) {
        func(evt.changedTouches[0]);
    };
}

function _onMove(evt) {
    settings.mouse.x = (evt.pageX / _width) * 2 - 1;
    settings.mouse.y = -(evt.pageY / _height) * 2 + 1;
}

function _onKeyUp(evt) {
    if(evt.keyCode === 32) {
        settings.dieSpeed = settings.speed === 0 ? 0.0035  : 0;
        settings.speed = settings.speed === 0 ? 0.25 : 0;
    }
}

function _onResize() {
    _width = window.innerWidth;
    _height = window.innerHeight;

    particles.resize(_width, _height);
    postprocessing.resize(_width, _height);

    _camera.aspect = _width / _height;
    _camera.updateProjectionMatrix();
    _renderer.setSize(_width, _height);

}

function _loop() {
    var newTime = Date.now();
    raf(_loop);
    if(settings.useStats) _stats.begin();
    _render(newTime - _time);
    if(settings.useStats) _stats.end();
    _time = newTime;
}

function _render(dt) {

    var ratio;
    _bgColor.setStyle(settings.bgColor);
    var tmpColor = floor.mesh.material.color;
    tmpColor.lerp(_bgColor, 1);
    particles.mesh.material.uniforms.uFogColor.value.copy(tmpColor);
    _scene.fog.color.copy(tmpColor);
    _renderer.setClearColor(tmpColor.getHex());

    _initAnimation = Math.min(_initAnimation + dt * 0.00025, 1);
    simulator.initAnimation = _initAnimation;
    volume.boundBox.copy(volume.resolution).multiplyScalar(settings.volumeScale);

    postprocessing.vignette.uniforms.uReduction.value = math.lerp(0.5, 1.15, _initAnimation);
    postprocessing.vignette.uniforms.uBoost.value = math.lerp(1.9, 1.15, _initAnimation);
    _control.maxDistance = _initAnimation === 1 ? 1800 : math.lerp(1800, 1200, _initAnimation);
    _control.update();
    lights.update(dt, _camera);

    // update mouse3d
    _camera.updateMatrixWorld();
    _ray.origin.setFromMatrixPosition( _camera.matrixWorld );
    _ray.direction.set( settings.mouse.x, settings.mouse.y, 0.5 ).unproject( _camera ).sub( _ray.origin ).normalize();
    var distance = _ray.origin.length() / Math.cos(Math.PI - _ray.direction.angleTo(_ray.origin));
    _ray.origin.add( _ray.direction.multiplyScalar(distance * 1.0));

    simulator.update(dt);
    volume.update(dt);
    particles.preRender(dt);

    ratio = Math.min((1 - Math.abs(_initAnimation - 0.5) * 2) * 1.2, 1);
    var blur = (1 - ratio) * 10;
    _logo.style.display = ratio ? 'block' : 'none';
    if(ratio) {
        _logo.style.opacity = ratio;
        _logo.style.webkitFilter = 'blur(' + blur + 'px)';
        ratio = (0.8 + Math.pow(_initAnimation, 1.5) * 0.5);
        if(_width < 580) ratio *= 0.5;
        _logo.style.transform = 'scale3d(' + ratio + ',' + ratio + ',1)';

    }

    ratio = math.unLerp(0.5, 0.6, _initAnimation);
    if(!settings.isMobile) {
        _instruction.style.display = ratio ? 'block' : 'none';
        _instruction.style.transform = 'translate3d(0,' + ((1 - ratio * ratio) * 50) + 'px,0)';
    }

    for(var i = 0, len = _footerItems.length; i < len; i++) {
        ratio = math.unLerp(0.5 + i * 0.01, 0.6 + i * 0.01, _initAnimation);
        _footerItems[i].style.transform = 'translate3d(0,' + ((1 - Math.pow(ratio, 3)) * 50) + 'px,0)';
    }

    var renderTarget = postprocessing.render(_scene, _camera);
    particles.update(renderTarget, dt);
    postprocessing.renderDof();
    postprocessing.renderVignette();
    postprocessing.renderFxaa(true);
}

mobile.pass(init);
