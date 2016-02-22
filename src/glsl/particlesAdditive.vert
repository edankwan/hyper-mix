uniform sampler2D uTexturePosition;
uniform float uParticleSize;

varying float vHalfSize;
varying float vLife;
varying float vDepth;
varying float vColor;

void main() {

    vec4 positionInfo = texture2D( uTexturePosition, position.xy );

    vec4 worldPosition = modelMatrix * vec4( positionInfo.xyz, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    vDepth = -mvPosition.z;
    vLife = fract(positionInfo.w);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = position.z / gl_Position.z * smoothstep(0.0, 0.2, vLife) * uParticleSize;
    vHalfSize = gl_PointSize * 0.5;

    vColor = (floor(positionInfo.w) / 8192.0 * 2.0) - 1.0;
}
