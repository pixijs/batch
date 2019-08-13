"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.BatchRendererPluginFactory = void 0;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _BatchRenderer = require("./BatchRenderer");

var BatchRendererPluginFactory = function () {
  function BatchRendererPluginFactory() {
    (0, _classCallCheck2["default"])(this, BatchRendererPluginFactory);
  }

  (0, _createClass2["default"])(BatchRendererPluginFactory, null, [{
    key: "from",
    value: function from(attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction, packer, BatchGeneratorClass) {
      var BatchRendererClass = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : _BatchRenderer.BatchRenderer;
      return function (_BatchRendererClass) {
        (0, _inherits2["default"])(_class, _BatchRendererClass);

        function _class(renderer) {
          (0, _classCallCheck2["default"])(this, _class);
          return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(_class).call(this, renderer, attributeRedirects, indexProperty, vertexCountProperty, textureProperty, texturePerObject, textureAttribute, stateFunction, packer, BatchGeneratorClass));
        }

        return _class;
      }(BatchRendererClass);
    }
  }]);
  return BatchRendererPluginFactory;
}();

exports.BatchRendererPluginFactory = BatchRendererPluginFactory;
var _default = BatchRendererPluginFactory;
exports["default"] = _default;
//# sourceMappingURL=BatchRendererPluginFactory.js.map