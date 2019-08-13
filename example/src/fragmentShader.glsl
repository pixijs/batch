varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%texturesPerBatch%];

void main(void){
    vec4 color;

    for (int k = 0; k < %texturesPerBatch%; ++k)
        if (int(vTextureId) == k)
            color = texture2D(uSamplers[k], vTextureCoord);
    gl_FragColor = color * vColor;
}
