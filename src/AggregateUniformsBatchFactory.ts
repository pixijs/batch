import { StdBatchFactory } from './StdBatchFactory';
import { AggregateUniformsBatch } from './AggregateUniformsBatch';
import BatchRenderer from './BatchRenderer';
import * as PIXI from 'pixi.js';

/**
 * Factory for producing aggregate-uniforms batches. This is useful for shaders that
 * **must** use uniforms.
 *
 * **Hint**: Use this with `PIXI.brend.AggregateUniformsBatchDrawer`.
 *
 * @memberof PIXI.brend.AggregateUniformsBatchFactory
 */
export class AggregateUniformsBatchFactory extends StdBatchFactory
{
    MAX_UNIFORMS: number;

    protected uniformBuffer: { [id: string]: Array<PIXI.UniformGroup> };
    protected uniformLength: number;

    constructor(renderer: BatchRenderer)
    {
        super(renderer);

        /**
         * The max. uniforms until the batch is filled
         * @member {number}
         * @readonly
         */
        // Max. no. of uniforms that can be passed to the batch shader. We divide by four because
        // mat4d/vec4 count as four uniforms.
        this.MAX_UNIFORMS = Math.floor(
            Math.min(
                renderer.gl.getParameter(renderer.gl.MAX_VERTEX_UNIFORM_VECTORS),
                renderer.gl.getParameter(renderer.gl.MAX_FRAGMENT_UNIFORM_VECTORS))
            / (4 * renderer._uniformRedirects.length));

        this.uniformBuffer = this._createUniformBuffer();
        this.uniformLength = 0;
    }

    /**
     * @returns {AggregateUniformsBatch}
     */
    _newBatch(): AggregateUniformsBatch
    {
        const batch = new AggregateUniformsBatch(this._renderer);

        // All pooled batches will have a buffer
        batch.uniformBuffer = this._createUniformBuffer();

        return batch;
    }

    /**
     * Stores uniforms in the current batch, if possible.
     *
     * If you want to override this, be sure to return beforehand if `super._put` returns
     * false:
     * ```
     * _put(displayObject: PIXI.DisplayObject): boolean
     * {
     *      if (!super._put(displayObject))
     *      {
     *          return false;
     *      }
     *
     *      // Your logic ...
     * }
     * ```
     *
     * @protected
     * @param {PIXI.DisplayObject} displayObject
     * @returns {boolean} - whether uniforms can be buffered
     */
    protected _put(displayObject: PIXI.DisplayObject): boolean
    {
        if (this.uniformLength + 1 >= this.MAX_UNIFORMS)
        {
            return false;
        }

        // Push each uniform into the buffer
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++)
        {
            const uniformRedirect = this._renderer._uniformRedirects[i];
            const { source, glslIdentifer } = uniformRedirect;

            this.uniformBuffer[glslIdentifer].push(typeof source === 'string'
                ? (displayObject as any)[source] : source(displayObject));
        }

        return false;
    }

    /**
     * @protected
     * @param {AggregateUniformBatch} batch
     */
    _buildBatch(batch: any): void
    {
        super._buildBatch(batch);

        const buffer = batch.uniformBuffer;

        buffer.uniformBuffer = this.uniformBuffer;
        buffer.uniformLength = this.uniformLength;

        // Swap & reset instead of new allocation
        this.uniformBuffer = buffer;
        this.uniformLength = 0;
        this._resetUniformBuffer(this.uniformBuffer);
    }

    /**
     * Creates an array for each uniform-name in an object.
     *
     * @returns - the object created (the uniform buffer)
     */
    private _createUniformBuffer(): { [id: string]: Array<PIXI.UniformGroup> }
    {
        const buffer: { [id: string]: Array<PIXI.UniformGroup> } = {};

        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++)
        {
            const uniformRedirect = this._renderer._uniformRedirects[i];

            buffer[uniformRedirect.glslIdentifer] = [];
        }

        return buffer;
    }

    /**
     * Resets each array in the uniform buffer
     * @param {object} buffer
     */
    private _resetUniformBuffer(buffer: { [id: string]: Array<PIXI.UniformGroup> }): void
    {
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++)
        {
            const uniformRedirect = this._renderer._uniformRedirects[i];

            buffer[uniformRedirect.glslIdentifer].length = 0;
        }
    }
}
