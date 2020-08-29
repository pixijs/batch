/// <reference path="./types.d.ts" />

import { Buffer } from '@pixi/core';
import { BufferInvalidationPool } from './utils/BufferInvalidation';
import { BufferInvalidationQueue } from './utils/BufferInvalidationQueue';

import type { BufferInvalidation } from './utils/BufferInvalidation';

export class DiffBuffer extends Buffer
{
    public updateQueue: BufferInvalidationQueue;

    constructor(data?: ArrayBuffer | ArrayBufferView, _static = false, index = false)
    {
        super(data, _static, index);

        this.updateQueue = new BufferInvalidationQueue();
    }

    update(data?: ArrayBuffer | ArrayBufferView): void
    {
        super.update(data);
        this.updateQueue.clear();
    }
}
