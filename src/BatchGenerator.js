/**
 * Used to generate discrete groups/batches of display-objects
 * that can be drawn together. It also keeps a parallel buffer
 * of textures.
 *
 * This class ensures that the WebGL states are equivalent and
 * the texture count doesn't become greater than the no. of
 * texture registers on the GPU. You can extend it and add
 * constraints by overriding `onPut`.
 *
 * // WARNING: `BatchRenderer` does not support geometry
 *              packing with texture reduction disabled.
 */
export class BatchGenerator
{
    /**
     * @param {number} textureIncrement - textures per object
     * @param {number} textureLimit - no. of texture registers in GPU
     * @param {string} textureProperty - property where texture is kept
     * @param {boolean} [enableTextureReduction=true] - whether same textures
     *      aren't counted multiple times. This reduces draw calls and can
     *      draw huge amounts of objects at the same time. For example,
     *      if 1000 objects use the same texture, then they can be drawn
     *      together. Further more if 1000 object use the same 8 textures
     *      randomly, then they can be drawn together. (provided other
     *      constraints like state are satisfied.)
     */
    constructor(
        textureIncrement,
        textureLimit,
        textureProperty,
        enableTextureReduction = true
    )
    {
        /** @private */
        this._state = null;
        /** @private */
        this._textureIncrement = textureIncrement;
        /** @private */
        this._textureLimit = textureLimit;
        /** @private */
        this._textureProperty = textureProperty;
        /** @private */
        this._batchBuffer = [];
        /** @private */
        this._textureBuffer = {}; // uid : texture map
        /** @private */
        this._textureBufferLength = 0;
        /** @private */
        this._textureIndexedBuffer = []; // array of textures
        /** @private */
        this._textureIndexMap = {}; // uid : index in above
        /** @protected */
        this.enableTextureReduction = enableTextureReduction;

        // this._putTexture is used to handle texture buffering!
        if (enableTextureReduction)
        {
            if (textureIncrement === 1)
            {
                /** @private */
                this._putTexture = this._putOnlyTexture;
            }
            else
            {
                this._putTexture = this._putTextureArray;
            }
        }
        else if (textureIncrement === 1)
        {
            this._putTexture = this._putTextureWithoutReduction;
        }
        else
        {
            this._putTexture = this._putTextureArrayWithoutReduction;
        }
    }

    /**
     * Overridable method that is called before an object
     * is put into this batch. It should check compatibility
     * with other objects, and return true/false accordingly.
     *
     * @param targetObject {PIXI.DisplayObject} - object being added
     * @protected
     */
    onPut(targetObject)// eslint-disable-line no-unused-vars
    {
        return true;
    }

    /**
     * Put an object into this batch.
     *
     * @param targetObject {PIXI.DisplayObject} - object to add
     * @param state {PIXI.State} - state required by that object
     * @return {boolean} whether the object was added to the
     *     batch.
     */
    put(targetObject, state)
    {
        if (!this._state)
        {
            this._state = state;
        }
        else if (this._state.data !== state.data)
        {
            return false;
        }

        if (!this.onPut(targetObject))
        {
            return false;
        }

        if (this._textureIncrement > 0
            && !this._putTexture(targetObject[this._textureProperty]))
        {
            return false;
        }

        this._batchBuffer.push(targetObject);

        return true;
    }

    /**
     * Finalize this batch by getting its data into a
     * `Batch` object.
     *
     * @param batch {PIXI.brend.Batch}
     */
    finalize(batch)
    {
        batch.batchBuffer = this._batchBuffer;
        batch.textureBuffer = this._textureIndexedBuffer;
        batch.uidMap = this.enableTextureReduction
            ? this._textureIndexMap : null;
        batch.state = this._state;

        this._state = null;
        this._batchBuffer = [];
        this._textureBuffer = {};
        this._textureIndexMap = {};
        this._textureBufferLength = 0;
        this._textureIndexedBuffer = [];
    }

    _putOnlyTexture(texture)
    {
        if (texture.baseTexture)
        {
            texture = texture.baseTexture;
        }

        if (this._textureBuffer[texture.uid])
        {
            return true;
        }
        else if (this._textureBufferLength + 1 <= this._textureLimit)
        {
            this._textureBuffer[texture.uid] = texture;
            this._textureBufferLength += 1;

            const newLength = this._textureIndexedBuffer.push(texture);
            const index = newLength - 1;

            this._textureIndexMap[texture.uid] = index;

            return true;
        }

        return false;
    }

    _putTextureArray(textureArray)
    {
        let deltaBufferLength = 0;

        for (let i = 0; i < textureArray.length; i++)
        {
            const texture = textureArray[i].baseTexture
                ? textureArray[i].baseTexture
                : textureArray[i];

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

    _putTextureWithoutReduction(texture)
    {
        if (texture.baseTexture)
        {
            texture = texture.baseTexture;
        }

        if (this._textureBufferLength + 1 > this._textureLimit)
        {
            return false;
        }

        this._textureIndexedBuffer.push(texture);

        return true;
    }

    _putTextureArrayWithoutReduction(textureArray)
    {
        if (this._textureBufferLength + textureArray.length
            > this._textureLimit)
        {
            return false;
        }

        for (let i = 0; i < textureArray.length; i++)
        {
            this._textureIndexedBuffer.push(
                textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i]
            );
        }

        return true;
    }
}

export default BatchGenerator;
