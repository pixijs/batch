import { StdBatchFactory } from './StdBatchFactory';
import { AggregateUniformsBatch } from './AggregateUniformsBatch';
import BatchRenderer from './BatchRenderer';
import * as PIXI from 'pixi.js';

/**
 * Factory for producing aggregate-uniforms batches. This is useful for shaders that
 * **must** use uniforms.
 *
 * @memberof PIXI.brend.AggregateUniformsBatchFactory
 */
export class AggregateUniformsBatchFactory extends StdBatchFactory
{
    MAX_UNIFORMS: number;

    protected uniformBuffer: { [id: string]: Array<PIXI.UniformGroup> };
    protected uniformMap: Array<number>;
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
                renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_VERTEX_UNIFORM_VECTORS),
                renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_FRAGMENT_UNIFORM_VECTORS))
            / (4 * renderer._uniformRedirects.length));

        this.uniformBuffer = this._createUniformBuffer();
        this.uniformMap = [];
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
        batch.uniformMap = [];

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
        if (!this._renderer._uniformIDAttrib)
        {
            // No aggregation mode! If uniforms already buffered, they **must** match or batch will break.
            if (this.uniformLength > 0)
            {
                const id = this._matchUniforms(displayObject);

                if (id > 0)
                {
                    return true;
                }

                return false;
            }
        }

        if (this.uniformLength + 1 >= this.MAX_UNIFORMS)
        {
            return false;
        }

        if (this._renderer._uniformIDAttrib)
        {
            const id = this._matchUniforms(displayObject);

            if (id > 0)
            {
                this.uniformMap.push(id);

                return true;
            }
        }

        // Push each uniform into the buffer
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++)
        {
            const uniformRedirect = this._renderer._uniformRedirects[i];
            const { source, glslIdentifer } = uniformRedirect;

            this.uniformBuffer[glslIdentifer].push(typeof source === 'string'
                ? (displayObject as any)[source] : source(displayObject));
        }

        this.uniformMap.push(this.uniformLength);
        ++this.uniformLength;

        return true;
    }

    /**
     * @protected
     * @param {AggregateUniformBatch} batch
     */
    _buildBatch(batch: any): void
    {
        super._buildBatch(batch);

        const buffer = batch.uniformBuffer;
        const map = batch.uniformMap;

        batch.uniformBuffer = this.uniformBuffer;
        batch.uniformMap = this.uniformMap;
        batch.uniformLength = this.uniformLength;

        // Swap & reset instead of new allocation
        this.uniformBuffer = buffer;
        this.uniformMap = map;
        this.uniformLength = 0;
        this._resetUniformBuffer(this.uniformBuffer);
        this.uniformMap.length = 0;
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

    /**
     * Finds a matching set of uniforms in the buffer.
     */
    private _matchUniforms(displayObject: any): number
    {
        const uniforms = this._renderer._uniformRedirects;

        for (let i = this.uniformLength - 1; i >= 0; i--)
        {
            let isMatch = true;

            for (let k = 0, n = uniforms.length; k < n; k++)
            {
                const { glslIdentifer, source } = uniforms[k];

                const value = typeof source === 'string'
                    ? displayObject[source]
                    : source(displayObject as PIXI.DisplayObject);

                if (!this._compareUniforms(value, this.uniformBuffer[glslIdentifer][i]))
                {
                    isMatch = false;
                    break;
                }
            }

            if (isMatch)
            {
                return i;
            }
        }

        return -1;
    }

    // Compares two uniforms u1 & u2 for equality.
    private _compareUniforms(u1: any, u2: any): boolean
    {
        if (u1 === u2)
        {
            return true;
        }

        // UniformGroups must have referential equality
        if (u1.group || u2.group)
        {
            return false;
        }

        // Allow equals() method for custom stuff.
        if (u1.equals)
        {
            return u1.equals(u2);
        }

        // Test one-depth equality for arrays
        if (Array.isArray(u1) && Array.isArray(u2))
        {
            if (u1.length !== u2.length)
            {
                return false;
            }

            for (let i = 0, j = u1.length; i < j; i++)
            {
                // Referential equality for array elements
                if (u1[i] !== u2[i])
                {
                    return false;
                }
            }

            return true;
        }

        if (u1 instanceof PIXI.Point && u2 instanceof PIXI.Point)
        {
            return u1.x === u2.x && u1.y === u2.y;
        }
        if (u1 instanceof PIXI.Matrix && u2 instanceof PIXI.Matrix)
        {
            return u1.a === u2.a && u1.b === u2.b
                && u1.c === u2.c && u1.d === u2.d
                && u1.tx === u2.tx && u1.ty === u2.ty;
        }

        // Unlikely for batch rendering
        if (u1 instanceof PIXI.BaseTexture && u2 instanceof PIXI.BaseTexture)
        {
            return u1.uid === u2.uid;
        }

        return true;
    }
}
