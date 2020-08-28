import * as PIXI_2 from 'pixi.js';
import { UniformGroup } from 'pixi.js';

export declare class AggregateUniformsBatch extends Batch {
    renderer: BatchRenderer;
    uniformBuffer: {
        [id: string]: Array<UniformGroup>;
    };
    uniformMap: Array<number>;
    uniformLength: number;
    constructor(renderer: BatchRenderer, geometryOffset?: number);
    upload(renderer: PIXI.Renderer): void;
    reset(): void;
}

export declare class AggregateUniformsBatchFactory extends BatchGenerator {
    MAX_UNIFORMS: number;
    protected uniformBuffer: {
        [id: string]: Array<PIXI_2.UniformGroup>;
    };
    protected uniformMap: Array<number>;
    protected uniformLength: number;
    constructor(renderer: BatchRenderer);
    _newBatch(): AggregateUniformsBatch;
    protected _put(displayObject: PIXI_2.DisplayObject): boolean;
    _buildBatch(batch: any): void;
    private _createUniformBuffer;
    private _resetUniformBuffer;
    private _matchUniforms;
    private _compareUniforms;
}

export declare class AttributeRedirect extends Redirect {
    type: string;
    size: number | '%notarray%';
    glType: PIXI_2.TYPES;
    glSize: number;
    normalize: boolean;
    properSize: number;
    constructor(options: IAttributeRedirectOptions);
    static vertexSizeFor(attributeRedirects: Array<AttributeRedirect>): number;
}

export declare class Batch {
    geometryOffset: number;
    uidMap: any;
    state: PIXI_2.State;
    batchBuffer: Array<PIXI_2.DisplayObject>;
    textureBuffer: Array<PIXI_2.BaseTexture>;
    constructor(geometryOffset?: number);
    upload(renderer: PIXI_2.Renderer): void;
    reset(): void;
}

export declare class BatchDrawer {
    renderer: BatchRenderer;
    constructor(renderer: BatchRenderer);
    draw(): void;
}

export declare class BatchGenerator {
    protected _renderer: BatchRenderer;
    protected _textureCount: number;
    protected _textureLimit: number;
    protected _textureProperty: string;
    _batchBuffer: Array<PIXI.DisplayObject>;
    protected _state: PIXI.State;
    protected _textureBuffer: any;
    protected _textureBufferLength: number;
    protected _textureIndexedBuffer: Array<PIXI.BaseTexture>;
    protected _textureIndexMap: any;
    protected _batchPool: any[];
    protected _batchCount: number;
    protected _putTexture: any;
    constructor(renderer: BatchRenderer);
    put(targetObject: PIXI.DisplayObject, state: PIXI.State): boolean;
    build(geometryOffset: number): void;
    ready(): boolean;
    reset(): void;
    access(): any[];
    size(): number;
    protected _put(displayObject: PIXI.DisplayObject): boolean;
    protected _newBatch(): any;
    protected _nextBatch(geometryOffset?: number): any;
    protected _buildBatch(batch: any): void;
    private _putSingleTexture;
    private _putAllTextures;
}

export declare class BatchGeometry extends PIXI_2.Geometry {
    attribBuffer: PIXI_2.Buffer;
    indexBuffer: PIXI_2.Buffer;
    constructor(attributeRedirects: AttributeRedirect[], hasIndex: boolean, texIDAttrib: string, texturesPerObject: number, inBatchIDAttrib: string, uniformIDAttrib: string, masterIDAttrib: string, attributeBuffer?: PIXI_2.Buffer, indexBuffer?: PIXI_2.Buffer);
}

export declare class BatchGeometryFactory extends IBatchGeometryFactory {
    _targetCompositeAttributeBuffer: PIXI_2.ViewableBuffer;
    _targetCompositeIndexBuffer: Uint16Array;
    _aIndex: number;
    _iIndex: number;
    _attribRedirects: AttributeRedirect[];
    _indexProperty: string;
    _vertexCountProperty: string | number;
    _vertexSize: number;
    _texturesPerObject: number;
    _textureProperty: string;
    _texIDAttrib: string;
    _inBatchIDAttrib: string;
    _inBatchID: number;
    _uniformIDAttrib: string;
    _uniformID: number;
    _masterIDAttrib: string;
    protected _texID: number | number[];
    protected _aBuffers: PIXI_2.ViewableBuffer[];
    protected _iBuffers: Uint16Array[];
    protected _geometryPool: Array<PIXI_2.Geometry>;
    _geometryMerger: (displayObject: PIXI_2.DisplayObject, factory: BatchGeometryFactory) => void;
    constructor(renderer: BatchRenderer);
    init(verticesBatched: number, indiciesBatched?: number): void;
    append(targetObject: PIXI_2.DisplayObject, batch_: any): void;
    build(): PIXI_2.Geometry;
    release(geom: PIXI_2.Geometry): void;
    protected get geometryMerger(): (displayObject: PIXI_2.DisplayObject, factory: BatchGeometryFactory) => void;
    protected set geometryMerger(func: (displayObject: PIXI_2.DisplayObject, factory: BatchGeometryFactory) => void);
    protected getAttributeBuffer(size: number): PIXI_2.ViewableBuffer;
    protected getIndexBuffer(size: number): Uint16Array;
}

export declare class BatchRenderer extends PIXI_2.ObjectRenderer {
    readonly _attribRedirects: AttributeRedirect[];
    readonly _indexProperty: string;
    readonly _vertexCountProperty: string | number;
    readonly _textureProperty: string;
    readonly _texturesPerObject: number;
    readonly _texIDAttrib: string;
    readonly _inBatchIDAttrib: string;
    readonly _stateFunction: Function;
    readonly _shaderFunction: Function;
    readonly _uniformRedirects: UniformRedirect[];
    readonly _uniformIDAttrib: string;
    readonly _masterIDAttrib: string;
    _batchFactory: BatchGenerator;
    _geometryFactory: BatchGeometryFactory;
    _drawer: BatchDrawer;
    _objectBuffer: PIXI_2.DisplayObject[];
    _bufferedVertices: number;
    _bufferedIndices: number;
    _shader: PIXI_2.Shader;
    MAX_TEXTURES: number;
    protected readonly _BatchFactoryClass: typeof BatchGenerator;
    protected readonly _BatchGeometryFactoryClass: typeof BatchGeometryFactory;
    protected readonly _BatchDrawerClass: typeof BatchDrawer;
    protected readonly options: any;
    constructor(renderer: PIXI_2.Renderer, options: IBatchRendererOptions);
    contextChange(): void;
    start(): void;
    render(displayObject: PIXI_2.DisplayObject): void;
    flush(): void;
    stop(): void;
    protected _vertexCountFor(targetObject: PIXI_2.DisplayObject): number;
}

export declare class BatchRendererPluginFactory {
    static from(options: IBatchRendererStdOptions): typeof BatchRenderer;
}

export declare class BatchShaderFactory {
    protected _vertexShaderTemplate: string;
    protected _fragmentShaderTemplate: string;
    protected _uniforms: any;
    protected _templateInjectors: any;
    protected disableVertexShaderTemplate: boolean;
    protected _cache: any;
    protected _cState: any;
    constructor(vertexShaderTemplate: string, fragmentShaderTemplate: string, uniforms?: {}, templateInjectors?: any, disableVertexShaderTemplate?: boolean);
    derive(): (brend: BatchRenderer) => PIXI_2.Shader;
    protected _generateInjectorBasedState(batchRenderer: BatchRenderer): string;
    protected _generateShader(stringState: string, renderer: BatchRenderer): PIXI_2.Shader;
}

export declare class BufferPool<T extends ArrayLike<number>> {
    private _bufferPools;
    private _bufferType;
    constructor(bufferType: {
        new (size: number): ArrayLike<number>;
    });
    allocateBuffer(size: number): T;
    releaseBuffer(buffer: T): void;
}

declare interface IAttributeRedirectOptions {
    source: string | ((db: PIXI_2.DisplayObject, renderer: BatchRenderer) => any);
    attrib: string;
    type: string;
    size?: number | '%notarray%';
    glType: number;
    glSize: number;
    normalize?: boolean;
}

declare abstract class IBatchGeometryFactory {
    protected _renderer: BatchRenderer;
    constructor(renderer: BatchRenderer);
    abstract init(verticesBatched: number, indiciesBatched: number): void;
    abstract append(displayObject: PIXI_2.DisplayObject, batch: any): void;
    abstract build(): PIXI_2.Geometry;
    abstract release(geom: PIXI_2.Geometry): void;
}

declare interface IBatchRendererOptions {
    attribSet: AttributeRedirect[];
    indexProperty: string;
    vertexCountProperty?: string | number;
    textureProperty: string;
    texturesPerObject?: number;
    texIDAttrib: string;
    inBatchIDAttrib?: string;
    masterIDAttrib?: string;
    stateFunction?: (renderer: PIXI_2.DisplayObject) => PIXI_2.State;
    shaderFunction: (renderer: BatchRenderer) => PIXI_2.Shader;
    BatchFactoryClass?: typeof BatchGenerator;
    BatchGeometryFactoryClass?: typeof BatchGeometryFactory;
    BatchDrawerClass?: typeof BatchDrawer;
    uniformSet?: UniformRedirect[];
    uniformIDAttrib?: string;
}

declare interface IBatchRendererStdOptions {
    attribSet: AttributeRedirect[];
    vertexCountProperty?: string | number;
    indexProperty: string;
    textureProperty: string;
    texturesPerObject?: number;
    texIDAttrib: string;
    inBatchIDAttrib?: string;
    styleIDAttrib?: string;
    stateFunction?: (brend: PIXI_2.DisplayObject) => any;
    shaderFunction: (brend: BatchRenderer) => any;
    BatchFactoryClass?: typeof BatchGenerator;
    BatchRendererClass?: typeof BatchRenderer;
    BatchGeometryFactoryClass?: typeof BatchGeometryFactory;
    BatchDrawerClass?: typeof BatchDrawer;
    uniformSet?: UniformRedirect[];
    uniformIDAttrib?: string;
}

declare interface IUniformRedirectOptions {
    source: string | ((displayObject: PIXI_2.DisplayObject, renderer: BatchRenderer) => any);
    uniform: string;
}

export declare abstract class Redirect {
    source: string | ((displayObject: PIXI_2.DisplayObject, source: BatchRenderer) => any);
    glslIdentifer: string;
    constructor(source: string | ((displayObject: PIXI_2.DisplayObject, source: BatchRenderer) => any), glslIdentifer: string);
}

export declare class UniformRedirect extends Redirect {
    constructor(options: IUniformRedirectOptions);
}

export { }
