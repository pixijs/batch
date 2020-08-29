const { BufferInvalidation, BufferInvalidationQueue } = require('../');

/**
 * @param {BufferInvalidation} result
 * @param {BufferInvalidation} expected
 */
function expectNode(result, expected)
{
    expect(result.offset).to.equal(expected.offset);
    expect(result.size).to.equal(expected.size);
}

/**
 * @param {BufferInvalidation[]} nodes
 * @returns {BufferInvalidationQueue}
 */
function buildQueue(nodes)
{
    const queue = new BufferInvalidationQueue();

    for (let i = 0, j = nodes.length; i < j; i++)
    {
        queue.append(nodes[i]);
    }

    return queue;
}

/**
 * @param {BufferInvalidationQueue} result
 * @param {BufferInvalidationQueue} expected
 */
function expectQueue(result, expected)
{
    expect(result.size).to.equal(expected.size);

    let resultNode = result.start;
    let expectedNode = expected.start;

    while (resultNode || expectedNode)
    {
        expectNode(resultNode, expectedNode);

        resultNode = resultNode.next;
        expectedNode = expectedNode.next;
    }
}

describe('PIXI.brend.BufferInvalidationQueue', function ()
{
    it('should coalesce significant invalidations in the right order', function ()
    {
        const queue = buildQueue([
            new BufferInvalidation().init(0, 200),
            new BufferInvalidation().init(220, 200),

            new BufferInvalidation().init(600, 200),
            new BufferInvalidation().init(820, 200),
            new BufferInvalidation().init(1050, 200),
        ]);

        queue.partition(2);

        const expected = buildQueue([
            new BufferInvalidation().init(0, 420),
            new BufferInvalidation().init(600, 650),
        ]);

        expectQueue(queue, expected);
    });

    it('should coalesce a series of insignificant invalidations', function ()
    {
        const queue = buildQueue([
            new BufferInvalidation().init(0, 16),
            new BufferInvalidation().init(32, 16),
            new BufferInvalidation().init(48, 16),
            new BufferInvalidation().init(64, 16),
            new BufferInvalidation().init(80, 16),
            new BufferInvalidation().init(96, 16),

            new BufferInvalidation().init(160, 16),
        ]);

        queue.partition();

        const expected = buildQueue([
            new BufferInvalidation().init(0, 112),
            new BufferInvalidation().init(160, 16),
        ]);

        expectQueue(queue, expected);
    });
});
