/// <reference path="./types.d.ts" />

import { BatchGeometryFactory, BatchGeometry, BufferPool } from 'pixi-batch-renderer';
import { DiffGeometry } from './DiffGeometry';
import { ViewableBuffer } from '@pixi/core';

import type { BatchRenderer } from 'pixi-batch-renderer';
import { BufferInvalidation, BufferInvalidationPool } from './utils/BufferInvalidation';
import { DiffBuffer } from './DiffBuffer';

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
         * Cache of the geometries uploaded & rendered in the last frame.
         */
        this._geometryCache = [];

        /**
         * The geometries already rendered this frame.
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

        if (cachedBuffer.length < data.length)
        {
            geometry[type].update(data);

            this[type === 'attribBuffer' ? 'attribPool' : 'indexPool'].releaseBuffer(cachedBuffer as any);

            return;
        }

        (geometry[type] as DiffBuffer)._updateQueue = this.diffCache(geometry[type].data as ArrayLike<number>, data);

        this[type === 'attribBuffer' ? 'attribPool' : 'indexPool'].releaseBuffer(data as any);
    }

    /**
     * Calculates the regions different in the cached & updated versions of a buffer.
     *
     * @param cache
     * @param data
     */
    protected diffCache(cache: ArrayLike<number>, data: ArrayLike<number>): BufferInvalidation[]
    {
        const length = Math.min(cache.length, data.length);

        let inDiff = false;
        let diffOffset = 0;

        const diffs: BufferInvalidation[] = [];

        for (let i = 0; i < length; i++)
        {
            const c = cache[i];
            const d = data[i];

            if (c !== d)
            {
                (cache as number[])[i] = d;
            }

            if (c !== d && !inDiff)
            {
                inDiff = true;
                diffOffset = i;
            }
            else if (c === d && inDiff)
            {
                inDiff = false;

                diffs.push(
                    BufferInvalidationPool.allocate()
                        .init(diffOffset, diffOffset, i - diffOffset));
            }
        }

        if (inDiff)
        {
            diffs.push(BufferInvalidationPool.allocate()
                .init(diffOffset, diffOffset, length - diffOffset));
        }

        return diffs;
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
