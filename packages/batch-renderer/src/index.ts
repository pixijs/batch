export * from './redirects';
export { StdBatchFactory as BatchGenerator } from './StdBatchFactory';
export { BatchRenderer } from './BatchRenderer';
export { BatchRendererPluginFactory } from './BatchRendererPluginFactory';
export { BatchGeometryFactory, BatchGeometry } from './BatchGeometryFactory';
export { Redirect } from './redirects/Redirect';
export { BatchShaderFactory } from './BatchShaderFactory';
export { StdBatch as Batch } from './StdBatch';
export { BatchDrawer } from './BatchDrawer';

export { BufferPool } from './utils/BufferPool';

export type { IBatchRendererOptions } from './BatchRenderer';
export type { IBatchRendererStdOptions } from './BatchRendererPluginFactory';
export type { IBatchGeometryFactory } from './BatchGeometryFactory';
export type { Resolvable } from './utils/resolveProperty';

export * from './AggregateUniformsBatch';
export * from './AggregateUniformsBatchFactory';

/**
 * Used by `BatchGeometryFactory` to merge the geometry of a
 * display-object into the whole batch's geometry.
 *
 * @function IGeometryMerger
 * @param {PIXI.DisplayObject} displayObject
 * @param {BatchGeometryFactory} factory
 * @see BatchGeometryFactory#geometryMerger
 */

/**
 * @function
 * @name InjectorFunction
 *
 * @param {BatchRenderer} batchRenderer
 * @return {string} value of the macro for this renderer
 */
