export * from './redirects';
export { StdBatchFactory as BatchGenerator } from './StdBatchFactory';
export { BatchRenderer, IBatchRendererOptions } from './BatchRenderer';
export { BatchRendererPluginFactory, IBatchRendererStdOptions } from './BatchRendererPluginFactory';
export { BatchGeometryFactory, BatchGeometry, IBatchGeometryFactory } from './BatchGeometryFactory';
export { Redirect } from './redirects/Redirect';
export { BatchShaderFactory } from './BatchShaderFactory';
export { StdBatch as Batch } from './StdBatch';
export { BatchDrawer } from './BatchDrawer';

export { BufferPool } from './utils/BufferPool';

export type { Resolvable } from './utils/resolveProperty';

export * from './AggregateUniformsBatch';
export * from './AggregateUniformsBatchFactory';

/**
 * Used by `BatchGeometryFactory` to merge the geometry of a
 * display-object into the whole batch's geometry.
 *
 * @function IGeometryMerger
 * @param {PIXI.DisplayObject} displayObject
 * @param {PIXI.brend.BatchGeometryFactory} factory
 * @see PIXI.brend.BatchGeometryFactory#geometryMerger
 */

/**
 * @function
 * @name InjectorFunction
 *
 * @param {PIXI.brend.BatchRenderer} batchRenderer
 * @return {string} value of the macro for this renderer
 */
