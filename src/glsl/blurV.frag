uniform sampler2D tDiffuse;
uniform float uOffset;
varying vec2 vUv;

void main() {

    vec4 center = texture2D( tDiffuse, vec2( vUv.x, vUv.y ) );
    if(center.z > 0.001) {

        float w = floor(center.w + 0.5);
        float ww = smoothstep(0.5, 5.0, w);
        float offset = uOffset * ww;
        vec3 sum = vec3( 0.0 );
        float sumC = 0.0;
        vec4 color = texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * offset ) );
        sum += color.xyz * 0.051;
        sumC += fract(color.w + 0.5) * 0.051;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * offset ) );
        sum += color.xyz * 0.0918;
        sumC += fract(color.w + 0.5) * 0.0918;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * offset ) );
        sum += color.xyz * 0.12245;
        sumC += fract(color.w + 0.5) * 0.12245;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * offset ) );
        sum += color.xyz * 0.1531;
        sumC += fract(color.w + 0.5) * 0.1531;

        color = center;
        sum += color.xyz * 0.1633;
        sumC += fract(color.w + 0.5) * 0.1633;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * offset ) );
        sum += color.xyz * 0.1531;
        sumC += fract(color.w + 0.5) * 0.1531;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * offset ) );
        sum += color.xyz * 0.12245;
        sumC += fract(color.w + 0.5) * 0.12245;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * offset ) );
        sum += color.xyz * 0.0918;
        sumC += fract(color.w + 0.5) * 0.0918;

        color = texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * offset ) );
        sum += color.xyz * 0.051;
        sumC += fract(color.w + 0.5) * 0.051;

        center = mix(center, vec4(sum.xyz, w + sumC - 0.5 ), ww);
        // center.zw = mix(center.zw, vec2(sum.z, w + sumC - 0.5), 0.00035);
    }

    gl_FragColor = center;

}
