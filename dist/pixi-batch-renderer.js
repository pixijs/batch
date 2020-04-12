/*!
 * pixi-batch-renderer
 * Compiled Sun, 12 Apr 2020 20:13:19 UTC
 *
 * pixi-batch-renderer is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
this.PIXI = this.PIXI || {}
this.PIXI.brend = this.PIXI.brend || {}
var __batch_renderer = (function (exports, PIXI) {
    'use strict';

    /**
     * Redirects are used to aggregate the resources needed by the WebGL pipeline to render
     * a display-object. This includes the base primitives (geometry), uniforms, and
     * textures (which are handled as "special" uniforms).
     *
     * @memberof PIXI.brend
     * @class
     * @abstract
     * @see PIXI.brend.AttributeRedirect
     */
    class Redirect {
        constructor(source, glslIdentifer) {
            /**
             * The property on the display-object that holds the resource.
             *
             * Instead of a property, you can provide a callback that generates the resource
             * on invokation.
             *
             * @member {string | Function}
             */
            this.source = source;
            /**
             * The shader variable that references the resource, e.g. attribute or uniform
             * name.
             * @member {string}
             */
            this.glslIdentifer = glslIdentifer;
        }
    }

    /**
     * This redirect defines an attribute of a display-object's geometry. The attribute
     * data is expected to be stored in a `PIXI.ViewableBuffer`, in an array, or (if
     * just one element) as the property itself.
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.brend.Redirect
     * @example
     * // This attribute redirect calculates the tint used on top of a texture. Since the
     * // tintMode can change anytime, it is better to use a derived source (function).
     * //
     * // Furthermore, the color is uploaded as four bytes (`attribute vec4 aTint`) while the
     * // source returns an integer. This is done by splitting the 32-bit integer into four
     * // 8-bit bytes.
     * new PIXI.brend.AttributeRedirect({
     *     source: (tgt: ExampleDisplay) => (tgt.alpha < 1.0 && tgt.tintMode === PREMULTIPLY)
     *          ? premultiplyTint(tgt.rgb, tgt.alpha)
     *          : tgt.rgb + (tgt.alpha << 24);
     *     attrib: 'aTint',
     *     type: 'int32',
     *     size: '%notarray%', // optional/default
     *     glType: PIXI.TYPES.UNSIGNED_BYTE,
     *     glSize: 4,
     *     normalize: true // We are using [0, 255] range for RGBA here. Must normalize to [0, 1].
     * });
     */
    class AttributeRedirect extends Redirect {
        /**
         * @param {object} options
         * @param {string | Function} options.source - redirect source
         * @param {string} options.attrib - shader attribute variable
         * @param {string}[options.type='float32'] - the type of data stored in the source
         * @param {number | '%notarray%'}[options.size=0] - size of the source array ('%notarray' if not an array & just one element)
         * @param {PIXI.TYPES}[options.glType=PIXI.TYPES.FLOAT] - data format to be uploaded in
         * @param {number} options.glSize - number of elements to be uploaded as (size of source and upload must match)
         * @param {boolean}[options.normalize=false] - whether to normalize the data before uploading
         */
        constructor(options) {
            super(options.source, options.attrib);
            /**
             * The type of data stored in the source buffer. This can be any of: `int8`, `uint8`,
             * `int16`, `uint16`, `int32`, `uint32`, or (by default) `float32`.
             *
             * @member {string}
             * @see [PIXI.ViewableBuffer#view]{@link https://pixijs.download/dev/docs/PIXI.ViewableBuffer.html}
             * @default 'float32'
             */
            this.type = options.type;
            /**
             * Number of elements to extract out of `source` with
             * the given view type, for one vertex.
             *
             * If source isn't an array (only one element), then
             * you can set this to `'%notarray%'`.
             *
             * @member {number | '%notarray%'}
             */
            this.size = options.size;
            /**
             * This is equal to `size` or 1 if size is `%notarray%`.
             *
             * @member {number}
             */
            this.properSize = (options.size === '%notarray%' || options.size === undefined) ? 1 : options.size;
            /**
             * Type of attribute, when uploading.
             *
             * Normally, you would use the corresponding type for
             * the view on source. However, to speed up uploads
             * you can aggregate attribute values in larger data
             * types. For example, an RGBA vec4 (byte-sized channels)
             * can be represented as one `Uint32`, while having
             * a `glType` of `UNSIGNED_BYTE`.
             *
             * @member {PIXI.TYPES}
             */
            this.glType = options.glType;
            /**
             * Size of attribute in terms of `glType`.
             *
             * Note that `glSize * glType <= size * type`
             *
             * @readonly
             */
            this.glSize = options.glSize;
            /**
             * Whether to normalize the attribute values.
             *
             * @member {boolean}
             * @readonly
             */
            this.normalize = !!options.normalize;
        }
        static vertexSizeFor(attributeRedirects) {
            return attributeRedirects.reduce((acc, redirect) => (PIXI.ViewableBuffer.sizeOf(redirect.type)
                * redirect.properSize)
                + acc, 0);
        }
    }

    /**
     * This redirect is used to aggregate & upload uniforms required for shading the
     * display-object.
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.brend.Redirect
     * @example
     * // The data-type of this uniform is defined in your shader.
     * new PIXI.brend.UniformRedirect({
     *      source: (dob: PIXI.DisplayObject) => dob.transform.worldTransform,
     *      uniform: "transform"
     * });
     */
    class UniformRedirect extends Redirect {
        constructor(options) {
            super(options.source, options.uniform);
        }
    }

    /**
     * Resources that need to be uploaded to WebGL to render one batch.
     *
     * To customize batches, you must create your own batch factory by extending the
     * `PIXI.brend.StdBatchFactory` class.
     *
     * @memberof PIXI.brend
     * @class
     * @see PIXI.brend.StdBatchFactory
     */
    class StdBatch {
        constructor(geometryOffset) {
            /**
             * Index of the first vertex of this batch's geometry in the uploaded geometry.
             *
             * @member {number}
             */
            this.geometryOffset = geometryOffset;
            /**
             * Textures that are used by the display-object's in this batch.
             *
             * @member {Array<PIXI.Texture>}
             */
            this.textureBuffer = null;
            /**
             * Map of base-texture UIDs to texture indices into `uSamplers`.
             *
             * @member {Map<number, number>}
             */
            this.uidMap = null;
            /**
             * State required to render this batch.
             *
             * @member {PIXI.State}
             */
            this.state = null;
        }
        /**
         * Uploads the resources required before rendering this batch. If you override
         * this, you must call `super.upload`.
         *
         * @param {PIXI.Renderer} renderer
         */
        upload(renderer) {
            this.textureBuffer.forEach((tex, i) => {
                renderer.texture.bind(tex, i);
            });
            renderer.state.set(this.state);
        }
        /**
         * Reset this batch to become "fresh"!
         */
        reset() {
            this.textureBuffer = this.uidMap = this.state = null;
            if (this.batchBuffer) {
                this.batchBuffer.length = 0;
            }
        }
    }

    /**
     * Factory for producing "standard" (based on state, geometry, & textures) batches of
     * display-objects.
     *
     * **NOTE:** Instead of "building" batches, this factory actually keeps the batches in
     * a buffer so they can be accessed together at the end.
     *
     * **Shared Textures**: If display-objects in the same batch use the same base-texture,
     * then that base-texture is not uploaded twice. This allows for more better batch density
     * when you use texture atlases (textures with same base-texture). This is one reason why
     * textures are treated as "special" uniforms.
     *
     * @memberof PIXI.brend
     * @class
     * @see PIXI.brend.AggregateUniformsBatchFactory
     */
    class StdBatchFactory {
        /**
         * @param {PIXI.brend.BatchRenderer} renderer
         */
        constructor(renderer) {
            /**
             * @member {PIXI.brend.BatchRenderer}
             * @protected
             */
            this._renderer = renderer;
            this._state = null;
            /**
             * Textures per display-object
             * @member {number}
             */
            this._textureCount = renderer._texturesPerObject;
            /**
             * Property in which textures are kept of display-objects
             * @member {string}
             */
            this._textureProperty = renderer._textureProperty;
            /**
             * Max. no of textures per batch (should be <= texture units of GPU)
             * @member {number}
             */
            this._textureLimit = renderer.MAX_TEXTURES;
            /**
             * @member {object}
             */
            this._textureBuffer = {}; // uid : texture map
            this._textureBufferLength = 0;
            this._textureIndexedBuffer = []; // array of textures
            this._textureIndexMap = {}; // uid : index in above
            /**
             * Display-objects in current batch
             * @protected
             */
            this._batchBuffer = [];
            /**
             * Pool to batch objects into which data is fed.
             * @member {any[]}
             * @protected
             */
            this._batchPool = [];
            /**
             * Number of batches created since last reset.
             * @member {number}
             * @protected
             */
            this._batchCount = 0;
            if (this._textureCount === 1) {
                this._putTexture = this._putSingleTexture;
            }
            else {
                this._putTexture = this._putAllTextures;
            }
        }
        /**
         * Puts the display-object into the current batch, if possible.
         *
         * @param targetObject {PIXI.DisplayObject} - object to add
         * @param state {PIXI.State} - state required by that object
         * @return {boolean} whether the object was added to the batch. If it wasn't, you should "build" it.
         */
        put(targetObject, state) {
            // State compat
            if (!this._state) {
                this._state = state;
            }
            else if (this._state.data !== state.data) {
                return false;
            }
            // Customized compat
            if (!this._put(targetObject)) {
                return false;
            }
            // Texture compat
            if (this._textureCount > 0 && !this._putTexture(targetObject[this._textureProperty])) {
                return false;
            }
            this._batchBuffer.push(targetObject);
            return true;
        }
        /**
         * Creates the batch object and pushes it into the pool This also resets any state
         * so that a new batch can be started again.
         *
         * @param batch {PIXI.brend.Batch}
         */
        build(geometryOffset) {
            const batch = this._nextBatch();
            batch.geometryOffset = geometryOffset;
            this._buildBatch(batch);
            this._state = null;
            this._batchBuffer = [];
            this._textureBuffer = {};
            this._textureIndexMap = {};
            this._textureBufferLength = 0;
            this._textureIndexedBuffer = [];
        }
        /**
         * @returns {boolean} - whether this factory is ready to start a new batch from
         *  "start". If not, then the current batch must be built before starting a new one.
         */
        ready() {
            return this._batchBuffer.length === 0;
        }
        /**
         * Clears the batch pool.
         */
        reset() {
            this._batchCount = 0;
        }
        /**
         * Returns the built batch pool. The array returned may be larger than the pool
         * itself.
         *
         * @returns {Array<object>}
         */
        access() {
            return this._batchPool;
        }
        /**
         * Size of the batch pool built since last reset.
         */
        size() {
            return this._batchCount;
        }
        /**
         * Should store any information from the display-object to be put into
         * the batch.
         * @param {PIXI.DisplayObject} displayObject
         * @returns {boolean} - whether the display-object was "compatible" with
         *      other display-objects in the batch. If not, it should not have been
         *      added.
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _put(displayObject) {
            // Override this
            return true;
        }
        /**
         * @returns {object} a new batch
         * @protected
         * @example
         * _newBatch(): CustomBatch
         * {
         *      return new CustomBatch();
         * }
         */
        _newBatch() {
            return new StdBatch();
        }
        /**
         * @param {number} geometryOffset
         */
        _nextBatch(geometryOffset) {
            if (this._batchCount === this._batchPool.length) {
                this._batchPool.push(this._newBatch());
            }
            const batch = this._batchPool[this._batchCount++];
            batch.reset();
            batch.geometryOffset = geometryOffset;
            return batch;
        }
        /**
         * Should add any information required to render the batch. If you override this,
         * you must call `super._buildBatch` and clear any state.
         * @param {object} batch
         * @protected
         * @example
         * _buildBatch(batch: any): void
         * {
         *      super._buildBatch(batch);
         *      batch.depth = this.generateDepth();
         *
         *      // if applicable
         *      this.resetDepthGenerator();
         * }
         */
        _buildBatch(batch) {
            batch.batchBuffer = this._batchBuffer;
            batch.textureBuffer = this._textureIndexedBuffer;
            batch.uidMap = this._textureIndexMap;
            batch.state = this._state;
        }
        // Optimized _putTexture case.
        _putSingleTexture(texture) {
            if ('baseTexture' in texture) {
                texture = texture.baseTexture;
            }
            const baseTexture = texture;
            if (this._textureBuffer[baseTexture.uid]) {
                return true;
            }
            else if (this._textureBufferLength + 1 <= this._textureLimit) {
                this._textureBuffer[baseTexture.uid] = texture;
                this._textureBufferLength += 1;
                const newLength = this._textureIndexedBuffer.push(baseTexture);
                const index = newLength - 1;
                this._textureIndexMap[baseTexture.uid] = index;
                return true;
            }
            return false;
        }
        _putAllTextures(textureArray) {
            let deltaBufferLength = 0;
            for (let i = 0; i < textureArray.length; i++) {
                const texture = (textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i]);
                if (!this._textureBuffer[texture.uid]) {
                    ++deltaBufferLength;
                }
            }
            if (deltaBufferLength + this._textureBufferLength > this._textureLimit) {
                return false;
            }
            for (let i = 0; i < textureArray.length; i++) {
                const texture = textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i];
                if (!this._textureBuffer[texture.uid]) {
                    this._textureBuffer[texture.uid] = texture;
                    this._textureBufferLength += 1;
                    const newLength = this._textureIndexedBuffer.push(texture);
                    const index = newLength - 1;
                    this._textureIndexMap[texture.uid] = index;
                }
            }
            return true;
        }
    }

    // BatchGeometryFactory uses this class internally to setup the attributes of
    // the batches.
    //
    // Supports Uniforms+Standard Pipeline's in-batch/uniform ID.
    class BatchGeometry extends PIXI.Geometry {
        constructor(attributeRedirects, hasIndex, texIDAttrib, texturesPerObject, inBatchIDAttrib, uniformIDAttrib) {
            super();
            const attributeBuffer = new PIXI.Buffer(null, false, false);
            const indexBuffer = hasIndex ? new PIXI.Buffer(null, false, true) : null;
            attributeRedirects.forEach((redirect) => {
                const { glslIdentifer, glType, glSize, normalize } = redirect;
                this.addAttribute(glslIdentifer, attributeBuffer, glSize, normalize, glType);
            });
            if (texIDAttrib && texturesPerObject > 0) {
                this.addAttribute(texIDAttrib, attributeBuffer, texturesPerObject, true, PIXI.TYPES.FLOAT);
            }
            if (inBatchIDAttrib) {
                this.addAttribute(inBatchIDAttrib, attributeBuffer, 1, false, PIXI.TYPES.FLOAT);
            }
            if (uniformIDAttrib) {
                this.addAttribute(uniformIDAttrib, attributeBuffer, 1, false, PIXI.TYPES.FLOAT);
            }
            if (hasIndex) {
                this.addIndex(indexBuffer);
            }
            this.attribBuffer = attributeBuffer;
            this.indexBuffer = indexBuffer;
        }
    }
    // To define the constructor shape, this is defined as an abstract class but documented
    // as an interface.
    class IBatchGeometryFactory {
        // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-unused-vars
        constructor(renderer) {
            // Implementation
        }
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
    class BatchGeometryFactory extends IBatchGeometryFactory {
        /**
         * @param {PIXI.brend.BatchRenderer} renderer
         */
        constructor(renderer) {
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
            this._vertexSize += this._texturesPerObject * 4; // texture indices are also passed
            if (this._inBatchIDAttrib) {
                this._vertexSize += 4;
            }
            if (this._uniformIDAttrib) {
                this._vertexSize += 4;
            }
            if (this._texturesPerObject === 1) {
                this._texID = 0;
            }
            else if (this._texturesPerObject > 1) {
                this._texID = new Array(this._texturesPerObject);
            }
            this._aBuffers = []; // @see _getAttributeBuffer
            this._iBuffers = []; // @see _getIndexBuffer
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
        init(verticesBatched, indiciesBatched) {
            this._targetCompositeAttributeBuffer = this.getAttributeBuffer(verticesBatched);
            if (this._indexProperty) {
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
        append(targetObject, batch_) {
            const batch = batch_;
            const tex = targetObject[this._textureProperty];
            // GeometryMerger uses _texID for texIDAttrib
            if (this._texturesPerObject === 1) {
                const texUID = tex.baseTexture ? tex.baseTexture.uid : tex.uid;
                this._texID = batch.uidMap[texUID];
            }
            else if (this._texturesPerObject > 1) {
                let _tex;
                for (let k = 0; k < tex.length; k++) {
                    _tex = tex[k];
                    const texUID = _tex.BaseTexture ? _tex.baseTexture.uid : _tex.uid;
                    this._texID[k] = batch.uidMap[texUID];
                }
            }
            // GeometryMerger uses this
            if (this._inBatchIDAttrib) {
                this._inBatchID = batch.batchBuffer.indexOf(targetObject);
            }
            if (this._uniformIDAttrib) {
                this._uniformID = batch.uniformMap[this._inBatchID];
            }
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
        build() {
            const geom = (this._geometryPool.pop() || new BatchGeometry(this._attribRedirects, true, this._texIDAttrib, this._texturesPerObject, this._inBatchIDAttrib, this._uniformIDAttrib));
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
        release(geom) {
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
        get geometryMerger() {
            if (!this._geometryMerger) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this._geometryMerger = new GeometryMergerFactory(this).compile();
            }
            return this._geometryMerger;
        }
        // eslint-disable-next-line require-jsdoc
        set geometryMerger(func) {
            this._geometryMerger = func;
        }
        /**
         * Allocates an attribute buffer with sufficient capacity to hold `size` elements.
         *
         * @param {number} size
         * @protected
         */
        getAttributeBuffer(size) {
            // 8 vertices is enough for 2 quads
            const roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 8));
            const roundedSizeIndex = PIXI.utils.log2(roundedP2);
            const roundedSize = roundedP2 * 8;
            if (this._aBuffers.length <= roundedSizeIndex) {
                this._aBuffers.length = roundedSizeIndex + 1;
            }
            let buffer = this._aBuffers[roundedSizeIndex];
            if (!buffer) {
                this._aBuffers[roundedSize] = buffer = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
            }
            return buffer;
        }
        /**
         * Allocates an index buffer (`Uint16Array`) with sufficient capacity to hold `size` indices.
         *
         * @param size
         * @protected
         */
        getIndexBuffer(size) {
            // 12 indices is enough for 2 quads
            const roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 12));
            const roundedSizeIndex = PIXI.utils.log2(roundedP2);
            const roundedSize = roundedP2 * 12;
            if (this._iBuffers.length <= roundedSizeIndex) {
                this._iBuffers.length = roundedSizeIndex + 1;
            }
            let buffer = this._iBuffers[roundedSizeIndex];
            if (!buffer) {
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
    const GeometryMergerFactory = class {
        // We need the BatchGeometryFactory for attribute redirect information.
        constructor(packer) {
            this.packer = packer;
        }
        compile() {
            const packer = this.packer;
            // The function's body/code is placed here.
            let packerBody = ``;
            // Define __offset_${i}, the offset of each attribute in the display-object's
            // geometry, __buffer_${i} the source buffer of the attribute data.
            packer._attribRedirects.forEach((redirect, i) => {
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
            const textureId = factory._texID;
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
            let skipByteIndexConversion = false;
            // Appends a vertice's attributes (inside the for-loop above).
            for (let i = 0; i < packer._attribRedirects.length; i++) {
                const redirect = packer._attribRedirects[i];
                // Initialize adjustedAIndex in terms of source type.
                if (!skipByteIndexConversion) {
                    packerBody += `
        adjustedAIndex = aIndex / ${this._sizeOf(i)};
                `;
                }
                if (typeof redirect.size === 'number') {
                    for (let j = 0; j < redirect.size; j++) {
                        packerBody += `
        ${redirect.type}View[adjustedAIndex++] = __buffer_${i}[__offset_${i}++];
                    `;
                    }
                }
                else {
                    packerBody += `
        ${redirect.type}View[adjustedAIndex++] = __buffer_${i};
                `;
                }
                if (packer._attribRedirects[i + 1] && (this._sizeOf(i + 1) !== this._sizeOf(i))) {
                    packerBody += `
        aIndex = adjustedAIndex * ${this._sizeOf(i)};
                `;
                }
                else {
                    skipByteIndexConversion = true;
                }
            }
            if (skipByteIndexConversion) {
                if (this._sizeOf(packer._attribRedirects.length - 1) !== 4) {
                    packerBody += `
        aIndex = adjustedAIndex * ${this._sizeOf(packer._attribRedirects.length - 1)}
                `;
                    skipByteIndexConversion = false;
                }
            }
            if (packer._texturesPerObject > 0) {
                if (packer._texturesPerObject > 1) {
                    if (!skipByteIndexConversion) {
                        packerBody += `
        adjustedAIndex = aIndex / 4;
                    `;
                    }
                    for (let k = 0; k < packer._texturesPerObject; k++) {
                        packerBody += `
        float32View[adjustedAIndex++] = textureId[${k}];
                    `;
                    }
                    packerBody += `
        aIndex = adjustedAIndex * 4;
                `;
                }
                else if (!skipByteIndexConversion) {
                    packerBody += `
        float32View[aIndex / 4] = textureId;
                `;
                }
                else {
                    packerBody += `
        float32View[adjustedAIndex++] = textureId;
        aIndex = adjustedAIndex * 4;
                `;
                }
            }
            if (packer._inBatchIDAttrib) {
                packerBody += `
                float32View[adjustedAIndex++] = factory._inBatchID;
                aIndex = adjustedAIndex * 4;
            `;
            }
            if (packer._uniformIDAttrib) {
                packerBody += `
                float32View[adjustedAIndex++] = factory._uniformID;
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
            if (this.packer._indexProperty) {
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
            return new Function(...CompilerConstants.packerArguments, packerBody);
        }
        // Returns an expression that fetches the attribute data source from
        // targetObject (DisplayObject).
        _compileSourceBufferExpression(redirect, i) {
            return (typeof redirect.source === 'string')
                ? `targetObject['${redirect.source}']`
                : `attributeRedirects[${i}].source(targetObject)`;
        }
        _compileVertexCountExpression() {
            if (!this.packer._vertexCountProperty) {
                // auto-calculate based on primary attribute
                return `__buffer_0.length / ${this.packer._attribRedirects[0].size}`;
            }
            return ((typeof this.packer._vertexCountProperty === 'string')
                ? `targetObject.${this.packer._vertexCountProperty}`
                : `${this.packer._vertexCountProperty}`);
        }
        _sizeOf(i) {
            return PIXI.ViewableBuffer.sizeOf(this.packer._attribRedirects[i].type);
        }
    };

    function resolveConstantOrProperty(targetObject, property) {
        return (typeof property === 'string')
            ? targetObject[property]
            : property;
    }

    function resolveFunctionOrProperty(targetObject, property) {
        return (typeof property === 'string')
            ? targetObject[property]
            : property(targetObject);
    }

    /**
     * Executes the final stage of batch rendering - drawing. The drawer can assume that
     * all display-objects have been into the batch-factory and the batch-geometry factory.
     *
     * @memberof PIXI.brend
     * @class
     */
    class BatchDrawer {
        constructor(renderer) {
            /**
             * @member {PIXI.brend.BatchRenderer}
             */
            this.renderer = renderer;
        }
        /**
         * This method will be called after all display-object have been fed into the
         * batch and batch-geometry factories.
         *
         * **Hint**: You will call some form of `BatchGeometryFactory#build`; be sure to release
         * that geometry for reuse in next render pass via `BatchGeometryFactory#release(geom)`.
         */
        draw() {
            const { renderer, _batchFactory: batchFactory, _geometryFactory: geometryFactory, _indexProperty: indexProperty, } = this.renderer;
            const batchList = batchFactory.access();
            const batchCount = batchFactory.size();
            const geom = geometryFactory.build();
            const { gl } = renderer;
            // PixiJS bugs - the shader can't be bound before uploading because uniform sync caching
            // and geometry requires the shader to be bound.
            batchList[0].upload(renderer);
            renderer.shader.bind(this.renderer._shader, false);
            renderer.geometry.bind(geom);
            for (let i = 0; i < batchCount; i++) {
                const batch = batchList[i];
                batch.upload(renderer);
                renderer.shader.bind(this.renderer._shader, false);
                if (indexProperty) {
                    // TODO: Get rid of the $indexCount black magic!
                    gl.drawElements(gl.TRIANGLES, batch.$indexCount, gl.UNSIGNED_SHORT, batch.geometryOffset * 2);
                }
                else {
                    // TODO: Get rid of the $vertexCount black magic!
                    gl.drawArrays(gl.TRIANGLES, batch.geometryOffset, batch.$vertexCount);
                }
                batch.reset();
            }
            geometryFactory.release(geom);
        }
    }

    /**
     * This object renderer renders multiple display-objects in batches. It can greatly
     * reduce the number of draw calls issued per frame.
     *
     * ## Batch Rendering Pipeline
     *
     * The batch rendering pipeline consists of the following stages:
     *
     * * **Display-Object Buffering**: Each display-object is kept in a buffer until it fills up or a
     * flush is required.
     *
     * * **Batch Generation**: In a sliding window, display-object batches are generated based off of certain
     * constraints like GPU texture units and the uniforms used in each display-object. This is done using an
     * instance of {@link PIXI.brend.BatchFactory}.
     *
     * * **Geometry Composition**: The geometries of all display-objects are merged together in a
     * composite geometry. This is done using an instance of {@link PIXI.brend.BatchGeometryFactory}.
     *
     * * **Drawing**: Each batch is rendered in-order using `gl.draw*`. The textures and
     * uniforms of each display-object are uploaded as arrays. This is done using an instance of
     * {@link PIXI.brend.BatchDrawer}.
     *
     * Each stage in this pipeline can be configured by overriding the appropriate component and passing that
     * class to `BatchRendererPluginFactory.from*`.
     *
     * ## Shaders
     *
     * ### Shader templates
     *
     * Since the max. display-object count per batch is not known until the WebGL context is created,
     * shaders are generated at runtime by processing shader templates. A shader templates has "%macros%"
     * that are replaced by constants at runtime.
     *
     * To use shader templates, simply use {@link PIXI.brend.BatchShaderFactory#derive}. This will generate a
     * function that derives a shader from your template at runtime.
     *
     * ### Textures
     *
     * The batch renderer uploads textures in the `uniform sampler2D uSamplers[%texturesPerBatch%];`. The
     * `varying float vTextureId` defines the index into this array that holds the current display-object's
     * texture.
     *
     * ### Uniforms
     *
     * This renderer currently does not support customized uniforms for display-objects. This is a
     * work-in-progress feature.
     *
     * ## Learn more
     * This batch renderer uses the PixiJS object-renderer API to hook itself:
     *
     * 1. [PIXI.ObjectRenderer]{@link http://pixijs.download/release/docs/PIXI.ObjectRenderer.html}
     *
     * 2. [PIXI.AbstractBatchRenderer]{@link http://pixijs.download/release/docs/PIXI.AbstractBatchRenderer.html}
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.ObjectRenderer
     * @example
     * import * as PIXI from 'pixi.js';
     * import { BatchRendererPluginFactory } from 'pixi-batch-renderer';
     *
     * // Define the geometry of your display-object and create a BatchRenderer using
     * // BatchRendererPluginFactory. Register it as a plugin with PIXI.Renderer.
     * PIXI.Renderer.registerPlugin('ExampleBatchRenderer', BatchRendererPluginFactory.from(...));
     *
     * class ExampleObject extends PIXI.Container
     * {
     *     _render(renderer: PIXI.Renderer): void
     *     {
     *          // BatchRenderer will handle the whole rendering process for you!
     *          renderer.batch.setObjectRenderer(renderer.plugins['ExampleBatchRenderer']);
     *          renderer.plugins['ExampleBatchRenderer'].render(this);
     *     }
     * }
     */
    class BatchRenderer extends PIXI.ObjectRenderer {
        /**
         * Creates a batch renderer the renders display-objects with the described geometry.
         *
         * To register a batch-renderer plugin, you must use the API provided by `PIXI.brend.BatchRendererPluginFactory`.
         *
         * @param {PIXI.Renderer} renderer - renderer to attach to
         * @param {object} options
         * @param {PIXI.brend.AttributeRedirect[]} options.attribSet
         * @param {string | null} options.indexProperty
         * @param {string | number} [options.vertexCountProperty]
         * @param {string | null} options.textureProperty
         * @param {number} [options.texturesPerObject=1]
         * @param {string} options.texIDAttrib - name of texture-id attribute variable
         * @param {Function} options.stateFunction - returns a PIXI.State for an object
         * @param {Function} options.shaderFunction - generates a shader given this instance
         * @param {Class} [options.BatchGeometryFactory=PIXI.brend.BatchGeometry]
         * @param {Class} [options.BatchFactoryClass=PIXI.brend.StdBatchFactory]
         * @param {Class} [options.BatchDrawer=PIXI.brend.BatchDrawer]
         * @see PIXI.brend.BatchShaderFactory
         * @see PIXI.brend.StdBatchFactory
         * @see PIXI.brend.BatchGeometryFactory
         * @see PIXI.brend.BatchDrawer
         */
        constructor(renderer, options) {
            super(renderer);
            /**
             * Attribute redirects
             * @member {PIXI.brend.AttributeRedirect[]}
             * @protected
             * @readonly
             */
            this._attribRedirects = options.attribSet;
            /**
             * Indices property
             * @member {string}
             * @protected
             * @readonly
             */
            this._indexProperty = options.indexProperty;
            /**
             * Vertex count property (optional)
             * @member {string}
             * @protected
             * @readonly
             */
            this._vertexCountProperty = options.vertexCountProperty;
            /**
             * Texture(s) property
             * @member {string}
             * @protected
             * @readonly
             */
            this._textureProperty = options.textureProperty;
            /**
             * Textures per display-object
             * @member {number}
             * @protected
             * @readonly
             * @default 1
             */
            this._texturesPerObject = typeof options.texturesPerObject !== 'undefined' ? options.texturesPerObject : 1;
            /**
             * Texture ID attribute
             * @member {string}
             * @protected
             * @readonly
             */
            this._texIDAttrib = options.texIDAttrib;
            /**
             * Indexes the display-object in the batch.
             * @member {string}
             * @protected
             * @readonly
             */
            this._inBatchIDAttrib = options.inBatchIDAttrib;
            /**
             * State generating function (takes a display-object)
             * @member {Function}
             * @default () => PIXI.State.for2d()
             * @protected
             * @readonly
             */
            this._stateFunction = options.stateFunction || (() => PIXI.State.for2d());
            /**
             * Shader generating function (takes the batch renderer)
             * @member {Function}
             * @protected
             * @see PIXI.brend.BatchShaderFactory
             * @readonly
             */
            this._shaderFunction = options.shaderFunction;
            /**
             * Batch-factory class.
             * @member {Class}
             * @protected
             * @default PIXI.brend.StdBatchFactory
             * @readonly
             */
            this._BatchFactoryClass = options.BatchFactoryClass || StdBatchFactory;
            /**
             * Batch-geometry factory class. Its constructor takes one argument - this batch renderer.
             * @member {Class}
             * @protected
             * @default PIXI.brend.BatchGeometryFactory
             * @readonly
             */
            this._BatchGeometryFactoryClass = options.BatchGeometryFactoryClass || BatchGeometryFactory;
            /**
             * Batch drawer class. Its constructor takes one argument - this batch renderer.
             * @member {Class}
             * @protected
             * @default PIXI.brend.BatchDrawer
             * @readonly
             */
            this._BatchDrawerClass = options.BatchDrawerClass || BatchDrawer;
            /**
             * Uniform redirects. If you use uniforms in your shader, be sure to use one the compatible
             * batch factories (like `PIXI.brend.AggregateUniformsBatchFactory`).
             * @member {PIXI.brend.UniformRedirect[]}
             * @protected
             * @default null
             * @readonly
             */
            this._uniformRedirects = options.uniformSet || null;
            /**
             * Indexes the uniforms of the display-object in the uniform arrays. This is not equal to the
             * in-batch ID because equal uniforms are not uploaded twice.
             * @member {string}
             * @protected
             * @readonly
             */
            this._uniformIDAttrib = options.uniformIDAttrib;
            /**
             * The options used to create this batch renderer.
             * @readonly {object}
             * @protected
             * @readonly
             */
            this.options = options;
            // Although the runners property is not a public API, it is required to
            // handle contextChange events.
            this.renderer.runners.contextChange.add(this);
            // If the WebGL context has already been created, initialization requires a
            // syntheic call to contextChange.
            if (this.renderer.gl) {
                this.contextChange();
            }
            this._objectBuffer = [];
            this._bufferedVertices = 0;
            this._bufferedIndices = 0;
            this._shader = null;
        }
        /**
         * Internal method that is called whenever the renderer's WebGL context changes.
         */
        contextChange() {
            const gl = this.renderer.gl;
            if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY) {
                this.MAX_TEXTURES = 1;
            }
            else {
                this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), PIXI.settings.SPRITE_MAX_TEXTURES);
            }
            /**
             * @member {_BatchFactoryClass}
             * @readonly
             * @protected
             */
            this._batchFactory = new this._BatchFactoryClass(this);
            /**
             * @member {_BatchGeometryFactoryClass}
             * @readonly
             * @protected
             */
            this._geometryFactory = new this._BatchGeometryFactoryClass(this);
            /**
             * @member {_BatchDrawerClass}
             * @readonly
             * @protected
             */
            this._drawer = new this._BatchDrawerClass(this);
        }
        /**
         * This is an internal method. It ensures that the batch renderer is ready to start buffering display-objects.
         * This is automatically invoked by the renderer's batch system.
         *
         * @override
         */
        start() {
            this._objectBuffer.length = 0;
            this._bufferedVertices = 0;
            this._bufferedIndices = 0;
            this._shader = this._shaderFunction(this);
        }
        /**
         * Adds the display-object to be rendered in a batch. Your display-object's render/_render method should call
         * this as follows:
         *
         * ```js
         * renderer.setObjectRenderer(<BatchRenderer>);
         * <BatchRenderer>.render(this);
         * ```
         *
         * @param {PIXI.DisplayObject} displayObject
         * @override
         */
        render(displayObject) {
            this._objectBuffer.push(displayObject);
            this._bufferedVertices += this._vertexCountFor(displayObject);
            if (this._indexProperty) {
                this._bufferedIndices += resolveConstantOrProperty(displayObject, this._indexProperty).length;
            }
        }
        /**
         * Forces buffered display-objects to be rendered immediately. This should not be called unless absolutely
         * necessary like the following scenarios:
         *
         * * before directly rendering your display-object, to preserve render-order.
         *
         * * to do a nested render pass (calling `Renderer#render` inside a `render` method)
         *   because the PixiJS renderer is not re-entrant.
         *
         * @override
         */
        flush() {
            const { _batchFactory: batchFactory, _geometryFactory: geometryFactory, _stateFunction: stateFunction } = this;
            const buffer = this._objectBuffer;
            const bufferLength = buffer.length;
            // Reset components
            batchFactory.reset();
            geometryFactory.init(this._bufferedVertices, this._bufferedIndices);
            let batchStart = 0;
            // Loop through display-objects and create batches
            for (let objectIndex = 0; objectIndex < bufferLength;) {
                const target = buffer[objectIndex];
                const wasPut = batchFactory.put(target, resolveFunctionOrProperty(target, stateFunction));
                if (!wasPut) {
                    batchFactory.build(batchStart);
                    batchStart = objectIndex;
                }
                else {
                    ++objectIndex;
                }
            }
            // Generate the last batch, if required.
            if (!batchFactory.ready()) {
                batchFactory.build(batchStart);
            }
            const batchList = batchFactory.access();
            const batchCount = batchFactory.size();
            let indices = 0;
            // Loop through batches and their display-object list to compose geometry
            for (let i = 0; i < batchCount; i++) // loop-per(batch)
             {
                const batch = batchList[i];
                const batchBuffer = batch.batchBuffer;
                const batchLength = batchBuffer.length;
                let vertexCount = 0;
                let indexCount = 0;
                for (let j = 0; j < batchLength; j++) // loop-per(targetObject)
                 {
                    const targetObject = batchBuffer[j];
                    if (this._indexProperty) {
                        indexCount += resolveConstantOrProperty(targetObject, this._indexProperty).length;
                    }
                    else {
                        vertexCount += resolveConstantOrProperty(targetObject, this._vertexCountProperty);
                    }
                    // externally-defined properties for draw calls
                    batch.$vertexCount = vertexCount;
                    batch.$indexCount = indexCount;
                    batch.geometryOffset = indices;
                    indices += batch.$indexCount;
                    geometryFactory.append(targetObject, batch);
                }
            }
            // BatchDrawer handles the rest!
            this._drawer.draw();
        }
        /**
         * Internal method that stops buffering of display-objects and flushes any existing buffers.
         *
         * @override
         */
        stop() {
            if (this._bufferedVertices) {
                this.flush();
            }
        }
        // Should we document this?
        _vertexCountFor(targetObject) {
            return (this._vertexCountProperty)
                ? resolveConstantOrProperty(targetObject, this._vertexCountProperty)
                : resolveFunctionOrProperty(targetObject, this._attribRedirects[0].source).length
                    / this._attribRedirects[0].size;
        }
    }

    /**
     * Factory class for creating a batch-renderer.
     *
     * @memberof PIXI.brend
     * @class
     * @example
     *  import * as PIXI from 'pixi.js';
     *  import { AttributeRedirect, BatchShaderFactory, BatchRendererPluginFactory } from 'pixi-batch-renderer';
     *
     *  // Define the geometry of Sprite.
     *  const attribSet = [
     *      // Sprite vertexData contains global coordinates of the corners
     *      new AttributeRedirect({
     *          source: 'vertexData',
     *          attrib: 'aVertex',
     *          type: 'float32',
     *          size: 2,
     *          glType: PIXI.TYPES.FLOAT,
     *          glSize: 2,
     *      }),
     *      // Sprite uvs contains the normalized texture coordinates for each corner/vertex
     *      new AttributeRedirect({
     *          source: 'uvs',
     *          attrib: 'aTextureCoord',
     *          type: 'float32',
     *          size: 2,
     *          glType: PIXI.TYPES.FLOAT,
     *          glSize: 2,
     *      }),
     *  ];
     *
     *  const shaderFunction = new BatchShaderFactory(// 1. vertexShader
     *  `
     *  attribute vec2 aVertex;
     *  attribute vec2 aTextureCoord;
     *  attribute float aTextureId;
     *
     *  varying float vTextureId;
     *  varying vec2 vTextureCoord;
     *
     *  uniform mat3 projectionMatrix;
     *
     *  void main() {
     *      gl_Position = vec4((projectionMatrix * vec3(aVertex, 1)).xy, 0, 1);
     *      vTextureId = aTextureId;
     *      vTextureCoord = aTextureCoord;
     *  }
     *  `,
     *  `
     *  uniform sampler2D uSamplers[%texturesPerBatch%];
     *  varying float vTextureId;
     *  varying vec2 vTextureCoord;
     *
     *  void main(void){
     *      vec4 color;
     *
     *      // get color, which is the pixel in texture uSamplers[vTextureId] at vTextureCoord
     *      for (int k = 0; k < %texturesPerBatch%; ++k) {
     *          if (int(vTextureId) == k) {
     *              color = texture2D(uSamplers[k], vTextureCoord);
     *              break;
     *          }
     *      }
     *
     *      gl_FragColor = color;
     *  }
     *  `,
     *  {// we don't use any uniforms except uSamplers, which is handled by default!
     *  },
     *  // no custom template injectors
     *  // disable vertex shader macros by default
     *  ).derive();
     *
     *  // Produce the SpriteBatchRenderer class!
     *  const SpriteBatchRenderer = BatchRendererPluginFactory.from({
     *      attribSet,
     *      indexProperty: 'indices',
     *      textureProperty: 'texture',
     *      texturesPerObject: 1, // default
     *      texIDAttrib: 'aTextureId',
     *      stateFunction: () => PIXI.State.for2d(), // default
     *      shaderFunction
     *  });
     *
     *  PIXI.Renderer.registerPlugin('customBatch', SpriteBatchRenderer);
     *
     *  // Sprite will render using SpriteBatchRenderer instead of default PixiJS
     *  // batch renderer. Instead of targetting PIXI.Sprite, you can write a batch
     *  // renderer for a custom display-object too! (See main page for that example!)
     *  const exampleSprite = PIXI.Sprite.from('./asset/example.png');
     *  exampleSprite.pluginName = 'customBatch';
     *  exampleSprite.width = 128;
     *  exampleSprite.height = 128;
     */
    class BatchRendererPluginFactory {
        /**
         * Generates a fully customized `BatchRenderer` that aggregates primitives and textures. This is useful
         * for non-uniform based display-objects.
         *
         * @param {object} options
         * @param {PIXI.brend.AttributeRedirect[]} options.attribSet - set of geometry attributes
         * @param {string | Array<number>} options.indexProperty - no. of indices on display-object
         * @param {string | number} options.vertexCountProperty - no. of vertices on display-object
         * @param {string} options.textureProperty - textures used in display-object
         * @param {number} options.texturePerObject - no. of textures used per display-object
         * @param {string} options.texIDAttrib - used to find texture for each display-object (index into array)
         * @param {string | Function}[options.stateFunction= ()=>PIXI.State.for2d()] - callback that finds the WebGL
         *  state required for display-object shader
         * @param {Function} options.shaderFunction - shader generator function
         * @param {Class}[options.BatchGeometryFactoryClass] - custom batch geometry factory class
         * @param {Class} [options.BatchFactoryClass] - custom batch factory class
         * @param {Class} [options.BatchRendererClass] - custom batch renderer class
         * @param {Class} [options.BatchDrawerClass] - custom batch drawer class
         * @static
         */
        static from(options) {
            // This class wraps around BatchRendererClass's constructor and passes the options from the outer scope.
            return class extends (options.BatchRendererClass || BatchRenderer) {
                constructor(renderer) {
                    super(renderer, options);
                }
            };
        }
    }

    // This file might need a cleanup :)
    // JavaScript is stupid enough not to have a replaceAll in String. This is a temporary
    // solution and we should depend on an actually polyfill.
    function _replaceAll(target, search, replacement) {
        return target.replace(new RegExp(search, 'g'), replacement);
    }
    function injectTexturesPerBatch(batchRenderer) {
        return `${batchRenderer.MAX_TEXTURES}`;
    }
    const INJECTORS = {
        uniformsPerBatch(renderer) {
            return `${renderer._batchFactory.MAX_UNIFORMS}`;
        },
    };
    /**
     * Exposes an easy-to-use API for generating shader-functions to use in
     * the batch renderer!
     *
     * You are required to provide an injector map, which maps macros to functions
     * that return a string value for those macros given a renderer. By default, only one
     * injector is used - the textures per batch `%texturesPerBatch%` macro. This is replaced by
     * the number of textures passed to the `uSamplers` textures uniform.
     *
     * **Built-in Injectors**:
     *
     * * `%texturesPerBatch%`: replaced by the max. textures allowed by WebGL context
     *
     * * `%uniformsPerBatch%`: replaced by the (aggregate-uniforms) batch factory's `MAX_UNIFORMS` property.
     *
     * @memberof PIXI.brend
     * @class
     */
    class BatchShaderFactory {
        /**
         * WARNING: Do not pass `uSamplers` in your uniforms. They
         *  will be added to your shader instance directly.
         *
         * @param {string} vertexShaderTemplate
         * @param {string} fragmentShaderTemplate
         * @param {UniformGroup | Map<string, object>} uniforms
         * @param {Object.<String, PIXI.brend.InjectorFunction>} [templateInjectors]
         * @param {boolean} [disableVertexShaderTemplate=true] - turn off (true)
         *      if you aren't using macros in the vertex shader
         */
        constructor(vertexShaderTemplate, fragmentShaderTemplate, uniforms = {}, templateInjectors = {}, disableVertexShaderTemplate = true) {
            if (!templateInjectors['%texturesPerBatch%']) {
                templateInjectors['%texturesPerBatch%'] = injectTexturesPerBatch;
            }
            if (!templateInjectors['%uniformsPerBatch%']) {
                templateInjectors['%uniformsPerBatch%'] = INJECTORS.uniformsPerBatch;
            }
            this._vertexShaderTemplate = vertexShaderTemplate;
            this._fragmentShaderTemplate = fragmentShaderTemplate;
            this._uniforms = uniforms;
            this._templateInjectors = templateInjectors;
            /**
             * Disable vertex shader templates to speed up shader
             * generation.
             *
             * @member {Boolean}
             */
            this.disableVertexShaderTemplate = disableVertexShaderTemplate;
            /**
             * Maps the stringifed state of the batch renderer to the
             * generated shader.
             *
             * @private
             * @member {Object.<String, PIXI.Shader>}
             */
            this._cache = {};
            /**
             * Unstringifed current state of the batch renderer.
             *
             * @private
             * @member {Object.<String, String>}
             * @see {PIXI.brend.ShaderGenerator#_generateInjectorBasedState}
             */
            this._cState = null;
        }
        /**
         * This essentially returns a function for generating the shader for a batch
         * renderer.
         *
         * @return shader function that can be given to the batch renderer
         */
        derive() {
            return (batchRenderer) => {
                const stringState = this._generateInjectorBasedState(batchRenderer);
                const cachedShader = this._cache[stringState];
                if (cachedShader) {
                    return cachedShader;
                }
                return this._generateShader(stringState, batchRenderer);
            };
        }
        _generateInjectorBasedState(batchRenderer) {
            let state = '';
            const cState = this._cState = {};
            for (const injectorMacro in this._templateInjectors) {
                const val = this._templateInjectors[injectorMacro](batchRenderer);
                state += val;
                cState[injectorMacro] = val;
            }
            return state;
        }
        _generateShader(stringState, renderer) {
            let vertexShaderTemplate = this._vertexShaderTemplate.slice(0);
            let fragmentShaderTemplate = this._fragmentShaderTemplate.slice(0);
            for (const injectorTemplate in this._cState) {
                if (!this.disableVertexShaderTemplate) {
                    vertexShaderTemplate = _replaceAll(vertexShaderTemplate, injectorTemplate, this._cState[injectorTemplate]);
                }
                fragmentShaderTemplate = _replaceAll(fragmentShaderTemplate, injectorTemplate, this._cState[injectorTemplate]);
            }
            const shader = PIXI.Shader.from(vertexShaderTemplate, fragmentShaderTemplate, this._uniforms);
            const textures = new Array(renderer.MAX_TEXTURES);
            for (let i = 0; i < textures.length; i++) {
                textures[i] = i;
            }
            shader.uniforms.uSamplers = textures;
            this._cache[stringState] = shader;
            return shader;
        }
    }

    /**
     * Allows usage of uniforms when rendering display-objects in batches. It expects you to
     * aggregate each display-object's uniforms in an array and that the shader will pick
     * the appropriate uniform at runtime (an index into the uniforms array will be passed).
     *
     * **Usage in shader:**
     * ```
     * // Your display-objects' affine transforms are aggregated into this array.
     * uniform mat3d affineTransform[];
     *
     * // For WebGL1+ machines, your uniforms may be fetched by the uniform-ID attrib (float).
     * varying float vUniformID;
     *
     * // For WebGL-2 only, to prevent interpolation overhead, you may use the flat in variables. You
     * // can configure this in AggregateUniformShaderFactory.
     * flat in int uniformID;
     * ```
     *
     * # No Aggregation Mode
     *
     * Aggregating uniforms into arrays requries a uniform-ID attribute to be uploaded as well. This
     * may cost a lot of memory if your uniforms don't really change a lot. For these cases, you can
     * disable uniform aggregation by not passing a `uniformIDAttrib`. This will make batches **only**
     * have one value for each uniform. The uniforms will still be uploaded as 1-element arrays, however.
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.brend.StdBatch
     */
    class AggregateUniformsBatch extends StdBatch {
        constructor(renderer, geometryOffset) {
            super(geometryOffset);
            /**
             * Renderer holding the uniform redirects
             * @member {PIXI.brend.BatchRenderer}
             */
            this.renderer = renderer;
            /**
             * The buffer of uniform arrays of the display-objects
             * @member {Object<string, Array<UniformGroup>>}
             */
            this.uniformBuffer = null;
            /**
             * Array mapping the in-batch ID to the uniform ID.
             * @member {Array<number>}
             */
            this.uniformMap = null;
            /**
             * No. of uniforms buffered (per uniform name)
             * @member {number}
             */
            this.uniformLength = 0;
        }
        /**
         * @param {PIXI.Renderer} renderer
         * @override
         */
        upload(renderer) {
            super.upload(renderer);
            const { _uniformRedirects: uniformRedirects, _shader: shader } = this.renderer;
            for (let i = 0, j = uniformRedirects.length; i < j; i++) {
                const glslIdentifer = uniformRedirects[i].glslIdentifer;
                shader.uniforms[glslIdentifer] = this.uniformBuffer[glslIdentifer];
            }
            //        shader.uniformGroup.update();
        }
        /**
         * @override
         */
        reset() {
            super.reset();
            for (const uniformName in this.uniformBuffer) {
                this.uniformBuffer[uniformName].length = 0;
            }
        }
    }

    /**
     * Factory for producing aggregate-uniforms batches. This is useful for shaders that
     * **must** use uniforms.
     *
     * @memberof PIXI.brend.AggregateUniformsBatchFactory
     */
    class AggregateUniformsBatchFactory extends StdBatchFactory {
        constructor(renderer) {
            super(renderer);
            /**
             * The max. uniforms until the batch is filled
             * @member {number}
             * @readonly
             */
            // Max. no. of uniforms that can be passed to the batch shader. We divide by four because
            // mat4d/vec4 count as four uniforms.
            this.MAX_UNIFORMS = Math.floor(Math.min(renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_VERTEX_UNIFORM_VECTORS), renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_FRAGMENT_UNIFORM_VECTORS))
                / (4 * renderer._uniformRedirects.length));
            this.uniformBuffer = this._createUniformBuffer();
            this.uniformMap = [];
            this.uniformLength = 0;
        }
        /**
         * @returns {AggregateUniformsBatch}
         */
        _newBatch() {
            const batch = new AggregateUniformsBatch(this._renderer);
            // All pooled batches will have a buffer
            batch.uniformBuffer = this._createUniformBuffer();
            batch.uniformMap = [];
            return batch;
        }
        /**
         * Stores uniforms in the current batch, if possible.
         *
         * If you want to override this, be sure to return beforehand if `super._put` returns
         * false:
         * ```
         * _put(displayObject: PIXI.DisplayObject): boolean
         * {
         *      if (!super._put(displayObject))
         *      {
         *          return false;
         *      }
         *
         *      // Your logic ...
         * }
         * ```
         *
         * @protected
         * @param {PIXI.DisplayObject} displayObject
         * @returns {boolean} - whether uniforms can be buffered
         */
        _put(displayObject) {
            if (!this._renderer._uniformIDAttrib) {
                // No aggregation mode! If uniforms already buffered, they **must** match or batch will break.
                if (this.uniformLength > 0) {
                    const id = this._matchUniforms(displayObject);
                    if (id > 0) {
                        return true;
                    }
                    return false;
                }
            }
            if (this.uniformLength + 1 >= this.MAX_UNIFORMS) {
                return false;
            }
            if (this._renderer._uniformIDAttrib) {
                const id = this._matchUniforms(displayObject);
                if (id > 0) {
                    this.uniformMap.push(id);
                    return true;
                }
            }
            // Push each uniform into the buffer
            for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
                const uniformRedirect = this._renderer._uniformRedirects[i];
                const { source, glslIdentifer } = uniformRedirect;
                this.uniformBuffer[glslIdentifer].push(typeof source === 'string'
                    ? displayObject[source] : source(displayObject));
            }
            this.uniformMap.push(this.uniformLength);
            ++this.uniformLength;
            return true;
        }
        /**
         * @protected
         * @param {AggregateUniformBatch} batch
         */
        _buildBatch(batch) {
            super._buildBatch(batch);
            const buffer = batch.uniformBuffer;
            const map = batch.uniformMap;
            batch.uniformBuffer = this.uniformBuffer;
            batch.uniformMap = this.uniformMap;
            batch.uniformLength = this.uniformLength;
            // Swap & reset instead of new allocation
            this.uniformBuffer = buffer;
            this.uniformMap = map;
            this.uniformLength = 0;
            this._resetUniformBuffer(this.uniformBuffer);
            this.uniformMap.length = 0;
        }
        /**
         * Creates an array for each uniform-name in an object.
         *
         * @returns - the object created (the uniform buffer)
         */
        _createUniformBuffer() {
            const buffer = {};
            for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
                const uniformRedirect = this._renderer._uniformRedirects[i];
                buffer[uniformRedirect.glslIdentifer] = [];
            }
            return buffer;
        }
        /**
         * Resets each array in the uniform buffer
         * @param {object} buffer
         */
        _resetUniformBuffer(buffer) {
            for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
                const uniformRedirect = this._renderer._uniformRedirects[i];
                buffer[uniformRedirect.glslIdentifer].length = 0;
            }
        }
        /**
         * Finds a matching set of uniforms in the buffer.
         */
        _matchUniforms(displayObject) {
            const uniforms = this._renderer._uniformRedirects;
            for (let i = this.uniformLength - 1; i >= 0; i--) {
                let isMatch = true;
                for (let k = 0, n = uniforms.length; k < n; k++) {
                    const { glslIdentifer, source } = uniforms[k];
                    const value = typeof source === 'string'
                        ? displayObject[source]
                        : source(displayObject);
                    if (!this._compareUniforms(value, this.uniformBuffer[glslIdentifer][i])) {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch) {
                    return i;
                }
            }
            return -1;
        }
        // Compares two uniforms u1 & u2 for equality.
        _compareUniforms(u1, u2) {
            if (u1 === u2) {
                return true;
            }
            // UniformGroups must have referential equality
            if (u1.group || u2.group) {
                return false;
            }
            // Allow equals() method for custom stuff.
            if (u1.equals) {
                return u1.equals(u2);
            }
            // Test one-depth equality for arrays
            if (Array.isArray(u1) && Array.isArray(u2)) {
                if (u1.length !== u2.length) {
                    return false;
                }
                for (let i = 0, j = u1.length; i < j; i++) {
                    // Referential equality for array elements
                    if (u1[i] !== u2[i]) {
                        return false;
                    }
                }
                return true;
            }
            if (u1 instanceof PIXI.Point && u2 instanceof PIXI.Point) {
                return u1.x === u2.x && u1.y === u2.y;
            }
            if (u1 instanceof PIXI.Matrix && u2 instanceof PIXI.Matrix) {
                return u1.a === u2.a && u1.b === u2.b
                    && u1.c === u2.c && u1.d === u2.d
                    && u1.tx === u2.tx && u1.ty === u2.ty;
            }
            // Unlikely for batch rendering
            if (u1 instanceof PIXI.BaseTexture && u2 instanceof PIXI.BaseTexture) {
                return u1.uid === u2.uid;
            }
            return true;
        }
    }

    /**
     * @memberof PIXI
     * @namespace brend
     * @example
     * // ES6 import
     * import * as brend from 'pixi-batch-renderer';
     * const { BatchRendererPluginFactory } = brend;
     * @example
     * // CommonJS require
     * const brend = require('pixi-batch-renderer');
     * const BatchRendererPluginFactory = brend.BatchRendererPluginFactory;
     */
    /**
     * Used by `PIXI.brend.BatchGeometryFactory` to merge the geometry of a
     * display-object into the whole batch's geometry.
     *
     * @memberof PIXI.brend#
     * @function IGeometryMerger
     * @param {PIXI.DisplayObject} displayObject
     * @param {PIXI.brend.BatchGeometryFactory} factory
     * @see PIXI.brend.BatchGeometryFactory#geometryMerger
     */
    /**
     * @function
     * @name InjectorFunction
     * @memberof PIXI.brend
     *
     * @param {PIXI.brend.BatchRenderer} batchRenderer
     * @return {string} value of the macro for this renderer
     */

    exports.AggregateUniformsBatch = AggregateUniformsBatch;
    exports.AggregateUniformsBatchFactory = AggregateUniformsBatchFactory;
    exports.AttributeRedirect = AttributeRedirect;
    exports.Batch = StdBatch;
    exports.BatchGenerator = StdBatchFactory;
    exports.BatchRenderer = BatchRenderer;
    exports.BatchRendererPluginFactory = BatchRendererPluginFactory;
    exports.BatchShaderFactory = BatchShaderFactory;
    exports.GeometryPacker = BatchGeometryFactory;
    exports.Redirect = Redirect;
    exports.UniformRedirect = UniformRedirect;

    return exports;

}({}, PIXI));
Object.assign(this.PIXI.brend, __batch_renderer);
//# sourceMappingURL=pixi-batch-renderer.js.map
