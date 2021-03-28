import { Redirect } from './Redirect';

import type { DisplayObject } from '@pixi/display';

export interface IUniformRedirectOptions
{
    source: string | ((displayObject: DisplayObject) => any);
    uniform: string;
}

/**
 * This redirect is used to aggregate & upload uniforms required for shading the
 * display-object.
 *
 * @example
 * // The data-type of this uniform is defined in your shader.
 * new UniformRedirect({
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
