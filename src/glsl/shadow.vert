uniform sampler2D uTexturePosition;
uniform float uParticleSize;

void main() {

    vec4 positionInfo = texture2D( uTexturePosition, position.xy );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( positionInfo.xyz, 1.0 );
    gl_PointSize = position.z / gl_Position.z * 0.65 * smoothstep(0.0, 0.2, fract(positionInfo.w)) * uParticleSize;

}
