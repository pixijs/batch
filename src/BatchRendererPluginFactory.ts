import { BatchRenderer } from './BatchRenderer';
import { AttributeRedirect } from './redirects/AttributeRedirect';
import BatchGeometryFactory from './BatchGeometryFactory';
import BatchFactory from './BatchFactory';

import * as PIXI from 'pixi.js';

// Geometry+Textures is the standard pipeline in Pixi's AbstractBatchRenderer.
interface IBatchRendererStdOptions
{
    attribSet: AttributeRedirect[];
    vertexCountProperty: string | number;
    indexCountProperty: string;
    textureProperty: string;
    texturePerObject: number;
    inBatchIdAttrib: string;
    stateFunction: (brend: BatchRenderer) => any;
    shaderFunction: (brend: BatchRenderer) => any;
    geometryFactory: BatchGeometryFactory;
    BatchFactoryClass: typeof BatchFactory;
    BatchRendererClass: typeof BatchRenderer;
}

/**
 * Factory class for creating a batch-renderer.
 *
 * @memberof PIXI.brend
 * @class
 * @example
 *  // Define the geometry of Sprite.
 *  const attribSet = [
 *      // Sprite vertexData contains global coordinates of the corners
 *      new AttributeRedirect({
 *          source: 'vertexData',
 *          attrib: 'aVertex',
 *          type: 'float32',
 *          size: 2,
 *          glType: PIXI.TYPES.FLOAT,
 *          glSize: 2,
 *      }),
 *      // Sprite uvs contains the normalized texture coordinates for each corner/vertex
 *      new AttributeRedirect({
 *          source: 'uvs',
 *          attrib: 'aTextureCoord',
 *          type: 'float32',
 *          size: 2,
 *          glType: PIXI.TYPES.FLOAT,
 *          glSize: 2,
 *      }),
 *  ];
 *
 *  const shaderFunction = new ShaderGenerator(// 1. vertexShader
 *  `
 *  attribute vec2 aVertex;
 *  attribute vec2 aTextureCoord;
 *  attribute float aTextureId;
 *
 *  varying float vTextureId;
 *  varying vec2 vTextureCoord;
 *
 *  uniform mat3 projectionMatrix;
 *
 *  void main() {
 *      gl_Position = vec4((projectionMatrix * vec3(aVertex, 1)).xy, 0, 1);
 *      vTextureId = aTextureId;
 *      vTextureCoord = aTextureCoord;
 *  }
 *  `,
 *  `
 *  uniform sampler2D uSamplers[%texturesPerBatch%];
 *  varying float vTextureId;
 *  varying vec2 vTextureCoord;
 *
 *  void main(void){
 *      vec4 color;
 *
 *      // get color, which is the pixel in texture uSamplers[vTextureId] @ vTextureCoord
 *      for (int k = 0; k < %texturesPerBatch%; ++k) {
 *          if (int(vTextureId) == k) {
 *              color = texture2D(uSamplers[k], vTextureCoord);
 *              break;
 *          }
 *      }
 *
 *      gl_FragColor = color;
 *  }
 *  `,
 *  {// we don't use any uniforms except uSamplers, which is handled by default!
 *  },
 *  // no custom template injectors
 *  // disable vertex shader macros by default
 *  ).generateFunction()
 *
 *  // Produce the SpriteBatchRenderer class!
 *  const SpriteBatchRenderer = BatchRendererPluginFactory.from({
 *      attribSet,
 *      indexCountProperty: 'indices',
 *      textureProperty: 'texture',
 *      texturePerObject: 1,
 *      inBatchIdAttrib: 'aTextureId',
 *      stateFunction: () => PIXI.State.for2d(), // default
 *      shaderFunction
 *  });
 *
 *  PIXI.Renderer.registerPlugin('customBatch', SpriteBatchRenderer);
 *
 *  // Sprite will render using SpriteBatchRenderer instead of default PixiJS
 *  // batch renderer. Instead of targetting PIXI.Sprite, you can write a batch
 *  // renderer for a custom display-object too! (See main page for that example!)
 *  const exampleSprite = PIXI.Sprite.from('./asset/example.png');
 *  exampleSprite.pluginName = 'customBatch';
 *  exampleSprite.width = 128;
 *  exampleSprite.height = 128;
 */
export class BatchRendererPluginFactory
{
    /**
     * Generates a fully customized `BatchRenderer` that aggregates primitives
     * and textures. This is useful for non-uniform based display-objects.
     *
     * @param {object} options
     * @param {PIXI.brend.AttributeRedirect[]} options.attribSet - set of geometry attributes
     * @param {string | Array<number>} options.indexCountProperty - no. of indices on display-object
     * @param {string | number} options.vertexCountProperty - no. of vertices on display-object
     * @param {string} options.textureProperty - textures used in display-object
     * @param {number} options.texturePerObject - no. of textures used per display-object
     * @param {string} options.inBatchIdAttrib - used to find texture for each display-object (index into array)
     * @param {string | Function}[options.stateFunction= ()=>PIXI.State.for2d()] - callback that finds the WebGL
     *  state required for display-object shader
     * @param {Function} shaderFunction - shader generator function
     * @param {PIXI.brend.BatchGeometryFactory}[options.geometryFactory]
     * @param {Class} [options.BatchFactoryClass] - custom batch factory class
     * @param {Class} [BatchRendererClass] - custom batch renderer class
     * @static
     */
    static from(options: IBatchRendererStdOptions): typeof BatchRenderer
    {
        return class extends (options.BatchRendererClass || BatchRenderer)
        {
            constructor(renderer: PIXI.Renderer)
            {
                super(renderer,
                    options.attribSet,
                    options.indexCountProperty,
                    options.vertexCountProperty,
                    options.textureProperty,
                    options.texturePerObject,
                    options.inBatchIdAttrib,
                    options.stateFunction || ((): PIXI.State => PIXI.State.for2d()),
                    options.shaderFunction,
                    options.geometryFactory,
                    options.BatchFactoryClass);
            }
        };
    }
}

export default BatchRendererPluginFactory;
