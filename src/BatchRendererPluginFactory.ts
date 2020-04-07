import { BatchRenderer } from './BatchRenderer';
import { AttributeRedirect } from './redirects/AttributeRedirect';
import GeometryPacker from './GeometryPacker';
import BatchGenerator from './BatchGenerator';

/**
 * Factory class for creating a batch-renderer.
 *
 * @memberof PIXI.brend
 * @class
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
        packer: GeometryPacker,
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
