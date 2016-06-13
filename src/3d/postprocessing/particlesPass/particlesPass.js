var Effect = require('../Effect');
var effectComposer = require('../effectComposer');
var fboHelper = require('../../fboHelper');
var particles = require('../../particles');

var glslify = require('glslify');
var THREE = require('three');

var undef;

var exports = module.exports = new Effect();
var _super = Effect.prototype;

exports.init = init;
exports.render = render;

function init() {
    _super.init.call(this);

}

function render(dt, renderTarget, toScreen) {

    particles.update(renderTarget);

    // _super.render.call(this, dt, renderTarget, toScreen);

}
