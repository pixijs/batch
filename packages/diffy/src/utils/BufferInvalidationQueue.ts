import { BufferInvalidationPool } from './BufferInvalidation';
import { BufferPool } from 'pixi-batch-renderer';

import type { BufferInvalidation } from './BufferInvalidation';

const arrayPool: BufferPool<Array<number | BufferInvalidation>> = new BufferPool(Array);

/**
 * The minimum length of a "significant" invalidation. Two significant invalidations can be separated
 * by at most 20% of their lengths, unless the number of regions is below {@link MAX_INVALIDATIONS}.
 *
 * This is also the maximum length of an "insignificant" invalidation. Two insignifant invalidations
 * should always be merged if they are less away than 20% of {@code SIG_REGION_LEN}.
 *
 * @ignore
 */
const SIG_REGION_LEN = 128;

/**
 * 20% of {@link SIG_REGION_LEN}
 *
 * @ignore
 */
const INSIG_REGION_DIST = Math.ceil(0.2 * SIG_REGION_LEN);

/**
 * The maximum number of invalidations allowed per buffer.
 *
 * @ignore
 */
const MAX_INVALIDATIONS = 8;

/**
 * The buffer invalidation queue manages a singly-linked list of buffer invalidations.
 *
 * @ignore
 */
export class BufferInvalidationQueue
{
    start: BufferInvalidation;
    end: BufferInvalidation;
    size: number;

    constructor()
    {
        this.start = null;
        this.end = null;
        this.size = 0;
    }

    /**
     * @returns whether the queue is empty
     */
    isEmpty(): boolean
    {
        return !this.start;
    }

    /**
     * Appends the invalidation-node to this queue
     *
     * @param node
     */
    append(node: BufferInvalidation): void
    {
        ++this.size;

        if (!this.start)
        {
            this.start = node;
            this.end = node;

            node.next = null;

            return;
        }

        this.end.next = node;
        node.next = null;
        this.end = node;
    }

    /**
     * This will repartition the invalidated buffer indices into fewer, larger segments. This is mainly used to avoid
     * issuing too many `bufferSubData` when sparse, small changes occur in the geometry.
     */
    // threshold parameter for testing only!
    partition(threshold: number = MAX_INVALIDATIONS): void
    {
        // NOTE: This algorithm doesn't have a solid statistical basis and improving it is welcome!

        let node = this.start;
        let lastNode = null;
        let lastNodeInsig = false;

        // Coalesce as many insignificant invalidations as possible
        while (node)
        {
            const nodeInsig = node.size < SIG_REGION_LEN;

            if ((lastNodeInsig || nodeInsig) && lastNode
                && (node.offset - (lastNode.offset + lastNode.size) < INSIG_REGION_DIST))
            {
                node = this.coalesce(lastNode);
            }

            lastNode = node;
            lastNodeInsig = nodeInsig;
            node = node.next;
        }

        if (this.size <= threshold)
        {
            // Phew! No need to coalesce significant invalidations as well!
            return;
        }

        // Distance of each node from its successor
        // NOTE: This is kind of expensive since we _have_ to allocate three arrays
        const size = this.size;
        const dists = arrayPool.allocateBuffer(size - 1) as Array<number>;
        const indices = arrayPool.allocateBuffer(size - 1) as Array<number>;
        const nodes = arrayPool.allocateBuffer(size - 1) as Array<BufferInvalidation>;// needed for random access

        node = this.start;

        for (let i = 0; i < size - 1; i++)
        {
            const next = node.next;

            dists[i] = next.offset - (node.offset + node.size);
            indices[i] = i;
            nodes[i] = node;

            node = next;
        }

        // Sort indicies of nodes based on the distances to their successor
        indices.sort((i, j) => dists[i] - dists[j]);

        // Coalesce nodes with the least distance
        for (let i = 0; i < size - threshold; i++)
        {
            const idx = indices[i];
            const node = nodes[idx];

            this.coalesce(node);

            // node (idx + 1) is deleted, but the new node is idx + 1 is just node (which becomes larger)
            nodes[idx + 1] = node;
        }

        arrayPool.releaseBuffer(dists);
        arrayPool.releaseBuffer(indices);
        arrayPool.releaseBuffer(nodes);
    }

    /**
     * Clears this queue, and returns the nodes to {@code BufferInvalidationPool}.
     */
    clear(): this
    {
        // Release nodes into BufferInvalidationPool
        for (let node = this.start; (!!node) as boolean;)
        {
            const next = node.next;

            BufferInvalidationPool.release(node);
            node = next;
        }

        // Reset queue
        this.start = null;
        this.end = null;
        this.size = 0;

        return this;
    }

    /**
     * Coalesces {@code node} and its successor {@code node.next} into one. The successor is released from the
     * queue.
     *
     * @param node - the node with coalesce
     * @returns the coalesced node
     */
    protected coalesce(node: BufferInvalidation): BufferInvalidation
    {
        const successor = node.next;

        const offset = node.offset;
        const size = successor.offset + successor.size - offset;

        node.size = size;

        // Delete successor from the queue
        node.next = successor.next;
        successor.next = null;

        // Update end, if needed
        if (this.end === successor)
        {
            this.end = node;
        }

        // Update queue's size
        --this.size;

        BufferInvalidationPool.release(successor);

        return node;
    }
}
