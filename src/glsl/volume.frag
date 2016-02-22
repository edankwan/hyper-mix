varying float vColor;
// varying float vWeight;

void main() {
    gl_FragColor = vec4(vColor, 1.0 - vColor, 1.0, 1.0);
    // gl_FragColor = vec4(vColor * vWeight, (1.0 - vColor) * vWeight, vWeight, 1.0);
}
