/**
 * @namespace PIXI
 */
/**
 * @namespace brend
 * @memberof PIXI
 */

export { AttributeRedirect } from './redirects/AttributeRedirect';
export { BatchGenerator } from './BatchGenerator';
export { BatchRenderer } from './BatchRenderer';
export { BatchRendererPluginFactory } from './BatchRendererPluginFactory';
export { GeometryPacker } from './GeometryPacker';
export { Redirect } from './redirects/Redirect';
export { ShaderGenerator } from './ShaderGenerator';
export { Batch } from './Batch';

/**
 * This function type is used by `GeometryPacker#packerFunction`.
 *
 * It should add to this._aIndex and this._iIndex the number
 * of vertices and indices appended.
 *
 * @function
 * @name PackerFunction
 * @memberof PIXI.brend
 *
 * @param {PIXI.DisplayObject} targetObject - object to pack
 * @param {PIXI.ViewableBuffer} compositeAttributes
 * @param {Uint16Array} compositeIndices
 * @param {number} aIndex - Offset in the composite attribute buffer
 *      in bytes at which the object's geometry should be inserted.
 * @param {number} iIndex - Number of vertices already packed in the
 *      composite index buffer.
 * @param {Array<PIXI.brend.AttributeRedirect>} attributeRedirects
 * @return {void}
 * @see PIXI.brend.GeometryPacker#packerFunction
 */

/**
 * @function
 * @name InjectorFunction
 * @memberof PIXI.brend
 *
 * @param {PIXI.brend.BatchRenderer} batchRenderer
 * @return {string} value of the macro for this renderer
 */
