"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.BatchRenderer = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _Batch = require("./Batch");

var _BatchGenerator = require("./BatchGenerator");

var _GeometryPacker = require("./GeometryPacker");

var PIXI = _interopRequireWildcard(require("pixi.js"));

var _resolve = require("./resolve");

var BatchRenderer = function (_PIXI$ObjectRenderer) {
  (0, _inherits2["default"])(BatchRenderer, _PIXI$ObjectRenderer);

  function BatchRenderer(renderer, attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction) {
    var _this;

    var packer = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : new _GeometryPacker.GeometryPacker(attributeRedirects, indexProperty, vertexCountProperty, undefined, texturePerObject);
    var BatchGeneratorClass = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : _BatchGenerator.BatchGenerator;
    (0, _classCallCheck2["default"])(this, BatchRenderer);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(BatchRenderer).call(this, renderer));
    _this._attributeRedirects = attributeRedirects;
    _this._indexProperty = indexProperty;
    _this._vertexCountProperty = vertexCountProperty;
    _this._textureProperty = textureProperty;
    _this._texturePerObject = texturePerObject;
    _this._textureAttribute = textureAttribute;
    _this._stateFunction = stateFunction;

    _this.renderer.runners.contextChange.add((0, _assertThisInitialized2["default"])(_this));

    if (_this.renderer.gl) {
        _this.contextChange();
      }

    _this._packer = packer;
    _this._geom = BatchRenderer.generateCompositeGeometry(attributeRedirects, !!indexProperty, textureAttribute, texturePerObject);
    _this._batchGenerator = new BatchGeneratorClass(texturePerObject, _this.MAX_TEXTURE, textureProperty, true);
    _this._objectBuffer = [];
    _this._bufferedVertices = 0;
    _this._bufferedIndices = 0;
    _this._batchPool = [];
    _this._batchCount = 0;
    return _this;
  }

  (0, _createClass2["default"])(BatchRenderer, [{
    key: "contextChange",
    value: function contextChange() {
      var gl = this.renderer.gl;

      if (PIXI.settings.PREFER_ENV === PIXI.ENV.WEBGL_LEGACY) {
        this.MAX_TEXTURES = 1;
      } else {
        this.MAX_TEXTURES = Math.min(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), PIXI.settings.SPRITE_MAX_TEXTURES);
      }
    }
  }, {
    key: "start",
    value: function start() {
      this._objectBuffer.length = 0;
      this._bufferedVertices = 0;
      this._bufferedIndices = 0;
    }
  }, {
    key: "render",
    value: function render(targetObject) {
      this._objectBuffer.push(targetObject);

      this._bufferedVertices += (0, _resolve.resolveConstantOrProperty)(targetObject, this._vertexCountProperty);

      if (this._indexProperty) {
        this._bufferedIndices += (0, _resolve.resolveConstantOrProperty)(targetObject, this._indexProperty).length;
      }
    }
  }, {
    key: "flush",
    value: function flush() {
      var batchGenerator = this._batchGenerator,
          geom = this._geom,
          packer = this._packer,
          renderer = this.renderer,
          stateFunction = this._stateFunction,
          textureProperty = this._textureProperty,
          texturePerObject = this._texturePerObject;
      var gl = renderer.gl;
      var buffer = this._objectBuffer;
      var bufferLength = buffer.length;
      this._batchCount = 0;
      batchGenerator.reset();
      packer.reset(this._bufferedVertices, this._bufferedIndices);
      var batchStart = 0;

      for (var objectIndex = 0; objectIndex < bufferLength;) {
        var target = buffer[objectIndex];
        var wasPut = batchGenerator.put(target, (0, _resolve.resolveFunctionOrProperty)(target, stateFunction));

        if (!wasPut) {
          batchGenerator.finalize(this._newBatch(batchStart));
          batchStart = objectIndex;
        } else {
          ++objectIndex;
        }
      }

      if (this.batchGenerator.batchBuffer.length !== 0) {
        batchGenerator.finalize(this._newBatch(batchStart));
      }

      var textureId = this.texturePerObject === 1 ? 0 : new Array(texturePerObject);

      for (var i = 0; i < this._batchCount; i++) {
        var batch = this._batchPool[i];
        var batchBuffer = batch.batchBuffer;
        var batchLength = batchBuffer.length;
        var uidMap = batch.uidMap;
        var vertexCount = 0;
        var indexCount = 0;

        for (var j = 0; j < batchLength; j++) {
          var targetObject = batchBuffer[j];

          if (this._indexProperty) {
            indexCount += (0, _resolve.resolveConstantOrProperty)(targetObject, this._indexProperty).length;
          } else {
            vertexCount += (0, _resolve.resolveConstantOrProperty)(targetObject, this._vertexCountProperty);
          }

          batch.$vertexCount = vertexCount;
          batch.$indexCount = indexCount;
          var tex = targetObject[textureProperty];
          var texUID = void 0;

          if (texturePerObject === 1) {
            texUID = tex.baseTexture ? tex.baseTexture.uid : tex.uid;
            textureId = uidMap[texUID];
          } else {
            var _tex = void 0;

            for (var k = 0; k < tex.length; k++) {
              _tex = tex[k];
              texUID = _tex.BaseTexture ? _tex.baseTexture.uid : _tex.uid;
              textureId[k] = uidMap[texUID];
            }
          }

          packer.pack(targetObject, textureId);
        }
      }

      renderer.geometry.bind(geom);
      geom.$buffer.update(packer.compositeAttributeBuffer.rawBinaryData, 0);
      geom.getIndex().update(packer.compositeIndicesBuffer.rawBinaryData, 0);
      renderer.geometry.updateBuffers();

      for (var _i = 0; _i < this._batchCount; _i++) {
        var _batch = this._batchPool[_i];

        _batch.textureBuffer.forEach(function (texture, j) {
          renderer.texture.bind(texture, j);
        });

        renderer.state.set(_batch.state);

        if (this._indexProperty) {
          gl.drawElements(gl.TRIANGLES, _batch.$indexCount, gl.UNSIGNED_SHORT, _batch.geometryOffset);
        } else {
          gl.drawArrays(gl.TRIANGLES, _batch.geometryOffset, _batch.$vertexCount);
        }
      }
    }
  }, {
    key: "_newBatch",
    value: function _newBatch(batchStart) {
      if (this._batchCount === this._batchPool.length) {
        var _batch2 = new _Batch.Batch(batchStart);

        this._batchPool.push(_batch2);

        ++this._batchCount;
        return _batch2;
      }

      var batch = this._batchPool[this._batchCount++];
      batch.reset();
      batch.geometryOffset = batchStart;
      return batch;
    }
  }], [{
    key: "generateCompositeGeometry",
    value: function generateCompositeGeometry(attributeRedirects, hasIndex, textureAttribute, texturePerObject) {
      var geom = new PIXI.Geometry();
      var attributeBuffer = new PIXI.Buffer(null, false, false);
      var indexBuffer = hasIndex ? new PIXI.Buffer(null, false, true) : null;
      attributeRedirects.forEach(function (redirect) {
        var glslIdentifer = redirect.glslIdentifer,
            glType = redirect.glType,
            glSize = redirect.glSize,
            normalize = redirect.normalize;
        geom.addAttribute(glslIdentifer, attributeBuffer, glSize, normalize, glType);
      });

      if (textureAttribute && texturePerObject > 0) {
        geom.addAttribute(textureAttribute, attributeBuffer, texturePerObject, false, PIXI.TYPES.UNSIGNED_FLOAT);
      }

      if (hasIndex) {
        geom.addIndex(indexBuffer);
      }

      geom.$buffer = attributeBuffer;
      return geom;
    }
  }]);
  return BatchRenderer;
}(PIXI.ObjectRenderer);

exports.BatchRenderer = BatchRenderer;
var _default = BatchRenderer;
exports["default"] = _default;
//# sourceMappingURL=BatchRenderer.js.map