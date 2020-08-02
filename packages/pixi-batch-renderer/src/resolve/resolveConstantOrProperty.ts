import * as PIXI from 'pixi.js';

export function resolveConstantOrProperty(targetObject: PIXI.DisplayObject, property: string | number): any
{
    return (typeof property === 'string')
    // @ts-ignore
        ? targetObject[property]
        : property;
}

export default resolveConstantOrProperty;
