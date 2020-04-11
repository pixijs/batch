import { StdBatch } from './StdBatch';
import BatchRenderer from './BatchRenderer';

/**
 * Factory for producing "standard" (based on state, geometry, & textures) batches of
 * display-objects.
 *
 * **NOTE:** Instead of "building" batches, this factory actually keeps the batches in
 * a buffer so they can be accessed together at the end.
 *
 * **Shared Textures**: If display-objects in the same batch use the same base-texture,
 * then that base-texture is not uploaded twice. This allows for more better batch density
 * when you use texture atlases (textures with same base-texture). This is one reason why
 * textures are treated as "special" uniforms.
 *
 * @memberof PIXI.brend
 * @class
 * @see PIXI.brend.AggregateUniformsBatchFactory
 */
export class StdBatchFactory
{
    protected _renderer: BatchRenderer;

    protected _textureCount: number;
    protected _textureLimit: number;
    protected _textureProperty: string;

    /** @internal */
    public _batchBuffer: Array<PIXI.DisplayObject>;
    protected _state: PIXI.State;

    protected _textureBuffer: any;
    protected _textureBufferLength: number;
    protected _textureIndexedBuffer: Array<PIXI.BaseTexture>;
    protected _textureIndexMap: any;

    protected _batchPool: any[];
    protected _batchCount: number;

    // _putTexture is optimized for the one texture/display-object case.
    protected _putTexture: any;

    /**
     * @param {PIXI.brend.BatchRenderer} renderer
     */
    constructor(renderer: BatchRenderer)
    {
        /**
         * @member {PIXI.brend.BatchRenderer}
         * @protected
         */
        this._renderer = renderer;
        this._state = null;

        /**
         * Textures per display-object
         * @member {number}
         */
        this._textureCount = renderer._texturesPerObject;

        /**
         * Property in which textures are kept of display-objects
         * @member {string}
         */
        this._textureProperty = renderer._textureProperty;

        /**
         * Max. no of textures per batch (should be <= texture units of GPU)
         * @member {number}
         */
        this._textureLimit = renderer.MAX_TEXTURES;

        /**
         * @member {object}
         */
        this._textureBuffer = {}; // uid : texture map
        this._textureBufferLength = 0;
        this._textureIndexedBuffer = []; // array of textures
        this._textureIndexMap = {}; // uid : index in above

        /**
         * Display-objects in current batch
         * @protected
         */
        this._batchBuffer = [];

        /**
         * Pool to batch objects into which data is fed.
         * @member {any[]}
         * @protected
         */
        this._batchPool = [];

        /**
         * Number of batches created since last reset.
         * @member {number}
         * @protected
         */
        this._batchCount = 0;

        if (this._textureCount === 1)
        {
            this._putTexture = this._putSingleTexture;
        }
        else
        {
            this._putTexture = this._putAllTextures;
        }
    }

    /**
     * Puts the display-object into the current batch, if possible.
     *
     * @param targetObject {PIXI.DisplayObject} - object to add
     * @param state {PIXI.State} - state required by that object
     * @return {boolean} whether the object was added to the batch. If it wasn't, you should "build" it.
     */
    put(targetObject: PIXI.DisplayObject, state: PIXI.State): boolean
    {
        // State compat
        if (!this._state)
        {
            this._state = state;
        }
        else if (this._state.data !== state.data)
        {
            return false;
        }

        // Customized compat
        if (!this._put(targetObject))
        {
            return false;
        }

        // Texture compat
        if (this._textureCount > 0 && !this._putTexture((targetObject as any)[this._textureProperty]))
        {
            return false;
        }

        this._batchBuffer.push(targetObject);

        return true;
    }

    /**
     * Creates the batch object and pushes it into the pool This also resets any state
     * so that a new batch can be started again.
     *
     * @param batch {PIXI.brend.Batch}
     */
    build(geometryOffset: number): void
    {
        const batch = this._nextBatch() as StdBatch;

        batch.geometryOffset = geometryOffset;
        this._buildBatch(batch);

        this._state = null;
        this._batchBuffer = [];
        this._textureBuffer = {};
        this._textureIndexMap = {};
        this._textureBufferLength = 0;
        this._textureIndexedBuffer = [];
    }

    /**
     * @returns {boolean} - whether this factory is ready to start a new batch from
     *  "start". If not, then the current batch must be built before starting a new one.
     */
    ready(): boolean
    {
        return this._batchBuffer.length === 0;
    }

    /**
     * Clears the batch pool.
     */
    reset(): void
    {
        this._batchCount = 0;
    }

    /**
     * Returns the built batch pool. The array returned may be larger than the pool
     * itself.
     *
     * @returns {Array<object>}
     */
    access(): any[]
    {
        return this._batchPool;
    }

    /**
     * Size of the batch pool built since last reset.
     */
    size(): number
    {
        return this._batchCount;
    }

    /**
     * Should store any information from the display-object to be put into
     * the batch.
     * @param {PIXI.DisplayObject} displayObject
     * @returns {boolean} - whether the display-object was "compatible" with
     *      other display-objects in the batch. If not, it should not have been
     *      added.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _put(displayObject: PIXI.DisplayObject): boolean
    {
        // Override this
        return true;
    }

    /**
     * @returns {object} a new batch
     * @protected
     * @example
     * _newBatch(): CustomBatch
     * {
     *      return new CustomBatch();
     * }
     */
    protected _newBatch(): any
    {
        return new StdBatch();
    }

    /**
     * @param {number} geometryOffset
     */
    protected _nextBatch(geometryOffset?: number): any
    {
        if (this._batchCount === this._batchPool.length)
        {
            this._batchPool.push(this._newBatch());
        }

        const batch = this._batchPool[this._batchCount++];

        batch.reset();
        batch.geometryOffset = geometryOffset;

        return batch;
    }

    /**
     * Should add any information required to render the batch. If you override this,
     * you must call `super._buildBatch` and clear any state.
     * @param {object} batch
     * @protected
     * @example
     * _buildBatch(batch: any): void
     * {
     *      super._buildBatch(batch);
     *      batch.depth = this.generateDepth();
     *
     *      // if applicable
     *      this.resetDepthGenerator();
     * }
     */
    protected _buildBatch(batch: any): void
    {
        batch.batchBuffer = this._batchBuffer;
        batch.textureBuffer = this._textureIndexedBuffer;
        batch.uidMap = this._textureIndexMap;
        batch.state = this._state;
    }

    // Optimized _putTexture case.
    private _putSingleTexture(texture: PIXI.BaseTexture | PIXI.Texture): boolean
    {
        if ('baseTexture' in texture)
        {
            texture = texture.baseTexture;
        }

        const baseTexture: PIXI.BaseTexture = texture as PIXI.BaseTexture;

        if (this._textureBuffer[baseTexture.uid])
        {
            return true;
        }
        else if (this._textureBufferLength + 1 <= this._textureLimit)
        {
            this._textureBuffer[baseTexture.uid] = texture;
            this._textureBufferLength += 1;

            const newLength = this._textureIndexedBuffer.push(baseTexture);
            const index = newLength - 1;

            this._textureIndexMap[baseTexture.uid] = index;

            return true;
        }

        return false;
    }

    private _putAllTextures(textureArray: Array<PIXI.Texture>): boolean
    {
        let deltaBufferLength = 0;

        for (let i = 0; i < textureArray.length; i++)
        {
            const texture: PIXI.BaseTexture = (textureArray[i].baseTexture
                ? textureArray[i].baseTexture
                : textureArray[i]) as PIXI.BaseTexture;

            if (!this._textureBuffer[texture.uid])
            {
                ++deltaBufferLength;
            }
        }

        if (deltaBufferLength + this._textureBufferLength > this._textureLimit)
        {
            return false;
        }

        for (let i = 0; i < textureArray.length; i++)
        {
            const texture = textureArray[i].baseTexture
                ? textureArray[i].baseTexture
                : textureArray[i];

            if (!this._textureBuffer[texture.uid])
            {
                this._textureBuffer[texture.uid] = texture;
                this._textureBufferLength += 1;

                const newLength = this._textureIndexedBuffer.push(texture);
                const index = newLength - 1;

                this._textureIndexMap[texture.uid] = index;
            }
        }

        return true;
    }
}

export default StdBatchFactory;
