import { ObjectPoolFactory } from '@pixi-essentials/object-pool';

/**
 * A buffer invalidation records a region of data that has changed across frames.
 */
export class BufferInvalidation
{
    srcOffset: number;
    dstOffset: number;
    size: number;

    constructor()
    {
        this.srcOffset = 0;
        this.dstOffset = 0;
        this.size = 0;
    }

    /**
     * Initialize the invalidation tracking data.
     */
    init(srcStart: number, dstOffset: number, size: number): this
    {
        this.srcOffset = srcStart;
        this.dstOffset = dstOffset;
        this.size = size;

        return this;
    }
}

export const BufferInvalidationPool = ObjectPoolFactory.build(BufferInvalidation);
