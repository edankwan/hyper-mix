
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

uniform mat4 u_prevModelViewMatrix;

varying vec2 v_motion;

void main() {

    #include <skinbase_vertex>
    #include <begin_vertex>

    #include <morphtarget_vertex>
    #include <skinning_vertex>

    vec4 pos = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
    vec4 prevPos = projectionMatrix * u_prevModelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = pos;
    v_motion = (pos.xy / pos.w - prevPos.xy / prevPos.w) * 0.5;

}
