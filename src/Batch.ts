import * as PIXI from 'pixi.js';

/**
 * Resources that need to be uploaded to WebGL to render
 * one batch.
 *
 * @memberof PIXI.brend
 * @protected
 */
export class Batch
{
    geometryOffset: number;
    uidMap: Map<number, number>;
    state: PIXI.State;

    batchBuffer: Array<PIXI.DisplayObject>;
    textureBuffer: Array<PIXI.BaseTexture>;

    constructor(geometryOffset: number)
    {
        /**
         * Offset in the geometry (set by `BatchRenderer`)
         * where this batch is located.
         *
         * @member {number}
         */
        this.geometryOffset = geometryOffset;

        /**
         * Buffer of textures that should be uploaded in-order
         * to GPU texture registers.
         *
         * @member {Array<PIXI.Texture>}
         */
        this.textureBuffer = null;

        /**
         * Map of texture-ids into texture-buffer indices.
         *
         * @member {Map<number, number>}
         */
        this.uidMap = null;

        /**
         * State required to render this batch.
         *
         * @member {PIXI.State}
         */
        this.state = null;
    }

    /**
     * Uploads the resources required before rendering this
     * batch.
     */
    upload(renderer: PIXI.Renderer): void
    {
        this.textureBuffer.forEach((tex, i) =>
        {
            renderer.texture.bind(tex, i);
        });

        renderer.state.set(this.state);
    }

    /**
     * Resets all properties to `null` to free up references
     * to resources.
     */
    reset(): void
    {
        this.textureBuffer
            = this.uidMap
                = this.state
                    = null;
    }
}
