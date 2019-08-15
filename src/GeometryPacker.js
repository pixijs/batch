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
        'attributeRedirects',
    ],
};

/**
 * Packs the geometry of display-object batches into a
 * composite attribute and index buffer.
 *
 * It works by generating an optimized packer function,
 * which can add objects to the composite geometry. This
 * geometry is interleaved and is in accordance with
 * what {@link PIXI.brend.BatchRenderer.generateCompositeGeometry}
 * would return.
 *
 * @memberof PIXI.brend
 */
class GeometryPacker
{
    /**
     * @param {PIXI.brend.AttributeRedirect[]} attributeRedirects
     * @param {string} indexProperty - property where indicies are
     *     kept; null/undefined if not required.
     * @param {string | number} vertexCountProperty - property where
     *      no. of vertices for each object are kept. This could also
     *      be a constant.
     * @param {number} vertexSize - vertex size, calculated by
     *     default. This should exclude the vertex attribute
     * @param {number} texturePerObject - no. of textures per object
     */
    constructor(attributeRedirects, indexProperty, vertexCountProperty,
        vertexSize = AttributeRedirect.vertexSizeFor(attributeRedirects),
        texturePerObject)
    {
        vertexSize += texturePerObject * 4;// texture indices are also passed
        /** @private */
        this._targetCompositeAttributeBuffer = null;
        /** @private */
        this._targetCompositeIndexBuffer = null;
        /** @private */
        this._aIndex = 0;
        /** @private */
        this._iIndex = 0;

        /** @private */
        this._attributeRedirects = attributeRedirects;
        /** @private */
        this._indexProperty = indexProperty;
        /** @private */
        this._vertexCountProperty = vertexCountProperty;
        /** @private */
        this._vertexSize = vertexSize;
        /** @private */
        this._texturePerObject = texturePerObject;

        /** @private */
        this._aBuffers = [];// @see _getAttributeBuffer
        /** @private */
        this._iBuffers = [];// @see _getIndexBuffer
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
     *
     * @member {PIXI.brend.PackerFunction}
     */
    get packerFunction()
    {
        if (!this._packerFunction)
        {
            this._packerFunction
                = new FunctionCompiler(this).compile();// eslint-disable-line
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
     *
     * @member {Uint16Array}
     */
    get compositeIndices()
    {
        return this._targetCompositeIndexBuffer;
    }

    /**
     * @param {number} batchVertexCount
     * @param {number} batchIndexCount
     */
    reset(batchVertexCount, batchIndexCount)
    {
        this._targetCompositeAttributeBuffer
            = this._getAttributeBuffer(batchVertexCount);

        if (this._indexProperty)
        {
            this._targetCompositeIndexBuffer
                = this._getIndexBuffer(batchIndexCount);
        }

        this._aIndex = this.iIndex = 0;
    }

    /**
     * @param {PIXI.DisplayObject} targetObject
     * @param {number} textureId
     */
    pack(targetObject, textureId)
    {
        this.packerFunction(
            targetObject,
            this._targetCompositeAttributeBuffer,
            this._targetCompositeIndexBuffer,
            this._aIndex,
            this._iIndex,
            textureId,
            this._attributeRedirects
        );
    }

    /** @private */
    _getAttributeBuffer(size)
    {
        // 8 vertices is enough for 2 quads
        const roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 8));
        const roundedSizeIndex = PIXI.utils.log2(roundedP2);
        const roundedSize = roundedP2 * 8;

        if (this._aBuffers.length <= roundedSizeIndex)
        {
            this._aBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._aBuffers[roundedSizeIndex];

        if (!buffer)
        {
            this._aBuffers[roundedSize] = buffer
                = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
        }

        return buffer;
    }

    /** @private */
    _getIndexBuffer(size)
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
}

// FunctionCompiler was intented to be a static inner
// class in GeometryPacker. However, due to a bug in
// JSDoc (3.6.3), I've put it down here :)
//
// https://github.com/jsdoc/jsdoc/issues/1673

/** @private */
const FunctionCompiler = class
{
    /**
     * @param {PIXI.brend.GeometryPacker} packer
     */
    constructor(packer)
    {
        this.packer = packer;
    }

    compile()
    {
        const packer = this.packer;

        let packerBody = ``;

        /* Source offset variables for attribute buffers &
            the corresponding buffer-view references. */
        packer._attributeRedirects.forEach((redirect, i) =>
        {
            packerBody += `
                let __offset_${i} = 0;
                const __buffer_${i} = (
                    ${this._compileSourceBufferExpression(redirect, i)});
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

            let adjustedAIndex = 0;

            for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++)
            {
        `;

        // Eliminate offset conversion when adjacent attributes
        // have similar source-types.
        let skipReverseTransformation = false;

        /* Packing for-loop body. */
        for (let i = 0; i < packer._attributeRedirects.length; i++)
        {
            const redirect = packer._attributeRedirects[i];

            /* Initialize adjsutedAIndex in terms of source type. */
            if (!skipReverseTransformation)
            {
                packerBody += `
                    adjustedAIndex = aIndex / ${this._sizeOf(i)};
                `;
            }

            if (typeof redirect.size === 'number')
            {
                for (let j = 0; j < redirect.size; j++)
                {
                    packerBody += `
                        ${redirect.type}View[adjustedAIndex++] =
                            __buffer_${i}[__offset_${i}++];
                    `;
                }
            }
            else
            {
                packerBody += `
                        ${redirect.type}View[adjustedAIndex++] =
                            __buffer_${i};
                `;
            }

            if (packer._attributeRedirects[i + 1]
                && (this._sizeOf(i + 1) !== this._sizeOf(i)))
            {
                packerBody += `
                    aIndex = adjustedAIndex * ${this._sizeOf(i)};
                `;
            }
            else
            {
                skipReverseTransformation = true;
            }
        }

        if (skipReverseTransformation)
        {
            if (this._sizeOf(packer._attributeRedirects.length - 1)
                    !== 4)
            {
                packerBody += `
                    aIndex = adjustedAIndex * ${this._sizeOf(
        packer._attributeRedirects.length - 1)}
                `;
                skipReverseTransformation = false;
            }
        }

        if (packer._texturePerObject > 0)
        {
            if (packer._texturePerObject > 1)
            {
                if (!skipReverseTransformation)
                {
                    packerBody += `
                        adjustedAIndex = aIndex / 4;
                    `;
                }

                for (let k = 0; k < packer._texturePerObject; k++)
                {
                    packerBody += `
                        float32View[adjustedAIndex++] = textureId[${k}];
                    `;
                }

                packerBody += `
                    aIndex = adjustedAIndex * 4;
                `;
            }
            else if (!skipReverseTransformation)
            {
                packerBody += `
                    float32View[aIndex] = textureId;
                    aIndex += 4;
                `;
            }
            else
            {
                packerBody += `
                    float32View[adjustedAIndex++] = textureId;
                    aIndex = adjustedAIndex * 4;
                `;
            }
        }

        /* Close the packing for-loop. */
        packerBody += `}
            ${this.packer._indexProperty
        ? `const oldAIndex = this._aIndex;`
        : ''}
            this._aIndex = aIndex;
        `;

        if (this.packer._indexProperty)
        {
            packerBody += `
                const verticesBefore = oldAIndex / ${this.packer._vertexSize}
                const indexCount
                    = targetObject['${this.packer._indexProperty}'].length;

                for (let j = 0; j < indexCount; j++)
                {
                    compositeIndices[iIndex++] = verticesBefore +
                        targetObject['${this.packer._indexProperty}'][j];
                }

                this._iIndex = iIndex;
            `;
        }

        // eslint-disable-next-line no-new-func
        return new Function(
            ...CompilerConstants.packerArguments,
            packerBody);
    }

    _compileSourceBufferExpression(redirect, i)
    {
        return (typeof redirect.source === 'string')
            ? `targetObject['${redirect.source}']`
            : `attributeRedirects[${i}].source(targetObject)`;
    }

    _compileVertexCountExpression()
    {
        if (!this.packer._vertexCountProperty)
        {
            // auto-calculate based on primary attribute
            return `__buffer_0.length / ${
                this.packer._attributeRedirects[0].size}`;
        }

        return (
            (typeof this.packer._vertexCountProperty === 'string')
                ? `targetObject.${this.packer._vertexCountProperty}`
                : `${this.packer._vertexCountProperty}`
        );
    }

    _sizeOf(i)
    {
        return PIXI.ViewableBuffer.sizeOf(
            this.packer._attributeRedirects[i].type);
    }
};

export { GeometryPacker };

export default GeometryPacker;
