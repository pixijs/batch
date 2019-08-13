"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.GeometryPacker = void 0;

var _construct2 = _interopRequireDefault(require("@babel/runtime/helpers/construct"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _AttributeRedirect = _interopRequireDefault(require("./redirects/AttributeRedirect"));

var PIXI = _interopRequireWildcard(require("pixi.js"));

var CompilerConstants = {
  INDICES_OFFSET: '__offset_indices_',
  FUNC_SOURCE_BUFFER: 'getSourceBuffer',
  packerArguments: ['targetObject', 'compositeAttributes', 'compositeIndices', 'aIndex', 'iIndex', 'textureId', 'attributeRedirects']
};

var GeometryPacker = function () {
  function GeometryPacker(attributeRedirects, indexProperty, vertexCountProperty) {
    var vertexSize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _AttributeRedirect["default"].vertexSizeFor(attributeRedirects);
    var texturePerObject = arguments.length > 4 ? arguments[4] : undefined;
    (0, _classCallCheck2["default"])(this, GeometryPacker);
    vertexSize += texturePerObject * 4;
    this._targetCompositeAttributeBuffer = null;
    this._targetCompositeIndexBuffer = null;
    this._aIndex = 0;
    this._iIndex = 0;
    this._attributeRedirects = attributeRedirects;
    this._indexProperty = indexProperty;
    this._vertexCountProperty = vertexCountProperty;
    this._vertexSize = vertexSize;
    this._texturePerObject = texturePerObject;
    this._aBuffers = [];
    this._iBuffers = [];
  }

  (0, _createClass2["default"])(GeometryPacker, [{
    key: "reset",
    value: function reset(batchVertexCount, batchIndexCount) {
      this._targetCompositeAttributeBuffer = this._getAttributeBuffer(batchVertexCount);

      if (this._indexProperty) {
        this._targetCompositeIndexBuffer = this._getIndexBuffer(batchIndexCount);
      }

      this._aIndex = this.iIndex = 0;
    }
  }, {
    key: "pack",
    value: function pack(targetObject, textureId) {
      this.packerFunction(targetObject, this._targetCompositeAttributeBuffer, this._targetCompositeIndexBuffer, this._aIndex, this._iIndex, textureId, this._attributeRedirects);
    }
  }, {
    key: "_getAttributeBuffer",
    value: function _getAttributeBuffer(size) {
      var roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 8));
      var roundedSizeIndex = PIXI.utils.log2(roundedP2);
      var roundedSize = roundedP2 * 8;

      if (this._aBuffers.length <= roundedSizeIndex) {
        this._aBuffers.length = roundedSizeIndex + 1;
      }

      var buffer = this._aBuffers[roundedSizeIndex];

      if (!buffer) {
        this._aBuffers[roundedSize] = buffer = new PIXI.ViewableBuffer(roundedSize * this._vertexSize);
      }

      return buffer;
    }
  }, {
    key: "_getIndexBuffer",
    value: function _getIndexBuffer(size) {
      var roundedP2 = PIXI.utils.nextPow2(Math.ceil(size / 12));
      var roundedSizeIndex = PIXI.utils.log2(roundedP2);
      var roundedSize = roundedP2 * 12;

      if (this._iBuffers.length <= roundedSizeIndex) {
        this._iBuffers.length = roundedSizeIndex + 1;
      }

      var buffer = this._iBuffers[roundedSizeIndex];

      if (!buffer) {
        this._iBuffers[roundedSizeIndex] = buffer = new Uint16Array(roundedSize);
      }

      return buffer;
    }
  }, {
    key: "packerFunction",
    get: function get() {
      if (!this._packerFunction) {
        this._packerFunction = new FunctionCompiler(this).compile();
      }

      return this._packerFunction;
    },
    set: function set(func) {
      this._packerFunction = func;
    }
  }, {
    key: "compositeAttributes",
    get: function get() {
      return this._targetCompositeAttributeBuffer;
    }
  }, {
    key: "compositeIndices",
    get: function get() {
      return this._targetCompositeIndexBuffer;
    }
  }]);
  return GeometryPacker;
}();

exports.GeometryPacker = GeometryPacker;

var FunctionCompiler = function () {
  function FunctionCompiler(packer) {
    (0, _classCallCheck2["default"])(this, FunctionCompiler);
    this.packer = packer;
  }

  (0, _createClass2["default"])(FunctionCompiler, [{
    key: "compile",
    value: function compile() {
      var _this = this;

      var packer = this.packer;
      var packerBody = "";

      packer._attributeRedirects.forEach(function (redirect, i) {
        packerBody += "\n                let __offset_".concat(i, " = 0;\n                const __buffer_").concat(i, " = (\n                    ").concat(_this._compileSourceBufferExpression(redirect, i), ");\n            ");
      });

      packerBody += "\n            const {\n                int8View,\n                uint8View,\n                int16View,\n                uint16View,\n                int32View,\n                uint32View,\n                float32View,\n            } = compositeAttributes;\n\n            const vertexCount = ".concat(this._compileVertexCountExpression(), ";\n\n            let adjustedAIndex = 0;\n\n            for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++)\n            {\n        ");
      var skipReverseTransformation = false;

      for (var i = 0; i < packer._attributeRedirects.length; i++) {
        var redirect = packer._attributeRedirects[i];

        if (!skipReverseTransformation) {
          packerBody += "\n                    adjustedAIndex = aIndex / ".concat(this._sizeOf(i), ";\n                ");
        }

        if (typeof redirect.size === 'number') {
          for (var j = 0; j < redirect.size; j++) {
            packerBody += "\n                        ".concat(redirect.type, "View[adjustedAIndex++] =\n                            __buffer_").concat(i, "[__offset_").concat(i, "++];\n                    ");
          }
        } else {
          packerBody += "\n                        ".concat(redirect.type, "View[adjustedAIndex++] =\n                            __buffer_").concat(i, ";\n                ");
        }

        if (packer._attributeRedirects[i + 1] && this._sizeOf(i + 1) !== this._sizeOf(i)) {
          packerBody += "\n                    aIndex = adjustedAIndex * ".concat(this._sizeOf(i), ";\n                ");
        } else {
          skipReverseTransformation = true;
        }
      }

      if (skipReverseTransformation) {
        if (this._sizeOf(packer._attributeRedirects.length - 1) !== 4) {
          packerBody += "\n                    aIndex = adjustedAIndex * ".concat(this._sizeOf(packer._attributeRedirects.length - 1), "\n                ");
          skipReverseTransformation = false;
        }
      }

      if (packer._texturePerObject > 0) {
        if (packer._texturePerObject > 1) {
          if (!skipReverseTransformation) {
            packerBody += "\n                        adjustedAIndex = aIndex / 4;\n                    ";
          }

          for (var k = 0; k < packer._texturePerObject; k++) {
            packerBody += "\n                        float32View[adjustedAIndex++] = textureId[".concat(k, "];\n                    ");
          }

          packerBody += "\n                    aIndex = adjustedAIndex * 4;\n                ";
        } else if (!skipReverseTransformation) {
          packerBody += "\n                    float32View[aIndex] = textureId;\n                    aIndex += 4;\n                ";
        } else {
          packerBody += "\n                    float32View[adjustedAIndex++] = textureId;\n                    aIndex = adjustedAIndex * 4;\n                ";
        }
      }

      packerBody += "}\n            ".concat(this.packer._indexProperty ? "const oldAIndex = this._aIndex;" : '', "\n            this._aIndex = aIndex;\n        ");

      if (this.packer._indexProperty) {
        packerBody += "\n                const verticesBefore = oldAIndex / ".concat(this.packer._vertexSize, "\n                const indexCount\n                    = targetObject['").concat(this.packer._indexProperty, "'].length;\n\n                for (let j = 0; j < indexCount; j++)\n                {\n                    compositeIndices[iIndex++] = verticesBefore +\n                        targetObject['").concat(this.packer._indexProperty, "'][j];\n                }\n\n                this._iIndex = iIndex;\n            ");
      }

      return (0, _construct2["default"])(Function, (0, _toConsumableArray2["default"])(CompilerConstants.packerArguments).concat([packerBody]));
    }
  }, {
    key: "_compileSourceBufferExpression",
    value: function _compileSourceBufferExpression(redirect, i) {
      return typeof redirect.source === 'string' ? "targetObject['".concat(redirect.source, "']") : "attributeRedirects[".concat(i, "].source(targetObject)");
    }
  }, {
    key: "_compileVertexCountExpression",
    value: function _compileVertexCountExpression() {
      if (!this.packer._vertexCountProperty) {
        return "__buffer_0.length / ".concat(this.packer._attributeRedirects[0].size);
      }

      return typeof this.packer._vertexCountProperty === 'string' ? "targetObject.".concat(this.packer._vertexCountProperty) : "".concat(this.packer._vertexCountProperty);
    }
  }, {
    key: "_sizeOf",
    value: function _sizeOf(i) {
      return PIXI.ViewableBuffer.sizeOf(this.packer._attributeRedirects[i].type);
    }
  }]);
  return FunctionCompiler;
}();

var _default = GeometryPacker;
exports["default"] = _default;
//# sourceMappingURL=GeometryPacker.js.map