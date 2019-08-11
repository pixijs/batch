"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.AttributeRedirect = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var PIXI = _interopRequireWildcard(require("pixi.js"));

var _Redirect2 = require("./Redirect");

var AttributeRedirect = function (_Redirect) {
  (0, _inherits2["default"])(AttributeRedirect, _Redirect);

  function AttributeRedirect(source, glslIdentifer) {
    var _this;

    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'float32';
    var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var glType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : PIXI.TYPES.FLOAT;
    var glSize = arguments.length > 5 ? arguments[5] : undefined;
    var normalize = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    (0, _classCallCheck2["default"])(this, AttributeRedirect);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(AttributeRedirect).call(this, source, glslIdentifer));
    _this.type = type;
    _this.size = size;
    _this.glType = glType;
    _this.glSize = glSize;
    _this.normalize = normalize;
    return _this;
  }

  (0, _createClass2["default"])(AttributeRedirect, null, [{
    key: "vertexSizeFor",
    value: function vertexSizeFor(attributeRedirects) {
      return attributeRedirects.reduce(function (acc, redirect) {
        return PIXI.ViewableBuffer.sizeOf(redirect.type) * redirect.size + acc;
      });
    }
  }]);
  return AttributeRedirect;
}(_Redirect2.Redirect);

exports.AttributeRedirect = AttributeRedirect;
var _default = AttributeRedirect;
exports["default"] = _default;
//# sourceMappingURL=AttributeRedirect.js.map