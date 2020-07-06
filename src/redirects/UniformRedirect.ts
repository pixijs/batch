import * as PIXI from 'pixi.js';
import { Redirect } from './Redirect';
import type { BatchRenderer } from '../BatchRenderer';

interface IUniformRedirectOptions
{
    source: string | ((displayObject: PIXI.DisplayObject, renderer: BatchRenderer) => any);
    uniform: string;
}

/**
 * This redirect is used to aggregate & upload uniforms required for shading the
 * display-object.
 *
 * @memberof PIXI.brend
 * @class
 * @extends PIXI.brend.Redirect
 * @example
 * // The data-type of this uniform is defined in your shader.
 * new PIXI.brend.UniformRedirect({
 *      source: (dob: PIXI.DisplayObject) => dob.transform.worldTransform,
 *      uniform: "transform"
 * });
 */
export class UniformRedirect extends Redirect
{
    constructor(options: IUniformRedirectOptions)
    {
        super(options.source, options.uniform);
    }
}
