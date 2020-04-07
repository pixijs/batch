import { Batch } from './Batch';
import { BatchGenerator } from './BatchGenerator';
import { GeometryPacker } from './GeometryPacker';
import * as PIXI from 'pixi.js';
import { resolveConstantOrProperty, resolveFunctionOrProperty } from './resolve';
import { AttributeRedirect } from './redirects/AttributeRedirect';

/**
 * This object renderer renders multiple display-objects in batches. It can greatly
 * reduce the number of draw calls issued per frame.
 *
 * ## Batch Rendering Pipeline
 *
 * The batch rendering pipeline consists of the following stages:
 *
 * * **Display-object buffering**: Each display-object is kept in a buffer until it fills
 * up or a flush is required.
 *
 * * **Geometry compositing**: The geometries of each display-object are merged together
 * in one interleaved composite geometry.
 *
 * * **Batch accumulation**: In a sliding window, display-object batches are generated based
 * off of certain constraints like GPU texture units and the uniforms used in each display-object.
 *
 * * **Rendering**: Each batch is rendered in-order using `gl.draw*`. The textures and
 * uniforms of each display-object are uploaded as arrays.
 *
 * ## Shaders
 *
 * ### Shader templates
 *
 * Since the max. display-object count per batch is not known until the WebGL context is created,
 * shaders are generated at runtime by processing shader templates. A shader templates has "%macros%"
 * that are replaced by constants at runtime.
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
 *          renderer.plugins['ExampleBatchRenderer'].render(this);
 *     }
 * }
 */
export class BatchRenderer extends PIXI.ObjectRenderer
{
    _attributeRedirects: AttributeRedirect[];
    _indexProperty: string;
    _vertexCountProperty: string | number;
    _textureProperty: string;
    _texturePerObject: number;
    _textureAttribute: string;
    _stateFunction: Function;
    _shaderFunction: Function;

    _BatchGeneratorClass: typeof BatchGenerator;
    _batchGenerator: BatchGenerator;

    _packer: GeometryPacker;
    _geom: PIXI.Geometry;

    _objectBuffer: PIXI.DisplayObject[];
    _bufferedVertices: number;
    _bufferedIndices: number;

    _shader: PIXI.Shader;

    _batchPool: Array<Batch>;
    _batchCount: number;

    MAX_TEXTURES: number;

    /**
     * Creates a batch renderer the renders display-objects with the described
     * geometry.
     *
     * To register a batch-renderer plugin, you must use the API provided by
     * `PIXI.brend.BatchRendererPluginFactory`.
     *
     * @param {PIXI.Renderer} renderer - renderer to attach to
     * @param {PIXI.brend.AttributeRedirect[]} attributeRedirects
     * @param {string | null} indexProperty
     * @param {string | number} vertexCountProperty
     * @param {string | null} textureProperty
     * @param {number} texturePerObject
     * @param {string} textureAttribute - name of texture-id attribute variable
     * @param {Function} stateFunction - returns a {PIXI.State} for an object
     * @param {Function} shaderFunction - generates a shader given this instance
     * @param {PIXI.brend.GeometryPacker} [packer=new PIXI.brend.GeometryPacker]
     * @param {Class} [BatchGeneratorClass=PIXI.brend.BatchGenerator]
     * @see PIXI.brend.ShaderGenerator
     */
    constructor(// eslint-disable-line max-params
        renderer: PIXI.Renderer,
        attributeRedirects: AttributeRedirect[],
        indexProperty: string,
        vertexCountProperty: string | number,
        textureProperty: string,
        texturePerObject: number,
        textureAttribute: string,
        stateFunction: (renderer: BatchRenderer) => PIXI.State,
        shaderFunction: (renderer: BatchRenderer) => PIXI.Shader,
        packer = new GeometryPacker(
            attributeRedirects,
            indexProperty,
            vertexCountProperty, // auto-calculate
            undefined,
            texturePerObject,
        ),
        BatchGeneratorClass = BatchGenerator,
    )
    {
        super(renderer);

        this._attributeRedirects = attributeRedirects;
        this._indexProperty = indexProperty;
        this._vertexCountProperty = vertexCountProperty;
        this._textureProperty = textureProperty;
        this._texturePerObject = texturePerObject;
        this._textureAttribute = textureAttribute;
        this._stateFunction = stateFunction;
        this._shaderFunction = shaderFunction;

        this._BatchGeneratorClass = BatchGeneratorClass;
        this._batchGenerator = null;// @see this#contextChange

        // Although the runners property is not a public API, it is required to
        // handle contextChange events.
        this.renderer.runners.contextChange.add(this);

        // If the WebGL context has already been created, initialization requires a
        // syntheic call to contextChange.
        if (this.renderer.gl)
        {
            this.contextChange();
        }

        this._packer = packer;

        this._geom = BatchRenderer.generateCompositeGeometry(
            attributeRedirects,
            !!indexProperty,
            textureAttribute,
            texturePerObject);

        this._objectBuffer = [];
        this._bufferedVertices = 0;
        this._bufferedIndices = 0;
        this._shader = null;

        this._batchPool = [];// may contain garbage after _batchCount
        this._batchCount = 0;
    }

    /**
     * Internal method that is called whenever the renderer's WebGL context changes.
     */
    contextChange(): void
    {
        const gl = this.renderer.gl;

        if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY)
        {
            this.MAX_TEXTURES = 1;
        }
        else
        {
            this.MAX_TEXTURES = Math.min(
                gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
                PIXI.settings.SPRITE_MAX_TEXTURES);
        }

        this._batchGenerator = new this._BatchGeneratorClass(
            this._texturePerObject, this.MAX_TEXTURES,
            this._textureProperty, true); // NOTE: Force texture reduction

        if (!this._batchGenerator.enableTextureReduction)
        {
            throw new Error('PIXI.brend.BatchRenderer does not support '
                    + 'batch generation without texture reduction enabled.');
        }
    }

    /**
     * This is an internal method. It ensures that the batch renderer is ready
     * to start buffering display-objects. This is automatically invoked by the
     * renderer's batch system.
     *
     * @override
     */
    start(): void
    {
        this._objectBuffer.length = 0;
        this._bufferedVertices = 0;
        this._bufferedIndices = 0;

        this._shader = this._shaderFunction(this);

        if (this._shader.uniforms.uSamplers)
        {
            this._shader.uniforms.uSamplers
                = BatchRenderer.generateTextureArray(this.MAX_TEXTURES);
        }

        this.renderer.shader.bind(this._shader, false);
    }

    /**
     * Adds the display-object to be rendered in a batch.
     *
     * @param {PIXI.DisplayObject} displayObject
     * @override
     */
    render(displayObject: PIXI.DisplayObject): void
    {
        this._objectBuffer.push(displayObject);

        this._bufferedVertices += this._vertexCountFor(displayObject);

        if (this._indexProperty)
        {
            this._bufferedIndices += resolveConstantOrProperty(
                displayObject, this._indexProperty).length;
        }
    }

    /**
     * Forces buffered display-objects to be rendered immediately. This should not
     * be called unless absolutely necessary like the following scenarios:
     *
     * * before directly rendering your display-object, to preserve render-order.
     *
     * * to do a nested render pass (calling `Renderer#render` inside a `render` method)
     *   because the PixiJS renderer is not re-entrant.
     *
     * @override
     */
    flush(): void
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
        if (batchGenerator._batchBuffer.length !== 0)
        {
            batchGenerator.finalize(this._newBatch(batchStart));
        }

        // Pack each object into the composite geometry. This is done
        // after batching, so that texture-ids are generated.
        let textureId = this._texturePerObject === 1
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
        geom.$buffer.update(packer.compositeAttributes.float32View);
        geom.getIndex().update(packer.compositeIndices);
        renderer.geometry.bind(geom);
        renderer.geometry.updateBuffers();

        // Now draw each batch
        for (let i = 0; i < this._batchCount; i++)
        {
            const batch = this._batchPool[i];

            batch.upload();

            if (this._indexProperty)
            {
                gl.drawElements(gl.TRIANGLES,
                    batch.$indexCount,
                    gl.UNSIGNED_SHORT,
                    batch.geometryOffset * 2);// * 2 cause Uint16 indices
            }
            else
            {
                gl.drawArrays(gl.TRIANGLES,
                    batch.geometryOffset,
                    batch.$vertexCount);// TODO: *vertexSize
            }

            batch.reset();
        }
    }

    /**
     * Internal method that stops buffering of display-objects and flushes any existing
     * buffers.
     *
     * @override
     */
    stop(): void
    {
        if (this._bufferedVertices)
        {
            this.flush();
        }
    }

    protected _newBatch(batchStart: number): Batch
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

    protected _vertexCountFor(targetObject: PIXI.DisplayObject): number
    {
        return (this._vertexCountProperty)
            ? resolveConstantOrProperty(targetObject, this._vertexCountProperty)
            : resolveFunctionOrProperty(targetObject,
                this._attributeRedirects[0].source).length
                    / (this._attributeRedirects[0].size as number);
    }

    /**
     * Constructs an interleaved geometry that can be used to upload a whole buffer
     * of display-object primitives at once.
     *
     * @private
     * @param {Array<PIXI.brend.AttributeRedirect>} attributeRedirects
     * @param {boolean} hasIndex - whether to include an index property
     * @param {string} textureAttribute - name of the texture-id attribute
     * @param {number} texturePerObject - no. of textures per object
     */
    static generateCompositeGeometry(
        attributeRedirects: AttributeRedirect[],
        hasIndex: boolean,
        textureAttribute: string,
        texturePerObject: number,
    ): PIXI.Geometry
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
                texturePerObject, true, PIXI.TYPES.FLOAT);
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

    /**
     * @private
     * @param {number} count
     */
    static generateTextureArray(count: number): Int32Array
    {
        const array = new Int32Array(count);

        for (let i = 0; i < count; i++)
        {
            array[i] = i;
        }

        return array;
    }
}

export default BatchRenderer;
