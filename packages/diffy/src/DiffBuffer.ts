/// <reference path="./types.d.ts" />

import { Buffer } from '@pixi/core';
import { BufferInvalidationPool } from './utils/BufferInvalidation';

import type { BufferInvalidation } from './utils/BufferInvalidation';

export class DiffBuffer extends Buffer
{
    backData: ArrayBufferView;
    _updateQueue: BufferInvalidation[];

    constructor(data?: ArrayBuffer | ArrayBufferView, _static = false, index = false)
    {
        super(data, _static, index);

        this.backData = null;

        this._updateQueue = [];
    }

    updateBack(data: ArrayBufferView): void
    {
        this.backData = data;
    }

    updatePartial(srcOffset: number, dstOffset: number, size: number): void
    {
        this._updateQueue.push(
            BufferInvalidationPool.allocate()
                .init(srcOffset, dstOffset, size));
    }
}
