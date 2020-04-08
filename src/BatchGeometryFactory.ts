import { AttributeRedirect } from './redirects/AttributeRedirect';
import * as PIXI from 'pixi.js';
import Redirect from './redirects/Redirect';

// BatchGeometryFactory uses this class internally to setup the attributes of
// the batches.
export class BatchGeometry extends PIXI.Geometry
{
    // Interleaved attribute data buffer
    attribBuffer: PIXI.Buffer;

    // Batched indicies
    indexBuffer: PIXI.Buffer;

    constructor(attributeRedirects: AttributeRedirect[],
        hasIndex: boolean,
        textureAttribute: string,
        texturePerObject: number,
    )
    {
        super();

        const attributeBuffer = new PIXI.Buffer(null, false, false);
        const indexBuffer = hasIndex ? new PIXI.Buffer(null, false, true) : null;

        attributeRedirects.forEach((redirect) =>
        {
            const { glslIdentifer, glType, glSize, normalize } = redirect;

            this.addAttribute(glslIdentifer, attributeBuffer, glSize, normalize, glType);
        });

        if (textureAttribute && texturePerObject > 0)
        {
            this.addAttribute(textureAttribute, attributeBuffer, texturePerObject, true, PIXI.TYPES.FLOAT);
        }

        if (hasIndex)
        {
            this.addIndex(indexBuffer);
        }

        this.attribBuffer = attributeBuffer;
        this.indexBuffer = indexBuffer;
    }
}

export interface IBatchGeometryFactory
{
    init(verticesBatched: number, indiciesBatched: number): void;
    append(displayObject: number, inBatchId: number): void;
    build(): PIXI.Geometry;
    release(geom: PIXI.Geometry): void;
}

/**
 * This interface defines the methods you need to implement to creating your own batch
 * geometry factory.
 * @memberof PIXI.brend
 * @interface IBatchGeometryFactory
 */

/**
 * Called before the batch renderer starts feeding the display-objects. This can be used
 * to pre-allocated space for the batch geometry.
 *
 * @memberof PIXI.brend.IBatchGeometryFactory#
 * @method init
 * @param {number} verticesBatched
 * @param {number}[indiciesBatched] - optional when display-object's don't use a index buffer
 */

/**
 * Adds the display-object to the batch geometry. If the display-object's shader also uses
 * uniforms (or textures in `uSamplers` uniform), then it will also be given an in-batch
 * ID. This id is used to fetch the corresponding uniform for the "current" display-object
 * from an array. `inBatchId` is passed as an attribute `vTextureId`.
 *
 * @memberof PIXI.brend.IBatchGeometryFactory#
 * @method append
 * @param {PIXI.DisplayObject} displayObject
 * @param {number} inBatchId
 */

/**
 * This should wrap up the batch geometry in a `PIXI.Geometry` object.
 *
 * @memberof PIXI.brend.IBatchGeometryFactory#
 * @method build
 * @returns {PIXI.Geometry} batch geometry
 */

/**
 * This is used to return a batch geometry so it can be pooled and reused in a future `build()`
 * call.
 *
 * @memberof PIXI.brend.IBatchGeometryFactory#
 * @method release
 * @param {PIXI.Geometry} geom
 */

/**
 * Factory class that generates the geometry for a whole batch by feeding on
 * the individual display-object geometries. This factory is reusable, i.e. you
 * can build another geometry after a {@link build} call.
 *
 * **Optimizations:** To speed up geometry generation, this compiles an optimized
 * packing function that pushes attributes without looping through the attribute
 * redirects.
 *
 * **Default Format:** If you are not using a custom draw-call issuer, then
 * the batch geometry must have an interleaved attribute data buffer and one
 * index buffer.
 *
 * **Customization:** If you want to customize the batch geometry, then you must
 * also define your draw call issuer. This is not supported by pixi-batch-render
 * but is work-in-progress.
 *
 * @memberof PIXI.brend
 * @class
 * @implements PIXI.brend.IBatchGeometryFactory
 */
export class BatchGeometryFactory
{
    _targetCompositeAttributeBuffer: PIXI.ViewableBuffer;
    _targetCompositeIndexBuffer: Uint16Array;
    _aIndex: number;
    _iIndex: number;

    _attribRedirects: AttributeRedirect[];
    _indexProperty: string;
    _vertexCountProperty: string | number;
    _vertexSize: number;
    _texturePerObject: number;

    textureId: number;

    protected _aBuffers: PIXI.ViewableBuffer[];
    protected _iBuffers: Uint16Array[];

    protected _geometryPool: Array<PIXI.Geometry>;

    _geometryMerger: (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void;

    /**
     * @param {PIXI.brend.AttributeRedirect[]} attributeRedirects
     * @param {string} indexProperty - property where indicies are kept; null/undefined if not required.
     * @param {string | number} vertexCountProperty - property where no. of vertices for each object
     *  are kept. This could also be a constant.
     * @param {number} vertexSize - vertex size, calculated by default. This should exclude the vertex attribute
     * @param {number} texturePerObject - no. of textures per object
     */
    constructor(
        attribRedirects: AttributeRedirect[],
        indexProperty: string,
        vertexCountProperty: string | number,
        vertexSize = AttributeRedirect.vertexSizeFor(attribRedirects),
        texturePerObject: number)
    {
        vertexSize += texturePerObject * 4;// texture indices are also passed

        this._targetCompositeAttributeBuffer = null;
        this._targetCompositeIndexBuffer = null;
        this._aIndex = 0;
        this._iIndex = 0;

        this._attribRedirects = attribRedirects;
        this._indexProperty = indexProperty;
        this._vertexCountProperty = vertexCountProperty;
        this._vertexSize = vertexSize;
        this._texturePerObject = texturePerObject;

        this._aBuffers = [];// @see _getAttributeBuffer
        this._iBuffers = [];// @see _getIndexBuffer

        /**
         * Batch geometries that can be reused.
         *
         * @member {PIXI.Geometry}
         * @protected
         * @see PIXI.brend.IBatchGeometryFactory#release
         */
        this._geometryPool = [];
    }

    /**
     * This is the currently active composite attribute
     * buffer. It may contain garbage in unused locations.
     *
     * @member {PIXI.ViewableBuffer}
     */
    get compositeAttributes(): PIXI.ViewableBuffer
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
    get compositeIndices(): Uint16Array
    {
        return this._targetCompositeIndexBuffer;
    }

    /**
     * Ensures this factory has enough space to buffer the given number of vertices
     * and indices. This should be called before feeding display-objects from the
     * batch.
     *
     * @param {number} verticesBatched
     * @param {number} indiciesBatched
     */
    init(verticesBatched: number, indiciesBatched?: number): void
    {
        this._targetCompositeAttributeBuffer = this.getAttributeBuffer(verticesBatched);

        if (this._indexProperty)
        {
            this._targetCompositeIndexBuffer = this.getIndexBuffer(indiciesBatched);
        }

        this._aIndex = this._iIndex = 0;
    }

    /**
     * Append's the display-object geometry to this batch's geometry.
     *
     * @param {PIXI.DisplayObject} targetObject
     * @param {number} textureId
     */
    append(targetObject: PIXI.DisplayObject, textureId: number): void
    {
        this.textureId = textureId;
        this.geometryMerger(targetObject, this);
    }

    /**
     * @override
     * @returns {PIXI.Geometry} the generated batch geometry
     */
    build(): PIXI.Geometry
    {
        const geom: BatchGeometry = (this._geometryPool.pop() || new BatchGeometry(
            this._attribRedirects, true, 'aInBatchID', this._texturePerObject)) as BatchGeometry;

        // We don't really have to remove the buffers because BatchRenderer won't reuse
        // the data in these buffers after the next build() call.
        geom.attribBuffer.update(this._targetCompositeAttributeBuffer.rawBinaryData);
        geom.indexBuffer.update(this._targetCompositeIndexBuffer);

        return geom;
    }

    /**
     * @param {PIXI.Geometry} geom - releases back the geometry to be reused. It is expected
     *  that it is not used externally again.
     * @override
     */
    release(geom: PIXI.Geometry): void
    {
        this._geometryPool.push(geom);
    }

    /**
     * This lazy getter returns the geometry-merger function. This function
     * takes one argument - the display-object to be appended to the batch -
     * and pushes its geometry to the batch geometry.
     *
     * You can overwrite this property with a custom geometry-merger function
     * if customizing `PIXI.brend.BatchGeometryFactory`.
     *
     * @member {PIXI.brend#IGeometryMerger}
     */
    protected get geometryMerger(): (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void
    {
        if (!this._geometryMerger)
        {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            this._geometryMerger = new GeometryMergerFactory(this).compile();
        }

        return this._geometryMerger;
    }
    // eslint-disable-next-line require-jsdoc
    protected set geometryMerger(func: (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void)
    {
        this._geometryMerger = func;
    }

    /**
     * Allocates an attribute buffer with sufficient capacity to hold `size` elements.
     *
     * @param {number} size
     * @protected
     */
    protected getAttributeBuffer(size: number): PIXI.ViewableBuffer
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

    /**
     * Allocates an index buffer (`Uint16Array`) with sufficient capacity to hold `size` indices.
     *
     * @param size
     * @protected
     */
    protected getIndexBuffer(size: number): Uint16Array
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

// GeometryMergerFactory uses these variable names.
const CompilerConstants = {
    INDICES_OFFSET: '__offset_indices_',
    FUNC_SOURCE_BUFFER: 'getSourceBuffer',

    // Argument names for the geometryMerger() function.
    packerArguments: [
        'targetObject',
        'factory',
    ],
};

// This was intended to be an inner class of BatchGeometryFactory; however, due to
// a bug in JSDoc, it was placed outside.
// https://github.com/jsdoc/jsdoc/issues/1673

// Factory for generating a geometry-merger function (which appends the geometry of
// a display-object to the batch geometry).
const GeometryMergerFactory = class
{
    packer: BatchGeometryFactory;

    // We need the BatchGeometryFactory for attribute redirect information.
    constructor(packer: BatchGeometryFactory)
    {
        this.packer = packer;
    }

    compile(): (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void
    {
        const packer = this.packer;

        // The function's body/code is placed here.
        let packerBody = ``;

        // Define __offset_${i}, the offset of each attribute in the display-object's
        // geometry, __buffer_${i} the source buffer of the attribute data.
        packer._attribRedirects.forEach((redirect, i) =>
        {
            packerBody += `
                let __offset_${i} = 0;
                const __buffer_${i} = (
                    ${this._compileSourceBufferExpression(redirect, i)});
            `;
        });

        // This loops through each vertex in the display-object's geometry and appends
        // them (attributes are interleaved, so each attribute element is pushed per vertex)
        packerBody += `
            const compositeAttributes = factory._targetCompositeAttributeBuffer;
            const compositeIndices = factory._targetCompositeIndexBuffer;
            let aIndex = factory._aIndex;
            let iIndex = factory._iIndex;
            const textureId = factory.textureId;
            const attributeRedirects = factory.attributeRedirects;

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

        // Appends a vertice's attributes (inside the for-loop above).
        for (let i = 0; i < packer._attribRedirects.length; i++)
        {
            const redirect = packer._attribRedirects[i];

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

            if (packer._attribRedirects[i + 1]
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
            if (this._sizeOf(packer._attribRedirects.length - 1)
                    !== 4)
            {
                packerBody += `
                    aIndex = adjustedAIndex * ${this._sizeOf(
        packer._attribRedirects.length - 1)}
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
            packerBody) as
        (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void;
    }

    // Returns an expression that fetches the attribute data source from
    // targetObject (DisplayObject).
    _compileSourceBufferExpression(redirect: Redirect, i: number): string
    {
        return (typeof redirect.source === 'string')
            ? `targetObject['${redirect.source}']`
            : `attributeRedirects[${i}].source(targetObject)`;
    }

    _compileVertexCountExpression(): string
    {
        if (!this.packer._vertexCountProperty)
        {
            // auto-calculate based on primary attribute
            return `__buffer_0.length / ${
                this.packer._attribRedirects[0].size}`;
        }

        return (
            (typeof this.packer._vertexCountProperty === 'string')
                ? `targetObject.${this.packer._vertexCountProperty}`
                : `${this.packer._vertexCountProperty}`
        );
    }

    _sizeOf(i: number): number
    {
        return PIXI.ViewableBuffer.sizeOf(
            this.packer._attribRedirects[i].type);
    }
};

export default BatchGeometryFactory;
