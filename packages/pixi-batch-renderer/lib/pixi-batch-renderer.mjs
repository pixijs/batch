/*!
 * pixi-batch-renderer
 * Compiled Sun, 02 Aug 2020 18:37:54 UTC
 *
 * pixi-batch-renderer is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
import { ViewableBuffer, Geometry, Buffer, TYPES, utils, ObjectRenderer, State, settings, ENV, Shader, Point, Matrix, BaseTexture } from 'pixi.js';

class Redirect {
    constructor(source, glslIdentifer) {
        this.source = source;
        this.glslIdentifer = glslIdentifer;
    }
}

class AttributeRedirect extends Redirect {
    constructor(options) {
        super(options.source, options.attrib);
        this.type = options.type;
        this.size = options.size;
        this.properSize = (options.size === '%notarray%' || options.size === undefined) ? 1 : options.size;
        this.glType = options.glType;
        this.glSize = options.glSize;
        this.normalize = !!options.normalize;
    }
    static vertexSizeFor(attributeRedirects) {
        return attributeRedirects.reduce((acc, redirect) => (ViewableBuffer.sizeOf(redirect.type)
            * redirect.properSize)
            + acc, 0);
    }
}

class UniformRedirect extends Redirect {
    constructor(options) {
        super(options.source, options.uniform);
    }
}

class StdBatch {
    constructor(geometryOffset) {
        this.geometryOffset = geometryOffset;
        this.textureBuffer = null;
        this.uidMap = null;
        this.state = null;
    }
    upload(renderer) {
        this.textureBuffer.forEach((tex, i) => {
            renderer.texture.bind(tex, i);
        });
        renderer.state.set(this.state);
    }
    reset() {
        this.textureBuffer = this.uidMap = this.state = null;
        if (this.batchBuffer) {
            this.batchBuffer.length = 0;
        }
    }
}

class StdBatchFactory {
    constructor(renderer) {
        this._renderer = renderer;
        this._state = null;
        this._textureCount = renderer._texturesPerObject;
        this._textureProperty = renderer._textureProperty;
        this._textureLimit = renderer.MAX_TEXTURES;
        this._textureBuffer = {};
        this._textureBufferLength = 0;
        this._textureIndexedBuffer = [];
        this._textureIndexMap = {};
        this._batchBuffer = [];
        this._batchPool = [];
        this._batchCount = 0;
        if (this._textureCount === 1) {
            this._putTexture = this._putSingleTexture;
        }
        else {
            this._putTexture = this._putAllTextures;
        }
    }
    put(targetObject, state) {
        if (!this._state) {
            this._state = state;
        }
        else if (this._state.data !== state.data) {
            return false;
        }
        if (!this._put(targetObject)) {
            return false;
        }
        if (this._textureCount > 0 && !this._putTexture(targetObject[this._textureProperty])) {
            return false;
        }
        this._batchBuffer.push(targetObject);
        return true;
    }
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
    ready() {
        return this._batchBuffer.length === 0;
    }
    reset() {
        this._batchCount = 0;
    }
    access() {
        return this._batchPool;
    }
    size() {
        return this._batchCount;
    }
    _put(displayObject) {
        return true;
    }
    _newBatch() {
        return new StdBatch();
    }
    _nextBatch(geometryOffset) {
        if (this._batchCount === this._batchPool.length) {
            this._batchPool.push(this._newBatch());
        }
        const batch = this._batchPool[this._batchCount++];
        batch.reset();
        batch.geometryOffset = geometryOffset;
        return batch;
    }
    _buildBatch(batch) {
        batch.batchBuffer = this._batchBuffer;
        batch.textureBuffer = this._textureIndexedBuffer;
        batch.uidMap = this._textureIndexMap;
        batch.state = this._state;
    }
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

class BatchGeometry extends Geometry {
    constructor(attributeRedirects, hasIndex, texIDAttrib, texturesPerObject, inBatchIDAttrib, uniformIDAttrib, masterIDAttrib) {
        super();
        const attributeBuffer = new Buffer(null, false, false);
        const indexBuffer = hasIndex ? new Buffer(null, false, true) : null;
        attributeRedirects.forEach((redirect) => {
            const { glslIdentifer, glType, glSize, normalize } = redirect;
            this.addAttribute(glslIdentifer, attributeBuffer, glSize, normalize, glType);
        });
        if (!masterIDAttrib) {
            if (texIDAttrib && texturesPerObject > 0) {
                this.addAttribute(texIDAttrib, attributeBuffer, texturesPerObject, true, TYPES.FLOAT);
            }
            if (inBatchIDAttrib) {
                this.addAttribute(inBatchIDAttrib, attributeBuffer, 1, false, TYPES.FLOAT);
            }
            if (uniformIDAttrib) {
                this.addAttribute(uniformIDAttrib, attributeBuffer, 1, false, TYPES.FLOAT);
            }
        }
        else {
            this.addAttribute(masterIDAttrib, attributeBuffer, 1, false, TYPES.FLOAT);
        }
        if (hasIndex) {
            this.addIndex(indexBuffer);
        }
        this.attribBuffer = attributeBuffer;
        this.indexBuffer = indexBuffer;
    }
}
class IBatchGeometryFactory {
    constructor(renderer) {
        this._renderer = renderer;
    }
}
class BatchGeometryFactory extends IBatchGeometryFactory {
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
        this._masterIDAttrib = renderer._masterIDAttrib;
        if (!this._masterIDAttrib) {
            this._vertexSize += this._texturesPerObject * 4;
            if (this._inBatchIDAttrib) {
                this._vertexSize += 4;
            }
            if (this._uniformIDAttrib) {
                this._vertexSize += 4;
            }
        }
        else {
            this._vertexSize += 4;
        }
        if (this._texturesPerObject === 1) {
            this._texID = 0;
        }
        else if (this._texturesPerObject > 1) {
            this._texID = new Array(this._texturesPerObject);
        }
        this._aBuffers = [];
        this._iBuffers = [];
        this._geometryPool = [];
    }
    init(verticesBatched, indiciesBatched) {
        this._targetCompositeAttributeBuffer = this.getAttributeBuffer(verticesBatched);
        if (this._indexProperty) {
            this._targetCompositeIndexBuffer = this.getIndexBuffer(indiciesBatched);
        }
        this._aIndex = this._iIndex = 0;
    }
    append(targetObject, batch_) {
        const batch = batch_;
        const tex = targetObject[this._textureProperty];
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
        if (this._inBatchIDAttrib || this._uniformIDAttrib) {
            this._inBatchID = batch.batchBuffer.indexOf(targetObject);
        }
        if (this._uniformIDAttrib) {
            this._uniformID = batch.uniformMap[this._inBatchID];
        }
        this.geometryMerger(targetObject, this);
    }
    build() {
        const geom = (this._geometryPool.pop() || new BatchGeometry(this._attribRedirects, true, this._texIDAttrib, this._texturesPerObject, this._inBatchIDAttrib, this._uniformIDAttrib, this._masterIDAttrib));
        geom.attribBuffer.update(this._targetCompositeAttributeBuffer.float32View);
        geom.indexBuffer.update(this._targetCompositeIndexBuffer);
        return geom;
    }
    release(geom) {
        this._geometryPool.push(geom);
    }
    get geometryMerger() {
        if (!this._geometryMerger) {
            this._geometryMerger = new GeometryMergerFactory(this).compile();
        }
        return this._geometryMerger;
    }
    set geometryMerger(func) {
        this._geometryMerger = func;
    }
    getAttributeBuffer(size) {
        const roundedP2 = utils.nextPow2(size);
        const roundedSizeIndex = utils.log2(roundedP2);
        const roundedSize = roundedP2;
        if (this._aBuffers.length <= roundedSizeIndex) {
            this._aBuffers.length = roundedSizeIndex + 1;
        }
        let buffer = this._aBuffers[roundedSizeIndex];
        if (!buffer) {
            this._aBuffers[roundedSizeIndex] = buffer = new ViewableBuffer(roundedSize * this._vertexSize);
        }
        return buffer;
    }
    getIndexBuffer(size) {
        const roundedP2 = utils.nextPow2(Math.ceil(size / 12));
        const roundedSizeIndex = utils.log2(roundedP2);
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
const CompilerConstants = {
    INDICES_OFFSET: '__offset_indices_',
    FUNC_SOURCE_BUFFER: 'getSourceBuffer',
    packerArguments: [
        'targetObject',
        'factory',
    ],
};
const GeometryMergerFactory = class {
    constructor(packer) {
        this.packer = packer;
    }
    compile() {
        const packer = this.packer;
        let packerBody = `
            const compositeAttributes = factory._targetCompositeAttributeBuffer;
            const compositeIndices = factory._targetCompositeIndexBuffer;
            let aIndex = factory._aIndex;
            let iIndex = factory._iIndex;
            const textureId = factory._texID;
            const attributeRedirects = factory._attribRedirects;
        `;
        packer._attribRedirects.forEach((redirect, i) => {
            packerBody += `
                let __offset_${i} = 0;
                const __buffer_${i} = (
                    ${this._compileSourceBufferExpression(redirect, i)});
            `;
        });
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
        let skipByteIndexConversion = false;
        for (let i = 0; i < packer._attribRedirects.length; i++) {
            const redirect = packer._attribRedirects[i];
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
        if (!packer._masterIDAttrib) {
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
        }
        else {
            if (!skipByteIndexConversion) {
                packerBody += `
                    adjustedAIndex = aIndex / 4;
                `;
            }
            packerBody += `
                    float32View[adjustedAIndex++] = factory._masterID;
                    aIndex = adjustedAIndex * 4;
            `;
        }
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
        return new Function(...CompilerConstants.packerArguments, packerBody);
    }
    _compileSourceBufferExpression(redirect, i) {
        return (typeof redirect.source === 'string')
            ? `targetObject['${redirect.source}']`
            : `attributeRedirects[${i}].source(targetObject, factory._renderer)`;
    }
    _compileVertexCountExpression() {
        if (!this.packer._vertexCountProperty) {
            return `__buffer_0.length / ${this.packer._attribRedirects[0].size}`;
        }
        return ((typeof this.packer._vertexCountProperty === 'string')
            ? `targetObject.${this.packer._vertexCountProperty}`
            : `${this.packer._vertexCountProperty}`);
    }
    _sizeOf(i) {
        return ViewableBuffer.sizeOf(this.packer._attribRedirects[i].type);
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

class BatchDrawer {
    constructor(renderer) {
        this.renderer = renderer;
    }
    draw() {
        const { renderer, _batchFactory: batchFactory, _geometryFactory: geometryFactory, _indexProperty: indexProperty, } = this.renderer;
        const batchList = batchFactory.access();
        const batchCount = batchFactory.size();
        const geom = geometryFactory.build();
        const { gl } = renderer;
        batchList[0].upload(renderer);
        renderer.shader.bind(this.renderer._shader, false);
        renderer.geometry.bind(geom);
        for (let i = 0; i < batchCount; i++) {
            const batch = batchList[i];
            batch.upload(renderer);
            renderer.shader.bind(this.renderer._shader, false);
            if (indexProperty) {
                gl.drawElements(gl.TRIANGLES, batch.$indexCount, gl.UNSIGNED_SHORT, batch.geometryOffset * 2);
            }
            else {
                gl.drawArrays(gl.TRIANGLES, batch.geometryOffset, batch.$vertexCount);
            }
            batch.reset();
        }
        geometryFactory.release(geom);
    }
}

class BatchRenderer extends ObjectRenderer {
    constructor(renderer, options) {
        super(renderer);
        this._attribRedirects = options.attribSet;
        this._indexProperty = options.indexProperty;
        this._vertexCountProperty = options.vertexCountProperty;
        this._textureProperty = options.textureProperty;
        this._texturesPerObject = typeof options.texturesPerObject !== 'undefined' ? options.texturesPerObject : 1;
        this._texIDAttrib = options.texIDAttrib;
        this._inBatchIDAttrib = options.inBatchIDAttrib;
        this._stateFunction = options.stateFunction || (() => State.for2d());
        this._shaderFunction = options.shaderFunction;
        this._BatchFactoryClass = options.BatchFactoryClass || StdBatchFactory;
        this._BatchGeometryFactoryClass = options.BatchGeometryFactoryClass || BatchGeometryFactory;
        this._BatchDrawerClass = options.BatchDrawerClass || BatchDrawer;
        this._uniformRedirects = options.uniformSet || null;
        this._uniformIDAttrib = options.uniformIDAttrib;
        this._masterIDAttrib = options.masterIDAttrib;
        this.options = options;
        if (options.masterIDAttrib) {
            this._texIDAttrib = this._masterIDAttrib;
            this._uniformIDAttrib = this._masterIDAttrib;
            this._inBatchIDAttrib = this._masterIDAttrib;
        }
        this.renderer.runners.contextChange.add(this);
        if (this.renderer.gl) {
            this.contextChange();
        }
        this._objectBuffer = [];
        this._bufferedVertices = 0;
        this._bufferedIndices = 0;
        this._shader = null;
    }
    contextChange() {
        const gl = this.renderer.gl;
        if (settings.PREFER_ENV === ENV.WEBGL_LEGACY) {
            this.MAX_TEXTURES = 1;
        }
        else {
            this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), settings.SPRITE_MAX_TEXTURES);
        }
        this._batchFactory = new this._BatchFactoryClass(this);
        this._geometryFactory = new this._BatchGeometryFactoryClass(this);
        this._drawer = new this._BatchDrawerClass(this);
    }
    start() {
        this._objectBuffer.length = 0;
        this._bufferedVertices = 0;
        this._bufferedIndices = 0;
        this._shader = this._shaderFunction(this);
    }
    render(displayObject) {
        this._objectBuffer.push(displayObject);
        this._bufferedVertices += this._vertexCountFor(displayObject);
        if (this._indexProperty) {
            this._bufferedIndices += resolveConstantOrProperty(displayObject, this._indexProperty).length;
        }
    }
    flush() {
        const { _batchFactory: batchFactory, _geometryFactory: geometryFactory, _stateFunction: stateFunction } = this;
        const buffer = this._objectBuffer;
        const bufferLength = buffer.length;
        batchFactory.reset();
        geometryFactory.init(this._bufferedVertices, this._bufferedIndices);
        let batchStart = 0;
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
        if (!batchFactory.ready()) {
            batchFactory.build(batchStart);
        }
        const batchList = batchFactory.access();
        const batchCount = batchFactory.size();
        let indices = 0;
        for (let i = 0; i < batchCount; i++) {
            const batch = batchList[i];
            const batchBuffer = batch.batchBuffer;
            const batchLength = batchBuffer.length;
            let vertexCount = 0;
            let indexCount = 0;
            batch.geometryOffset = indices;
            for (let j = 0; j < batchLength; j++) {
                const targetObject = batchBuffer[j];
                if (this._indexProperty) {
                    indexCount += resolveConstantOrProperty(targetObject, this._indexProperty).length;
                }
                else {
                    vertexCount += resolveConstantOrProperty(targetObject, this._vertexCountProperty);
                }
                geometryFactory.append(targetObject, batch);
            }
            batch.$vertexCount = vertexCount;
            batch.$indexCount = indexCount;
            indices += batch.$indexCount;
        }
        this._drawer.draw();
    }
    stop() {
        if (this._bufferedVertices) {
            this.flush();
        }
    }
    _vertexCountFor(targetObject) {
        return (this._vertexCountProperty)
            ? resolveConstantOrProperty(targetObject, this._vertexCountProperty)
            : resolveFunctionOrProperty(targetObject, this._attribRedirects[0].source).length
                / this._attribRedirects[0].size;
    }
}

class BatchRendererPluginFactory {
    static from(options) {
        return class extends (options.BatchRendererClass || BatchRenderer) {
            constructor(renderer) {
                super(renderer, options);
            }
        };
    }
}

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
class BatchShaderFactory {
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
        this.disableVertexShaderTemplate = disableVertexShaderTemplate;
        this._cache = {};
        this._cState = null;
    }
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
        const shader = Shader.from(vertexShaderTemplate, fragmentShaderTemplate, this._uniforms);
        const textures = new Array(renderer.MAX_TEXTURES);
        for (let i = 0; i < textures.length; i++) {
            textures[i] = i;
        }
        shader.uniforms.uSamplers = textures;
        this._cache[stringState] = shader;
        return shader;
    }
}

class AggregateUniformsBatch extends StdBatch {
    constructor(renderer, geometryOffset) {
        super(geometryOffset);
        this.renderer = renderer;
        this.uniformBuffer = null;
        this.uniformMap = null;
        this.uniformLength = 0;
    }
    upload(renderer) {
        super.upload(renderer);
        const { _uniformRedirects: uniformRedirects, _shader: shader } = this.renderer;
        for (let i = 0, j = uniformRedirects.length; i < j; i++) {
            const glslIdentifer = uniformRedirects[i].glslIdentifer;
            shader.uniforms[glslIdentifer] = this.uniformBuffer[glslIdentifer];
        }
    }
    reset() {
        super.reset();
        for (const uniformName in this.uniformBuffer) {
            this.uniformBuffer[uniformName].length = 0;
        }
    }
}

class AggregateUniformsBatchFactory extends StdBatchFactory {
    constructor(renderer) {
        super(renderer);
        this.MAX_UNIFORMS = Math.floor(Math.min(renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_VERTEX_UNIFORM_VECTORS), renderer.renderer.gl.getParameter(renderer.renderer.gl.MAX_FRAGMENT_UNIFORM_VECTORS))
            / (4 * renderer._uniformRedirects.length));
        this.uniformBuffer = this._createUniformBuffer();
        this.uniformMap = [];
        this.uniformLength = 0;
    }
    _newBatch() {
        const batch = new AggregateUniformsBatch(this._renderer);
        batch.uniformBuffer = this._createUniformBuffer();
        batch.uniformMap = [];
        return batch;
    }
    _put(displayObject) {
        if (!this._renderer._uniformIDAttrib) {
            if (this.uniformLength >= 0) {
                const id = this._matchUniforms(displayObject);
                if (id >= 0) {
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
            if (id >= 0) {
                this.uniformMap.push(id);
                return true;
            }
        }
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
            const uniformRedirect = this._renderer._uniformRedirects[i];
            const { source, glslIdentifer } = uniformRedirect;
            const value = typeof source === 'string'
                ? displayObject[source]
                : source(displayObject, this._renderer);
            if (Array.isArray(value)) {
                this.uniformBuffer[glslIdentifer].push(...value);
            }
            else {
                this.uniformBuffer[glslIdentifer].push(value);
            }
        }
        this.uniformMap.push(this.uniformLength);
        ++this.uniformLength;
        return true;
    }
    _buildBatch(batch) {
        super._buildBatch(batch);
        const buffer = batch.uniformBuffer;
        const map = batch.uniformMap;
        batch.uniformBuffer = this.uniformBuffer;
        batch.uniformMap = this.uniformMap;
        batch.uniformLength = this.uniformLength;
        this.uniformBuffer = buffer;
        this.uniformMap = map;
        this.uniformLength = 0;
        this._resetUniformBuffer(this.uniformBuffer);
        this.uniformMap.length = 0;
    }
    _createUniformBuffer() {
        const buffer = {};
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
            const uniformRedirect = this._renderer._uniformRedirects[i];
            buffer[uniformRedirect.glslIdentifer] = [];
        }
        return buffer;
    }
    _resetUniformBuffer(buffer) {
        for (let i = 0, j = this._renderer._uniformRedirects.length; i < j; i++) {
            const uniformRedirect = this._renderer._uniformRedirects[i];
            buffer[uniformRedirect.glslIdentifer].length = 0;
        }
    }
    _matchUniforms(displayObject) {
        const uniforms = this._renderer._uniformRedirects;
        for (let i = this.uniformLength - 1; i >= 0; i--) {
            let isMatch = true;
            for (let k = 0, n = uniforms.length; k < n; k++) {
                const { glslIdentifer, source } = uniforms[k];
                const value = typeof source === 'string'
                    ? displayObject[source]
                    : source(displayObject, this._renderer);
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
    _compareUniforms(u1, u2) {
        if (u1 === u2) {
            return true;
        }
        if (u1.group || u2.group) {
            return false;
        }
        if (u1.equals) {
            return u1.equals(u2);
        }
        if (Array.isArray(u1) && Array.isArray(u2)) {
            if (u1.length !== u2.length) {
                return false;
            }
            for (let i = 0, j = u1.length; i < j; i++) {
                if (u1[i] !== u2[i]) {
                    return false;
                }
            }
            return true;
        }
        if (u1 instanceof Point && u2 instanceof Point) {
            return u1.x === u2.x && u1.y === u2.y;
        }
        if (u1 instanceof Matrix && u2 instanceof Matrix) {
            return u1.a === u2.a && u1.b === u2.b
                && u1.c === u2.c && u1.d === u2.d
                && u1.tx === u2.tx && u1.ty === u2.ty;
        }
        if (u1 instanceof BaseTexture && u2 instanceof BaseTexture) {
            return u1.uid === u2.uid;
        }
        return false;
    }
}

export { AggregateUniformsBatch, AggregateUniformsBatchFactory, AttributeRedirect, StdBatch as Batch, StdBatchFactory as BatchGenerator, BatchGeometryFactory, BatchRenderer, BatchRendererPluginFactory, BatchShaderFactory, Redirect, UniformRedirect };
//# sourceMappingURL=pixi-batch-renderer.mjs.map
