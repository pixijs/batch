"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.ShaderGenerator = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var PIXI = _interopRequireWildcard(require("pixi.js"));

function _replaceAll(target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
}

function injectTexturesPerBatch(batchRenderer) {
  return "".concat(batchRenderer.MAX_TEXTURES);
}

var ShaderGenerator = function () {
  function ShaderGenerator(vertexShaderTemplate, fragmentShaderTemplate) {
    var uniforms = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var templateInjectors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
      '%texturesPerBatch%': injectTexturesPerBatch
    };
    var disableVertexShaderTemplate = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
    (0, _classCallCheck2["default"])(this, ShaderGenerator);

    if (!templateInjectors['%texturesPerBatch%']) {
      templateInjectors['%texturesPerBatch%'] = injectTexturesPerBatch;
    }

    this._vertexShaderTemplate = vertexShaderTemplate;
    this._fragmentShaderTemplate = fragmentShaderTemplate;
    this._uniforms = uniforms;
    this._templateInjectors = templateInjectors;
    this.disableVertexShaderTemplate = disableVertexShaderTemplate;
    this._cache = {};
    this._cState = null;
  }

  (0, _createClass2["default"])(ShaderGenerator, [{
    key: "generateFunction",
    value: function generateFunction() {
      var _this = this;

      return function (batchRenderer) {
        var stringState = _this._generateInjectorBasedState(batchRenderer);

        var cachedShader = _this._cache[stringState];

        if (cachedShader) {
          return cachedShader;
        }

        return _this._generateShader(stringState);
      };
    }
  }, {
    key: "_generateInjectorBasedState",
    value: function _generateInjectorBasedState(batchRenderer) {
      var state = '';
      var cState = this._cState = {};

      for (var injectorMacro in this._templateInjectors) {
        var val = this._templateInjectors[injectorMacro](batchRenderer);

        state += val;
        cState[injectorMacro] = val;
      }

      return state;
    }
  }, {
    key: "_generateShader",
    value: function _generateShader(stringState) {
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
    }
  }]);
  return ShaderGenerator;
}();

exports.ShaderGenerator = ShaderGenerator;
var _default = ShaderGenerator;
exports["default"] = _default;
//# sourceMappingURL=ShaderGenerator.js.map