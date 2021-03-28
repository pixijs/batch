import type { DisplayObject } from '@pixi/display';

export function resolveFunctionOrProperty(targetObject: DisplayObject, property: Function | string): any
{
    return (typeof property === 'string')
        ? (targetObject as Record<string, any>)[property]
        : property(targetObject);
}

export default resolveFunctionOrProperty;
