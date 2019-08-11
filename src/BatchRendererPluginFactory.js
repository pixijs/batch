import { BatchRenderer } from './BatchRenderer';

/**
 * Generates a batch-renderer plugin.
 *
 * @memberof PIXI.brend
 */
export class BatchRendererPluginFactory
{
    static from(
        attributeRedirects,
        indexProperty,
        vertexCountProperty,
        textureProperty,
        texturePerObject,
        textureAttribute,
        stateFunction,
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
                    packer,
                    BatchGeneratorClass);
            }
        };
    }
}
