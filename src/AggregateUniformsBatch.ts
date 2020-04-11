import { StdBatch } from './StdBatch';
import { UniformGroup } from 'pixi.js';
import BatchRenderer from './BatchRenderer';

/**
 * Allows usage of uniforms when rendering display-objects in batches. It expects you to
 * aggregate each display-object's uniforms in an array and that the shader will pick
 * the appropriate uniform at runtime (an index into the uniforms array will be passed).
 *
 * **Usage in shader:**
 * ```
 * // Your display-objects' affine transforms are aggregated into this array.
 * uniform mat3d affineTransform[];
 *
 * // For WebGL1+ machines, your uniforms may be fetched by the uniform-ID attrib (float).
 * varying float vUniformID;
 *
 * // For WebGL-2 only, to prevent interpolation overhead, you may use the flat in variables. You
 * // can configure this in AggregateUniformShaderFactory.
 * flat in int uniformID;
 * ```
 *
 * @memberof PIXI.brend
 * @class
 * @extends PIXI.brend.StdBatch
 */
export class AggregateUniformsBatch extends StdBatch
{
    renderer: BatchRenderer;

    uniformBuffer: { [id: string]: Array<UniformGroup> };
    uniformLength: number;

    constructor(renderer: BatchRenderer, geometryOffset?: number)
    {
        super(geometryOffset);

        /**
         * Renderer holding the uniform redirects
         * @member {PIXI.brend.BatchRenderer}
         */
        this.renderer = renderer;

        /**
         * The buffer of uniform arrays of the display-objects
         * @member {Object<string, Array<UniformGroup>>}
         */
        this.uniformBuffer = {};

        /**
         * No. of uniforms buffered (per uniform name)
         * @member {number}
         */
        this.uniformLength = 0;
    }

    /**
     * @param {PIXI.Renderer} renderer
     * @override
     */
    upload(renderer: PIXI.Renderer): void
    {
        super.upload(renderer);

        const { _uniformRedirects: uniformRedirects, _shader: shader } = this.renderer;

        for (let i = 0, j = uniformRedirects.length; i < j; i++)
        {
            const glslIdentifer = uniformRedirects[i].glslIdentifer;

            shader.uniforms[glslIdentifer] = this.uniformBuffer[glslIdentifer];
        }

        shader.uniformGroup.update();
    }

    /**
     * @override
     */
    reset(): void
    {
        super.reset();

        for (const uniformName in this.uniformBuffer)
        {
            this.uniformBuffer[uniformName].length = 0;
        }
    }
}
