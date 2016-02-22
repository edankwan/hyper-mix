var _canvas;
var _ctx;

(function () {

    _canvas = document.createElement('canvas');
    _ctx = _canvas.getContext('2d');

}());

module.exports = parse;

function parse(img, threshold, neighborPassThreholds) {
    var width = _canvas.width = img.width;
    var height = _canvas.height = img.height;
    _ctx.drawImage(img, 0, 0);
    var data = _ctx.getImageData(0, 0, width, height).data;
    var x, y, i, yi, r0, g0, b0, a0, b, a, passCount, tmp;
    var w2 = width / 2;
    var h2 = height / 2;
    var w4 = width * 4;
    var positions = [];
    var uvs = [];
    var normals = [];
    for(y = 1; y < height - 1; ++y) {
        yi = y * w4;
        for(x = 1; x < width - 1; ++x) {
            i = yi + x * 4;
            r0 = data[i];
            g0 = data[i + 1];
            b0 = data[i + 2];
            a0 = data[i + 3] / 255;
            a = a0 / 255;
            passCount = +(Math.pow(Math.random(), 0.3) < a0 ? 1 : 0) * 8;

            if(passCount < neighborPassThreholds) {
                tmp = i - w4 - 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i - w4 + 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i - 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i + 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i + w4 - 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i + w4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount < neighborPassThreholds) {
                tmp = i + w4 + 4;
                if(_getPixelDelta(r0, g0, b0, data[tmp], data[tmp + 1], data[tmp + 2]) * a > threshold) ++passCount;
            }

            if(passCount >= neighborPassThreholds) {
                positions.push(x - w2, h2 - y);
                uvs.push(x / width, y / height);
                _pushNormal(normals, r0 / 255, g0 / 255, b0 / 255);
            }
        }
    }

    return {
        width: width,
        height: height,
        positions: positions,
        uvs: uvs,
        normals: normals
    }
}

function _pushNormal(normals, r, g, b) {
    r -= 0.5;
    g -= 0.5;
    b -= 0.5;
    if(r && g && b) {
        normals.push(0, 0, 1);
    } else {
        var base = 1 / Math.sqrt(r * r + g * g + b * b);
        normals.push(r * base, g * base, b * base);
    }
}

function _getPixelDelta(r0, g0, b0, r1, g1, b1) {
    return Math.max(Math.abs(r0 - r1), Math.abs(g0 - g1), Math.abs(b0 - b1));
}
