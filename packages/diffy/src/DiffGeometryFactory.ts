import { BatchGeometryFactory, BatchGeometry, BufferPool } from 'pixi-batch-renderer';
import { BufferInvalidationQueue } from './utils/BufferInvalidationQueue';
import { DiffBuffer } from './DiffBuffer';
import { DiffGeometry } from './DiffGeometry';
import { ViewableBuffer } from '@pixi/core';

import type { BatchRenderer } from 'pixi-batch-renderer';

declare interface HackedUint32Array extends Uint32Array {
    viewableBuffer: ViewableBuffer;
}

// ViewableBuffer.constructor(ArrayBuffer) is introduced in the Compressed Textures PR in pixi.js, will be released ion 5.4.0
// Cringe hack till then:
function hackViewableBuffer(buffer: Uint32Array): ViewableBuffer
{
    const hackedBuffer = buffer as HackedUint32Array;

    if (hackedBuffer.viewableBuffer)
    {
        return hackedBuffer.viewableBuffer;
    }

    const viewableBuffer = new ViewableBuffer(0);

    viewableBuffer.rawBinaryData = buffer.buffer;
    viewableBuffer.uint32View = buffer;
    viewableBuffer.float32View = new Float32Array(buffer.buffer);

    hackedBuffer.viewableBuffer = viewableBuffer;

    return viewableBuffer;
}

export class DiffGeometryFactory extends BatchGeometryFactory
{
    // typings from BGF
    _vertexSize: number;

    protected _geometryCache: DiffGeometry[];
    protected _geometryPipeline: DiffGeometry[];

    attribPool: BufferPool<Uint32Array>;
    indexPool: BufferPool<Uint16Array>;

    constructor(renderer: BatchRenderer)
    {
        super(renderer);

        /**
         * Cache of the geometries drawn in the last frame.
         */
        this._geometryCache = [];

        /**
         * The geometries already drawn this frame.
         */
        this._geometryPipeline = [];

        this.attribPool = new BufferPool(Uint32Array);
        this.indexPool = new BufferPool(Uint16Array);

        renderer.renderer.on('postrender', this.postrender, this);
    }

    build(): DiffGeometry
    {
        const cache: DiffGeometry = this._geometryCache.shift();

        const geom = cache || new DiffGeometry(
            this._attribRedirects,
            true,
            this._texIDAttrib,
            this._texturesPerObject,
            this._inBatchIDAttrib,
            this._uniformIDAttrib,
            this._masterIDAttrib,
        );

        if (!cache)
        {
            geom.attribBuffer.update(this._targetCompositeAttributeBuffer.uint32View);
            geom.indexBuffer.update(this._targetCompositeIndexBuffer);
        }
        else
        {
            this.updateCache(cache, 'attribBuffer', this._targetCompositeAttributeBuffer.uint32View);
            this.updateCache(cache, 'indexBuffer', this._targetCompositeIndexBuffer);
        }

        return geom;
    }

    /**
     * {@code DiffGeometryFactory}
     *
     * @override
     * @param geom
     */
    release(geom: DiffGeometry): void
    {
        this._geometryPipeline.push(geom);
    }

    protected updateCache(
        geometry: BatchGeometry,
        type: 'attribBuffer' | 'indexBuffer',
        data: Uint32Array | Uint16Array,
    ): void
    {
        const cachedBuffer = geometry[type].data as ArrayLike<number>;
        const buffer = geometry[type] as DiffBuffer;
        const bufferPool = this[type === 'attribBuffer' ? 'attribPool' : 'indexPool'];
        const bufferLength = type === 'attribBuffer' ? this._aIndex / 4 : this._iIndex;

        if (cachedBuffer.length < data.length)
        {
            buffer.update(data);
            bufferPool.releaseBuffer(cachedBuffer as any);

            return;
        }

        this.diffCache(buffer.data as ArrayLike<number>, data, bufferLength, buffer.updateQueue);
        bufferPool.releaseBuffer(data as any);
    }

    /**
     * Calculates the regions different in the cached & updated versions of a buffer. The cache is expected to not be smaller
     * than the updated data.
     *
     * @param cache
     * @param data
     */
    protected diffCache(
        cache: ArrayLike<number>,
        data: ArrayLike<number>,
        length: number,
        diffQueue: BufferInvalidationQueue): void
    {
        diffQueue.clear();

        // Flags whether the loop is inside an invalidated interval
        let inDiff = false;

        // Stores the offset of the current invalidated interval, if inDiff
        let diffOffset = 0;

        // Fill diffQueue
        for (let i = 0; i < length; i++)
        {
            const cachedElement = cache[i];
            const dataElement = data[i];

            if (cachedElement !== dataElement)
            {
                (cache as number[])[i] = dataElement;
            }

            if (cachedElement !== dataElement && !inDiff)
            {
                inDiff = true;
                diffOffset = i;
            }
            else if (cachedElement === dataElement && inDiff)
            {
                inDiff = false;

                diffQueue.append(diffOffset, i - diffOffset);
            }
        }

        if (inDiff)
        {
            diffQueue.append(diffOffset, length - diffOffset);
        }
    }

    /**
     * Release the geometry cache
     */
    protected releaseCache(): void
    {
        this._geometryPool.push(...this._geometryCache);

        // Swap geometryCache & geometryPipeline arrays.
        const lastCache = this._geometryCache;

        this._geometryCache = this._geometryPipeline;
        this._geometryPipeline = lastCache;
        this._geometryPipeline.length = 0;
    }

    postrender(): void
    {
        this.releaseCache();
    }

    getAttributeBuffer(size: number): ViewableBuffer
    {
        const buffer = this.attribPool.allocateBuffer(size * this._vertexSize);
        const vbuf = hackViewableBuffer(buffer);

        return vbuf;
    }

    getIndexBuffer(size: number): Uint16Array
    {
        return this.indexPool.allocateBuffer(size);
    }
}
