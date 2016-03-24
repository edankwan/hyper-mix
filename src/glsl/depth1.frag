uniform vec2 uResolution;
uniform vec2 uMouse;

uniform sampler2D uDistance;
uniform sampler2D uDistance1;


void main() {

    gl_FragColor = vec4(texture2D( uDistance, (uMouse + 1.0) * 0.5).r, 0.0, 0.0, 1.0);

}
