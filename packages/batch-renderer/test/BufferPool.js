const { BufferPool } = require('../');

describe('PIXI.brend.BufferPool', function()
{
    it('should return the released buffer', function()
    {
        const bufferPool = new BufferPool(Float32Array);
        const firstBuffer = bufferPool.allocateBuffer(1500);

        bufferPool.releaseBuffer(firstBuffer);

        const secondBuffer = bufferPool.allocateBuffer(1501);

        expect(firstBuffer).to.equal(secondBuffer);
    })
})