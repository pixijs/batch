import { AttributeRedirect } from './redirects/AttributeRedirect';
import * as PIXI from 'pixi.js';
import Redirect from './redirects/Redirect';
import BatchRenderer from './BatchRenderer';
import { StdBatch } from './StdBatch';
import { AggregateUniformsBatch } from './AggregateUniformsBatch';

// BatchGeometryFactory uses this class internally to setup the attributes of
// the batches.
//
// Supports Uniforms+Standard Pipeline's in-batch/uniform ID.
export class BatchGeometry extends PIXI.Geometry
{
    // Interleaved attribute data buffer
    attribBuffer: PIXI.Buffer;

    // Batched indicies
    indexBuffer: PIXI.Buffer;

    constructor(attributeRedirects: AttributeRedirect[],
        hasIndex: boolean,
        texIDAttrib: string,
        texturesPerObject: number,
        inBatchIDAttrib: string,
        uniformIDAttrib: string,
        masterIDAttrib: string,
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

        if (!masterIDAttrib)
        {
            if (texIDAttrib && texturesPerObject > 0)
            {
                this.addAttribute(texIDAttrib, attributeBuffer, texturesPerObject, true, PIXI.TYPES.FLOAT);
            }
            if (inBatchIDAttrib)
            {
                this.addAttribute(inBatchIDAttrib, attributeBuffer, 1, false, PIXI.TYPES.FLOAT);
            }
            if (uniformIDAttrib)
            {
                this.addAttribute(uniformIDAttrib, attributeBuffer, 1, false, PIXI.TYPES.FLOAT);
            }
        }
        else
        {
            this.addAttribute(masterIDAttrib, attributeBuffer, 1, false, PIXI.TYPES.FLOAT);
        }

        if (hasIndex)
        {
            this.addIndex(indexBuffer);
        }

        this.attribBuffer = attributeBuffer;
        this.indexBuffer = indexBuffer;
    }
}

// To define the constructor shape, this is defined as an abstract class but documented
// as an interface.
export abstract class IBatchGeometryFactory
{
    protected _renderer: BatchRenderer;

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-unused-vars
    constructor(renderer: BatchRenderer)
    {
        // Implementation
        this._renderer = renderer;
    }

    abstract init(verticesBatched: number, indiciesBatched: number): void;
    abstract append(displayObject: PIXI.DisplayObject, batch: any): void;
    abstract build(): PIXI.Geometry;
    abstract release(geom: PIXI.Geometry): void;
}

/**
 * This interface defines the methods you need to implement to creating your own batch
 * geometry factory.
 *
 * The constructor of an implementation should take only one argument - the batch renderer.
 *
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
 * Adds the display-object to the batch geometry.
 *
 * If the display-object's shader also uses textures (in `uSamplers` uniform), then it will
 * be given a texture-ID to get the texture from the `uSamplers` array. If it uses multiple
 * textures, then the texture-ID is an array of indices into `uSamplers`. The texture-attrib
 * passed to the batch renderer sets the name of the texture-ID attribute (defualt is `aTextureId`).
 *
 * @memberof PIXI.brend.IBatchGeometryFactory#
 * @method append
 * @param {PIXI.DisplayObject} displayObject
 * @param {object} batch - the batch
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
 * **inBatchID Support**: If you specified an `inBatchID` attribute in the batch-renderer,
 * then this will support it automatically. The aggregate-uniforms pipeline doesn't need a custom
 * geometry factory.
 *
 * @memberof PIXI.brend
 * @class
 * @implements PIXI.brend.IBatchGeometryFactory
 */
export class BatchGeometryFactory extends IBatchGeometryFactory
{
    _targetCompositeAttributeBuffer: PIXI.ViewableBuffer;
    _targetCompositeIndexBuffer: Uint16Array;
    _aIndex: number;
    _iIndex: number;

    // These properties are not protected because GeometryMerger uses them!

    // Standard Pipeline
    _attribRedirects: AttributeRedirect[];
    _indexProperty: string;
    _vertexCountProperty: string | number;
    _vertexSize: number;
    _texturesPerObject: number;
    _textureProperty: string;
    _texIDAttrib: string;
    _inBatchIDAttrib: string;
    _inBatchID: number;

    // Uniform+Standard Pipeline
    _uniformIDAttrib: string;
    _uniformID: number;

    // Master-ID attribute feature
    _masterIDAttrib: string;

    /* Set to the indicies of the display-object's textures in uSamplers uniform before
        invoking geometryMerger(). */
    protected _texID: number | number[];

    protected _aBuffers: PIXI.ViewableBuffer[];
    protected _iBuffers: Uint16Array[];

    protected _geometryPool: Array<PIXI.Geometry>;

    _geometryMerger: (displayObject: PIXI.DisplayObject, factory: BatchGeometryFactory) => void;

    /**
     * @param {PIXI.brend.BatchRenderer} renderer
     */
    constructor(renderer: BatchRenderer)
    {
        super(renderer);

        this._targetCompositeAttributeBuffer = null;
        this._targetCompositeIndexBuffer = null;
        this._aIndex = 0;
        this._iIndex = 0;

        this._attribRedirects = renderer._attribRedirects;
        this._indexProperty = renderer._indexProperty;
        this._vertexCountProperty = renderer._vertexCountProperty;
        this._vertexSize = AttributeRedirect.vertexSizeFor(this._attribRedirects);
        this._texturesPerObject = renderer._texturesPerObject;
        this._textureProperty = renderer._textureProperty;
        this._texIDAttrib = renderer._texIDAttrib;

        this._inBatchIDAttrib = renderer._inBatchIDAttrib;
        this._uniformIDAttrib = renderer._uniformIDAttrib;

        this._masterIDAttrib = renderer._masterIDAttrib;

        if (!this._masterIDAttrib)
        {
            this._vertexSize += this._texturesPerObject * 4;// texture indices are also passed

            if (this._inBatchIDAttrib)
            {
                this._vertexSize += 4;
            }
            if (this._uniformIDAttrib)
            {
                this._vertexSize += 4;
            }
        }
        else
        {
            this._vertexSize += 4;
        }

        if (this._texturesPerObject === 1)
        {
            this._texID = 0;
        }
        else if (this._texturesPerObject > 1)
        {
            this._texID = new Array(this._texturesPerObject);
        }

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
     * Append's the display-object geometry to this batch's geometry. You must override
     * this you need to "modify" the geometry of the display-object before merging into
     * the composite geometry (for example, adding an ID to a special uniform)
     *
     * @param {PIXI.DisplayObject} targetObject
     * @param {number} batch
     */
    append(targetObject: PIXI.DisplayObject, batch_: any): void
    {
        const batch: StdBatch = batch_ as StdBatch;
        const tex = (targetObject as any)[this._textureProperty];

        // GeometryMerger uses _texID for texIDAttrib
        if (this._texturesPerObject === 1)
        {
            const texUID = tex.baseTexture ? tex.baseTexture.uid : tex.uid;

            this._texID = batch.uidMap[texUID];
        }
        else if (this._texturesPerObject > 1)
        {
            let _tex;

            for (let k = 0; k < tex.length; k++)
            {
                _tex = tex[k];

                const texUID = _tex.BaseTexture ? _tex.baseTexture.uid : _tex.uid;

                (this._texID as number[])[k] = batch.uidMap[texUID];
            }
        }

        // GeometryMerger uses this
        if (this._inBatchIDAttrib || this._uniformIDAttrib)
        {
            this._inBatchID = batch.batchBuffer.indexOf(targetObject);
        }
        if (this._uniformIDAttrib)
        {
            this._uniformID = (batch as AggregateUniformsBatch).uniformMap[this._inBatchID];
        }

        // If _masterIDAttrib, then it is expected you override this function.

        this.geometryMerger(targetObject, this);
    }

    /**
     * @override
     * @returns {PIXI.Geometry} the generated batch geometry
     * @example
     * build(): PIXI.Geometry
     * {
     *      // Make sure you're not allocating new geometries if _geometryPool has some
     *      // already. (Otherwise, a memory leak will result!)
     *      const geom: ExampleGeometry = (this._geometryPool.pop() || new ExampleGeometry(
     *          // ...your arguments... //)) as ExampleGeometry;
     *
     *      // Put data into geometry's buffer
     *
     *      return geom;
     * }
     */
    build(): PIXI.Geometry
    {
        const geom: BatchGeometry = (this._geometryPool.pop() || new BatchGeometry(
            this._attribRedirects,
            true,
            this._texIDAttrib,
            this._texturesPerObject,
            this._inBatchIDAttrib,
            this._uniformIDAttrib,
            this._masterIDAttrib,
        )) as BatchGeometry;

        // We don't really have to remove the buffers because BatchRenderer won't reuse
        // the data in these buffers after the next build() call.
        geom.attribBuffer.update(this._targetCompositeAttributeBuffer.float32View);
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
        const roundedP2 = PIXI.utils.nextPow2(size);
        const roundedSizeIndex = PIXI.utils.log2(roundedP2);
        const roundedSize = roundedP2;

        if (this._aBuffers.length <= roundedSizeIndex)
        {
            this._aBuffers.length = roundedSizeIndex + 1;
        }

        let buffer = this._aBuffers[roundedSizeIndex];

        if (!buffer)
        {
            this._aBuffers[roundedSizeIndex] = buffer = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
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
            this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
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
        let packerBody = `
            const compositeAttributes = factory._targetCompositeAttributeBuffer;
            const compositeIndices = factory._targetCompositeIndexBuffer;
            let aIndex = factory._aIndex;
            let iIndex = factory._iIndex;
            const textureId = factory._texID;
            const attributeRedirects = factory._attribRedirects;
        `;

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
        let skipByteIndexConversion = false;

        // Appends a vertice's attributes (inside the for-loop above).
        for (let i = 0; i < packer._attribRedirects.length; i++)
        {
            const redirect = packer._attribRedirects[i];

            // Initialize adjustedAIndex in terms of source type.
            if (!skipByteIndexConversion)
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
        ${redirect.type}View[adjustedAIndex++] = __buffer_${i}[__offset_${i}++];
                    `;
                }
            }
            else
            {
                packerBody += `
        ${redirect.type}View[adjustedAIndex++] = __buffer_${i};
                `;
            }

            if (packer._attribRedirects[i + 1] && (this._sizeOf(i + 1) !== this._sizeOf(i)))
            {
                packerBody += `
        aIndex = adjustedAIndex * ${this._sizeOf(i)};
                `;
            }
            else
            {
                skipByteIndexConversion = true;
            }
        }

        if (skipByteIndexConversion)
        {
            if (this._sizeOf(packer._attribRedirects.length - 1) !== 4)
            {
                packerBody += `
        aIndex = adjustedAIndex * ${this._sizeOf(packer._attribRedirects.length - 1)}
                `;
                skipByteIndexConversion = false;
            }
        }

        if (!packer._masterIDAttrib)
        {
            if (packer._texturesPerObject > 0)
            {
                if (packer._texturesPerObject > 1)
                {
                    if (!skipByteIndexConversion)
                    {
                        packerBody += `
            adjustedAIndex = aIndex / 4;
                        `;
                    }

                    for (let k = 0; k < packer._texturesPerObject; k++)
                    {
                        packerBody += `
            float32View[adjustedAIndex++] = textureId[${k}];
                        `;
                    }

                    packerBody += `
            aIndex = adjustedAIndex * 4;
                    `;
                }
                else if (!skipByteIndexConversion)
                {
                    packerBody += `
            float32View[aIndex / 4] = textureId;
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
            if (packer._inBatchIDAttrib)
            {
                packerBody += `
                    float32View[adjustedAIndex++] = factory._inBatchID;
                    aIndex = adjustedAIndex * 4;
                `;
            }
            if (packer._uniformIDAttrib)
            {
                packerBody += `
                    float32View[adjustedAIndex++] = factory._uniformID;
                    aIndex = adjustedAIndex * 4;
                `;
            }
        }
        else
        {
            if (!skipByteIndexConversion)
            {
                packerBody += `
                    adjustedAIndex = aIndex / 4;
                `;
            }

            packerBody += `
                    float32View[adjustedAIndex++] = factory._masterID;
                    aIndex = adjustedAIndex * 4;
            `;
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
    const indexCount  = targetObject['${this.packer._indexProperty}'].length;

    for (let j = 0; j < indexCount; j++)
    {
        compositeIndices[iIndex++] = verticesBefore + targetObject['${this.packer._indexProperty}'][j];
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
            : `attributeRedirects[${i}].source(targetObject, factory._renderer)`;
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
