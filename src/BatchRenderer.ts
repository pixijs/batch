import { StdBatchFactory } from './StdBatchFactory';
import { BatchGeometryFactory } from './BatchGeometryFactory';
import * as PIXI from 'pixi.js';
import { resolveConstantOrProperty, resolveFunctionOrProperty } from './resolve';
import { AttributeRedirect } from './redirects/AttributeRedirect';

export interface IBatchRendererOptions
{
    attribSet: AttributeRedirect[];
    indexProperty: string;
    vertexCountProperty?: string | number;
    textureProperty: string;
    texturesPerObject?: number;
    texIDAttrib: string;
    stateFunction: (renderer: PIXI.DisplayObject) => PIXI.State;
    shaderFunction: (renderer: BatchRenderer) => PIXI.Shader;
    BatchFactoryClass?: typeof StdBatchFactory;
    BatchGeometryFactoryClass?: typeof BatchGeometryFactory;
}

/**
 * @memberof PIXI.brend#
 * @interface IBatchRendererOptions
 */

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
export class BatchRenderer extends PIXI.ObjectRenderer
{
    readonly _attribRedirects: AttributeRedirect[];
    readonly _indexProperty: string;
    readonly _vertexCountProperty: string | number;
    readonly _textureProperty: string;
    readonly _texturePerObject: number;
    readonly _texIDAttrib: string;
    readonly _stateFunction: Function;
    readonly _shaderFunction: Function;

    _batchFactory: StdBatchFactory;
    _geometryFactory: BatchGeometryFactory;

    _shader: PIXI.Shader;

    _objectBuffer: PIXI.DisplayObject[];
    _bufferedVertices: number;
    _bufferedIndices: number;

    MAX_TEXTURES: number;

    protected readonly _BatchFactoryClass: typeof StdBatchFactory;
    protected readonly _BatchGeometryFactoryClass: typeof BatchGeometryFactory;

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
     * @param {PIXI.brend.BatchGeometryFactory} [packer=new PIXI.brend.BatchGeome]
     * @param {Class} [BatchGeneratorClass=PIXI.brend.BatchGenerator]
     * @see PIXI.brend.ShaderGenerator
     */
    constructor(renderer: PIXI.Renderer, options: IBatchRendererOptions)
    {
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
        this._texturePerObject = typeof options.texturesPerObject !== 'undefined' ? options.texturesPerObject : 1;

        /**
         * Texture ID attribute
         * @member {string}
         * @protected
         * @readonly
         */
        this._texIDAttrib = options.texIDAttrib;

        /**
         * State generating function (takes a display-object)
         *
         * @member {Function}
         * @default () => PIXI.State.for2d()
         * @protected
         * @readonly
         */
        this._stateFunction = options.stateFunction || ((): PIXI.State => PIXI.State.for2d());

        /**
         * Shader generating function (takes the batch renderer)
         *
         * @member {Function}
         * @protected
         * @see PIXI.brend.BatchShaderFactory
         * @readonly
         */
        this._shaderFunction = options.shaderFunction;

        /**
         * Batch-factory class.
         *
         * @member {Class}
         * @protected
         * @default PIXI.brend.StdBatchFactory
         * @readonly
         */
        this._BatchFactoryClass = options.BatchFactoryClass || StdBatchFactory;

        /**
         * Batch-geometry factory class. It's constructor takes one argument - this batch
         * renderer.
         *
         * @member {Class}
         * @protected
         * @default PIXI.brend.BatchGeometryFactory
         * @readonly
         */
        this._BatchGeometryFactoryClass = options.BatchGeometryFactoryClass || BatchGeometryFactory;

        // Although the runners property is not a public API, it is required to
        // handle contextChange events.
        this.renderer.runners.contextChange.add(this);

        // If the WebGL context has already been created, initialization requires a
        // syntheic call to contextChange.
        if (this.renderer.gl)
        {
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
    contextChange(): void
    {
        const gl = this.renderer.gl;

        if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY)
        {
            this.MAX_TEXTURES = 1;
        }
        else
        {
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
            _batchFactory: batchFactory,
            _geometryFactory: geometryFactory,
            renderer,
            _stateFunction: stateFunction,
            _texturePerObject: texturePerObject,
        } = this;

        const gl = renderer.gl;
        const buffer = this._objectBuffer;
        const bufferLength = buffer.length;

        // Reset components
        batchFactory.reset();
        geometryFactory.init(this._bufferedVertices, this._bufferedIndices);

        let batchStart = 0;

        // Loop through display-objects and create batches
        for (let objectIndex = 0; objectIndex < bufferLength;)
        {
            const target = buffer[objectIndex];
            const wasPut = batchFactory.put(target, resolveFunctionOrProperty(target, stateFunction));

            if (!wasPut)
            {
                batchFactory.build(batchStart);
                batchStart = objectIndex;
            }
            else
            {
                ++objectIndex;
            }
        }

        // Generate the last batch, if required.
        if (!batchFactory.ready())
        {
            batchFactory.build(batchStart);
        }

        const batchList = batchFactory.access();
        const batchCount = batchFactory.size();

        for (let i = 0; i < batchCount; i++)// loop-per(batch)
        {
            const batch = batchList[i];
            const batchBuffer = batch.batchBuffer;
            const batchLength = batchBuffer.length;

            let vertexCount = 0;// eslint-disable-line
            let indexCount = 0;

            for (let j = 0; j < batchLength; j++)// loop-per(targetObject)
            {
                const targetObject = batchBuffer[j];

                if (this._indexProperty)
                {
                    indexCount += resolveConstantOrProperty(targetObject, this._indexProperty).length;
                }
                else
                {
                    vertexCount += resolveConstantOrProperty(targetObject, this._vertexCountProperty);
                }

                // externally-defined properties for draw calls
                batch.$vertexCount = vertexCount;
                batch.$indexCount = indexCount;

                geometryFactory.append(targetObject, batch);
            }
        }

        // Upload the geometry
        const geom = geometryFactory.build();

        renderer.geometry.bind(geom);

        // Draw each batch
        for (let i = 0; i < batchCount; i++)
        {
            const batch = batchList[i];

            batch.upload(renderer);

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

        geometryFactory.release(geom);
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

    protected _vertexCountFor(targetObject: PIXI.DisplayObject): number
    {
        return (this._vertexCountProperty)
            ? resolveConstantOrProperty(targetObject, this._vertexCountProperty)
            : resolveFunctionOrProperty(targetObject,
                this._attribRedirects[0].source).length
                    / (this._attribRedirects[0].size as number);
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
