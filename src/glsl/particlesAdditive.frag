varying float vHalfSize;
varying float vDepth;
varying float vLife;
varying float vColor;

uniform float uInset;
uniform vec2 uResolution;
uniform sampler2D uDepth;

const float EPS = 0.001;

void main() {

    vec2 toCenter = (gl_PointCoord.xy - 0.5) * 2.0;
    float isVisible = step(-1.0 + EPS, -length(toCenter));
    if(isVisible < 0.5) discard;

    vec2 uv = gl_FragCoord.xy  / uResolution;

    float centerZ = texture2D( uDepth, gl_FragCoord.xy  / uResolution ).r;
    float zLength = sqrt(1.0 - toCenter.x * toCenter.x - toCenter.y * toCenter.y) * vHalfSize;
    float z = centerZ - vDepth + zLength;

    isVisible *= step(EPS, z);
    toCenter.xy *= z;
    gl_FragColor = vec4(toCenter, z,  ceil(z / zLength) + vColor * 0.00001 * z ) * isVisible;

}


