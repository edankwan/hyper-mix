uniform sampler2D uTexturePosition;
uniform float uParticleSize;

varying float vDepth;

void main() {

    vec4 positionInfo = texture2D( uTexturePosition, position.xy );

    vec4 worldPosition = modelMatrix * vec4( positionInfo.xyz, 1.0 );
    vec4 mvPosition = viewMatrix * worldPosition;

    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = position.z / gl_Position.z * smoothstep(0.0, 0.2, fract(positionInfo.w)) * uParticleSize;

}
