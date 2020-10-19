import * as PIXI from 'pixi.js';

/**
 * Redirects are used to aggregate the resources needed by the WebGL pipeline to render
 * a display-object. This includes the base primitives (geometry), uniforms, and
 * textures (which are handled as "special" uniforms).
 *
 * @memberof PIXI.brend
 * @class
 * @abstract
 * @see PIXI.brend.AttributeRedirect
 */
export abstract class Redirect
{
    public source: string | ((displayObject: PIXI.DisplayObject) => any);
    public glslIdentifer: string;

    constructor(source: string | ((displayObject: PIXI.DisplayObject) => any), glslIdentifer: string)
    {
        /**
         * The property on the display-object that holds the resource.
         *
         * Instead of a property, you can provide a callback that generates the resource
         * on invokation.
         *
         * @member {string | Function}
         */
        this.source = source;

        /**
         * The shader variable that references the resource, e.g. attribute or uniform
         * name.
         * @member {string}
         */
        this.glslIdentifer = glslIdentifer;
    }
}

export default Redirect;
