"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Batch = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Batch = function () {
  function Batch(geometryOffset) {
    (0, _classCallCheck2["default"])(this, Batch);
    this.batchBuffer = null;
    this.textureBuffer = null;
    this.uidMap = null;
    this.state = null;
    this.geometryOffset = geometryOffset;
  }

  (0, _createClass2["default"])(Batch, [{
    key: "reset",
    value: function reset() {
      this.batchBuffer = this.textureBuffer = this.uidMap = this.state = null;
    }
  }]);
  return Batch;
}();

exports.Batch = Batch;
var _default = Batch;
exports["default"] = _default;
//# sourceMappingURL=Batch.js.map