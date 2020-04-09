export { AttributeRedirect } from './redirects/AttributeRedirect';
export { StdBatchFactory as BatchGenerator } from './StdBatchFactory';
export { BatchRenderer } from './BatchRenderer';
export { BatchRendererPluginFactory } from './BatchRendererPluginFactory';
export { BatchGeometryFactory as GeometryPacker } from './BatchGeometryFactory';
export { Redirect } from './redirects/Redirect';
export { BatchShaderFactory } from './BatchShaderFactory';
export { StdBatch as Batch } from './StdBatch';

/**
 * @memberof PIXI
 * @namespace brend
 * @example
 * // ES6 import
 * import * as brend from 'pixi-batch-renderer';
 * const { BatchRendererPluginFactory } = brend;
 * @example
 * // CommonJS require
 * const brend = require('pixi-batch-renderer');
 * const BatchRendererPluginFactory = brend.BatchRendererPluginFactory;
 */

/**
 * Used by `PIXI.brend.BatchGeometryFactory` to merge the geometry of a
 * display-object into the whole batch's geometry.
 *
 * @memberof PIXI.brend#
 * @function IGeometryMerger
 * @param {PIXI.DisplayObject} displayObject
 * @param {PIXI.brend.BatchGeometryFactory} factory
 * @see PIXI.brend.BatchGeometryFactory#geometryMerger
 */

/**
 * @function
 * @name InjectorFunction
 * @memberof PIXI.brend
 *
 * @param {PIXI.brend.BatchRenderer} batchRenderer
 * @return {string} value of the macro for this renderer
 */
