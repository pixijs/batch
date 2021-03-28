import type { DisplayObject } from '@pixi/display';

export function resolveFunctionOrProperty(targetObject: DisplayObject, property: Function | string): any
{
    return (typeof property === 'string')
    // @ts-ignore
        ? targetObject[property]
        : property(targetObject);
}

export default resolveFunctionOrProperty;
