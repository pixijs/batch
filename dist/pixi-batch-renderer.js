/*!
 * pixi-batch-renderer
 * Compiled Tue, 07 Apr 2020 17:54:42 UTC
 *
 * pixi-batch-renderer is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
this.PIXI = this.PIXI || {}
this.PIXI.brend = this.PIXI.brend || {}
var __batch_renderer = (function (exports, PIXI) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    function __exportStar(m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };

    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }

    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    }

    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }

    function __asyncValues(o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
    }

    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    function __importStar(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result.default = mod;
        return result;
    }

    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    /**
     * A redirect is used to transfer data from the display
     * object to the shader program.
     *
     * @memberof PIXI.brend
     * @class
     */
    var Redirect = /** @class */ (function () {
        function Redirect(source, glslIdentifer) {
            /**
             * Source property on a `PIXI.DisplayObject` that
             * holds the data being transferred. This can also
             * be a callback that returns the data.
             *
             * @member {string | Function}
             */
            this.source = source;
            /**
             * GLSL variable that will hold the data.
             *
             * @member {string}
             */
            this.glslIdentifer = glslIdentifer;
        }
        return Redirect;
    }());

    /**
     * An attribute-redirect describes how the batch renderer will
     * aggregate shader attributes.
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.brend.Redirect
     */
    var AttributeRedirect = /** @class */ (function (_super) {
        __extends(AttributeRedirect, _super);
        function AttributeRedirect(source, glslIdentifer, type, size, glType, glSize, normalize) {
            if (type === void 0) { type = 'float32'; }
            if (size === void 0) { size = 0; }
            if (glType === void 0) { glType = PIXI.TYPES.FLOAT; }
            if (normalize === void 0) { normalize = false; }
            var _this = _super.call(this, source, glslIdentifer) || this;
            /**
             * View on the source buffer that should be used to
             * extract data.
             *
             * @member {string}
             * @see PIXI.ViewableBuffer#view
             */
            _this.type = type;
            /**
             * Number of elements to extract out of `source` with
             * the given view type, for one vertex.
             *
             * If source isn't an array (only one element), then
             * you can set this to `'%notarray%'`.
             *
             * @member {number | '%notarray%'}
             */
            _this.size = size;
            /**
             * This is equal to `size` or 1 if size is `%notarray%`.
             *
             * @member {number}
             */
            _this.properSize = (size === '%notarray%') ? 1 : size;
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
            _this.glType = glType;
            /**
             * Size of attribute in terms of `glType`.
             *
             * Note that `glSize * glType <= size * type`
             *
             * @readonly
             */
            _this.glSize = glSize;
            /**
             * Whether to normalize the attribute values.
             *
             * @member {boolean}
             * @readonly
             */
            _this.normalize = normalize;
            return _this;
        }
        AttributeRedirect.vertexSizeFor = function (attributeRedirects) {
            return attributeRedirects.reduce(function (acc, redirect) {
                return (PIXI.ViewableBuffer.sizeOf(redirect.type)
                    * redirect.properSize)
                    + acc;
            }, 0);
        };
        return AttributeRedirect;
    }(Redirect));

    /**
     * Used to generate discrete groups/batches of display-objects
     * that can be drawn together. It also keeps a parallel buffer
     * of textures.
     *
     * This class ensures that the WebGL states are equivalent and
     * the texture count doesn't become greater than the no. of
     * texture registers on the GPU. You can extend it and add
     * constraints by overriding `onPut`.
     *
     * WARNING: `BatchRenderer` does not support geometry
     *              packing with texture reduction disabled.
     *
     * @memberof PIXI.brend
     * @class
     */
    var BatchGenerator = /** @class */ (function () {
        /**
         * @param {number} textureIncrement - textures per object
         * @param {number} textureLimit - no. of texture registers in GPU
         * @param {string} textureProperty - property where texture is kept
         * @param {boolean} [enableTextureReduction=true] - whether same textures
         *      aren't counted multiple times. This reduces draw calls and can
         *      draw huge amounts of objects at the same time. For example,
         *      if 1000 objects use the same texture, then they can be drawn
         *      together. Further more if 1000 object use the same 8 textures
         *      randomly, then they can be drawn together. (provided other
         *      constraints like state are satisfied.)
         */
        function BatchGenerator(textureIncrement, textureLimit, textureProperty, enableTextureReduction) {
            if (enableTextureReduction === void 0) { enableTextureReduction = true; }
            /** @private */
            this._state = null;
            /** @private */
            this._textureIncrement = textureIncrement;
            /** @private */
            this._textureLimit = textureLimit;
            /** @private */
            this._textureProperty = textureProperty;
            /** @private */
            this._batchBuffer = [];
            /** @private */
            this._textureBuffer = {}; // uid : texture map
            /** @private */
            this._textureBufferLength = 0;
            /** @private */
            this._textureIndexedBuffer = []; // array of textures
            /** @private */
            this._textureIndexMap = {}; // uid : index in above
            /** @protected */
            this.enableTextureReduction = enableTextureReduction;
            // this._putTexture is used to handle texture buffering!
            if (enableTextureReduction) {
                if (textureIncrement === 1) {
                    /** @private */
                    this._putTexture = this._putOnlyTexture;
                }
                else {
                    this._putTexture = this._putTextureArray;
                }
            }
            else if (textureIncrement === 1) {
                this._putTexture = this._putTextureWithoutReduction;
            }
            else {
                this._putTexture = this._putTextureArrayWithoutReduction;
            }
        }
        /**
         * Overridable method that is called before an object
         * is put into this batch. It should check compatibility
         * with other objects, and return true/false accordingly.
         *
         * @param targetObject {PIXI.DisplayObject} - object being added
         * @protected
         */
        BatchGenerator.prototype.onPut = function (targetObject) {
            return true;
        };
        /**
         * Put an object into this batch.
         *
         * @param targetObject {PIXI.DisplayObject} - object to add
         * @param state {PIXI.State} - state required by that object
         * @return {boolean} whether the object was added to the
         *     batch. If it wasn't, you should finalize it.
         */
        BatchGenerator.prototype.put = function (targetObject, state) {
            if (!this._state) {
                this._state = state;
            }
            else if (this._state.data !== state.data) {
                return false;
            }
            if (!this.onPut(targetObject)) {
                return false;
            }
            if (this._textureIncrement > 0
                && !this._putTexture(targetObject[this._textureProperty])) {
                return false;
            }
            this._batchBuffer.push(targetObject);
            return true;
        };
        /**
         * Finalize this batch by getting its data into a
         * `Batch` object.
         *
         * @param batch {PIXI.brend.Batch}
         */
        BatchGenerator.prototype.finalize = function (batch) {
            batch.batchBuffer = this._batchBuffer;
            batch.textureBuffer = this._textureIndexedBuffer;
            batch.uidMap = this.enableTextureReduction
                ? this._textureIndexMap : null;
            batch.state = this._state;
            this._state = null;
            this._batchBuffer = [];
            this._textureBuffer = {};
            this._textureIndexMap = {};
            this._textureBufferLength = 0;
            this._textureIndexedBuffer = [];
        };
        BatchGenerator.prototype._putOnlyTexture = function (texture) {
            if (texture.baseTexture) {
                texture = texture.baseTexture;
            }
            var baseTexture = texture;
            if (this._textureBuffer[baseTexture.uid]) {
                return true;
            }
            else if (this._textureBufferLength + 1 <= this._textureLimit) {
                this._textureBuffer[baseTexture.uid] = texture;
                this._textureBufferLength += 1;
                var newLength = this._textureIndexedBuffer.push(baseTexture);
                var index = newLength - 1;
                this._textureIndexMap[baseTexture.uid] = index;
                return true;
            }
            return false;
        };
        BatchGenerator.prototype._putTextureArray = function (textureArray) {
            var deltaBufferLength = 0;
            for (var i = 0; i < textureArray.length; i++) {
                var texture = textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i];
                if (!this._textureBuffer[texture.uid]) {
                    ++deltaBufferLength;
                }
            }
            if (deltaBufferLength + this._textureBufferLength > this._textureLimit) {
                return false;
            }
            for (var i = 0; i < textureArray.length; i++) {
                var texture = textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i];
                if (!this._textureBuffer[texture.uid]) {
                    this._textureBuffer[texture.uid] = texture;
                    this._textureBufferLength += 1;
                    var newLength = this._textureIndexedBuffer.push(texture);
                    var index = newLength - 1;
                    this._textureIndexMap[texture.uid] = index;
                }
            }
            return true;
        };
        BatchGenerator.prototype._putTextureWithoutReduction = function (texture) {
            if (texture.baseTexture) {
                texture = texture.baseTexture;
            }
            if (this._textureBufferLength + 1 > this._textureLimit) {
                return false;
            }
            this._textureIndexedBuffer.push(texture);
            return true;
        };
        BatchGenerator.prototype._putTextureArrayWithoutReduction = function (textureArray) {
            if (this._textureBufferLength + textureArray.length
                > this._textureLimit) {
                return false;
            }
            for (var i = 0; i < textureArray.length; i++) {
                this._textureIndexedBuffer.push(textureArray[i].baseTexture
                    ? textureArray[i].baseTexture
                    : textureArray[i]);
            }
            return true;
        };
        return BatchGenerator;
    }());

    /**
     * Resources that need to be uploaded to WebGL to render
     * one batch.
     *
     * @memberof PIXI.brend
     * @class
     */
    var Batch = /** @class */ (function () {
        function Batch(geometryOffset) {
            /**
             * Offset in the geometry (set by `BatchRenderer`)
             * where this batch is located.
             *
             * @member {number}
             */
            this.geometryOffset = geometryOffset;
            /**
             * Buffer of textures that should be uploaded in-order
             * to GPU texture registers.
             *
             * @member {Array<PIXI.Texture>}
             */
            this.textureBuffer = null;
            /**
             * Map of texture-ids into texture-buffer indices.
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
         * Uploads the resources required before rendering this
         * batch.
         */
        Batch.prototype.upload = function (renderer) {
            this.textureBuffer.forEach(function (tex, i) {
                renderer.texture.bind(tex, i);
            });
            renderer.state.set(this.state);
        };
        /**
         * Resets all properties to `null` to free up references
         * to resources.
         */
        Batch.prototype.reset = function () {
            this.textureBuffer
                = this.uidMap
                    = this.state
                        = null;
        };
        return Batch;
    }());

    var CompilerConstants = {
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
     * @class
     */
    var GeometryPacker = /** @class */ (function () {
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
        function GeometryPacker(attributeRedirects, indexProperty, vertexCountProperty, vertexSize, texturePerObject) {
            if (vertexSize === void 0) { vertexSize = AttributeRedirect.vertexSizeFor(attributeRedirects); }
            vertexSize += texturePerObject * 4; // texture indices are also passed
            this._targetCompositeAttributeBuffer = null;
            this._targetCompositeIndexBuffer = null;
            this._aIndex = 0;
            this._iIndex = 0;
            this._attributeRedirects = attributeRedirects;
            this._indexProperty = indexProperty;
            this._vertexCountProperty = vertexCountProperty;
            this._vertexSize = vertexSize;
            this._texturePerObject = texturePerObject;
            this._aBuffers = []; // @see _getAttributeBuffer
            this._iBuffers = []; // @see _getIndexBuffer
        }
        Object.defineProperty(GeometryPacker.prototype, "packerFunction", {
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
            get: function () {
                if (!this._packerFunction) {
                    this._packerFunction
                        = new FunctionCompiler(this).compile(); // eslint-disable-line
                }
                return this._packerFunction;
            },
            set: function (func) {
                this._packerFunction = func;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GeometryPacker.prototype, "compositeAttributes", {
            /**
             * This is the currently active composite attribute
             * buffer. It may contain garbage in unused locations.
             *
             * @member {PIXI.ViewableBuffer}
             */
            get: function () {
                return this._targetCompositeAttributeBuffer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GeometryPacker.prototype, "compositeIndices", {
            /**
             * This is the currently active composite index
             * buffer. It may contain garbage in unused locations.
             *
             * It will be `null` if `indexProperty` was not given.
             *
             * @member {Uint16Array}
             */
            get: function () {
                return this._targetCompositeIndexBuffer;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @param {number} batchVertexCount
         * @param {number} batchIndexCount
         */
        GeometryPacker.prototype.reset = function (batchVertexCount, batchIndexCount) {
            this._targetCompositeAttributeBuffer
                = this.getAttributeBuffer(batchVertexCount);
            if (this._indexProperty) {
                this._targetCompositeIndexBuffer
                    = this.getIndexBuffer(batchIndexCount);
            }
            this._aIndex = this._iIndex = 0;
        };
        /**
         * @param {PIXI.DisplayObject} targetObject
         * @param {number} textureId
         */
        GeometryPacker.prototype.pack = function (targetObject, textureId) {
            this.packerFunction(targetObject, this._targetCompositeAttributeBuffer, this._targetCompositeIndexBuffer, this._aIndex, this._iIndex, textureId, this._attributeRedirects);
        };
        GeometryPacker.prototype.getAttributeBuffer = function (size) {
            // 8 vertices is enough for 2 quads
            var roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 8));
            var roundedSizeIndex = PIXI.utils.log2(roundedP2);
            var roundedSize = roundedP2 * 8;
            if (this._aBuffers.length <= roundedSizeIndex) {
                this._aBuffers.length = roundedSizeIndex + 1;
            }
            var buffer = this._aBuffers[roundedSizeIndex];
            if (!buffer) {
                this._aBuffers[roundedSize] = buffer
                    = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
            }
            return buffer;
        };
        GeometryPacker.prototype.getIndexBuffer = function (size) {
            // 12 indices is enough for 2 quads
            var roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 12));
            var roundedSizeIndex = PIXI.utils.log2(roundedP2);
            var roundedSize = roundedP2 * 12;
            if (this._iBuffers.length <= roundedSizeIndex) {
                this._iBuffers.length = roundedSizeIndex + 1;
            }
            var buffer = this._iBuffers[roundedSizeIndex];
            if (!buffer) {
                this._iBuffers[roundedSizeIndex] = buffer
                    = new Uint16Array(roundedSize);
            }
            return buffer;
        };
        return GeometryPacker;
    }());
    // FunctionCompiler was intented to be a static inner
    // class in GeometryPacker. However, due to a bug in
    // JSDoc (3.6.3), I've put it down here :)
    //
    // https://github.com/jsdoc/jsdoc/issues/1673
    var FunctionCompiler = /** @class */ (function () {
        /**
         * @param {PIXI.brend.GeometryPacker} packer
         */
        function class_1(packer) {
            this.packer = packer;
        }
        class_1.prototype.compile = function () {
            var _this = this;
            var packer = this.packer;
            var packerBody = "";
            /* Source offset variables for attribute buffers &
                the corresponding buffer-view references. */
            packer._attributeRedirects.forEach(function (redirect, i) {
                packerBody += "\n                let __offset_" + i + " = 0;\n                const __buffer_" + i + " = (\n                    " + _this._compileSourceBufferExpression(redirect, i) + ");\n            ";
            });
            /* Basis for the "packing" for-loop. */
            packerBody += "\n            const {\n                int8View,\n                uint8View,\n                int16View,\n                uint16View,\n                int32View,\n                uint32View,\n                float32View,\n            } = compositeAttributes;\n\n            const vertexCount = " + this._compileVertexCountExpression() + ";\n\n            let adjustedAIndex = 0;\n\n            for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++)\n            {\n        ";
            // Eliminate offset conversion when adjacent attributes
            // have similar source-types.
            var skipReverseTransformation = false;
            /* Packing for-loop body. */
            for (var i = 0; i < packer._attributeRedirects.length; i++) {
                var redirect = packer._attributeRedirects[i];
                /* Initialize adjsutedAIndex in terms of source type. */
                if (!skipReverseTransformation) {
                    packerBody += "\n                    adjustedAIndex = aIndex / " + this._sizeOf(i) + ";\n                ";
                }
                if (typeof redirect.size === 'number') {
                    for (var j = 0; j < redirect.size; j++) {
                        packerBody += "\n                        " + redirect.type + "View[adjustedAIndex++] =\n                            __buffer_" + i + "[__offset_" + i + "++];\n                    ";
                    }
                }
                else {
                    packerBody += "\n                        " + redirect.type + "View[adjustedAIndex++] =\n                            __buffer_" + i + ";\n                ";
                }
                if (packer._attributeRedirects[i + 1]
                    && (this._sizeOf(i + 1) !== this._sizeOf(i))) {
                    packerBody += "\n                    aIndex = adjustedAIndex * " + this._sizeOf(i) + ";\n                ";
                }
                else {
                    skipReverseTransformation = true;
                }
            }
            if (skipReverseTransformation) {
                if (this._sizeOf(packer._attributeRedirects.length - 1)
                    !== 4) {
                    packerBody += "\n                    aIndex = adjustedAIndex * " + this._sizeOf(packer._attributeRedirects.length - 1) + "\n                ";
                    skipReverseTransformation = false;
                }
            }
            if (packer._texturePerObject > 0) {
                if (packer._texturePerObject > 1) {
                    if (!skipReverseTransformation) {
                        packerBody += "\n                        adjustedAIndex = aIndex / 4;\n                    ";
                    }
                    for (var k = 0; k < packer._texturePerObject; k++) {
                        packerBody += "\n                        float32View[adjustedAIndex++] = textureId[" + k + "];\n                    ";
                    }
                    packerBody += "\n                    aIndex = adjustedAIndex * 4;\n                ";
                }
                else if (!skipReverseTransformation) {
                    packerBody += "\n                    float32View[aIndex] = textureId;\n                    aIndex += 4;\n                ";
                }
                else {
                    packerBody += "\n                    float32View[adjustedAIndex++] = textureId;\n                    aIndex = adjustedAIndex * 4;\n                ";
                }
            }
            /* Close the packing for-loop. */
            packerBody += "}\n            " + (this.packer._indexProperty
                ? "const oldAIndex = this._aIndex;"
                : '') + "\n            this._aIndex = aIndex;\n        ";
            if (this.packer._indexProperty) {
                packerBody += "\n                const verticesBefore = oldAIndex / " + this.packer._vertexSize + "\n                const indexCount\n                    = targetObject['" + this.packer._indexProperty + "'].length;\n\n                for (let j = 0; j < indexCount; j++)\n                {\n                    compositeIndices[iIndex++] = verticesBefore +\n                        targetObject['" + this.packer._indexProperty + "'][j];\n                }\n\n                this._iIndex = iIndex;\n            ";
            }
            // eslint-disable-next-line no-new-func
            return new (Function.bind.apply(Function, __spreadArrays([void 0], CompilerConstants.packerArguments, [packerBody])))();
        };
        class_1.prototype._compileSourceBufferExpression = function (redirect, i) {
            return (typeof redirect.source === 'string')
                ? "targetObject['" + redirect.source + "']"
                : "attributeRedirects[" + i + "].source(targetObject)";
        };
        class_1.prototype._compileVertexCountExpression = function () {
            if (!this.packer._vertexCountProperty) {
                // auto-calculate based on primary attribute
                return "__buffer_0.length / " + this.packer._attributeRedirects[0].size;
            }
            return ((typeof this.packer._vertexCountProperty === 'string')
                ? "targetObject." + this.packer._vertexCountProperty
                : "" + this.packer._vertexCountProperty);
        };
        class_1.prototype._sizeOf = function (i) {
            return PIXI.ViewableBuffer.sizeOf(this.packer._attributeRedirects[i].type);
        };
        return class_1;
    }());

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
     * Core class that renders objects in batches. Clients should
     * defer rendering to a `BatchRenderer` instance by registering
     * it as a plugin.
     *
     * @memberof PIXI.brend
     * @class
     * @extends PIXI.ObjectRenderer
     */
    var BatchRenderer = /** @class */ (function (_super) {
        __extends(BatchRenderer, _super);
        /**
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
        function BatchRenderer(// eslint-disable-line max-params
        renderer, attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction, shaderFunction, packer, BatchGeneratorClass) {
            if (packer === void 0) { packer = new GeometryPacker(attributeRedirects, indexProperty, vertexCountProperty, // auto-calculate
            undefined, texturePerObject); }
            if (BatchGeneratorClass === void 0) { BatchGeneratorClass = BatchGenerator; }
            var _this = _super.call(this, renderer) || this;
            _this._attributeRedirects = attributeRedirects;
            _this._indexProperty = indexProperty;
            _this._vertexCountProperty = vertexCountProperty;
            _this._textureProperty = textureProperty;
            _this._texturePerObject = texturePerObject;
            _this._textureAttribute = textureAttribute;
            _this._stateFunction = stateFunction;
            _this._shaderFunction = shaderFunction;
            _this._BatchGeneratorClass = BatchGeneratorClass;
            _this._batchGenerator = null; // @see this#contextChange
            _this.renderer.runners.contextChange.add(_this);
            if (_this.renderer.gl) // we are late to the party!
             {
                _this.contextChange();
            }
            _this._packer = packer;
            _this._geom = BatchRenderer.generateCompositeGeometry(attributeRedirects, !!indexProperty, textureAttribute, texturePerObject);
            _this._objectBuffer = [];
            _this._bufferedVertices = 0;
            _this._bufferedIndices = 0;
            _this._shader = null;
            _this._batchPool = []; // may contain garbage after _batchCount
            _this._batchCount = 0;
            return _this;
        }
        BatchRenderer.prototype.contextChange = function () {
            var gl = this.renderer.gl;
            if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY) {
                this.MAX_TEXTURES = 1;
            }
            else {
                this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), PIXI.settings.SPRITE_MAX_TEXTURES);
            }
            this._batchGenerator = new this._BatchGeneratorClass(this._texturePerObject, this.MAX_TEXTURES, this._textureProperty, true); // NOTE: Force texture reduction
            if (!this._batchGenerator.enableTextureReduction) {
                throw new Error('PIXI.brend.BatchRenderer does not support '
                    + 'batch generation without texture reduction enabled.');
            }
        };
        BatchRenderer.prototype.start = function () {
            this._objectBuffer.length = 0;
            this._bufferedVertices = 0;
            this._bufferedIndices = 0;
            this._shader = this._shaderFunction(this);
            if (this._shader.uniforms.uSamplers) {
                this._shader.uniforms.uSamplers
                    = BatchRenderer.generateTextureArray(this.MAX_TEXTURES);
            }
            this.renderer.shader.bind(this._shader, false);
        };
        BatchRenderer.prototype.render = function (targetObject) {
            this._objectBuffer.push(targetObject);
            this._bufferedVertices += this._vertexCountFor(targetObject);
            if (this._indexProperty) {
                this._bufferedIndices += resolveConstantOrProperty(targetObject, this._indexProperty).length;
            }
        };
        BatchRenderer.prototype.flush = function () {
            var _a = this, batchGenerator = _a._batchGenerator, geom = _a._geom, packer = _a._packer, renderer = _a.renderer, stateFunction = _a._stateFunction, textureProperty = _a._textureProperty, texturePerObject = _a._texturePerObject;
            var gl = renderer.gl;
            var buffer = this._objectBuffer;
            var bufferLength = buffer.length;
            this._batchCount = 0;
            packer.reset(this._bufferedVertices, this._bufferedIndices);
            var batchStart = 0;
            // Generate batches/groups that will be drawn using just
            // one draw call.
            for (var objectIndex = 0; objectIndex < bufferLength;) {
                var target = buffer[objectIndex];
                var wasPut = batchGenerator.put(target, resolveFunctionOrProperty(target, stateFunction));
                if (!wasPut) {
                    batchGenerator.finalize(this._newBatch(batchStart));
                    batchStart = objectIndex;
                }
                else {
                    ++objectIndex;
                }
            }
            // Generate the last batch, if required.
            if (batchGenerator._batchBuffer.length !== 0) {
                batchGenerator.finalize(this._newBatch(batchStart));
            }
            // Pack each object into the composite geometry. This is done
            // after batching, so that texture-ids are generated.
            var textureId = this._texturePerObject === 1
                ? 0
                : new Array(texturePerObject);
            for (var i = 0; i < this._batchCount; i++) // loop-per(batch)
             {
                var batch = this._batchPool[i];
                var batchBuffer = batch.batchBuffer;
                var batchLength = batchBuffer.length;
                var uidMap = batch.uidMap;
                var vertexCount = 0; // eslint-disable-line
                var indexCount = 0;
                for (var j = 0; j < batchLength; j++) // loop-per(targetObject)
                 {
                    var targetObject = batchBuffer[j];
                    if (this._indexProperty) {
                        indexCount += resolveConstantOrProperty(targetObject, this._indexProperty).length;
                    }
                    else {
                        vertexCount += resolveConstantOrProperty(targetObject, this._vertexCountProperty);
                    }
                    // externally-defined properties for draw calls
                    batch.$vertexCount = vertexCount;
                    batch.$indexCount = indexCount;
                    var tex = targetObject[textureProperty];
                    var texUID = void 0;
                    if (texturePerObject === 1) {
                        texUID = tex.baseTexture
                            ? tex.baseTexture.uid
                            : tex.uid;
                        textureId = uidMap[texUID];
                    }
                    else {
                        var _tex = void 0;
                        for (var k = 0; k < tex.length; k++) {
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
            for (var i = 0; i < this._batchCount; i++) {
                var batch = this._batchPool[i];
                batch.upload();
                if (this._indexProperty) {
                    gl.drawElements(gl.TRIANGLES, batch.$indexCount, gl.UNSIGNED_SHORT, batch.geometryOffset * 2); // * 2 cause Uint16 indices
                }
                else {
                    gl.drawArrays(gl.TRIANGLES, batch.geometryOffset, batch.$vertexCount); // TODO: *vertexSize
                }
                batch.reset();
            }
        };
        BatchRenderer.prototype.stop = function () {
            if (this._bufferedVertices) {
                this.flush();
            }
        };
        BatchRenderer.prototype._newBatch = function (batchStart) {
            if (this._batchCount === this._batchPool.length) {
                var batch_1 = new Batch(batchStart);
                this._batchPool.push(batch_1);
                ++this._batchCount;
                return batch_1;
            }
            var batch = this._batchPool[this._batchCount++];
            batch.reset();
            batch.geometryOffset = batchStart;
            return batch;
        };
        BatchRenderer.prototype._vertexCountFor = function (targetObject) {
            return (this._vertexCountProperty)
                ? resolveConstantOrProperty(targetObject, this._vertexCountProperty)
                : resolveFunctionOrProperty(targetObject, this._attributeRedirects[0].source).length
                    / this._attributeRedirects[0].size;
        };
        /**
         * Generates a `PIXI.Geometry` that can be used for rendering
         * multiple display objects at once.
         *
         * @param {Array<PIXI.brend.AttributeRedirect>} attributeRedirects
         * @param {boolean} hasIndex - whether to include an index property
         * @param {string} textureAttribute - name of the texture-id attribute
         * @param {number} texturePerObject - no. of textures per object
         */
        BatchRenderer.generateCompositeGeometry = function (attributeRedirects, hasIndex, textureAttribute, texturePerObject) {
            var geom = new PIXI.Geometry();
            var attributeBuffer = new PIXI.Buffer(null, false, false);
            var indexBuffer = hasIndex ? new PIXI.Buffer(null, false, true) : null;
            attributeRedirects.forEach(function (redirect) {
                var glslIdentifer = redirect.glslIdentifer, glType = redirect.glType, glSize = redirect.glSize, normalize = redirect.normalize;
                geom.addAttribute(glslIdentifer, attributeBuffer, glSize, normalize, glType);
            });
            if (textureAttribute && texturePerObject > 0) {
                geom.addAttribute(textureAttribute, attributeBuffer, texturePerObject, true, PIXI.TYPES.FLOAT);
            }
            if (hasIndex) {
                geom.addIndex(indexBuffer);
            }
            geom.$buffer = attributeBuffer;
            // $buffer is attributeBuffer
            // getIndex() is ?indexBuffer
            return geom;
        };
        BatchRenderer.generateTextureArray = function (count) {
            var array = new Int32Array(count);
            for (var i = 0; i < count; i++) {
                array[i] = i;
            }
            return array;
        };
        return BatchRenderer;
    }(PIXI.ObjectRenderer));

    /**
     * Generates a batch-renderer plugin.
     *
     * @memberof PIXI.brend
     * @hideconstructor
     * @class
     */
    var BatchRendererPluginFactory = /** @class */ (function () {
        function BatchRendererPluginFactory() {
        }
        /**
         * @param {PIXI.brend.AttributeRedirect[]} attributeRedirects
         * @param {string | Array<number>} indexProperty
         * @param {string | number} vertexCountProperty
         * @param {string} textureProperty
         * @param {number} texturePerObject
         * @param {string} textureAttribute
         * @param {Function} stateFunction
         * @param {Function} shaderFunction
         * @param {PIXI.brend.GeometryPacker} [packer]
         * @param {Class} [BatchGeneratorClass]
         * @param {Class} [BatchRendererClass]
         */
        BatchRendererPluginFactory.from = function (/* eslint-disable-line max-params */ attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction, shaderFunction, packer, BatchGeneratorClass, BatchRendererClass) {
            if (BatchRendererClass === void 0) { BatchRendererClass = BatchRenderer; }
            return /** @class */ (function (_super) {
                __extends(class_1, _super);
                function class_1(renderer) {
                    return _super.call(this, renderer, attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction, shaderFunction, packer, BatchGeneratorClass) || this;
                }
                return class_1;
            }(BatchRendererClass));
        };
        return BatchRendererPluginFactory;
    }());

    // JavaScript is stupid enough not to have a replaceAll
    // in String. This is a temporary solution and we should
    // depend on an actually polyfill.
    function _replaceAll(target, search, replacement) {
        return target.replace(new RegExp(search, 'g'), replacement);
    }
    function injectTexturesPerBatch(batchRenderer) {
        return "" + batchRenderer.MAX_TEXTURES;
    }
    /**
     * Exposes an easy-to-use API for generating a shader function
     * for batch rendering.
     *
     * You are required to provide an injector map, which maps
     * macros to functions that return a string value for those
     * macros given a renderer.
     *
     * By default, only one injector is used - the textures per
     * batch `%texturesPerBatch%` macro. This is replaced by
     * the number of textures passed to the `uSamplers` textures
     * uniform.
     *
     * @memberof PIXI.brend
     * @class
     */
    var ShaderGenerator = /** @class */ (function () {
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
        function ShaderGenerator(vertexShaderTemplate, fragmentShaderTemplate, uniforms, templateInjectors, disableVertexShaderTemplate) {
            if (uniforms === void 0) { uniforms = {}; }
            if (templateInjectors === void 0) { templateInjectors = {
                '%texturesPerBatch%': injectTexturesPerBatch,
            }; }
            if (disableVertexShaderTemplate === void 0) { disableVertexShaderTemplate = true; }
            if (!templateInjectors['%texturesPerBatch%']) {
                templateInjectors['%texturesPerBatch%'] = injectTexturesPerBatch;
            }
            /** @protected */
            this._vertexShaderTemplate = vertexShaderTemplate;
            /** @protected */
            this._fragmentShaderTemplate = fragmentShaderTemplate;
            /** @protected */
            this._uniforms = uniforms;
            /** @protected */
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
         * @return shader function that can be given to the batch renderer
         */
        ShaderGenerator.prototype.generateFunction = function () {
            var _this = this;
            return function (batchRenderer) {
                var stringState = _this._generateInjectorBasedState(batchRenderer);
                var cachedShader = _this._cache[stringState];
                if (cachedShader) {
                    return cachedShader;
                }
                return _this._generateShader(stringState);
            };
        };
        ShaderGenerator.prototype._generateInjectorBasedState = function (batchRenderer) {
            var state = '';
            var cState = this._cState = {};
            for (var injectorMacro in this._templateInjectors) {
                var val = this._templateInjectors[injectorMacro](batchRenderer);
                state += val;
                cState[injectorMacro] = val;
            }
            return state;
        };
        ShaderGenerator.prototype._generateShader = function (stringState) {
            var vertexShaderTemplate = this._vertexShaderTemplate.slice(0);
            var fragmentShaderTemplate = this._fragmentShaderTemplate.slice(0);
            for (var injectorTemplate in this._cState) {
                if (!this.disableVertexShaderTemplate) {
                    vertexShaderTemplate = _replaceAll(vertexShaderTemplate, injectorTemplate, this._cState[injectorTemplate]);
                }
                fragmentShaderTemplate = _replaceAll(fragmentShaderTemplate, injectorTemplate, this._cState[injectorTemplate]);
            }
            var shader = PIXI.Shader.from(vertexShaderTemplate, fragmentShaderTemplate, this._uniforms);
            this._cache[stringState] = shader;
            return shader;
        };
        return ShaderGenerator;
    }());

    /**
     * @namespace PIXI
     */
    /**
     * This function type is used by `GeometryPacker#packerFunction`.
     *
     * It should add to this._aIndex and this._iIndex the number
     * of vertices and indices appended.
     *
     * @function
     * @name PackerFunction
     * @memberof PIXI.brend
     *
     * @param {PIXI.DisplayObject} targetObject - object to pack
     * @param {PIXI.ViewableBuffer} compositeAttributes
     * @param {Uint16Array} compositeIndices
     * @param {number} aIndex - Offset in the composite attribute buffer
     *      in bytes at which the object's geometry should be inserted.
     * @param {number} iIndex - Number of vertices already packed in the
     *      composite index buffer.
     * @param {Array<PIXI.brend.AttributeRedirect>} attributeRedirects
     * @return {void}
     * @see PIXI.brend.GeometryPacker#packerFunction
     */
    /**
     * @function
     * @name InjectorFunction
     * @memberof PIXI.brend
     *
     * @param {PIXI.brend.BatchRenderer} batchRenderer
     * @return {string} value of the macro for this renderer
     */

    exports.AttributeRedirect = AttributeRedirect;
    exports.BatchGenerator = BatchGenerator;
    exports.BatchRenderer = BatchRenderer;
    exports.BatchRendererPluginFactory = BatchRendererPluginFactory;
    exports.GeometryPacker = GeometryPacker;
    exports.Redirect = Redirect;
    exports.ShaderGenerator = ShaderGenerator;

    return exports;

}({}, PIXI));
Object.assign(this.PIXI.brend, __batch_renderer);
//# sourceMappingURL=pixi-batch-renderer.js.map
