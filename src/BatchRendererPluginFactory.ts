import { BatchRenderer } from './BatchRenderer';
import { AttributeRedirect } from './redirects/AttributeRedirect';
import BatchGeometryFactory from './BatchGeometryFactory';
import BatchGenerator from './BatchGenerator';

/**
 * Factory class for creating a batch-renderer.
 *
 * @memberof PIXI.brend
 * @class
 * @example
 *  const attribSet = [
 *      new AttributeRedirect({
 *          source: 'vertexData',
 *          attrib: 'aVertex',
 *          type: 'float32',
 *          size: 2,
 *          glType: PIXI.TYPES.FLOAT,
 *          glSize: 2,
 *       }),
 *      new AttributeRedirect({
 *          source: 'uvs',
 *          attrib: 'aTextureCoord',
 *          type: 'float32',
 *          size: 2,
 *          glType: PIXI.TYPES.FLOAT,
 *          glSize: 2,
 *      }),
 *  ];
 *  const SpriteBatchRenderer = BatchRendererPluginFactory.from(
 *      attribSet,
 *      // 2. indexProperty
 *      'indices',
 *      // 3. vertexCountProperty
 *      undefined, // auto-calculates
 *      // 4. textureProperty
 *      'texture',
 *      // 5. texturePerObject
 *      1,
 *      // 6. textureAttribute
 *      'aTextureId', // this will be used to locate the texture in the fragment shader later
 *      // 7. stateFunction,
 *      () => PIXI.State.for2d(), // default state please!
 *      // 8. shaderFunction
 *      new ShaderGenerator(// 1. vertexShader
 *          ` attribute vec2 aVertex;
 *          attribute vec2 aTextureCoord;
 *          attribute float aTextureId;
 *
 *          varying float vTextureId;
 *          varying vec2 vTextureCoord;
 *
 *          uniform mat3 projectionMatrix;
 *
 *          void main() {
 *              gl_Position = vec4((projectionMatrix * vec3(aVertex, 1)).xy, 0, 1);
 *              vTextureId = aTextureId;
 *              vTextureCoord = aTextureCoord;
 *          }
 *     `,
 *     `
 *          uniform sampler2D uSamplers[%texturesPerBatch%];
 *          varying float vTextureId;
 *          varying vec2 vTextureCoord;
 *
 *          void main(void){
 *              vec4 color;
 *
 *              // get color, which is the pixel in texture uSamplers[vTextureId] @ vTextureCoord
 *              for (int k = 0; k < %texturesPerBatch%; ++k) {
 *                  if (int(vTextureId) == k) {
 *                      color = texture2D(uSamplers[k], vTextureCoord);
 *                      break;
 *              }
 *           }
 *
 *           gl_FragColor = color;
 *      }
 *      `,
 *      {// we don't use any uniforms except uSamplers, which is handled by default!
 *      },
 *      // no custom template injectors
 *      // disable vertex shader macros by default
 *      ).generateFunction()
 *  );
 *
 *  PIXI.Renderer.registerPlugin('customBatch', SpriteBatchRenderer);
 */
export class BatchRendererPluginFactory
{
    /**
     * Generates a fully customized `BatchRenderer` that aggregates primitives
     * and textures. This is useful for non-uniform based display-objects.
     *
     * @param {PIXI.brend.AttributeRedirect[]} attributeRedirects
     * @param {string | Array<number>} indexProperty
     * @param {string | number} vertexCountProperty
     * @param {string} textureProperty
     * @param {number} texturePerObject
     * @param {string} textureAttribute
     * @param {Function} stateFunction
     * @param {Function} shaderFunction
     * @param {PIXI.brend.GeometryPacker} [packer]
     * @param {Class} [BatchGeneratorClass]
     * @param {Class} [BatchRendererClass]
     * @static
     */
    static from(/* eslint-disable-line max-params */
        attributeRedirects: AttributeRedirect[],
        indexProperty: string,
        vertexCountProperty: string | number,
        textureProperty: string,
        texturePerObject: number,
        textureAttribute: string,
        stateFunction: (brend: BatchRenderer) => any,
        shaderFunction: (brend: BatchRenderer) => any,
        packer: BatchGeometryFactory,
        BatchGeneratorClass: typeof BatchGenerator,
        BatchRendererClass = BatchRenderer,
    ): typeof BatchRenderer
    {
        return class extends BatchRendererClass
        {
            constructor(renderer: PIXI.Renderer)
            {
                super(renderer,
                    attributeRedirects,
                    indexProperty,
                    vertexCountProperty,
                    textureProperty,
                    texturePerObject,
                    textureAttribute,
                    stateFunction,
                    shaderFunction,
                    packer,
                    BatchGeneratorClass);
            }
        };
    }
}

export default BatchRendererPluginFactory;
