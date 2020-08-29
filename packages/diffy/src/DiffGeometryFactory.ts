/// <reference path="./types.d.ts" />

import { BatchGeometryFactory, BatchGeometry, BufferPool } from 'pixi-batch-renderer';
import { BufferInvalidationPool } from './utils/BufferInvalidation';
import { BufferInvalidationQueue } from './utils/BufferInvalidationQueue';
import { DiffBuffer } from './DiffBuffer';
import { DiffGeometry } from './DiffGeometry';
import { ViewableBuffer } from '@pixi/core';

import type { BatchRenderer } from 'pixi-batch-renderer';

// ViewableBuffer(ArrayBuffer) is introduced in the Compressed Textures PR in pixi.js, will be released ion 5.4.0
// Cringe hack till then:
function hackViewableBuffer(buffer: ArrayBuffer): ViewableBuffer
{
    const vbuf = new ViewableBuffer(0);

    vbuf.rawBinaryData = buffer;
    vbuf.float32View = new Float32Array(buffer);
    vbuf.uint32View = new Uint32Array(buffer);

    return vbuf;
}

export class DiffGeometryFactory extends BatchGeometryFactory
{
    // typings from BGF
    _vertexSize: number;

    protected _geometryCache: DiffGeometry[];
    protected _geometryPipeline: DiffGeometry[];

    attribPool: BufferPool<Float32Array>;
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

        this.attribPool = new BufferPool(Float32Array);
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
            geom.attribBuffer.update(this._targetCompositeAttributeBuffer.float32View);
            geom.indexBuffer.update(this._targetCompositeIndexBuffer);
        }
        else
        {
            this.updateCache(cache, 'attribBuffer', this._targetCompositeAttributeBuffer.float32View);
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
        data: Float32Array | Uint16Array,
    ): void
    {
        const cachedBuffer = geometry[type].data as ArrayLike<number>;
        const buffer = geometry[type] as DiffBuffer;
        const bufferPool = this[type === 'attribBuffer' ? 'attribPool' : 'indexPool'];

        if (cachedBuffer.length < data.length)
        {
            buffer.update(data);
            bufferPool.releaseBuffer(cachedBuffer as any);

            return;
        }

        this.diffCache(buffer.data as ArrayLike<number>, data, buffer.updateQueue);
        bufferPool.releaseBuffer(data as any);
    }

    /**
     * Calculates the regions different in the cached & updated versions of a buffer. The cache is expected to not be smaller
     * than the updated data.
     *
     * @param cache
     * @param data
     */
    protected diffCache(cache: ArrayLike<number>, data: ArrayLike<number>, diffQueue: BufferInvalidationQueue): void
    {
        diffQueue.clear();

        // NOTE: cache.length >= data.length expected!
        const length = Math.min(cache.length, data.length);

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

                diffQueue.append(
                    BufferInvalidationPool
                        .allocate()
                        .init(diffOffset, i - diffOffset),
                );
            }
        }

        if (inDiff)
        {
            diffQueue.append(
                BufferInvalidationPool.allocate()
                    .init(diffOffset, length - diffOffset),
            );
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
