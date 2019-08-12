"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.BatchGenerator = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var BatchGenerator = function () {
  function BatchGenerator(textureIncrement, textureLimit, textureProperty) {
    var enableTextureReduction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    (0, _classCallCheck2["default"])(this, BatchGenerator);
    this._state = null;
    this._textureIncrement = textureIncrement;
    this._textureLimit = textureLimit;
    this._textureProperty = textureProperty;
    this._batchBuffer = [];
    this._textureBuffer = {};
    this._textureBufferLength = 0;
    this._textureIndexedBuffer = [];
    this._textureIndexMap = {};
    this.enableTextureReduction = enableTextureReduction;

    if (enableTextureReduction) {
      if (textureIncrement === 1) {
        this._putTexture = this._putOnlyTexture;
      } else {
        this._putTexture = this._putTextureArray;
      }
    } else if (textureIncrement === 1) {
      this._putTexture = this._putTextureWithoutReduction;
    } else {
      this._putTexture = this._putTextureArrayWithoutReduction;
    }
  }

  (0, _createClass2["default"])(BatchGenerator, [{
    key: "onPut",
    value: function onPut(targetObject) {
      return true;
    }
  }, {
    key: "put",
    value: function put(targetObject, state) {
      if (!this._state) {
        this._state = state;
      } else if (this._state.data !== state.data) {
        return false;
      }

      if (!this.onPut(targetObject)) {
        return false;
      }

      if (this._textureIncrement > 0 && !this._putTexture(targetObject[this._textureProperty])) {
        return false;
      }

      this._batchBuffer.push(targetObject);

      return true;
    }
  }, {
    key: "finalize",
    value: function finalize(batch) {
      batch.batchBuffer = this._batchBuffer;
      batch.textureBuffer = this._textureIndexedBuffer;
      batch.uidMap = this.enableTextureReduction ? this._textureIndexMap : null;
      batch.state = this._state;
      this._state = null;
      this._batchBuffer = [];
      this._textureBuffer = {};
      this._textureIndexMap = {};
      this._textureBufferLength = 0;
      this._textureIndexedBuffer = [];
    }
  }, {
    key: "_putOnlyTexture",
    value: function _putOnlyTexture(texture) {
      if (texture.baseTexture) {
        texture = texture.baseTexture;
      }

      if (this._textureBuffer[texture.uid]) {
        return true;
      } else if (this._textureBufferLength + 1 <= this._textureLimit) {
        this._textureBuffer[texture.uid] = texture;
        this._textureBufferLength += 1;

        var newLength = this._textureIndexedBuffer.push(texture);

        var index = newLength - 1;
        this._textureIndexMap[texture.uid] = index;
        return true;
      }

      return false;
    }
  }, {
    key: "_putTextureArray",
    value: function _putTextureArray(textureArray) {
      var deltaBufferLength = 0;

      for (var i = 0; i < textureArray.length; i++) {
        var texture = textureArray[i].baseTexture ? textureArray[i].baseTexture : textureArray[i];

        if (!this._textureBuffer[texture.uid]) {
          ++deltaBufferLength;
        }
      }

      if (deltaBufferLength + this._textureBufferLength > this._textureLimit) {
        return false;
      }

      for (var _i = 0; _i < textureArray.length; _i++) {
        var _texture = textureArray[_i].baseTexture ? textureArray[_i].baseTexture : textureArray[_i];

        if (!this._textureBuffer[_texture.uid]) {
          this._textureBuffer[_texture.uid] = _texture;
          this._textureBufferLength += 1;

          var newLength = this._textureIndexedBuffer.push(_texture);

          var index = newLength - 1;
          this._textureIndexMap[_texture.uid] = index;
        }
      }

      return true;
    }
  }, {
    key: "_putTextureWithoutReduction",
    value: function _putTextureWithoutReduction(texture) {
      if (texture.baseTexture) {
        texture = texture.baseTexture;
      }

      if (this._textureBufferLength + 1 > this._textureLimit) {
        return false;
      }

      this._textureIndexedBuffer.push(texture);

      return true;
    }
  }, {
    key: "_putTextureArrayWithoutReduction",
    value: function _putTextureArrayWithoutReduction(textureArray) {
      if (this._textureBufferLength + textureArray.length > this._textureLimit) {
        return false;
      }

      for (var i = 0; i < textureArray.length; i++) {
        this._textureIndexedBuffer.push(textureArray[i].baseTexture ? textureArray[i].baseTexture : textureArray[i]);
      }

      return true;
    }
  }]);
  return BatchGenerator;
}();

exports.BatchGenerator = BatchGenerator;
var _default = BatchGenerator;
exports["default"] = _default;
//# sourceMappingURL=BatchGenerator.js.map