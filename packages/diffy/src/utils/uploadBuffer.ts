/// <reference path="../types.d.ts" />

import { BufferInvalidationPool } from './BufferInvalidation';

import type { systems } from '@pixi/core';

export function uploadBuffer(geometrySystem: systems.GeometrySystem, buffer: any): void
{
    const renderer = geometrySystem.renderer;
    const gl = renderer.gl;
    const glBuffer = buffer._glBuffers[(renderer as any).CONTEXT_UID];

    const type = buffer.index ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

    if (buffer._updateID === glBuffer.updateID && buffer._updateQueue.length === 0)
    {
        return;
    }

    gl.bindBuffer(type, glBuffer.buffer);

    (geometrySystem as any)._boundBuffer = glBuffer;

    if (buffer._updateID !== glBuffer.updateID || renderer.context.webGLVersion === 1)
    {
        if (glBuffer.byteLength >= buffer.data.byteLength)
        {
            // offset is always zero for now!
            gl.bufferSubData(type, 0, buffer.data);
        }
        else
        {
            const drawType = buffer.static ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;

            glBuffer.byteLength = buffer.data.byteLength;
            gl.bufferData(type, buffer.data, drawType);
        }

        glBuffer.updateID = buffer._updateID;
    }
    else if (buffer._updateQueue.length > 0)
    {
        const queue = buffer._updateQueue;
        const src = buffer.data;

        gl.bufferSubData(type, 0, buffer.data);

        for (let i = 0; i < queue.length; i++)
        {
            const { srcOffset, dstOffset, size } = queue[i];

            (gl as WebGL2RenderingContext).bufferSubData(
                type,
                dstOffset * src.BYTES_PER_ELEMENT,
                src,
                srcOffset,
                size,
            );
        }
    }

    if (buffer._updateQueue.length > 0)
    {
        BufferInvalidationPool.releaseArray(buffer._updateQueue);
        buffer._updateQueue.length = 0;
    }
}
