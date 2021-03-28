import type { DisplayObject } from '@pixi/display';

export function resolveConstantOrProperty(targetObject: DisplayObject, property: string | number): any
{
    return (typeof property === 'string')
        ? (targetObject as Record<string, any>)[property]
        : property;
}

export default resolveConstantOrProperty;
