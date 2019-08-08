import AttributeRedirect from './redirects/AttributeRedirect';
import * as PIXI from 'pixi.js';

const CompilerConstants = {
    INDICES_OFFSET: '__offset_indices_',
    FUNC_SOURCE_BUFFER: 'getSourceBuffer',

    packerArguments: [
        'targetObject',
        'compositeAttributes',
        'compositeIndices',
        'aIndex',
        'iIndex',
        'textureId',
    ],
};

/**
 * Packs the geometry of display-object batches into a
 * composite attribute and index buffer.
 *
 * It works by generating an optimized packer function,
 * which can add objects to the composite geometry. This
 * geometry is interleaved.
 *
 * @memberof PIXI.brend
 */
export class GeometryPacker
{
    /**
     * @param attributeRedirects {Array<AttributeRedirect>}
     * @param indexProperty {string} - property where indicies are
     *     kept; null/undefined if not required.
     * @param vertexCountProperty {string | number} - property where
     *      no. of vertices for each object are kept. This could also
     *      be a constant.
     * @param vertexSize {number} - vertex size, calculated by
     *     default. This should exclude the vertex attribute.
     */
    constructor(attributeRedirects, indexProperty, vertexCountProperty,
        vertexSize = AttributeRedirect.vertexSizeFor(attributeRedirects),
        texturePerObject)
    {
        vertexSize += texturePerObject * 4;// texture id is an Uint32

        /** @private */ this._targetCompositeAttributeBuffer = null;
        /** @private */ this._targetCompositeIndexBuffer = null;
        /** @private */ this._aIndex = 0;
        /** @private */ this._iIndex = 0;

        /** @private */ this._attributeRedirects = attributeRedirects;
        /** @private */ this._indexProperty = indexProperty;
        /** @private */ this._vertexCountProperty = vertexCountProperty;
        /** @private */ this._vertexSize = vertexSize;
        /** @private */ this._texturePerObject = texturePerObject;

        /** @private */ this._aBuffers = [];// @see _getAttributeBuffer
        /** @private */ this._iBuffers = [];// @see _getIndexBuffer
    }

    /**
     * A generated function that will append an object's
     * attributes and indices to composite buffers.
     *
     * The composite attribute buffer is interleaved.
     *
     * The composite index buffer has adjusted indices. It
     * accounts for the new positions of vertices in the
     * composite attribute buffer.
     *
     * You can overwrite this property with a custom packer
     * function.
     */
    get packerFunction()
    {
        if (!this._packerFunction)
        {
            this._packerFunction
                = new GeometryPacker.FunctionCompiler(this).compile();
        }

        return this._packerFunction;
    }

    set packerFunction(func)// eslint-disable-line require-jsdoc
    {
        this._packerFunction = func;
    }

    /**
     * This is the currently active composite attribute
     * buffer. It may contain garbage in unused locations.
     *
     * @member {PIXI.ViewableBuffer}
     */
    get compositeAttributes()
    {
        return this._targetCompositeAttributeBuffer;
    }

    /**
     * This is the currently active composite index
     * buffer. It may contain garbage in unused locations.
     *
     * It will be `null` if `indexProperty` was not given.
     */
    get compositeIndices()
    {
        return this._targetCompositeIndexBuffer;
    }

    reset(batchVertexCount, batchIndexCount)
    {
        this._targetCompositeAttributeBuffer
            = this._getAttributeBuffer(batchVertexCount);

        if (this.indexProperty)
        {
            this._targetCompositeIndexBuffer
                = this._getIndexBuffer(batchIndexCount);
        }

        this._aIndex = this.iIndex = 0;
    }

    pack(targetObject, textureId)
    {
        const deltaVertices = this.packerFunction(
            targetObject,
            this._targetCompositeAttributeBuffer,
            this._targetCompositeIndexBuffer,
            this._aIndex,
            this._iIndex,
            textureId
        );

        this._aIndex += deltaVertices * this._vertexSize;
        this._iIndex += deltaVertices;
    }

    /** @private */ _getAttributeBuffer(size)
    {
        // 8 vertices is enough for 2 quads
        const roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 8));
        const roundedSizeIndex = PIXI.utils.log2(roundedP2);
        const roundedSize = roundedP2 * 8;

        if (this._aBuffers.length <= roundedSizeIndex)
        {
            this._iBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._aBuffers[roundedSize];

        if (!buffer)
        {
            this._aBuffers[roundedSize] = buffer
                = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
        }

        return buffer;
    }

    /** @private */ _getIndexBuffer(size)
    {
        // 12 indices is enough for 2 quads
        const roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 12));
        const roundedSizeIndex = PIXI.utils.log2(roundedP2);
        const roundedSize = roundedP2 * 12;

        if (this._iBuffers.length <= roundedSizeIndex)
        {
            this._iBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._iBuffers[roundedSizeIndex];

        if (!buffer)
        {
            this._iBuffers[roundedSizeIndex] = buffer
                = new Uint16Array(roundedSize);
        }

        return buffer;
    }

    /**
     * @function
     * @name PackerFunction
     * @memberof PIXI.brend
     *
     * This function type is used by `GeometryPacker#packerFunction`.
     *
     * @param targetObject {PIXI.DisplayObject} - object to pack
     * @param compositeAttributes {PIXI.ViewableBuffer}
     * @param compositeIndices {Uint16Array}
     * @param aIndex {number} - Offset in the composite attribute buffer
     *      in bytes at which the object's geometry should be inserted.
     * @param iIndex {number} - Number of vertices already packed in the
     *      composite index buffer.
     * @return No. of vertices added
     * @see PIXI.brend.GeometryPacker#packerFunction
     */

    /** @private */ static FunctionCompiler = class
    {
        constructor(packer)
        {
            this.packer = packer;
        }

        compile()
        {
            const packer = this.packer;

            let packerBody = `
                ${this._compileSourceBufferFunction()}
            `;

            /* Source offset variables for attribute buffers &
                the corresponding buffer-view references. */
            this.attributeRedirects.forEach((redirect, i) =>
            {
                packerBody += `
                    let __offset_${i} = 0;
                    const __buffer_${i} =
                        ${CompilerConstants.FUNC_SOURCE_BUFFER}(
                            attributeRedirects[i],
                            targetObject
                        )[${redirect.type}View];
                    const __size_${i} = attributeRedirects.size;
                    const __sizeOf_${i} =
                        ${PIXI.ViewableBuffer.sizeOf(redirect.type)};
                `;
            });

            /* Basis for the "packing" for-loop. */
            packerBody += `
                const {
                    int8View,
                    uint8View,
                    int16View,
                    uint16View,
                    int32View,
                    uint32View,
                    float32View,
                } = compositeAttributes;

                const vertexCount = ${this._compileVertexCountExpression()};

                for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++)
                {
                    let adjustedAIndex = 0;
            `;

            /* Packing for-loop body. */
            this.attributeRedirects.forEach((redirect, i) =>
            {
                /* Initialize adjsutedAIndex in terms of source type. */
                packerBody += `
                    adjustedAIndex = aIndex / __sizeOf_${i});
                `;

                for (let j = 0; j < redirect.size; j++)
                {
                    packerBody += `
                        ${redirect[i].type}View[adjustedAIndex++] =
                            __buffer_${i}[__offset_${i}++ % vertexCount];
                    `;
                }

                packerBody += `
                    aIndex = adjustedAIndex * __sizeOf_${i};
                `;
            });

            if (packer._texturePerObject > 0)
            {
                if (packer._texturePerObject > 1)
                {
                    packerBody += `
                        adjustedAIndex = aIndex / 4;
                    `;

                    for (let k = 0; k < packer._texturePerObject; k++)
                    {
                        packerBody += `
                            uint32View[adjustedAIndex++] = textureId[${k}];
                        `;
                    }

                    packerBody += `
                        aIndex = adjustedAIndex * 4;
                    `;
                }
                else
                {
                    packerBody = `
                        uint32View[aIndex] = textureId;
                        aIndex += 4;
                    `;
                }
            }

            /* Close the packing for-loop. */
            packerBody += '}';

            if (this.packer._indexProperty)
            {
                packerBody += `
                    const initialIndicesCount = iIndex;
                    const indexCount
                        = targetObject[${this.packer._indexProperty}].length;

                    for (let j = 0; j < indexCount; j++)
                    {
                        compositeIndices[iIndex++] = initialIndicesCount +
                            targetObject[${this.packer._indexProperty}][j];
                    }
                `;
            }

            // eslint-disable-next-line no-new-func
            return new Function(
                ...CompilerConstants.packerArguments,
                packerBody);
        }

        _compileSourceBufferFunction()
        {
            return `
                function ${CompilerConstants.FUNC_SOURCE_BUFFER}(
                    redirect, targetObject)
                {
                    return (typeof redirect.source === 'string') ?
                        targetObject[redirect.source] :
                        redirect.source(targetObject);
                }
            `;
        }

        _compileVertexCountExpression()
        {
            return (
                (typeof this.packer._vertexCountProperty === 'string')
                    ? `targetObject.${this.packer._vertexCountProperty}`
                    : `${this.packer._vertexCountProperty}`
            );
        }
    }
}
