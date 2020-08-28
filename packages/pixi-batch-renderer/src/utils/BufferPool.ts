import { ViewableBuffer } from 'pixi.js';
import { utils} from 'pixi.js';

export class BufferPool<T extends ArrayLike<number>>
{
    private _bufferPools: T[][];
    private _bufferType: { new(size: number): ArrayLike<number> };

    constructor(bufferType: { new(size: number): ArrayLike<number> })
    {
        this._bufferPools = [];
        this._bufferType = bufferType;
    }

    allocateBuffer(size: number): T
    {
        const roundedP2 = utils.nextPow2(size);
        const roundedSizeIndex = utils.log2(roundedP2);
        const roundedSize = roundedP2;

        if (this._bufferPools.length <= roundedSizeIndex)
        {
            this._bufferPools.length = roundedSizeIndex + 1;
        }

        let bufferPool = this._bufferPools[roundedSizeIndex];

        if (!bufferPool)
        {
            this._bufferPools[roundedSizeIndex] = bufferPool = [];
        }

        return bufferPool.pop() || (new (this._bufferType)(roundedSize) as T);
    }

    releaseBuffer(buffer: T): void
    {

    }
}
