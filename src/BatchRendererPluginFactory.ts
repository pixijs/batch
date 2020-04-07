import { BatchRenderer } from './BatchRenderer';
import { AttributeRedirect } from './redirects/AttributeRedirect';
import GeometryPacker from './GeometryPacker';
import BatchGenerator from './BatchGenerator';

/**
 * Generates a batch-renderer plugin.
 *
 * @memberof PIXI.brend
 * @hideconstructor
 * @class
 */
export class BatchRendererPluginFactory
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

export default BatchRendererPluginFactory;
