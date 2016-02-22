// attribute vec3 position;

uniform vec3 resolution;
uniform vec3 uBoundBox;
uniform vec2 textureResolution;

uniform sampler2D texturePosition;
uniform vec4 sliceInfo;

varying float vColor;
// varying float vWeight;

#pragma glslify: coord3to2 = require(./helpers/coord3to2)

void main() {
    vec4 positionInfo = texture2D( texturePosition, position.xy );
    vec3 position = positionInfo.xyz;
    position = floor(position + vec3(uBoundBox.x * 0.5, 200.0, uBoundBox.z * 0.5)) / uBoundBox.y * 128.0;
    gl_Position = vec4( (coord3to2(position / resolution, sliceInfo) * 2.0 - 1.0), 0.0, 1.0 );
    gl_PointSize = 1.0;
    vColor = floor(positionInfo.w) / 8192.0;
    // vWeight = 0.01 + fract(positionInfo.w) * 0.99;
}
