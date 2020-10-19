import type { DisplayObject } from '@pixi/display';

/**
 * A resolvable configures specific settings of how a display-object is rendered by a batch renderer. It
 * is resolved to a number, for a given display object, using {@link resolveProperty}.
 * 
 * @ignore
 */
export type Resolvable<T> = string | T | ((object: DisplayObject) => number);

/**
 * Resolves a resolvable for the passed {@link DisplayObject}. It is expected to evaluate to a
 * number. If the passed {@code prop} is a string, it is dereferenced from the object. If the passed
 * {@code prop} is a function, then it is invoked by passing the object.
 *
 * @ignore
 * @param object - The object for which the parameter property is to be resolved.
 * @param prop - The property that is to be resolved to a numeric value.
 * @param def - The value that will be resolved if {@code prop} is undefined.
 * @return The resolved value of the {@code prop}.
 */
export function resolve<T>(
    object: DisplayObject,
    prop: Resolvable<T>,
    def?: T
): T
{
    switch(typeof prop)
    {
        case 'string':
            return object[prop];
        case 'function':
            return prop(object);
        case 'undefined':
            return def;
    }

    return prop;
}