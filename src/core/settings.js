var parse = require('mout/queryString/parse');
var keys = require('mout/object/keys');
var query = exports.query = parse(window.location.href.replace('#','?'));

var undef;

exports.useStats = false;

var amountMap = {
    '4k' : [64, 64, 0.3],
    '8k' : [128, 64, 0.3],
    '16k' : [128, 128, 0.3],
    '32k' : [256, 128, 0.5],
    '65k' : [256, 256, 0.6],
    '131k' : [512, 256, 0.65],
    '252k' : [512, 512, 0.7],
    '524k' : [1024, 512, 0.75],
    '1m' : [1024, 1024, 0.8],
    '2m' : [2048, 1024, 0.85],
    '4m' : [2048, 2048, 0.9]
};

exports.amountList = keys(amountMap);
query.amount = amountMap[query.amount] ? query.amount : '16k';
var amountInfo = amountMap[query.amount];
exports.simulatorTextureWidth = amountInfo[0];
exports.simulatorTextureHeight = amountInfo[1];

exports.emitterDistanceRatio = 0.65;
exports.emitterSpeed = 20.0;

exports.volumeWidth = 256;
exports.volumeHeight = 128;
exports.volumeDepth = 128;
exports.volumeSliceColumn = 8;
exports.volumeSliceRow = 16;
exports.volumeScale = 7;

exports.speed = 0.25;
exports.dieSpeed = 0.0035;
exports.radius = amountInfo[2];
exports.blur = 0;
exports.curlSize = 0.00055;

exports.particleSize = 32;
exports.bgColor = '#1c2020';
exports.color1 = '#e6005e';
exports.color2 = '#00b1d7';
exports.dof = 0;
exports.dofFocus = 1;
exports.uDofDistance = 0;
exports.dofFocusZ = 0;
exports.dofMouse = false;

var motionBlurQualityMap = exports.motionBlurQualityMap = {
    best: 1,
    high: 0.5,
    medium: 1 / 3,
    low: 0.25
};
exports.motionBlurQualityList = keys(motionBlurQualityMap);
query.motionBlurQuality = motionBlurQualityMap[query.motionBlurQuality] ? query.motionBlurQuality : 'medium';
exports.fxaa = true;
exports.motionBlur = true;
exports.motionBlurPause = false;
exports.bloom = false;
exports.vignette = false;
exports.vignetteMultiplier = 0.8;

exports.capablePrecision = undef;

