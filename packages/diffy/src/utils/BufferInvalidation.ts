import { ObjectPoolFactory } from '@pixi-essentials/object-pool';

import type { ObjectPool } from '@pixi-essentials/object-pool';

/* eslint-disable-next-line prefer-const */
export let BufferInvalidationPool: ObjectPool<BufferInvalidation>;

/**
 * A buffer invalidation records a region of data that has changed across frames.
 *
 * @ignore
 * @internal
 */
export class BufferInvalidation
{
    offset: number;
    size: number;
    next: BufferInvalidation;

    constructor()
    {
        this.offset = 0;
        this.size = 0;
        this.next = null;
    }

    /**
     * Initialize the invalidation tracking data.
     */
    init(srcStart: number, size: number): this
    {
        this.offset = srcStart;
        this.size = size;

        return this;
    }

    /**
     * Clone this object, used for debugging only
     */
    clone(): BufferInvalidation
    {
        return BufferInvalidationPool.allocate()
            .init(this.offset, this.size);
    }
}

BufferInvalidationPool = ObjectPoolFactory.build(BufferInvalidation);
