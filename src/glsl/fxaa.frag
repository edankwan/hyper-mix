uniform vec2 uResolution;
uniform sampler2D uDiffuse;

#pragma glslify: fxaa = require(glsl-fxaa)

void main() {
    gl_FragColor = fxaa(uDiffuse, gl_FragCoord.xy, uResolution);
}
