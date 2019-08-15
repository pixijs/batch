import { BatchRenderer } from './BatchRenderer';

/**
 * Generates a batch-renderer plugin.
 *
 * @memberof PIXI.brend
 * @hideconstructor
 */
class BatchRendererPluginFactory
{
    /**
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
     */
    static from(// eslint-disable-line max-params
        attributeRedirects,
        indexProperty,
        vertexCountProperty,
        textureProperty,
        texturePerObject,
        textureAttribute,
        stateFunction,
        shaderFunction,
        packer,
        BatchGeneratorClass,
        BatchRendererClass = BatchRenderer
    )
    {
        return class extends BatchRendererClass
        {
            constructor(renderer)
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

export { BatchRendererPluginFactory };
export default BatchRendererPluginFactory;
