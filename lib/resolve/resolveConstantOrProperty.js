"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveConstantOrProperty = resolveConstantOrProperty;
exports["default"] = void 0;

function resolveConstantOrProperty(targetObject, property) {
  return typeof property === 'string' ? targetObject[property] : property;
}

var _default = resolveConstantOrProperty;
exports["default"] = _default;
//# sourceMappingURL=resolveConstantOrProperty.js.map