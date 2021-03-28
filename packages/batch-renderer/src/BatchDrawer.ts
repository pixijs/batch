import { BatchRenderer } from './BatchRenderer';

/**
 * Executes the final stage of batch rendering - drawing. The drawer can assume that
 * all display-objects have been into the batch-factory and the batch-geometry factory.
 */
export class BatchDrawer
{
    renderer: BatchRenderer;

    constructor(renderer: BatchRenderer)
    {
        /**
         * @member {PIXI.brend.BatchRenderer}
         */
        this.renderer = renderer;
    }

    /**
     * This method will be called after all display-object have been fed into the
     * batch and batch-geometry factories.
     *
     * **Hint**: You will call some form of `BatchGeometryFactory#build`; be sure to release
     * that geometry for reuse in next render pass via `BatchGeometryFactory#release(geom)`.
     */
    draw(): void
    {
        const {
            renderer,
            _batchFactory: batchFactory,
            _geometryFactory: geometryFactory,
            _indexProperty: indexProperty,
        }  = this.renderer;

        const batchList = batchFactory.access();
        const batchCount = batchFactory.size();
        const geom = geometryFactory.build();
        const { gl } = renderer;

        // PixiJS bugs - the shader can't be bound before uploading because uniform sync caching
        // and geometry requires the shader to be bound.
        batchList[0].upload(renderer);
        renderer.shader.bind(this.renderer._shader, false);
        renderer.geometry.bind(geom);

        for (let i = 0; i < batchCount; i++)
        {
            const batch = batchList[i];

            batch.upload(renderer);
            renderer.shader.bind(this.renderer._shader, false);

            if (indexProperty)
            {
                // TODO: Get rid of the $indexCount black magic!
                gl.drawElements(gl.TRIANGLES, batch.$indexCount, gl.UNSIGNED_SHORT, batch.geometryOffset * 2);
            }
            else
            {
                // TODO: Get rid of the $vertexCount black magic!
                gl.drawArrays(gl.TRIANGLES, batch.geometryOffset, batch.$vertexCount);
            }

            batch.reset();
        }

        geometryFactory.release(geom);
    }
}
