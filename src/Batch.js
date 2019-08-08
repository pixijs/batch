/**
 * @memberof PIXI.brend
 * @protected
 */
export class Batch
{
    constructor(geometryOffset)
    {
        this.batchBuffer = null;
        this.textureBuffer = null;
        this.uidMap = null;
        this.state = null;

        // Remembers the location in the geometry where this
        // batch starts. This can be in the attribute or
        // index buffer.
        //
        this.geometryOffset = geometryOffset;
    }

    reset()
    {
        this.batchBuffer
            = this.textureBuffer
                = this.uidMap
                    = this.state
                        = null;
    }
}

export default Batch;
