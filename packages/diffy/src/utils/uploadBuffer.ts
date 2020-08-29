/// <reference path="../types.d.ts" />

import { BufferInvalidationPool } from './BufferInvalidation';

import type { BufferInvalidationQueue } from './BufferInvalidationQueue';
import type { systems } from '@pixi/core';

export function uploadBuffer(geometrySystem: systems.GeometrySystem, buffer: any): void
{
    const renderer = geometrySystem.renderer;
    const gl = renderer.gl;
    const glBuffer = buffer._glBuffers[(renderer as any).CONTEXT_UID];

    const type = buffer.index ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;

    if (buffer._updateID === glBuffer.updateID && buffer.updateQueue.length === 0)
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
    else if (buffer.updateQueue.size > 0)
    {
        const queue: BufferInvalidationQueue = buffer.updateQueue;
        const data = buffer.data;

        queue.partition();

        for (let node = queue.start; node; node = node.next)
        {
            const { offset, size } = node;

            (gl as WebGL2RenderingContext).bufferSubData(
                type,
                offset * data.BYTES_PER_ELEMENT,
                data,
                offset,
                size,
            );
        }
    }

    if (buffer.updateQueue.size > 0)
    {
        buffer.updateQueue.clear();
    }
}
