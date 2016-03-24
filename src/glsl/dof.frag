uniform vec2 uResolution;
uniform sampler2D uDiffuse;
uniform sampler2D uDistance;
uniform vec2 uMouse;
uniform float uDofDistance;
uniform vec2 uDelta;
uniform float uAmount;
uniform float uRange;

void main() {

    vec2 resolutionInverted = 1.0 / uResolution;
    vec2 uv = gl_FragCoord.xy * resolutionInverted;

    float centerZ = texture2D( uDistance, uv ).r;
    // float mouseCenterZ = texture2D( uDistance, (uMouse + 1.0) * 0.5 ).r;
    // mouseCenterZ = mix(mouseCenterZ, uCameraDistance, step(-0.1, -mouseCenterZ));
    // float bias = smoothstep(0.0, 300.0, distance(centerZ, mouseCenterZ));

    float bias = smoothstep(0.0, 512.0, distance(centerZ, uDofDistance));

    vec2 d = uDelta * resolutionInverted * bias * uAmount;

    vec4 sum = vec4(0.0);
    vec4 center = texture2D( uDiffuse, uv );
    d *= length(center.xyz);
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
