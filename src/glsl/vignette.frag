uniform sampler2D uDiffuse;
uniform vec2 uResolution;

uniform float uReduction;
uniform float uBoost;

void main() {

  vec4 color = texture2D( uDiffuse, gl_FragCoord.xy / uResolution );

  vec2 center = uResolution * 0.5;
  float vignette = distance( center, gl_FragCoord.xy ) / uResolution.x;
  vignette = uBoost - vignette * uReduction;

  color.rgb *= vignette;
  gl_FragColor = color;

}
