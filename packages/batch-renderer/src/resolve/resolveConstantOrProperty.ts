import type { DisplayObject } from '@pixi/display';

export function resolveConstantOrProperty(targetObject: DisplayObject, property: string | number): any
{
    return (typeof property === 'string')
    // @ts-ignore
        ? targetObject[property]
        : property;
}

export default resolveConstantOrProperty;
