/// <reference types="src/types" />
import { BatchDrawer } from 'pixi-batch-renderer';
import { BatchGeometry } from 'pixi-batch-renderer';
import { BatchGeometryFactory } from 'pixi-batch-renderer';
import { Buffer } from '@pixi/core';

export declare class BufferInvalidation {
    constructor() {
        this.offset = 0;
        this.size = 0;
        this.next = null;
    }
    init(srcStart, size) {
        this.offset = srcStart;
        this.size = size;
        return this;
    }
    clone() {
        return BufferInvalidationPool.allocate()
            .init(this.offset, this.size);
    }
}

export declare class BufferInvalidationQueue {
    constructor() {
        this.start = null;
        this.end = null;
        this.size = 0;
    }
    isEmpty() {
        return !this.start;
    }
    append(node) {
        ++this.size;
        if (!this.start) {
            this.start = node;
            this.end = node;
            return;
        }
        this.end.next = node;
        node.next = null;
        this.end = node;
    }
    partition(threshold = MAX_INVALIDATIONS) {
        let node = this.start;
        let lastNode = null;
        let lastNodeInsig = false;
        while (node) {
            const nodeInsig = node.size < SIG_REGION_LEN;
            if ((lastNodeInsig || nodeInsig) && lastNode
                && (node.offset - (lastNode.offset + lastNode.size) < INSIG_REGION_DIST)) {
                node = this.coalesce(lastNode);
            }
            lastNode = node;
            lastNodeInsig = nodeInsig;
            node = node.next;
        }
        if (this.size <= threshold) {
            return;
        }
        const size = this.size;
        const dists = arrayPool.allocateBuffer(size - 1);
        const indices = arrayPool.allocateBuffer(size - 1);
        const nodes = arrayPool.allocateBuffer(size - 1);
        node = this.start;
        for (let i = 0; i < size - 1; i++) {
            const next = node.next;
            dists[i] = next.offset - (node.offset + node.size);
            indices[i] = i;
            nodes[i] = node;
            node = next;
        }
        indices.sort((i, j) => dists[i] - dists[j]);
        for (let i = 0; i < size - threshold; i++) {
            const idx = indices[i];
            const node = nodes[idx];
            this.coalesce(node);
            nodes[idx + 1] = node;
        }
        arrayPool.releaseBuffer(dists);
        arrayPool.releaseBuffer(indices);
        arrayPool.releaseBuffer(nodes);
    }
    clear() {
        for (let node = this.start; (!!node);) {
            const next = node.next;
            BufferInvalidationPool.release(node);
            node = next;
        }
        this.start = null;
        this.end = null;
        this.size = 0;
        return this;
    }
    coalesce(node) {
        const successor = node.next;
        const offset = node.offset;
        const size = successor.offset + successor.size - offset;
        node.size = size;
        node.next = successor.next;
        if (this.end === successor) {
            this.end = node;
        }
        --this.size;
        BufferInvalidationPool.release(successor);
        return node;
    }
}

export declare class DiffBuffer extends Buffer {
    updateQueue: BufferInvalidationQueue;
    constructor(data?: ArrayBuffer | ArrayBufferView, _static?: boolean, index?: boolean);
    update(data?: ArrayBuffer | ArrayBufferView): void;
}

export declare class DiffDrawer extends BatchDrawer {
    draw(): void;
}

export declare class DiffGeometry extends BatchGeometry {
    constructor(attributeRedirects, hasIndex, texIDAttrib, texturesPerObject, inBatchIDAttrib, uniformIDAttrib, masterIDAttrib) {
        super(attributeRedirects, hasIndex, texIDAttrib, texturesPerObject, inBatchIDAttrib, uniformIDAttrib, masterIDAttrib, new DiffBuffer(null, false, false), new DiffBuffer(null, false, true));
    }
}

export declare class DiffGeometryFactory extends BatchGeometryFactory {
    constructor(renderer) {
        super(renderer);
        this._geometryCache = [];
        this._geometryPipeline = [];
        this.attribPool = new BufferPool(Uint32Array);
        this.indexPool = new BufferPool(Uint16Array);
        renderer.renderer.on('postrender', this.postrender, this);
    }
    build() {
        const cache = this._geometryCache.shift();
        const geom = cache || new DiffGeometry(this._attribRedirects, true, this._texIDAttrib, this._texturesPerObject, this._inBatchIDAttrib, this._uniformIDAttrib, this._masterIDAttrib);
        if (!cache) {
            geom.attribBuffer.update(this._targetCompositeAttributeBuffer.uint32View);
            geom.indexBuffer.update(this._targetCompositeIndexBuffer);
        }
        else {
            this.updateCache(cache, 'attribBuffer', this._targetCompositeAttributeBuffer.uint32View);
            this.updateCache(cache, 'indexBuffer', this._targetCompositeIndexBuffer);
        }
        return geom;
    }
    release(geom) {
        this._geometryPipeline.push(geom);
    }
    updateCache(geometry, type, data) {
        const cachedBuffer = geometry[type].data;
        const buffer = geometry[type];
        const bufferPool = this[type === 'attribBuffer' ? 'attribPool' : 'indexPool'];
        if (cachedBuffer.length < data.length) {
            buffer.update(data);
            bufferPool.releaseBuffer(cachedBuffer);
            return;
        }
        this.diffCache(buffer.data, data, buffer.updateQueue);
        bufferPool.releaseBuffer(data);
    }
    diffCache(cache, data, diffQueue) {
        diffQueue.clear();
        const length = this._aIndex * 4;
        let inDiff = false;
        let diffOffset = 0;
        for (let i = 0; i < length; i++) {
            const cachedElement = cache[i];
            const dataElement = data[i];
            if (cachedElement !== dataElement) {
                cache[i] = dataElement;
            }
            if (cachedElement !== dataElement && !inDiff) {
                inDiff = true;
                diffOffset = i;
            }
            else if (cachedElement === dataElement && inDiff) {
                inDiff = false;
                diffQueue.append(BufferInvalidationPool
                    .allocate()
                    .init(diffOffset, i - diffOffset));
            }
        }
        if (inDiff) {
            diffQueue.append(BufferInvalidationPool.allocate()
                .init(diffOffset, length - diffOffset));
        }
    }
    releaseCache() {
        this._geometryPool.push(...this._geometryCache);
        const lastCache = this._geometryCache;
        this._geometryCache = this._geometryPipeline;
        this._geometryPipeline = lastCache;
        this._geometryPipeline.length = 0;
    }
    postrender() {
        this.releaseCache();
    }
    getAttributeBuffer(size) {
        const buffer = this.attribPool.allocateBuffer(size * this._vertexSize);
        const vbuf = hackViewableBuffer(buffer);
        return vbuf;
    }
    getIndexBuffer(size) {
        return this.indexPool.allocateBuffer(size);
    }
}

export { }
