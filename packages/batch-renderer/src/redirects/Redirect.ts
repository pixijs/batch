import type { BatchRenderer } from '../BatchRenderer';
import type { DisplayObject } from '@pixi/display';

/**
 * Redirects are used to aggregate the resources needed by the WebGL pipeline to render
 * a display-object. This includes the base primitives (geometry), uniforms, and
 * textures (which are handled as "special" uniforms).
 *
 * @see AttributeRedirect
 */
export abstract class Redirect
{
    /**
     * The property on the display-object that holds the resource.
     *
     * Instead of a property, you can provide a callback that generates the resource
     * on invokation.
     */
    public source: string | ((displayObject: DisplayObject, renderer: BatchRenderer) => any);

    /** The shader variable that references the resource, e.g. attribute or uniform name. */
    public glslIdentifer: string;

    constructor(source: string | ((displayObject: DisplayObject) => any), glslIdentifer: string)
    {
        this.source = source;
        this.glslIdentifer = glslIdentifer;
    }
}

export default Redirect;
