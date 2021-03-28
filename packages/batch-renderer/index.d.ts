import type { BaseTexture } from '@pixi/core';
import { Buffer as Buffer_2 } from '@pixi/core';
import type { DisplayObject } from '@pixi/display';
import { Geometry } from '@pixi/core';
import { ObjectRenderer } from '@pixi/core';
import type { Renderer } from '@pixi/core';
import { Shader } from '@pixi/core';
import type { State } from '@pixi/core';
import type { TYPES } from '@pixi/constants';
import type { UniformGroup } from '@pixi/core';
import { ViewableBuffer } from '@pixi/core';

export declare class AggregateUniformsBatch extends Batch {
    renderer: BatchRenderer;
    uniformBuffer: {
        [id: string]: Array<UniformGroup>;
    };
    uniformMap: Array<number>;
    uniformLength: number;
    constructor(renderer: BatchRenderer, geometryOffset?: number);
    upload(renderer: Renderer): void;
    reset(): void;
}

export declare class AggregateUniformsBatchFactory extends BatchGenerator {
    MAX_UNIFORMS: number;
    protected uniformBuffer: {
        [id: string]: Array<UniformGroup>;
    };
    protected uniformMap: Array<number>;
    protected uniformLength: number;
    constructor(renderer: BatchRenderer);
    _newBatch(): AggregateUniformsBatch;
    protected _put(displayObject: DisplayObject): boolean;
    _buildBatch(batch: any): void;
    private _createUniformBuffer;
    private _resetUniformBuffer;
    private _matchUniforms;
    private _compareUniforms;
}

export declare class AttributeRedirect extends Redirect {
    type: string;
    size: number | '%notarray%';
    glType: TYPES;
    glSize: number;
    normalize: boolean;
    properSize: number;
    constructor(options: IAttributeRedirectOptions);
    static vertexSizeFor(attributeRedirects: Array<AttributeRedirect>): number;
}

export declare class Batch {
    geometryOffset: number;
    uidMap: any;
    state: State;
    batchBuffer: Array<DisplayObject>;
    textureBuffer: Array<BaseTexture>;
    constructor(geometryOffset?: number);
    upload(renderer: Renderer): void;
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
    _batchBuffer: Array<DisplayObject>;
    protected _state: State;
    protected _textureBuffer: any;
    protected _textureBufferLength: number;
    protected _textureIndexedBuffer: Array<BaseTexture>;
    protected _textureIndexMap: any;
    protected _batchPool: any[];
    protected _batchCount: number;
    protected _putTexture: any;
    constructor(renderer: BatchRenderer);
    put(targetObject: DisplayObject, state: State): boolean;
    build(geometryOffset: number): void;
    ready(): boolean;
    reset(): void;
    access(): any[];
    size(): number;
    protected _put(displayObject: DisplayObject): boolean;
    protected _newBatch(): any;
    protected _nextBatch(geometryOffset?: number): any;
    protected _buildBatch(batch: any): void;
    private _putSingleTexture;
    private _putAllTextures;
}

export declare class BatchGeometry extends Geometry {
    attribBuffer: Buffer_2;
    indexBuffer: Buffer_2;
    constructor(attributeRedirects: AttributeRedirect[], hasIndex: boolean, texIDAttrib: string, texturesPerObject: number, inBatchIDAttrib: string, uniformIDAttrib: string, masterIDAttrib: string, attributeBuffer?: Buffer_2, indexBuffer?: Buffer_2);
}

export declare class BatchGeometryFactory extends IBatchGeometryFactory {
    _targetCompositeAttributeBuffer: ViewableBuffer;
    _targetCompositeIndexBuffer: Uint16Array;
    _aIndex: number;
    _iIndex: number;
    _attribRedirects: AttributeRedirect[];
    _indexProperty: string;
    _vertexCountProperty: string | number | ((object: DisplayObject) => number);
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
    protected _aBuffers: ViewableBuffer[];
    protected _iBuffers: Uint16Array[];
    protected _geometryPool: Array<Geometry>;
    _geometryMerger: (displayObject: DisplayObject, factory: BatchGeometryFactory) => void;
    constructor(renderer: BatchRenderer);
    init(verticesBatched: number, indiciesBatched?: number): void;
    append(targetObject: DisplayObject, batch_: any): void;
    build(): Geometry;
    release(geom: Geometry): void;
    protected get geometryMerger(): (displayObject: DisplayObject, factory: BatchGeometryFactory) => void;
    protected set geometryMerger(func: (displayObject: DisplayObject, factory: BatchGeometryFactory) => void);
    get _indexCountProperty(): Resolvable<number>;
    protected getAttributeBuffer(size: number): ViewableBuffer;
    protected getIndexBuffer(size: number): Uint16Array;
}

export declare class BatchRenderer extends ObjectRenderer {
    renderer: Renderer;
    readonly _attribRedirects: AttributeRedirect[];
    readonly _indexProperty: string;
    readonly _indexCountProperty: string | number | ((object: DisplayObject) => number);
    readonly _vertexCountProperty: string | number | ((object: DisplayObject) => number);
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
    _objectBuffer: DisplayObject[];
    _bufferedVertices: number;
    _bufferedIndices: number;
    _shader: Shader;
    MAX_TEXTURES: number;
    protected readonly _BatchFactoryClass: typeof BatchGenerator;
    protected readonly _BatchGeometryFactoryClass: typeof BatchGeometryFactory;
    protected readonly _BatchDrawerClass: typeof BatchDrawer;
    protected readonly options: any;
    constructor(renderer: Renderer, options: IBatchRendererOptions);
    contextChange(): void;
    start(): void;
    render(displayObject: DisplayObject): void;
    flush(): void;
    stop(): void;
    protected calculateVertexCount(object: DisplayObject): number;
    protected calculateIndexCount(object: DisplayObject): number;
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
    derive(): (brend: BatchRenderer) => Shader;
    protected _generateInjectorBasedState(batchRenderer: BatchRenderer): string;
    protected _generateShader(stringState: string, renderer: BatchRenderer): Shader;
}

export declare class BufferPool<T extends ArrayLike<any>> {
    private _bufferPools;
    private _bufferType;
    constructor(bufferType: {
        new (size: number): ArrayLike<any>;
    });
    allocateBuffer(size: number): T;
    releaseBuffer(buffer: T): void;
}

export declare interface IAttributeRedirectOptions {
    source: string | ((db: DisplayObject) => any);
    attrib: string;
    type: string;
    size?: number | '%notarray%';
    glType: number;
    glSize: number;
    normalize?: boolean;
}

export declare abstract class IBatchGeometryFactory {
    protected _renderer: BatchRenderer;
    constructor(renderer: BatchRenderer);
    abstract init(verticesBatched: number, indiciesBatched: number): void;
    abstract append(displayObject: DisplayObject, batch: any): void;
    abstract build(): Geometry;
    abstract release(geom: Geometry): void;
}

export declare interface IBatchRendererOptions {
    attribSet: AttributeRedirect[];
    indexProperty: string;
    indexCountProperty?: string | number | ((object: DisplayObject) => number);
    vertexCountProperty?: string | number | ((object: DisplayObject) => number);
    textureProperty: string;
    texturesPerObject?: number;
    texIDAttrib: string;
    inBatchIDAttrib?: string;
    masterIDAttrib?: string;
    stateFunction?: (renderer: DisplayObject) => State;
    shaderFunction: (renderer: BatchRenderer) => Shader;
    BatchFactoryClass?: typeof BatchGenerator;
    BatchGeometryFactoryClass?: typeof BatchGeometryFactory;
    BatchDrawerClass?: typeof BatchDrawer;
    uniformSet?: UniformRedirect[];
    uniformIDAttrib?: string;
}

export declare interface IBatchRendererStdOptions {
    attribSet: AttributeRedirect[];
    vertexCountProperty?: string | number | ((object: DisplayObject) => number);
    indexCountProperty?: string | number | ((object: DisplayObject) => number);
    indexProperty: string;
    textureProperty: string;
    texturesPerObject?: number;
    texIDAttrib: string;
    inBatchIDAttrib?: string;
    styleIDAttrib?: string;
    stateFunction?: (brend: DisplayObject) => any;
    shaderFunction: (brend: BatchRenderer) => any;
    BatchFactoryClass?: typeof BatchGenerator;
    BatchRendererClass?: typeof BatchRenderer;
    BatchGeometryFactoryClass?: typeof BatchGeometryFactory;
    BatchDrawerClass?: typeof BatchDrawer;
    uniformSet?: UniformRedirect[];
    uniformIDAttrib?: string;
}

export declare interface IUniformRedirectOptions {
    source: string | ((displayObject: DisplayObject) => any);
    uniform: string;
}

export declare abstract class Redirect {
    source: string | ((displayObject: DisplayObject, renderer: BatchRenderer) => any);
    glslIdentifer: string;
    constructor(source: string | ((displayObject: DisplayObject) => any), glslIdentifer: string);
}

export declare type Resolvable<T> = string | T | ((object: DisplayObject, renderer: BatchRenderer) => T);

export declare class UniformRedirect extends Redirect {
    constructor(options: IUniformRedirectOptions);
}

export { }
