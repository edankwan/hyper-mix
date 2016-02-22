varying float vDepth;

void main() {
    if(length(gl_PointCoord.xy - 0.5) > 0.5) discard;
    gl_FragColor = vec4(vDepth, 0.0, 0.0, 1.0);

}
