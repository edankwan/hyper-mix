uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uFogColor;
uniform vec3 uLightPosition;
uniform mat4 uProjectMatrix;
uniform mat4 uProjectMatrixInverse;
uniform mat4 uCameraInverse;
uniform mat4 uCameraRotationInverse;

uniform mat4 spotShadowMatrix[1];
uniform sampler2D spotShadowMap[1];

uniform vec3 uColor1;
uniform vec3 uColor2;

uniform sampler2D uDepth;
uniform sampler2D uAdditive;
// uniform sampler2D uSphereMap;
varying vec2 vUv;

#pragma glslify: noise = require(./helpers/noise3.glsl)
#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: toLinear = require('glsl-gamma/in')
#pragma glslify: toGamma  = require('glsl-gamma/out')


#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
#define LOG2 1.442695

vec3 blendOverlay(in vec3 base,in  vec3 blend) {
    return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
}

float rand(float n){return fract(sin(n) * 43758.5453123);}


float unpackDepth( const in vec4 rgba_depth ) {

    const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
    return dot( rgba_depth, bit_shift );

}

float texture2DCompare( sampler2D depths, vec2 uv, float compare, float range ) {
    float depth = unpackDepth( texture2D(depths, uv ) );
    return step(compare, depth) + smoothstep( range - compare, -compare , -depth );
    // return step( compare, unpackDepth( texture2D( depths, uv ) ) );
}

float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare, float range ) {

    const vec2 offset = vec2( 0.0, 1.0 );

    vec2 texelSize = vec2( 1.0 ) / size;
    vec2 centroidUV = floor( uv * size + 0.5 ) / size;

    float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare, range );
    float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare, range );
    float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare, range );
    float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare, range );

    vec2 f = fract( uv * size + 0.5 );

    float a = mix( lb, lt, f.y );
    float b = mix( rb, rt, f.y );
    float c = mix( a, b, f.x );

    return c;

}

float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowSize, vec4 shadowCoord, float range ) {

        shadowCoord.xyz /= shadowCoord.w;
        shadowCoord.z += shadowBias;

        bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
        bool inFrustum = all( inFrustumVec );

        bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

        bool frustumTest = all( frustumTestVec );

        if ( frustumTest ) {

            // return texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z, range );

            float t = floor(noise(shadowCoord.xyz) * 275121.351);
            vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

            // return texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z, range );

            return (
                texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z, range ) * 2.0 +
                texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( (rand(t + 214.43) - 0.5) * shadowSize, (rand(t + 412.321) - 0.5) * shadowSize) , shadowCoord.z, range ) +
                texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( (rand(t + 321.743) - 0.5) * shadowSize, (rand(t + 113.5) - 0.5) * shadowSize) , shadowCoord.z, range ) +
                texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( (rand(t + 312.632) - 0.5) * shadowSize, (rand(t + 53.26) - 0.5) * shadowSize) , shadowCoord.z, range ) +
                texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( (rand(t + 632.62) - 0.5) * shadowSize, (rand(t + 34.513) - 0.5) * shadowSize) , shadowCoord.z, range )
            ) * ( 1.0 / 6.0 );
        }

        return 1.0;
}

void main() {

    vec4 merged = texture2D( uAdditive, vUv );
    // vec4 outer = merged;

    float alpha = smoothstep(0.0, 0.01, merged.z);

    if(alpha < 0.001) discard;

    merged.xy /= merged.z;

    float centerZ = texture2D( uDepth, gl_FragCoord.xy  / uResolution ).r;


    centerZ  = 0.5 * (-uProjectMatrix[2].z * centerZ + uProjectMatrix[3].z) / centerZ + 0.5;
    if(centerZ > 1.0) discard;
    vec3 ndc = (vec3 (gl_FragCoord.xy / uResolution, centerZ) - 0.5) * 2.0;
    vec4 tmp4 = uProjectMatrixInverse * vec4(ndc, 1.0);
    vec3 viewPosition = tmp4.xyz / tmp4.w;
    float roundW = floor(merged.w + 0.5);
    viewPosition.z -= merged.z / roundW; // no perspective on the particles

    tmp4 = uCameraInverse * vec4(viewPosition , 1.0);
    vec3 worldPosition = tmp4.xyz / tmp4.w;

    // if(worldPosition.y < -200.0) discard;

    float colorRatio = smoothstep(-1.0, 1.0, (merged.w - roundW) / merged.z * 100000.0);

    merged.y *= -1.0;
    merged.z = sqrt(1.0 - merged.x * merged.x - merged.y * merged.y);
    merged.xyz = normalize(merged.xyz);

    vec3 color = vec3(0.0);

    vec3 lightPosition = uLightPosition - worldPosition;
    vec3 lightDirection = normalize(lightPosition);

    float light = max(0.0, dot(normalize((uCameraRotationInverse * vec4(merged.xyz, 1.0)).xyz), lightDirection));
    light *= (1.0 - smoothstep(500.0, 2500.0, length(lightPosition)));
    color += light;

    color.xyz = mix(color.xyz, mix(uColor1, uColor2, colorRatio), 0.8);

    // shadow
    vec4 spotShadowCoord = spotShadowMatrix[0] * vec4(worldPosition.xyz, 1.0);
    color.xyz *= 0.5 + getShadow( spotShadowMap[0], vec2(1024.0, 2048.0), 0.0, .004, spotShadowCoord, mix(0.0005, 0.0175, light) ) * 0.5;

    color += light * 0.3;

    // fog
    float fogFactor = whiteCompliment( exp2( - 0.0009 * 0.0009 * viewPosition.z * viewPosition.z * LOG2 ) );
    color.xyz = mix(color.xyz, uFogColor, pow(fogFactor, 6.5));


    gl_FragColor = vec4(color.xyz, alpha);

}

