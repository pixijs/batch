import { Buffer, IArrayBuffer } from '@pixi/core';
import { BufferInvalidationQueue } from './utils/BufferInvalidationQueue';

export class DiffBuffer extends Buffer
{
    public updateQueue: BufferInvalidationQueue;

    constructor(data?: IArrayBuffer, _static = false, index = false)
    {
        super(data, _static, index);

        this.updateQueue = new BufferInvalidationQueue();
    }

    update(data?: IArrayBuffer): void
    {
        super.update(data);
        this.updateQueue.clear();
    }
}
