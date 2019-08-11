"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveFunctionOrProperty = resolveFunctionOrProperty;
exports["default"] = void 0;

function resolveFunctionOrProperty(targetObject, property) {
  return typeof property === 'string' ? targetObject[property] : property(targetObject);
}

var _default = resolveFunctionOrProperty;
exports["default"] = _default;
//# sourceMappingURL=resolveFunctionOrProperty.js.map