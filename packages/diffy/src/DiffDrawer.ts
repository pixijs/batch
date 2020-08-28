/// <reference path="types.d.ts" />

import { BatchDrawer } from 'pixi-batch-renderer';
import { uploadBuffer } from './utils/uploadBuffer';

import type { DiffBuffer } from './DiffBuffer';

export class DiffDrawer extends BatchDrawer
{
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

        // Clear update-queue if buffers are fully invalidated
        for (let i = 0; i < (geom as any).buffers.length; i++)
        {
            const buffer = (geom as any).buffers[i];
            const glBuffer = buffer._glBuffers[(renderer as any).CONTEXT_UID];

            if (buffer._updateID !== glBuffer.updateID)
            {
                (buffer as DiffBuffer)._updateQueue.length = 0;
            }
        }

        renderer.geometry.bind(geom);

        for (let i = 0; i < (geom as any).buffers.length; i++)
        {
            const buffer = (geom as any).buffers[i];

            uploadBuffer(renderer.geometry, buffer);
        }

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
