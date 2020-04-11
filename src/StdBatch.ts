import * as PIXI from 'pixi.js';

/**
 * Resources that need to be uploaded to WebGL to render one batch.
 *
 * To customize batches, you must create your own batch factory by extending the
 * `PIXI.brend.StdBatchFactory` class.
 *
 * @memberof PIXI.brend
 * @class
 * @see PIXI.brend.StdBatchFactory
 */
export class StdBatch
{
    geometryOffset: number;
    uidMap: any;
    state: PIXI.State;

    batchBuffer: Array<PIXI.DisplayObject>;
    textureBuffer: Array<PIXI.BaseTexture>;

    constructor(geometryOffset?: number)
    {
        /**
         * Index of the first vertex of this batch's geometry in the uploaded geometry.
         *
         * @member {number}
         */
        this.geometryOffset = geometryOffset;

        /**
         * Textures that are used by the display-object's in this batch.
         *
         * @member {Array<PIXI.Texture>}
         */
        this.textureBuffer = null;

        /**
         * Map of base-texture UIDs to texture indices into `uSamplers`.
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
     * Uploads the resources required before rendering this batch. If you override
     * this, you must call `super.upload`.
     *
     * @param {PIXI.Renderer} renderer
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
     * Reset this batch to become "fresh"!
     */
    reset(): void
    {
        this.textureBuffer = this.uidMap = this.state = null;

        if (this.batchBuffer)
        {
            this.batchBuffer.length = 0;
        }
    }
}
