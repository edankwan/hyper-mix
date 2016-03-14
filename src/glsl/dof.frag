uniform vec2 uResolution;
uniform sampler2D uDiffuse;
uniform sampler2D uDistance;
uniform vec2 uMouse;
uniform float uFocusZ;
uniform vec2 uDelta;
uniform float uAmount;
uniform float uRange;

float unpack1K ( vec4 color ) {
   const vec4 bitSh = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
   return dot( color, bitSh ) * 1000.0;
}

void main() {

    vec2 resolutionInverted = 1.0 / uResolution;
    vec2 uv = gl_FragCoord.xy * resolutionInverted;
    float centerZ = texture2D( uDistance, uv ).r;
    float bias = pow(smoothstep(50.0, 400.0, distance(centerZ, uFocusZ)), 2.0);
    vec2 d = uDelta * resolutionInverted * bias * uAmount;

    vec4 sum = vec4(0.0);
    vec4 center = texture2D( uDiffuse, uv );
    sum += texture2D( uDiffuse, ( uv - d * 4. ) ) * 0.051;
    sum += texture2D( uDiffuse, ( uv - d * 3. ) ) * 0.0918;
    sum += texture2D( uDiffuse, ( uv - d * 2. ) ) * 0.12245;
    sum += texture2D( uDiffuse, ( uv - d * 1. ) ) * 0.1531;
    sum += center * 0.1633;
    sum += texture2D( uDiffuse, ( uv + d * 1. ) ) * 0.1531;
    sum += texture2D( uDiffuse, ( uv + d * 2. ) ) * 0.12245;
    sum += texture2D( uDiffuse, ( uv + d * 3. ) ) * 0.0918;
    sum += texture2D( uDiffuse, ( uv + d * 4. ) ) * 0.051;

    gl_FragColor = sum;
}
