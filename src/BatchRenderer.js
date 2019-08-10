import { Batch } from './Batch';
import { BatchGenerator } from './BatchGenerator';
import { GeometryPacker } from './GeometryPacker';
import * as PIXI from 'pixi.js';
import { resolveConstantOrProperty, resolveFunctionOrProperty } from './resolve';

/**
 * @memberof PIXI.brend
 */
export class BatchRenderer extends PIXI.ObjectRenderer
{
    /**
     * @param {PIXI.Renderer} renderer - renderer to attach to
     * @param {Array<PIXI.brend.AttributeRedirect>} attributeRedirects
     * @param {string | null} indexProperty
     * @param {string | number} vertexCountProperty
     * @param {string | null} textureProperty
     * @param {number} texturePerObject
     * @param {string} textureAttribute - name of texture-id attribute variable
     * @param {Function} stateFunction - returns a {PIXI.State} for an object
     * @param {PIXI.brend.GeometryPacker} [packer=new PIXI.brend.GeometryPacker]
     * @param {Class} [BatchGeneratorClass=PIXI.brend.BatchGenerator]
     */
    constructor(
        renderer,
        attributeRedirects,
        indexProperty,
        vertexCountProperty,
        textureProperty,
        texturePerObject,
        textureAttribute,
        stateFunction,
        packer = new GeometryPacker(
            attributeRedirects,
            indexProperty,
            vertexCountProperty, // auto-calculate
            undefined,
            texturePerObject
        ),
        BatchGeneratorClass = BatchGenerator
    )
    {
        super(renderer);

        /** @protected */
        this._attributeRedirects = attributeRedirects;
        /** @protected */
        this._indexProperty = indexProperty;
        /** @protected */
        this._vertexCountProperty = vertexCountProperty;
        /** @protected */
        this._textureProperty = textureProperty;
        /** @protected */
        this._texturePerObject = texturePerObject;
        /** @protected */
        this._textureAttribute = textureAttribute;
        /** @protected */
        this._stateFunction = stateFunction;

        this.renderer.runners.contextChange.add(this);

        if (this.renderer.gl)// we are late to the party!
        {
            this.contextChange();
        }

        /** @protected */
        this._packer = packer;

        /** @protected */
        this._geom = BatchRenderer.generateCompositeGeometry(
            attributeRedirects,
            !!indexProperty,
            textureAttribute,
            texturePerObject);

        /** @protected */
        this._batchGenerator = new BatchGeneratorClass(
            texturePerObject, this.MAX_TEXTURE,
            textureProperty, true); // NOTE: Force texture reduction

        /** @protected */
        this._objectBuffer = [];
        /** @protected */
        this._bufferedVertices = 0;
        /** @protected */
        this._bufferedIndices = 0;

        /** @protected */
        this._batchPool = [];// may contain garbage after _batchCount
        /** @protected */
        this._batchCount = 0;
    }

    /** @override */
    contextChange()
    {
        const gl = this.renderer.gl;

        if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY)
        {
            /** @protected */
            this.MAX_TEXTURES = 1;
        }
        else
        {
            this.MAX_TEXTURES = Math.min(
                gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                PIXI.settings.SPRITE_MAX_TEXTURES);
        }
    }

    /** @override */
    start()
    {
        this._objectBuffer.length = 0;
        this._bufferedVertices = 0;
        this._bufferedIndices = 0;
    }

    /** @override */
    render(targetObject)
    {
        this._objectBuffer.push(targetObject);

        this._bufferedVertices += resolveConstantOrProperty(
            targetObject, this._vertexCountProperty);

        if (this._indexProperty)
        {
            this._bufferedIndices += resolveConstantOrProperty(
                targetObject, this._indexProperty).length;
        }
    }

    /** @override */
    flush()
    {
        const {
            _batchGenerator: batchGenerator,
            _geom: geom,
            _packer: packer,
            renderer,
            _stateFunction: stateFunction,
            _textureProperty: textureProperty,
            _texturePerObject: texturePerObject,
        } = this;

        const gl = renderer.gl;
        const buffer = this._objectBuffer;
        const bufferLength = buffer.length;

        this._batchCount = 0;
        batchGenerator.reset();
        packer.reset(this._bufferedVertices, this._bufferedIndices);

        let batchStart = 0;

        // Generate batches/groups that will be drawn using just
        // one draw call.
        for (let objectIndex = 0; objectIndex < bufferLength;)
        {
            const target = buffer[objectIndex];
            const wasPut = batchGenerator.put(target,
                resolveFunctionOrProperty(target, stateFunction));

            if (!wasPut)
            {
                batchGenerator.finalize(this._newBatch(batchStart));
                batchStart = objectIndex;
            }
            else
            {
                ++objectIndex;
            }
        }

        // Generate the last batch, if required.
        if (this.batchGenerator.batchBuffer.length !== 0)
        {
            batchGenerator.finalize(this._newBatch(batchStart));
        }

        // Pack each object into the composite geometry. This is done
        // after batching, so that texture-ids are generated.
        let textureId = this.texturePerObject === 1
            ? 0
            : new Array(texturePerObject);

        for (let i = 0; i < this._batchCount; i++)// loop-per(batch)
        {
            const batch = this._batchPool[i];
            const batchBuffer = batch.batchBuffer;
            const batchLength = batchBuffer.length;
            const uidMap = batch.uidMap;

            let vertexCount = 0;// eslint-disable-line
            let indexCount = 0;

            for (let j = 0; j < batchLength; j++)// loop-per(targetObject)
            {
                const targetObject = batchBuffer[j];

                if (this._indexProperty)
                {
                    indexCount += resolveConstantOrProperty(
                        targetObject, this._indexProperty).length;
                }
                else
                {
                    vertexCount += resolveConstantOrProperty(
                        targetObject, this._vertexCountProperty);
                }

                // externally-defined properties for draw calls
                batch.$vertexCount = vertexCount;
                batch.$indexCount = indexCount;

                const tex = targetObject[textureProperty];

                let texUID;

                if (texturePerObject === 1)
                {
                    texUID = tex.baseTexture
                        ? tex.baseTexture.uid
                        : tex.uid;

                    textureId = uidMap[texUID];
                }
                else
                {
                    let _tex;

                    for (let k = 0; k < tex.length; k++)
                    {
                        _tex = tex[k];

                        texUID = _tex.BaseTexture
                            ? _tex.baseTexture.uid
                            : _tex.uid;

                        textureId[k] = uidMap[texUID];
                    }
                }

                packer.pack(targetObject, textureId);
            }
        }

        // Upload the geometry
        renderer.geometry.bind(geom);
        geom.$buffer.update(packer.compositeAttributeBuffer.rawBinaryData, 0);
        geom.getIndex().update(packer.compositeIndicesBuffer.rawBinaryData, 0);
        renderer.geometry.updateBuffers();

        // Now draw each batch
        for (let i = 0; i < this._batchCount; i++)
        {
            const batch = this._batchPool[i];

            batch.textureBuffer.forEach((texture, j) =>
            {
                renderer.texture.bind(texture, j);
            });

            renderer.state.set(batch.state);

            if (this._indexProperty)
            {
                gl.drawElements(gl.TRIANGLES,
                    batch.$indexCount,
                    gl.UNSIGNED_SHORT,
                    batch.geometryOffset);
            }
            else
            {
                gl.drawArrays(gl.TRIANGLES,
                    batch.geometryOffset,
                    batch.$vertexCount);
            }
        }
    }

    /** @private */
    _newBatch(batchStart)
    {
        if (this._batchCount === this._batchPool.length)
        {
            const batch = new Batch(batchStart);

            this._batchPool.push(batch);
            ++this._batchCount;

            return batch;
        }

        const batch = this._batchPool[this._batchCount++];

        batch.reset();
        batch.geometryOffset = batchStart;

        return batch;
    }

    /** @protected */
    static generateCompositeGeometry(attributeRedirects, hasIndex,
        textureAttribute, texturePerObject)
    {
        const geom = new PIXI.Geometry();
        const attributeBuffer = new PIXI.Buffer(null, false, false);
        const indexBuffer = hasIndex ? new PIXI.Buffer(null, false, true) : null;

        attributeRedirects.forEach((redirect) =>
        {
            const {
                glslIdentifer, glType, glSize,
                normalize,
            } = redirect;

            geom.addAttribute(glslIdentifer, attributeBuffer,
                glSize, normalize, glType);
        });

        if (textureAttribute && texturePerObject > 0)
        {
            geom.addAttribute(textureAttribute, attributeBuffer,
                texturePerObject, false, PIXI.TYPES.UNSIGNED_FLOAT);
        }

        if (hasIndex)
        {
            geom.addIndex(indexBuffer);
        }

        geom.$buffer = attributeBuffer;

        // $buffer is attributeBuffer
        // getIndex() is ?indexBuffer
        return geom;
    }
}

export default BatchRenderer;
